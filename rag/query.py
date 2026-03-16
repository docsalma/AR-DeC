"""
Query the AR-DeC RAG vector database.
Semantic search over 47 curated research articles.

Usage:
  python query.py "augmented reality intelligent tutoring"
  python query.py "gamification mobile learning" --limit 10
  python query.py "OCR text recognition education" --category ar_its_integration
"""

import argparse
import weaviate
from weaviate.classes.query import MetadataQuery, Filter
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

console = Console()
COLLECTION_NAME = "ResearchArticle"


def search(query: str, limit: int = 5, category: str = None, year_min: int = None):
    """Semantic search over research article chunks."""
    client = weaviate.connect_to_local(port=8080)

    try:
        collection = client.collections.get(COLLECTION_NAME)

        # Build filters
        filters = None
        if category:
            filters = Filter.by_property("category").equal(category)
        if year_min:
            year_filter = Filter.by_property("year").greater_or_equal(year_min)
            filters = filters & year_filter if filters else year_filter

        results = collection.query.near_text(
            query=query,
            limit=limit,
            return_metadata=MetadataQuery(distance=True, certainty=True),
            filters=filters,
        )

        if not results.objects:
            console.print("[yellow]No results found.[/yellow]")
            return

        # Group by article
        seen_titles = {}
        table = Table(title=f"Search: \"{query}\"", show_lines=True)
        table.add_column("#", style="bold", width=3)
        table.add_column("Score", width=6)
        table.add_column("Article", width=50)
        table.add_column("Year", width=5)
        table.add_column("Category", width=20)

        for i, obj in enumerate(results.objects):
            props = obj.properties
            title = props["title"]
            certainty = f"{obj.metadata.certainty:.2f}" if obj.metadata.certainty else "N/A"

            if title not in seen_titles:
                seen_titles[title] = []
            seen_titles[title].append(props["chunk_text"])

            table.add_row(
                str(i + 1),
                certainty,
                f"{props['authors']} - {props['title'][:80]}",
                str(props["year"]),
                props["category"],
            )

        console.print(table)

        # Show best chunk preview
        console.print()
        best = results.objects[0]
        chunk_preview = best.properties["chunk_text"][:500]
        panel = Panel(
            chunk_preview + "...",
            title=f"Best Match Preview — {best.properties['authors']} ({best.properties['year']})",
            subtitle=f"Chunk {best.properties['chunk_index']+1}/{best.properties['total_chunks']}",
            border_style="green",
        )
        console.print(panel)

    finally:
        client.close()


def list_articles():
    """List all unique articles in the database."""
    client = weaviate.connect_to_local(port=8080)

    try:
        collection = client.collections.get(COLLECTION_NAME)

        # Get all unique articles by querying chunk_index=0
        results = collection.query.fetch_objects(
            filters=Filter.by_property("chunk_index").equal(0),
            limit=100,
        )

        table = Table(title="Articles in RAG Database", show_lines=True)
        table.add_column("#", width=3)
        table.add_column("Authors", width=25)
        table.add_column("Year", width=5)
        table.add_column("Title", width=60)
        table.add_column("Category", width=20)
        table.add_column("Chunks", width=7)

        articles = sorted(results.objects, key=lambda o: o.properties["year"], reverse=True)
        for i, obj in enumerate(articles):
            p = obj.properties
            table.add_row(
                str(i + 1),
                p["authors"][:25],
                str(p["year"]),
                p["title"][:60],
                p["category"],
                str(p["total_chunks"]),
            )

        console.print(table)
        console.print(f"\n[bold]Total: {len(articles)} articles[/bold]")

    finally:
        client.close()


def stats():
    """Show database statistics."""
    client = weaviate.connect_to_local(port=8080)

    try:
        collection = client.collections.get(COLLECTION_NAME)
        total = collection.aggregate.over_all(total_count=True).total_count

        console.print(Panel(
            f"Total chunks: [bold cyan]{total}[/bold cyan]\n"
            f"Collection: {COLLECTION_NAME}\n"
            f"Vectorizer: text2vec-transformers (all-MiniLM-L6-v2)",
            title="RAG Database Stats",
            border_style="blue",
        ))

    finally:
        client.close()


def main():
    parser = argparse.ArgumentParser(description="Query AR-DeC RAG database")
    subparsers = parser.add_subparsers(dest="command", help="Command")

    # Search command
    search_parser = subparsers.add_parser("search", help="Semantic search")
    search_parser.add_argument("query", type=str, help="Search query")
    search_parser.add_argument("--limit", type=int, default=5, help="Max results")
    search_parser.add_argument("--category", type=str, help="Filter by category")
    search_parser.add_argument("--year-min", type=int, help="Minimum year filter")

    # List command
    subparsers.add_parser("list", help="List all articles")

    # Stats command
    subparsers.add_parser("stats", help="Show database stats")

    args = parser.parse_args()

    if args.command == "search":
        search(args.query, limit=args.limit, category=args.category, year_min=args.year_min)
    elif args.command == "list":
        list_articles()
    elif args.command == "stats":
        stats()
    else:
        # Default: treat all args as search query
        if len(sys.argv) > 1:
            search(" ".join(sys.argv[1:]))
        else:
            parser.print_help()


if __name__ == "__main__":
    import sys
    main()
