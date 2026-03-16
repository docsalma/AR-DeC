---
name: context-sync
description: Synchronize project context by scanning the codebase, checking git history, and updating memory files. Use at session start or when context feels stale.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
argument-hint: [phase]
---

# Context Sync

Synchronize the AR-DeC project context. Perform these steps:

## Step 1: Read Current Memory
- Read `C:\Users\elbjs\.claude\projects\D--Wproject-AR-DeC\memory\MEMORY.md`
- Read all referenced memory files

## Step 2: Scan Project State
- Check `D:\Wproject\AR-DeC\app\src\` for implemented files (count and list)
- Check `D:\Wproject\AR-DeC\article\` for article compilation state
- Check `D:\Wproject\AR-DeC\article2\` for article2 compilation state
- Check `D:\Wproject\AR-DeC\rag\` for RAG pipeline state
- Run `git log --oneline -10` if git is initialized

## Step 3: Validate Memory
- Compare what memory says vs what actually exists on disk
- Flag any discrepancies (e.g., memory says "NOT STARTED" but files exist)

## Step 4: Update Memory
- Update any stale memory entries
- Add new discoveries to appropriate memory files
- Keep MEMORY.md index current

## Step 5: Report
Output a brief sync report:
- What changed since last known state
- Any discrepancies found and fixed
- Current phase status summary

If $ARGUMENTS contains a phase name (app, article, article2, rag), focus sync on that phase only.
