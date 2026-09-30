#!/usr/bin/env bash
# Where are the parallel agents? Shows each agent worktree's branch, commits ahead of main,
# uncommitted files, PROGRESS.md notes and the time of the last file change.
# Usage: bash scripts/agent_status.sh
cd "$(dirname "$0")/.."
for w in .claude/worktrees/agent-*; do
  [ -d "$w" ] || continue
  echo "=== $w"
  ( cd "$w"
    echo "branch: $(git branch --show-current)   ahead of main: $(git rev-list --count main..HEAD)"
    git log --oneline main..HEAD | head -5
    n=$(git status --short | grep -v node_modules | wc -l | tr -d ' ')
    echo "uncommitted paths: $n"; git status --short | grep -v node_modules | head -12
    last=$(find . -path ./node_modules -prune -o -path ./.git -prune -o -type f -newer .git -print 2>/dev/null | grep -v "__pycache__\|\.pyc\|\.venv" | xargs -I{} stat -f "%m {}" {} 2>/dev/null | sort -rn | head -1)
    [ -n "$last" ] && echo "last change: $(date -r ${last%% *} '+%H:%M:%S') ${last#* }"
    for p in $(find . -name PROGRESS.md -not -path "./node_modules/*" 2>/dev/null); do echo "--- $p"; head -25 "$p"; done )
  echo
done
