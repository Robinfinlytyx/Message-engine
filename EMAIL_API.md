# Communication Engine - Email API Reference

## Authentication

All email endpoints require an `X-API-Key` header with your project API key.

```bash
curl -H "X-API-Key: your-project-api-key" ...
```

> **Note:** Project ID is automatically determined from your API key. The engine uses the project’s own SMTP credentials (configured via the [Project Configuration API](./WHATSAPP_API.md#project-configuration)), falling back to global `.env` defaults if none are set.

---

## Endpoints

### 1. Template Management
- [Create Template](#create-template)
- [Get Templates](#get-templates)
- [Get Template](#get-template-details)
- [Update Template](#update-template)
- [Delete Template](#delete-template)

---

## Template Management

### Create Template
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

### Get Templates
**Endpoint:** `GET /api/email/templates`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Welcome Email",
    "subject": "Welcome, {{name}}!",
    "createdAt": "2024-02-12T10:00:00Z"
  }
]
```

### Get Template Details
**Endpoint:** `GET /api/email/templates/:templateId`

**Response:**
```json
{
  "id": "uuid",
  "name": "Welcome Email",
  "description": "Standard welcome email for new users",
  "subject": "Welcome, {{name}}!",
  "htmlContent": "<h1>Hello {{name}}</h1><p>Welcome to {{appName}}.</p>",
  "textContent": "Hello {{name}}, Welcome to {{appName}}.",
  "variables": ["name", "appName"],
  "createdAt": "2024-02-12T10:00:00Z",
  "updatedAt": "2024-02-12T10:00:00Z"
}
```

### Update Template
**Endpoint:** `PUT /api/email/templates/:templateId`

**Request:**
```json
{
  "subject": "New Subject: Welcome {{name}}",
  "htmlContent": "New HTML Content..."
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Welcome Email",
  "subject": "New Subject: Welcome {{name}}",
  "htmlContent": "New HTML Content...",
  "textContent": "...",
  "variables": ["name", "appName"],
  "createdAt": "2024-02-12T10:00:00Z",
  "updatedAt": "2024-02-12T10:05:00Z"
}
```

### Delete Template
**Endpoint:** `DELETE /api/email/templates/:templateId`

**Response (204):** No Content

---

### 2. Sending Emails
- [Send Single Email](#send-single-email)
- [Send Bulk Emails](#send-bulk-emails)

- [Get Failed Emails](#get-failed-emails)
- [Retry Failed Emails](#retry-failed-emails)

### Send Single Email
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
> **Note:** When using `templateId` or `templateName`, `subject`, `html`, and `text` are optional. The template content will be used. Provide `templateVariables` as a JSON object where keys match the `{{variableName}}` placeholders in your template.

---

### Send Bulk Emails

**Endpoint:** `POST /api/email/send-bulk`

> **Note:** When using `templateId` or `templateName` in individual emails, `subject`, `html`, and `text` are optional. Provide `templateVariables` as a JSON object where keys match the `{{variableName}}` placeholders in your template.

**Request (Standard):**
```json
{
  "batchName": "Monthly Newsletter - Oct 2024",
  "batchSize": 100,
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Newsletter",
      "html": "<h1>Hi John</h1>"
    },
    {
      "to": "user2@example.com",
      "subject": "Newsletter",
      "html": "<h1>Hi Jane</h1>"
    }
  ]
}
```

**Request (Using Template):**
```json
{
  "batchName": "Monthly Newsletter - Oct 2024",
  "batchSize": 100,
  "emails": [
    {
      "to": "user1@example.com",
      "templateId": "uuid-of-template",
      "templateVariables": { "name": "John" }
    },
    {
      "to": "user2@example.com",
      "templateId": "uuid-of-template",
      "templateVariables": { "name": "Jane" }
    },
    {
      "to": "user3@example.com",
      "templateName": "welcome_email",
      "templateVariables": { "name": "Bob" }
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

### Get Batch Status

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

**Status Values:** `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`

---

### Get Failed Emails

**Endpoint:** `GET /api/email/batch/:batchId/failed`

**Response:**
```json
{
  "batchId": "uuid",
  "failedEmails": [
    {
      "id": "uuid",
      "to": "invalid@example.com",
      "subject": "Newsletter",
      "status": "FAILED",
      "retryCount": 3,
      "error": { "message": "SMTP error: Invalid recipient" }
    }
  ],
  "count": 1
}
```

---

### Retry Failed Emails

**Endpoint:** `POST /api/email/batch/:batchId/retry`

**Response:**
```json
{
  "message": "Retried 5 failed emails",
  "batchId": "uuid",
  "retriedCount": 5,
  "skippedCount": 2
}
```

---

## Features

### Retry Mechanism

Automatic retry with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 2 minutes |
| 3rd retry | 4 minutes |

After 3 failures → marked as `FAILED`.

### Batch Processing

- **Default batch size:** 100 emails
- **Stagger delay:** 5 seconds between batches
- **Real-time tracking:** Counters update as emails process

---

## Environment Configuration

These are **optional global defaults**. Each project can override them via the [Project Configuration API](./WHATSAPP_API.md#project-configuration).

```bash
# Default SMTP Configuration (used when a project has no config of its own)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourapp.com
DEFAULT_FROM_NAME=YourApp

# Tuning
EMAIL_BATCH_SIZE=100
EMAIL_MAX_RETRIES=3
EMAIL_WORKER_CONCURRENCY=5
```

**Gmail:** Enable 2FA → Generate "App Password" → Use in `SMTP_PASSWORD`

---

## Quick Test

```bash
# Send test email
curl -X POST http://localhost:5000/api/email/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"to": "test@example.com", "subject": "Test", "text": "Hello!"}'

# Check batch status
curl http://localhost:5000/api/email/batch/batch-uuid \
  -H "X-API-Key: your-api-key"
```
