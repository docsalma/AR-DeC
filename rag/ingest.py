"""
Ingest 47 curated Zotero articles into Weaviate vector DB.
Reads .zotero-ft-cache (pre-extracted full text), chunks it,
and stores with metadata. Weaviate auto-embeds via text2vec-transformers.
"""

import os
import re
import sys
import time
import weaviate
from weaviate.classes.config import Configure, Property, DataType
from weaviate.classes.data import DataObject
from rich.console import Console
from rich.progress import track

console = Console()

ZOTERO_DIR = os.path.join(os.path.dirname(__file__), "..", ".claude", "used-Data")
WEAVIATE_URL = "http://localhost:8080"
CHUNK_SIZE = 1500      # characters (~375 tokens)
CHUNK_OVERLAP = 200    # characters overlap between chunks
COLLECTION_NAME = "ResearchArticle"


def parse_filename(pdf_name: str) -> dict:
    """Extract author, year, title from Zotero PDF filename."""
    # Pattern: "Author et al. - 2024 - Title of the paper.pdf"
    match = re.match(r"^(.+?)\s*-\s*(\d{4})\s*-\s*(.+?)\.pdf$", pdf_name)
    if match:
        return {
            "authors": match.group(1).strip(),
            "year": int(match.group(2)),
            "title": match.group(3).strip(),
        }
    return {"authors": "Unknown", "year": 0, "title": pdf_name}


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks by character count."""
    chunks = []
    start = 0
    text = text.strip()
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start = end - overlap
    return chunks


def categorize_article(title: str) -> str:
    """Assign category based on title keywords."""
    t = title.lower()
    if any(kw in t for kw in ["mobile ar", "mobile augmented", "mobile app", "mobile-based ar", "arpocketlab"]):
        return "mobile_ar_education"
    if any(kw in t for kw in ["intelligent tutoring", "its ", "tutoring system"]) and any(kw in t for kw in ["ar", "augmented", "vr", "virtual", "mixed"]):
        return "ar_its_integration"
    if any(kw in t for kw in ["gamif", "game-based", "game based", "gamified"]):
        return "ar_gamification"
    if any(kw in t for kw in ["intelligent tutoring", "its ", "tutoring system", "tutor "]):
        return "its_design"
    if any(kw in t for kw in ["systematic review", "meta-analysis", "bibliometric", "overview", "survey"]):
        return "ar_review"
    return "ar_education_general"


def load_articles() -> list[dict]:
    """Load all articles from Zotero used-Data directory."""
    articles = []
    if not os.path.isdir(ZOTERO_DIR):
        console.print(f"[red]Directory not found: {ZOTERO_DIR}[/red]")
        sys.exit(1)

    for folder in sorted(os.listdir(ZOTERO_DIR)):
        folder_path = os.path.join(ZOTERO_DIR, folder)
        if not os.path.isdir(folder_path):
            continue

        cache_file = os.path.join(folder_path, ".zotero-ft-cache")
        if not os.path.isfile(cache_file):
            continue

        # Find the PDF filename for metadata
        pdf_name = None
        for f in os.listdir(folder_path):
            if f.endswith(".pdf"):
                pdf_name = f
                break

        with open(cache_file, "r", encoding="utf-8", errors="ignore") as fh:
            text = fh.read()

        if not text.strip():
            continue

        meta = parse_filename(pdf_name) if pdf_name else {"authors": "Unknown", "year": 0, "title": folder}
        meta["folder_id"] = folder
        meta["full_text"] = text
        meta["category"] = categorize_article(meta["title"])
        articles.append(meta)

    return articles


def setup_collection(client: weaviate.WeaviateClient):
    """Create or recreate the ResearchArticle collection."""
    if client.collections.exists(COLLECTION_NAME):
        client.collections.delete(COLLECTION_NAME)
        console.print(f"[yellow]Deleted existing '{COLLECTION_NAME}' collection[/yellow]")

    client.collections.create(
        name=COLLECTION_NAME,
        vectorizer_config=Configure.Vectorizer.text2vec_transformers(),
        properties=[
            Property(name="title", data_type=DataType.TEXT),
            Property(name="authors", data_type=DataType.TEXT),
            Property(name="year", data_type=DataType.INT),
            Property(name="category", data_type=DataType.TEXT),
            Property(name="folder_id", data_type=DataType.TEXT),
            Property(name="chunk_index", data_type=DataType.INT),
            Property(name="total_chunks", data_type=DataType.INT),
            Property(name="chunk_text", data_type=DataType.TEXT),
        ],
    )
    console.print(f"[green]Created '{COLLECTION_NAME}' collection[/green]")


def ingest(client: weaviate.WeaviateClient, articles: list[dict]):
    """Chunk and ingest all articles into Weaviate."""
    collection = client.collections.get(COLLECTION_NAME)
    total_chunks = 0
    batch_objects = []

    for article in track(articles, description="Ingesting articles..."):
        chunks = chunk_text(article["full_text"])
        for i, chunk in enumerate(chunks):
            obj = DataObject(
                properties={
                    "title": article["title"],
                    "authors": article["authors"],
                    "year": article["year"],
                    "category": article["category"],
                    "folder_id": article["folder_id"],
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "chunk_text": chunk,
                },
            )
            batch_objects.append(obj)
            total_chunks += 1

            # Batch insert every 50 objects
            if len(batch_objects) >= 50:
                collection.data.insert_many(batch_objects)
                batch_objects = []

    # Insert remaining
    if batch_objects:
        collection.data.insert_many(batch_objects)

    console.print(f"[green]Ingested {total_chunks} chunks from {len(articles)} articles[/green]")


def main():
    console.print("[bold]AR-DeC RAG Ingestion Pipeline[/bold]")
    console.print(f"Source: {ZOTERO_DIR}")

    # Load articles
    articles = load_articles()
    console.print(f"Found [cyan]{len(articles)}[/cyan] articles with full-text cache")

    # Category breakdown
    cats = {}
    for a in articles:
        cats[a["category"]] = cats.get(a["category"], 0) + 1
    for cat, count in sorted(cats.items()):
        console.print(f"  {cat}: {count}")

    # Connect to Weaviate
    console.print(f"\nConnecting to Weaviate at {WEAVIATE_URL}...")
    client = weaviate.connect_to_local(port=8080)

    try:
        if not client.is_ready():
            console.print("[red]Weaviate is not ready. Is Docker running?[/red]")
            sys.exit(1)
        console.print("[green]Connected![/green]")

        setup_collection(client)
        ingest(client, articles)

        # Verify
        collection = client.collections.get(COLLECTION_NAME)
        count = collection.aggregate.over_all(total_count=True).total_count
        console.print(f"\n[bold green]Verification: {count} objects in Weaviate[/bold green]")
    finally:
        client.close()


if __name__ == "__main__":
    main()
