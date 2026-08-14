## Summary of Changes
Provide a brief summary of what this pull request changes and why.

## Affected Components
- [ ] Backend (`backend/`)
- [ ] Web Client (`apps/web/`)
- [ ] Mobile Client (`apps/mobile/`)
- [ ] Shared Library (`packages/shared/`)
- [ ] Documentation (`docs/`)

## Checklist & Verification
- [ ] **Web Build Tested**: `npm run build` in `apps/web` succeeded without errors.
- [ ] **Mobile Typechecked**: `npx tsc --noEmit` in `apps/mobile` succeeded.
- [ ] **Backend Tests Passed**: `py -m pytest backend/tests` succeeded (all tests passing).
- [ ] **Database Migration Included**: If schema changed, Alembic migration file is attached.
- [ ] **Security Check**: Verified that no secrets, `.env` files, or private credentials are included.

## Screenshots / Evidence
*(Attach screenshots or console logs if applicable)*
