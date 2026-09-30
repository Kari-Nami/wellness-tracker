# Development workflow

Use developer-facing language in documentation, code comments, and commit messages. Explain intent, constraints, and behavior for another developer.

Read the product references, API contract, and assigned handoff before making changes. Keep framework choices, units, enums, envelopes, and shared service signatures consistent with the contract. Coordinate changes to shared interfaces with the frontend lead.

Keep the frontend and backend independently installable. Update canonical contracts and synchronize generated copies when an agreed API change is required. Keep secrets, local tooling configuration, build output, and temporary test artifacts out of version control.

Commit each coherent, verified increment. Aim for approximately 20 to 30 meaningful commits across the complete project, rather than manufacturing commits to meet a count. Use concise descriptions of engineering changes. Stage only files belonging to your scope and avoid overwriting concurrent work.

Run the relevant application's lint, type checks, focused tests, formatting check, and build. Frontend review should include screenshots of every finished screen at desktop and mobile sizes, with corrections for visible issues. Use additional browser automation only when needed to investigate a concrete failure.

Complete the frontend against contract-valid mock responses before the backend handoff. After backend implementation, verify ownership, authorization, scoring, analytics, and deployment behavior before connecting the full stack. The project owner performs final local acceptance testing and VM deployment.
