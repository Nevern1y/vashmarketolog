# goscontract_data versioning and optimistic updates

## Goals
- Track changes to goscontract_data without polluting the payload sent to bank APIs.
- Detect concurrent edits and avoid silent overwrites.
- Keep UI responsive with optimistic updates and clear conflict handling.

## Proposed backend changes
1. Add an integer field `goscontract_data_version` to `Application` (default 1).
2. Add a snapshot model, e.g. `ApplicationGoscontractSnapshot`:
   - application (FK)
   - version (int)
   - payload (JSON)
   - created_at, created_by
3. On update:
   - require `goscontract_data_version` in PATCH payload
   - if incoming version != current version -> return 409 Conflict
   - if OK, increment version, store snapshot, save new JSON
4. Add a read endpoint for version history (optional, paginated).

## Frontend changes (contract)
1. Read `goscontract_data_version` from application payload.
2. Send it back on PATCH with goscontract_data updates.
3. On 409:
   - show a conflict dialog (refresh, compare, or overwrite)
   - on refresh, reload the application and reapply edits if needed.

## Notes
- Do not store version metadata inside `goscontract_data` to avoid breaking bank API payloads.
- If audit is required, snapshots can be pruned or archived with retention policy.
