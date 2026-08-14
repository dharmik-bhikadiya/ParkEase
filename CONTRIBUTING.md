# Contributing to ParkEase

Thank you for your interest in contributing to **ParkEase**!

---

## Code of Conduct
We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please be respectful and constructive in all communications.

---

## Getting Started

1. **Fork & Clone the Repository**
   ```bash
   git clone https://github.com/your-username/ParkEase.git
   cd ParkEase
   ```

2. **Branch Naming Conventions**
   - `feat/feature-name` for new features
   - `fix/bug-description` for bug fixes
   - `docs/documentation-update` for documentation changes
   - `refactor/component-name` for code refactoring

3. **Development Environment Setup**
   Refer to [docs/development/local-development.md](docs/development/local-development.md) for full setup instructions across Backend, Web, and Mobile.

---

## Commit Guidelines
We follow Conventional Commits formatting:

- `feat:` Add new feature or endpoint
- `fix:` Resolve a bug or crash
- `docs:` Update documentation
- `refactor:` Code refactoring without functionality changes
- `test:` Add or update automated test cases
- `chore:` Maintenance tasks or package updates

---

## Pull Request Checklist
Before submitting a Pull Request, ensure:

- [ ] Code compiles cleanly without warnings or errors.
- [ ] Backend tests pass (`py -m pytest backend/tests`).
- [ ] Shared package builds (`npm run build` in `packages/shared`).
- [ ] Web application builds (`npm run build` in `apps/web`).
- [ ] Mobile TypeScript validation passes (`npx tsc --noEmit` in `apps/mobile`).
- [ ] No hardcoded API keys, JWT secrets, or environment credentials are committed.
