# Email API Reference

## Authentication

All email endpoints require an `X-API-Key` header with your project API key.

```bash
curl -H "X-API-Key: your-project-api-key" ...
```

> **Note:** Project ID is automatically determined from your API key. The engine uses the project’s own SMTP credentials (configured via the [Admin API](./ADMIN_API.md)), falling back to global `.env` defaults if none are set.

---

## Template Management

Manage HTML and Text email templates scoped to your project.

### 1. Create Template
**Endpoint:** `POST /api/email/templates`

**Request:**
```json
{
  "name": "Welcome Email",
  "description": "Standard welcome email for new users",
  "subject": "Welcome, {{name}}!",
  "htmlContent": "<h1>Hello {{name}}</h1><p>Welcome to {{appName}}.</p>",
  "textContent": "Hello {{name}}, Welcome to {{appName}}.",
  "variables": ["name", "appName"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Welcome Email",
  "subject": "Welcome, {{name}}!",
  "htmlContent": "...",
  "textContent": "...",
  "variables": ["name", "appName"],
  "createdAt": "2024-02-12T10:00:00Z"
}
```

### 2. Get Templates
**Endpoint:** `GET /api/email/templates`

**Response:** Array of template objects.

### 3. Get Template Details
**Endpoint:** `GET /api/email/templates/:templateId`

**Response:** Full template object.

### 4. Update Template
**Endpoint:** `PUT /api/email/templates/:templateId`

**Request:** Partial updates allowed (e.g. `subject`, `htmlContent`).

### 5. Delete Template
**Endpoint:** `DELETE /api/email/templates/:templateId`

**Response (204):** No Content

---

## Sending Emails

### 1. Send Single Email
**Endpoint:** `POST /api/email/send`

**Request (Standard):**
```json
{
  "to": "user@example.com",
  "subject": "Manual Subject",
  "html": "<p>Content</p>"
}
```

**Request (Using Template):**
```json
{
  "to": "user@example.com",
  "templateId": "uuid-of-template",
  "templateVariables": {
    "name": "John",
    "appName": "My App"
  }
}
```
> **Note:** When using `templateId` or `templateName`, `subject`, `html`, and `text` are optional. The template content will be used.

---

### 2. Send Bulk Emails

**Endpoint:** `POST /api/email/send-bulk`

**Request:**
```json
{
  "batchName": "Monthly Newsletter - Oct 2024",
  "batchSize": 100,
  "emails": [
    {
      "to": "user1@example.com",
      "templateName": "welcome_email",
      "templateVariables": { "name": "Bob" }
    },
    {
      "to": "user2@example.com",
      "subject": "Newsletter",
      "html": "<h1>Hi Jane</h1>"
    }
  ]
}
```

**Response (201):**
```json
{
  "batchId": "uuid",
  "totalEmails": 2,
  "batchCount": 1,
  "batchSize": 100,
  "status": "QUEUED",
  "message": "Bulk emails queued in 1 batches"
}
```

---

## Batch Processing & Status

### 1. Get Batch Status
**Endpoint:** `GET /api/email/batch/:batchId`

**Response:**
```json
{
  "batchId": "uuid",
  "batchName": "Newsletter",
  "status": "PROCESSING",
  "totalEmails": 500,
  "processedCount": 245,
  "successCount": 240,
  "failedCount": 5,
  "progress": 49
}
```

### 2. Get Failed Emails
**Endpoint:** `GET /api/email/batch/:batchId/failed`

**Response:** List of failed emails with SMTP error messages.

### 3. Retry Failed Emails
**Endpoint:** `POST /api/email/batch/:batchId/retry`

**Response:** Queues the failed emails back to the processor.

---

## Features

### Retry Mechanism

Automatic retry with exponential backoff for failed deliveries:
| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 2 minutes |
| 3rd retry | 4 minutes |

After 3 failures → marked as `FAILED`.

### Batch Processing Configuration
- **Default batch size:** 100 emails
- **Stagger delay:** 5 seconds between batches
- **Real-time tracking:** Counters update as emails process
