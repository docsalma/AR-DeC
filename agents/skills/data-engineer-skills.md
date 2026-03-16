# Data Engineer Skills

## Skill 1: RAG Query & Retrieval
**Trigger**: "search articles about [topic]" or "find literature on [topic]"
**Process**:
1. Run semantic search: `py rag/query.py search "[topic]" --limit N`
2. Filter by category if needed: --category ar_its_integration
3. Filter by year if needed: --year-min 2022
4. Return ranked results with article metadata and relevant chunks
5. Provide citation-ready output (author, year, title, journal)
**Output**: Ranked article chunks with citation metadata

## Skill 2: BibTeX Extraction
**Trigger**: "extract references" or "build bibliography"
**Process**:
1. Read existing BibTeX: `.claude/data zotero/XB52Q53Z/references_ce.bib`
2. Cross-reference with 47 curated articles in used-Data
3. Generate missing BibTeX entries from PDF metadata
4. Parse author, year, title, journal, DOI from filenames and ft-cache
5. Merge into unified references.bib for the article
6. Validate: check for duplicate keys, missing fields, DOI format
**Output**: Complete references.bib file for the LaTeX article

## Skill 3: Bibliometric Analysis
**Trigger**: "bibliometric analysis" or "publication statistics"
**Process**:
1. Count articles by year, journal, methodology, topic
2. Generate publication trend data (year vs. count)
3. Identify most cited authors/papers in the corpus
4. Map keyword co-occurrence from article texts
5. Generate summary tables for the article's lit review
**Output**: Bibliometric statistics + LaTeX tables

## Skill 4: Data Quality Audit
**Trigger**: "audit data" or "check ingestion quality"
**Process**:
1. Run `py rag/query.py stats` to verify total chunks
2. Run `py rag/query.py list` to verify all 47 articles present
3. Check for empty/very short chunks (< 100 chars)
4. Verify category distribution matches expectations
5. Test queries across all categories to ensure coverage
6. Report any issues or gaps
**Output**: Data quality report with any fixes needed

## Skill 5: Firebase Data Schema Design
**Trigger**: "design Firebase schema" or "plan database structure"
**Process**:
1. Design Firestore collections:
   - users/{uid}: profile, settings, created_at
   - users/{uid}/vocabulary/{wordId}: word, mastery, scans, quizzes
   - users/{uid}/sessions/{sessionId}: timestamp, words_scanned, points_earned
   - users/{uid}/badges/{badgeId}: badge_type, earned_at
   - leaderboards/{classId}: user rankings (optional)
2. Define security rules (user can only read/write own data)
3. Design offline sync strategy (Firestore persistence)
4. Plan Cloud Functions for analytics aggregation
**Output**: Firestore schema document + security rules
