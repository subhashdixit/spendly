# Browser expense workspace

Provide an independent GitHub Pages expense tracker with expense creation, edit, deletion, category/date filters, summaries and JSON import/export. Keep the original Flask authentication prototype and database outside the published site. This release is a single-device local workspace: do not imply server accounts or cross-device synchronization. Store integer minor units, reject invalid dates/amounts and malformed imports, escape output through DOM text APIs, and permit complete clearing. No original spendly.db records may enter a fixture or deployment.

Acceptance: CRUD modifies the expected item only; sums are exact integer units; invalid/duplicate imports are rejected before replacing existing state; export/import preserves validated records; empty/new workspace works; filtered totals match visible records; original Flask prototype remains available.
