# Development workflow

Use developer-facing language in documentation, code comments, and commit messages. Explain intent, constraints, and behavior for another developer.

Read the product references, API contract, and developer map before making changes. Keep framework choices, units, enums, envelopes, and shared service signatures consistent with the contract. Review shared interface changes before updating their consumers.

Keep the frontend and backend independently installable. Update canonical contracts and synchronize generated copies when an agreed API change is required. Keep secrets, local tooling configuration, build output, and temporary test artifacts out of version control.

Commit each coherent, verified increment. Aim for approximately 20 to 30 meaningful commits across the complete project, rather than manufacturing commits to meet a count. Use concise descriptions of engineering changes. Stage only files belonging to the change.

Run the relevant application's lint, type checks, focused tests, formatting check, and build. Frontend review should include screenshots of every finished screen at desktop and mobile sizes, with corrections for visible issues. Use additional browser automation only when needed to investigate a concrete failure.

Use contract-valid mock responses for isolated frontend development. Test major increments with the relevant checks; backend changes also require isolated MongoDB integration tests. Full-stack changes should pass the local Docker smoke test. The project owner performs final local acceptance testing and VM deployment.
