# Security Policy

We take the security of NearbyBazaar and its users seriously. This document outlines how to report vulnerabilities, our responsible disclosure guidelines, and security best practices for contributors.

## Supported versions
We aim to patch actively maintained branches. Unless otherwise stated, the `main` branch and the latest tagged release are supported for security fixes.

## Reporting a vulnerability
- Email: security@nearbybazaar.example (placeholder)
- Subject: "Vulnerability Report: <short summary>"
- Include: detailed description, steps to reproduce, potential impact, affected components/versions, and any relevant logs or PoCs.
- Please avoid sharing sensitive data when reporting.

We will acknowledge your report within 2 business days and provide regular updates until resolution.

## Responsible disclosure
- Do not publicly disclose vulnerabilities before we confirm a fix is available and deployed (coordinated disclosure).
- Make a good-faith effort to avoid privacy violations, data destruction, or service disruption.
- Use only accounts you own when testing; do not attempt to access data of other users.
- Once the issue is fixed, we will credit you (if desired) and share details in release notes or advisories.

## Safe harbor
If you follow the guidelines above and act in good faith, we will not pursue legal action for your research activities related to NearbyBazaar.

## Out of scope / prohibited activities
- Physical attacks against infrastructure or employees.
- Social engineering.
- Automated scanning that overwhelms the service (DoS/DDoS).
- Accessing or exfiltrating personal data beyond what is necessary to demonstrate a vulnerability.

## Bug bounty
We currently do not run a paid bug bounty program. Responsible disclosures are welcomed and appreciated. If/when a bounty program is introduced, we will update this document and link to the program’s terms.

## Secrets management
- Never commit real secrets (API keys, passwords, private keys) to the repository.
- Use environment variables and secret managers in production.
- Rotate secrets regularly and immediately if you suspect compromise.
- Do not log sensitive information.

## Data protection
- Handle personal data according to applicable regulations (e.g., GDPR, DPDP).
- Apply least-privilege principles across services and databases.
- Encrypt data in transit (TLS) and at rest where applicable.

## Contact & disclosure program
- Primary: security@nearbybazaar.example (placeholder)
- If a formal disclosure program exists, it will be linked here.

## Security hardening roadmap (high-level)
- Request validation, sanitization, and rate limiting across APIs.
- 2FA/TOTP and device/session security for sensitive actions.
- Structured logging (pino) with request IDs and idempotency keys for critical flows.
- Immutable audit logging for sensitive operations.
- Bot protection (reCAPTCHA/hCaptcha) on public forms.
- SIEM integration and alerting for suspicious activity.

Thank you for helping keep NearbyBazaar and our community safe.
