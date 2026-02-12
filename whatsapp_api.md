# WhatsApp Message Engine - API Documentation

## Overview

The WhatsApp Message Engine is a **multi-project server-side platform** for sending WhatsApp messages using Telinfy APIs. It supports:
- **Multi-project architecture** with API key authentication
- Template-based outbound messages
- **Campaign messaging** for bulk sends
- Async message delivery with automatic retries
- Message lifecycle tracking (QUEUED → SENT → DELIVERED → READ/FAILED)
- Webhook handling for status updates and inbound messages

**Base URL:** `http://localhost:3000` (development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
   - [Project Management](#project-management)
   - [Send Template Message](#send-template-message)
   - [Campaign Messaging](#campaign-messaging)
   - [Webhook Handler](#webhook-handler)
   - [Health Check](#health-check)
3. [Message Lifecycle](#message-lifecycle)
4. [Template Message Examples](#template-message-examples)
5. [Webhook Events](#webhook-events)
6. [Error Codes](#error-codes)

---

## Authentication

### API Key Authentication

All messaging endpoints require an `X-API-Key` header with a valid project API key.

```bash
curl -H "X-API-Key: your-project-api-key" ...
```

API keys are generated when you register a project. See [Project Management](#project-management) for details.

> **Note:** Admin endpoints (`/api/admin/*`) currently do not require authentication.

---

## API Endpoints

### Project Management

Register and manage projects for API access.

#### Register Project

```
POST /api/admin/projects
```

**Request Body:**
```json
{
  "name": "My Application",
  "description": "Optional description"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "name": "My Application",
    "apiKey": "generated-api-key-save-this",
    "status": "active",
    "createdAt": "2026-02-05T10:00:00Z"
  },
  "message": "Project created successfully"
}
```

> ⚠️ **Important:** Save the `apiKey` - it cannot be retrieved again!

#### List Projects

```
GET /api/admin/projects
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Application",
      "status": "active",
      "createdAt": "2026-02-05T10:00:00Z"
    }
  ]
}
```

---

### Send Template Message

Sends a WhatsApp template message to a recipient.

#### Endpoint
```
POST /api/whatsapp/send-template
```

#### Headers
```
Content-Type: application/json
X-API-Key: your-project-api-key
```

#### Request Body Structure

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

#### Parameter Types

**HeaderParameter** (for media):
```typescript
// Image
{
  type: "image",
  image: {
    link: string  // Public URL to image (.png, .jpg)
  }
}

// Video
{
  type: "video",
  video: {
    link: string  // Public URL to video (.mp4)
  }
}

// Audio
{
  type: "audio",
  audio: {
    link: string  // Public URL to audio (.mp3)
  }
}

// Document (PDF)
{
  type: "document",
  document: {
    link: string,      // Public URL to document (.pdf)
    filename?: string  // Optional filename
  }
}
```

**BodyParameter** (for variables):
```typescript
{
  type: "text",
  text: string  // Variable value to substitute in template
}
```

**ButtonParameter**:
```typescript
{
  sub_type: "url" | "quick_reply",
  index: number,        // Button index (1-based)
  parameters: [
    {
      type: "text",
      text: string      // URL suffix or button text
    }
  ]
}
```

#### Response

**Success (202 Accepted):**
```json
{
  "messageId": "uuid-v4",
  "status": "QUEUED"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Missing required field: to"
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "Internal server error"
}
```

#### Example Requests

**1. Simple Text Template**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "hello_world",
    "language": "en",
    "header": null,
    "body": null,
    "button": null
  }'
```

**2. Template with Variables**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "order_confirmation",
    "language": "en",
    "header": null,
    "body": {
      "parameters": [
        {
          "type": "text",
          "text": "John Doe"
        },
        {
          "type": "text",
          "text": "ORD-12345"
        }
      ]
    },
    "button": null
  }'
```

**3. Template with Image Header**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "product_promo",
    "language": "en",
    "header": {
      "parameters": [
        {
          "type": "image",
          "image": {
            "link": "https://example.com/product.png"
          }
        }
      ]
    },
    "body": {
      "parameters": [
        {
          "type": "text",
          "text": "Summer Sale"
        }
      ]
    },
    "button": null
  }'
```

**4. Template with Video**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "video_tutorial",
    "language": "en",
    "header": {
      "parameters": [
        {
          "type": "video",
          "video": {
            "link": "https://example.com/tutorial.mp4"
          }
        }
      ]
    },
    "body": null,
    "button": null
  }'
```

**5. Template with PDF Document**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "invoice_delivery",
    "language": "en",
    "header": {
      "parameters": [
        {
          "type": "document",
          "document": {
            "link": "https://example.com/invoice.pdf",
            "filename": "Invoice_12345.pdf"
          }
        }
      ]
    },
    "body": {
      "parameters": [
        {
          "type": "text",
          "text": "INV-2024-001"
        }
      ]
    },
    "button": null
  }'
```

**6. Template with URL Button**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "website_visit",
    "language": "en",
    "header": null,
    "body": null,
    "button": [
      {
        "sub_type": "url",
        "index": 1,
        "parameters": [
          {
            "type": "text",
            "text": "products/summer-collection"
          }
        ]
      }
    ]
  }'
```

---

---

### Template Management

Manage WhatsApp templates for your project.

#### Get All Templates
Retrieves all templates for the project from the local database.

**Request:**
`GET /api/whatsapp/templates`

**Headers:**
`X-API-Key: your-project-api-key`

**Response:**
```json
{
  "data": [
    {
      "name": "hello_world",
      "language": "en_US",
      "status": "APPROVED",
      "components": [...]
    }
  ]
}
```

#### Sync Templates
Fetches templates from Telinfy and updates the local database.

**Request:**
`POST /api/whatsapp/templates/sync`

**Headers:**
`X-API-Key: your-project-api-key`

#### Create Template
Creates a new template on Telinfy and saves it locally.

**Request:**
`POST /api/whatsapp/templates`

**Headers:**
`X-API-Key: your-project-api-key`

**Body:**
```json
{
  "name": "new_template",
  "language": "en",
  "category": "MARKETING",
  "components": [...]
}
```

---

### Direct Bulk Messaging (Notify)

Sends a template message to multiple recipients using Telinfy Notify endpoint (simpler than Campaigns).

**Request:**
`POST /api/whatsapp/notify`

**Headers:**
`X-API-Key: your-project-api-key`

**Body:**
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

**Response:**
```json
{
  "messageId": "provider_msg_id",
  "status": "QUEUED"
}
```

---

### Campaign Messaging

Send bulk template messages to multiple recipients.

#### Create Campaign

```
POST /api/whatsapp/campaign
```

**Headers:**
```
Content-Type: application/json
X-API-Key: your-project-api-key
```

**Request Body:**
```json
{
  "name": "Welcome Campaign",
  "scheduleTime": "2026-02-10T10:00:00Z",
  "messages": [
    {
      "to": "+919876543210",
      "templateName": "welcome_message",
      "language": "en",
      "header": null,
      "body": {
        "parameters": [
          { "type": "text", "text": "John" }
        ]
      },
      "button": null
    },
    {
      "to": "+919876543211",
      "templateName": "welcome_message",
      "language": "en",
      "header": null,
      "body": {
        "parameters": [
          { "type": "text", "text": "Jane" }
        ]
      },
      "button": null
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "campaign-uuid",
    "name": "Welcome Campaign",
    "status": "created",
    "messageCount": 2,
    "scheduleTime": "2026-02-10T10:00:00Z",
    "telinfyCampaignId": "telinfy-campaign-id"
  },
  "message": "Campaign created successfully"
}
```

#### List Campaigns

```
GET /api/whatsapp/campaigns
```

**Headers:**
```
X-API-Key: your-project-api-key
```

**Response:**
```json
{
  "data": [
    {
      "id": "campaign-uuid",
      "name": "Welcome Campaign",
      "status": "created",
      "messageCount": 2,
      "scheduleTime": "2026-02-10T10:00:00Z",
      "createdAt": "2026-02-05T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### Get Campaign Details

```
GET /api/whatsapp/campaign/:id
```

**Headers:**
```
X-API-Key: your-project-api-key
```

**Response:**
```json
{
  "data": {
    "id": "campaign-uuid",
    "name": "Welcome Campaign",
    "status": "created",
    "messageCount": 2,
    "scheduleTime": "2026-02-10T10:00:00Z",
    "telinfyCampaignId": "telinfy-id",
    "fileId": "file-id",
    "createdAt": "2026-02-05T10:00:00Z"
  }
}
```

---

### Webhook Handler

Receives webhooks from Telinfy for message status updates and inbound messages.

#### Endpoint
```
POST /webhooks/whatsapp
```

#### Headers
```
Content-Type: application/json
```

#### Request Body (from Telinfy)

```typescript
{
  whatsappBusinessId: string;
  messages?: Array<InboundMessage>;  // User-sent messages
  statuses?: Array<StatusUpdate>;    // Message status updates
  errors?: Array<ErrorEvent>;        // Error events
}
```

#### Response

Always returns `200 OK` to acknowledge webhook receipt:
```json
{
  "status": "ok"
}
```

> **Note:** The webhook endpoint always returns 200 OK, even if processing fails, to prevent webhook retries.

#### Webhook Payload Examples

**Status Update (Delivered):**
```json
{
  "whatsappBusinessId": "your-business-id",
  "statuses": [
    {
      "id": "wamid.XXXXXX",
      "recipient_id": "+919876543210",
      "status": "delivered",
      "timestamp": "2024-02-04T07:15:30.000Z",
      "type": "message"
    }
  ]
}
```

**Status Update (Read):**
```json
{
  "whatsappBusinessId": "your-business-id",
  "statuses": [
    {
      "id": "wamid.XXXXXX",
      "recipient_id": "+919876543210",
      "status": "read",
      "timestamp": "2024-02-04T07:20:45.000Z",
      "type": "message"
    }
  ]
}
```

**Inbound Message:**
```json
{
  "whatsappBusinessId": "your-business-id",
  "messages": [
    {
      "from": "+919876543210",
      "id": "wamid.YYYYY",
      "timestamp": "2024-02-04T07:25:00.000Z",
      "type": "text",
      "text": {
        "body": "Hello! I need help with my order."
      }
    }
  ]
}
```

---

### Health Check

Check if the server is running.

#### Endpoint
```
GET /health
```

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-02-04T07:30:00.000Z"
}
```

---

## Message Lifecycle

Messages go through the following states:

```
  ┌─────────┐
  │ QUEUED  │  Created in DB, job added to BullMQ
  └────┬────┘
       │
       ▼
  ┌─────────┐
  │  SENT   │  Accepted by Telinfy API
  └────┬────┘
       │
       ├──────────┐
       ▼          ▼
  ┌──────────┐ ┌────────┐
  │DELIVERED │ │ FAILED │  Webhook updates
  └────┬─────┘ └────────┘
       │
       ▼
  ┌─────────┐
  │  READ   │  User read the message
  └─────────┘
```

| Status | Description | Updated By |
|--------|-------------|------------|
| `QUEUED` | Message stored in DB, waiting in queue | API endpoint |
| `SENT` | Accepted by Telinfy, in transit | Worker after API call |
| `DELIVERED` | Delivered to recipient's device | Webhook |
| `READ` | Read by recipient | Webhook |
| `FAILED` | Failed to send or deliver | Worker or Webhook |

---

## Template Message Examples

### Example 1: Welcome Message
```json
{
  "to": "+919876543210",
  "templateName": "welcome_message",
  "language": "en",
  "header": null,
  "body": {
    "parameters": [
      {"type": "text", "text": "John"}
    ]
  },
  "button": null
}
```

Template text: *"Hello {{1}}, welcome to our service!"*

### Example 2: Order Update with Image
```json
{
  "to": "+919876543210",
  "templateName": "order_shipped",
  "language": "en",
  "header": {
    "parameters": [
      {
        "type": "image",
        "image": {"link": "https://example.com/package.jpg"}
      }
    ]
  },
  "body": {
    "parameters": [
      {"type": "text", "text": "ORD-456"},
      {"type": "text", "text": "TRK-789"}
    ]
  },
  "button": [
    {
      "sub_type": "url",
      "index": 1,
      "parameters": [{"type": "text", "text": "track/TRK-789"}]
    }
  ]
}
```

### Example 3: Invoice with PDF
```json
{
  "to": "+919876543210",
  "templateName": "invoice_ready",
  "language": "en",
  "header": {
    "parameters": [
      {
        "type": "document",
        "document": {
          "link": "https://example.com/invoices/123.pdf",
          "filename": "invoice.pdf"
        }
      }
    ]
  },
  "body": {
    "parameters": [
      {"type": "text", "text": "John"},
      {"type": "text", "text": "INV-123"}
    ]
  },
  "button": null
}
```

---

## Webhook Events

### Status Updates

The system handles these status events from Telinfy:

| Telinfy Status | Our Status | Description |
|----------------|------------|-------------|
| `sent` | `SENT` | Message accepted by WhatsApp |
| `delivered` | `DELIVERED` | Message delivered to device |
| `read` | `READ` | Message read by user |
| `failed` | `FAILED` | Message failed to deliver |

### Inbound Messages

Supported message types:
- `text` - Plain text messages
- `image` - Images with optional caption
- `video` - Videos with optional caption
- `audio` - Audio files
- `document` - PDF or other documents
- `location` - Location sharing
- `contacts` - Contact cards
- `interactive` - Button replies, list replies

All inbound messages are stored in the `webhook_events` table for reference.

---

## Error Codes

### API Errors

| Status Code | Error Message | Description |
|-------------|---------------|-------------|
| 400 | `Missing required field: to` | Phone number not provided |
| 400 | `Missing required field: templateName` | Template name not provided |
| 400 | `Missing required field: language` | Language code not provided |
| 500 | `Internal server error` | Server-side error |

### Telinfy API Errors

When Telinfy API fails, the error is stored in the message's `error` field:

```json
{
  "error": {
    "message": "Telinfy API error: 400 - Invalid template",
    "details": { ... }
  }
}
```

Common Telinfy errors:
- Invalid phone number format
- Template not approved
- Invalid template parameters
- Media URL not accessible
- Rate limit exceeded

---

## Database Schema

### messages Table

Stores all outbound messages and their status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Message ID (returned to client) |
| `provider` | TEXT | Always "telinfy" |
| `to` | TEXT | Recipient phone number |
| `template_name` | TEXT | Template name used |
| `language` | TEXT | Language code |
| `payload` | JSONB | Complete request payload |
| `provider_message_id` | TEXT | Telinfy's wamId |
| `status` | TEXT | Current status |
| `error` | JSONB | Error details if failed |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

### webhook_events Table

Stores all webhook events for audit/debugging.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Event ID |
| `provider` | TEXT | Provider name (telinfy) |
| `event_type` | TEXT | messages/statuses/errors |
| `payload` | JSONB | Complete webhook payload |
| `received_at` | TIMESTAMP | Receipt timestamp |

---

## Rate Limiting

⚠️ **No rate limiting implemented** (as per PRD). 

Telinfy may have their own rate limits. Contact Telinfy support for details.

---

## Testing

### Test the API Endpoint

```bash
# Send a simple template message
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "hello_world",
    "language": "en",
    "header": null,
    "body": null,
    "button": null
  }'

# Expected response:
# {
#   "messageId": "550e8400-e29b-41d4-a716-446655440000",
#   "status": "QUEUED"
# }
```

### Check Health

```bash
curl http://localhost:3000/health
```

### Verify in Database

Query Supabase to see the message:
```sql
SELECT * FROM messages ORDER BY created_at DESC LIMIT 1;
```

---

## Troubleshooting

### Message stuck in QUEUED status
- **Cause:** Redis not running or worker not started
- **Fix:** Ensure Redis is running and server is started with `npm run dev`

### Message in FAILED status
- **Cause:** Telinfy API error
- **Fix:** Check the `error` field in the message record for details

### Webhook not updating message status
- **Cause:** Webhook URL not configured in Telinfy
- **Fix:** Contact Telinfy to configure webhook URL: `https://your-domain.com/webhooks/whatsapp`

### Database connection errors
- **Cause:** Invalid DATABASE_URL or Supabase down
- **Fix:** Verify DATABASE_URL in `.env` file, ensure password is URL-encoded

---

## Production Deployment

1. **Set environment variables:**
   ```bash
   PORT=3000
   DATABASE_URL=your_supabase_url
   REDIS_HOST=your_redis_host
   REDIS_PORT=6379
   TELINFY_API_KEY=your_api_key
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Configure Telinfy webhook:**
   Set webhook URL in Telinfy dashboard to: `https://your-domain.com/webhooks/whatsapp`

---

## Support

For Telinfy API issues, contact: Telinfy Support  
For code issues, check the logs in the console output.
