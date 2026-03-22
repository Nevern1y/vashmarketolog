# QA Engineer Tooling Notes

## Primary Sources
- Repo files and configs first.
- Browser/runtime checks second.
- Backend serializers, models, views, and URLs define server truth.

## Preferred Checks
- Targeted lint/build/test commands for the affected app.
- Browser-based verification for UI, interaction, and regressions.
- Local HTTP checks for API behavior when services are reachable.
- Console and network inspection for silent failures.

## Reporting Discipline
- Keep notes concise and actionable.
- Include exact file paths, URLs, steps, and observed failures.
- Separate verified behavior from assumptions and untested areas.
