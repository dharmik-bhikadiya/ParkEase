# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting Vulnerabilities

If you discover a potential security vulnerability within **ParkEase**, please follow these security guidelines:

1. **Do NOT open a public GitHub Issue** for security vulnerabilities.
2. Report security concerns privately by submitting a detailed security advisory or emailing the project maintainers directly.
3. Include clear steps to reproduce the issue, potential impact, and suggested mitigation if available.

---

## Secret & Credential Safety
- Never commit `.env` files, production database passwords, JWT signing secrets, or OAuth credentials.
- All secrets must be injected through environment variables at deployment runtime.
