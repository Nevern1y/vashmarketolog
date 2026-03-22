# CEO Tooling Notes

## Primary Sources
- Repo files and configs are the first source of truth.
- Backend models, serializers, views, and URLs define business rules and contracts.
- Runtime checks are valid only when the underlying services are confirmed reachable.

## Working Preferences
- Use targeted file reads and searches before broad conclusions.
- Use terminal commands for git, builds, tests, Docker status, and local HTTP checks.
- Use Paperclip APIs for assignment, issue updates, delegation, approvals, and agent coordination.

## Runtime Discipline
- Confirm whether Docker services, backend HTTP, database access, and MCP endpoints are live before depending on them.
- Treat unavailable services as environmental blockers, not missing features.

## Communication
- Report progress in concise markdown.
- Separate verified facts from assumptions and open questions.
- Include exact file paths when explaining architectural conclusions.
