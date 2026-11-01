# Implementation plan

1. Review scope: Pages is static; implement the approved single-device adaptation while preserving the original Flask account prototype.
2. Separate validated expense book logic from localStorage and DOM orchestration.
3. Add bounded forms, exact minor-unit arithmetic, immutable updates, filter totals, import/export and explicit local persistence.
4. Add behavior tests for CRUD, ownership by ID within the book, dates, arithmetic and transactional import.
5. Publish only site; run quality checks and inspect browser flows.
