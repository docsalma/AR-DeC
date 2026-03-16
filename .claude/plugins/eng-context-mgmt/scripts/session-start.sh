#!/bin/bash
# session-start.sh - Run at session start to initialize context management
# Outputs a system-reminder that gets injected into the conversation

cat << 'EOF'
<user-prompt-submit-hook>
Engineering Context Manager is active. Available commands:
- /eng-context-mgmt:context-sync - Sync project context from codebase
- /eng-context-mgmt:project-status - Show full project status
- /eng-context-mgmt:memory-review - Audit and clean memory files
- /eng-context-mgmt:daily-brief - Generate today's engineering briefing

The eng-context-manager agent will be used proactively when tasks require project awareness.
</user-prompt-submit-hook>
EOF

exit 0
