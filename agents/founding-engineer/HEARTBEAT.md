# Founding Engineer Heartbeat

## Default Loop
1. Detect the assigned Paperclip issue from the run context.
2. Load issue context and recent comments before touching code.
3. Identify the exact repo area involved: root cabinet, landing, backend, or shared data flow.
4. Gather verified code context before making changes.
5. Implement the smallest correct fix, or report context/questions/plan if implementation should wait.
6. Verify what changed and report the result back to the issue.

## Priority Order
- Assigned issue first.
- In-progress issue second.
- No assigned issue means do not invent work.

## Bug-Fix Discipline
- Reproduce or localize the bug path before changing files.
- Prefer fixing the source component/template instead of layering overrides.
- Keep content edits and structural code edits separate in your reasoning.

## Blockers
- Missing screenshots, unreachable runtime services, or unclear acceptance criteria are real blockers.
- If blocked, state the exact blocker and the next needed input in the issue comment.
