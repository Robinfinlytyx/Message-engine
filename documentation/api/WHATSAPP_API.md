# WhatsApp API Reference

The WhatsApp Message Engine uses Telinfy APIs under the hood. It supports multi-project architecture, template messaging, bulk sends, and webhook handling.

## Authentication

All WhatsApp endpoints require an `X-API-Key` header with a valid project API key.

```bash
curl -H "X-API-Key: your-project-api-key" ...
```

---

## Sending Messages

### 1. Send Template Message
Sends a WhatsApp template message to a recipient.

**Endpoint:** `POST /api/whatsapp/send-template`

**Request Body Structure:**
```typescript
{
  to: string;              // Required: Recipient phone number with country code
  templateName: string;    // Required: Approved template name from Telinfy
  language: string;        // Required: Language code (e.g., "en", "hi")
  header?: {               // Optional: Template header parameters
    parameters: Array<HeaderParameter>
  } | null;
  body?: {                 // Optional: Template body parameters
    parameters: Array<BodyParameter>
  } | null;
  button?: Array<ButtonParameter> | null;  // Optional: Button parameters
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "to": "+919876543210",
    "templateName": "order_confirmation",
    "language": "en",
    "body": {
      "parameters": [
        { "type": "text", "text": "John Doe" },
        { "type": "text", "text": "ORD-12345" }
      ]
    }
  }'
```

**Response (202 Accepted):**
```json
{
  "messageId": "uuid-v4",
  "status": "QUEUED"
}
```

---

## Template Management

Manage WhatsApp templates for your project. Templates are scoped to your Project ID and synced with your Telinfy provider credentials.

### 1. Get All Templates
Retrieves all templates for the project from the local database.

**Endpoint:** `GET /api/whatsapp/templates`

### 2. Sync Templates
Fetches templates from Telinfy using the project's own credentials and updates the local database.

**Endpoint:** `POST /api/whatsapp/templates/sync`

### 3. Create Template
Creates a new template on Telinfy and saves it locally.

**Endpoint:** `POST /api/whatsapp/templates`

**Example Body:**
```json
{
  "name": "new_template",
  "language": "en",
  "category": "MARKETING",
  "allowCategoryChange": true,
  "label": "My New Template",
  "components": [
    {
      "type": "BODY",
      "text": "Hello {{1}}, welcome to our service!",
      "example": {
        "bodyText": [["John"]]
      },
      "bodyExample": "Hello John, welcome to our service!"
    }
  ]
}
```

---

## Bulk Messaging (Notify)

Sends a template message to multiple recipients using Telinfy Notify endpoint.

**Endpoint:** `POST /api/whatsapp/notify`

**Example Request:**
```json
{
  "templateName": "hello_world",
  "language": "en_US",
  "recipients": [
    {
      "to": "919999999999",
      "body": { "parameters": [{ "type": "text", "text": "John" }] }
    },
    {
      "to": "918888888888",
      "body": { "parameters": [{ "type": "text", "text": "Jane" }] }
    }
  ]
}
```

---

## Webhooks

The system handles webhooks from Telinfy for message status updates and inbound messages.

**Endpoint:** `POST /webhooks/whatsapp`

**Important Note:** 
- The endpoint does not require authentication from Telinfy but relies on internal routing/business IDs.
- The system processes `status` events (sent, delivered, read, failed).
- The system stores inbound `messages` from users.

Webhook events flow through and update the internal `messages` table based on `provider_message_id`. All raw payloads are stored in the `webhook_events` table for audit logging.
