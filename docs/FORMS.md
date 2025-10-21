# NearbyBazaar Forms Feature Documentation

This guide covers the form builder, API usage, and embedding forms in NearbyBazaar.

---

## How to Build a Form

1. Go to the Admin > Forms > Builder page.
2. Drag and drop fields to design your form (text, select, checkbox, etc.).
3. Set field properties (required, options, file limits, etc.).
4. Save the form schema; it will be available for submissions.
5. Manage permissions in the Permissions tab to control who can view, submit, or edit the form.

---

## Embedding a Form

You can embed a form on an external site using the embed widget:

```html
<script src="https://yourdomain.com/embed/form.js" data-form-id="FORM_ID"></script>
```

This will render the form in an iframe and handle submission events via postMessage.

---

## API Endpoints

### List Forms
```
GET /api/forms
```
Returns all forms (subject to permissions).

### Create Form
```
POST /api/forms
Content-Type: application/json
{
  "name": "Contact Us",
  "fields": [ ... ]
}
```

### Update Form
```
PUT /api/forms/{id}
Content-Type: application/json
{
  ...updated fields...
}
```

### Delete Form
```
DELETE /api/forms/{id}
```

### Submit Form Entry
```
POST /api/forms/submit
Content-Type: application/json
{
  "formId": "...",
  "data": { ... }
}
```

### Export Submissions as CSV
```
GET /api/forms/{formId}/export/csv
```
Streams all submissions for a form as CSV.

---

## Example: Retrieve Submissions

```sh
curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/forms/{formId}/entries
```

---

_Last updated: 2025-10-19_
