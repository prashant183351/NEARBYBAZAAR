# Compliance Suite (GDPR/DPDP)

## Features

- Data export: `/compliance/export` (POST, auth required)
- Data deletion: `/compliance/delete` (POST, auth required)
- Consent tracking: `/compliance/consent` (POST, auth required)
- All actions are logged in AuditLog
- Consent store for privacy/cookie acceptance

## Usage

- Users can request their data or deletion via API
- Admin can review AuditLog for compliance events
- Extend export/delete to cover more collections as needed

## CSRF & Cookie Consent

- If using cookies, add CSRF protection (see `csurf` middleware)
- Front-end: show cookie consent banner and POST to `/compliance/consent`

## Testing

- Test export returns all user data (redacted)
- Test delete redacts user PII
- Test consent is recorded

## References

- [GDPR](https://gdpr.eu/)
- [DPDP India](https://www.meity.gov.in/data-protection-framework)
