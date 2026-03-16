---
name: project-status
description: Display current AR-DeC project status across all phases with completion tracking and next actions.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [verbose]
---

# Project Status

Generate a comprehensive project status report for AR-DeC.

## Data Sources
1. Read `D:\Wproject\AR-DeC\CLAUDE.md` for planned architecture
2. Read `C:\Users\elbjs\.claude\projects\D--Wproject-AR-DeC\memory\MEMORY.md` for tracked progress
3. Scan directories to verify actual file counts:
   - `app/src/**/*.ts` and `app/src/**/*.tsx` for app files
   - `article/sections/*.tex` for article 1 sections
   - `article2/sections/*.tex` for article 2 sections
   - `article2/images/*.png` for UML diagrams
   - `rag/*.py` for RAG scripts

## Report Format

```
# AR-DeC Status Report

## Phase 0: RAG Pipeline
Status: [COMPLETE/IN PROGRESS/NOT STARTED]
Files: X scripts, Y articles ingested, Z chunks
Notes: ...

## Phase 1: Mobile App
Status: [COMPLETE/IN PROGRESS/NOT STARTED]
Files: X/18 source files implemented
TypeScript: [passes/fails]
Notes: ...

## Phase 2: Article 1
Status: [COMPLETE/IN PROGRESS/NOT STARTED]
Files: X section files, Y figures
Compiles: [yes/no] (X pages)
Notes: ...

## Article 2: UML Paper
Status: [COMPLETE/IN PROGRESS/NOT STARTED]
Files: X sections, Y diagrams (PlantUML)
Compiles: [yes/no] (X pages)
Notes: ...

## Next Priority Actions
1. ...
2. ...
3. ...
```

If $ARGUMENTS contains "verbose", include file-level detail for each phase.
