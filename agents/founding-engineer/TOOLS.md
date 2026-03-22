# Founding Engineer Tooling Notes

## Primary Sources
- Repo files and configs first.
- Backend serializers, models, views, and URLs define contracts.
- Runtime checks are valid only when the backing service is actually reachable.

## Working Preferences
- Use targeted file searches and reads before large edits.
- Use terminal commands for lint, build, local HTTP checks, and focused verification.
- Use Paperclip issue updates/comments for status, blockers, and completion notes.

## Repo Notes
- Root app scripts live in `package.json`.
- Landing scripts live in `lider-garant/package.json`.
- Backend dependencies and runtime stack live in `backend`.
- The repo is not guaranteed to have all runtime services up, so separate static facts from runtime assumptions.
