---
name: memory-review
description: Review and clean up memory files, removing stale entries and ensuring accuracy. Use periodically or when memory seems outdated.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# Memory Review

Audit all memory files for the AR-DeC project.

## Step 1: Inventory
- Read `C:\Users\elbjs\.claude\projects\D--Wproject-AR-DeC\memory\MEMORY.md`
- List all memory files referenced
- Read each memory file

## Step 2: Validate Each Memory
For each memory file, check:
- Is the information still accurate? (verify against codebase)
- Is it redundant with CLAUDE.md? (if so, consider removing)
- Is the type (user/feedback/project/reference) still correct?
- Are dates still relevant? (flag anything older than 2 weeks as potentially stale)

## Step 3: Clean Up
- Remove or update stale memories
- Merge duplicates
- Ensure MEMORY.md index is under 200 lines
- Verify all referenced files actually exist

## Step 4: Report
Output:
- Total memories: X
- Updated: Y
- Removed: Z
- New gaps identified (things we should remember but don't)
