#!/usr/bin/env bash
# PreToolUse hook (Bash matcher) — enforces the branch + PR workflow locally.
# Server-side branch protection on origin/main is the real gate; this hook
# catches the mistake earlier: a commit made on local main strands work that
# can never be pushed.
#
# Blocks:
#   - `git commit` while the current branch is main
#   - `git push` while on main (except tag-only pushes — the release runbook
#     pushes the vX.Y.Z tag from the main checkout, see docs/releasing.md)
#   - any `git push` with an explicit main refspec (origin main, HEAD:main)
set -u

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')

# Fast exit for non-git commands.
case "$cmd" in *git*) ;; *) exit 0 ;; esac

dir="${CLAUDE_PROJECT_DIR:-.}"
branch=$(git -C "$dir" branch --show-current 2>/dev/null || echo "")

deny() {
  jq -cn --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

if [ "$branch" = "main" ] && printf '%s' "$cmd" | grep -qE 'git[[:space:]]+commit'; then
  deny "Règle du repo : pas de commit direct sur main. Crée une branche (fix/…, feat/…, docs/…, ci/…, release/vX.Y.Z) puis ouvre une PR — voir CONTRIBUTING.md."
fi

if [ "$branch" = "main" ] && printf '%s' "$cmd" | grep -qE 'git[[:space:]]+push'; then
  # Tag-only pushes are part of the release runbook and stay allowed.
  if ! printf '%s' "$cmd" | grep -qE -- '--tags|refs/tags/|push[[:space:]]+[^[:space:]]+[[:space:]]+v[0-9]'; then
    deny "Règle du repo : pas de push depuis main (seuls les tags de release passent). Branche + PR obligatoires — voir CONTRIBUTING.md."
  fi
fi

if printf '%s' "$cmd" | grep -qE 'git[[:space:]][^|;&]*push[^|;&]*[[:space:]:+]main([[:space:]]|$)'; then
  deny "Règle du repo : push vers main interdit — passe par une PR. La protection de branche côté GitHub le rejetterait de toute façon."
fi

exit 0
