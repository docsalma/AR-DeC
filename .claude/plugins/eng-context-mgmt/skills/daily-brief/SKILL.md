---
name: daily-brief
description: Generate a daily engineering briefing summarizing project state, recent changes, and recommended focus areas for today's session.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash
---

# Daily Engineering Brief

Generate a focused briefing for today's AR-DeC work session.

## Gather Context
1. Read MEMORY.md and key memory files
2. Check git log for recent commits (last 3 days)
3. Scan for any TODO/FIXME comments in source
4. Check if Docker (Weaviate) is running
5. Check if any build artifacts are stale

## Briefing Format

```
# Daily Brief - [today's date]

## What's Done
- [recent completions from git log and memory]

## What's In Progress
- [open work items, partially complete features]

## Recommended Focus Today
Based on project priorities and what's closest to completion:
1. [highest priority action]
2. [secondary action]
3. [if time permits]

## Environment Check
- Docker/Weaviate: [running/stopped]
- Node/npm: [available]
- LaTeX: [available]
- Last successful build: [date]

## Reminders
- [any deadlines from project memories]
- [any blockers to address]
```

Keep the briefing concise - aim for 20-30 lines max.
