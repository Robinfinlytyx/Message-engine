# Architecture Overview

## What is the Communication Engine?

The Communication Engine is a **multi-project server-side platform** for sending communications (WhatsApp messages and Emails) via established providers (Telinfy for WhatsApp, Nodemailer/SMTP for Email).

It is built with a **multi-tenant architecture**, meaning different applications or "Projects" can use this single engine to send messages. Each project manages its own templates, message logs, and provider credentials.

## System Components

The system is composed of several independent but cooperating parts:

1. **API Server (Express.js):**
   - Receives HTTP requests from clients.
   - Handles authentication (Superadmin, User Auth, API Key Auth for Projects).
   - Validates requests, interacts with the Database, and creates jobs in the Message Queues.
   - Handles Webhooks from providers (e.g., Telinfy).

2. **Message Queues (BullMQ + Redis):**
   - Used for processing message delivery asynchronously.
   - `whatsapp-message-queue`: Handles outbound WhatsApp messages.
   - `email-queue`: Handles outbound single/bulk emails.

3. **Background Workers:**
   - Consume jobs from the BullMQ queues.
   - Perform the actual network calls to providers (Telinfy, SMTP Servers).
   - Update message delivery statuses in the Database.

4. **Database (PostgreSQL + Drizzle ORM):**
   - Stores Users, Organizations, and Projects.
   - Stores Templates, Messages, and Campaigns linked to specific Projects.
   - Stores Project-specific provider configurations (AES-256-GCM encrypted).
   - Logs all webhook events.

## Message Lifecycle Flow

```text
Client Request
    ↓
POST /api/whatsapp/send-template
    ↓
Save to PostgreSQL (status: QUEUED)
    ↓
Add job to BullMQ (Redis)
    ↓
Worker picks up job
    ↓
Fetches Project Config (from DB, falling back to Env Vars)
    ↓
Calls Provider API (e.g., Telinfy)
    ↓
Updates DB (status: SENT or FAILED)
    ↓
Provider sends webhook (delivery status)
    ↓
POST /webhooks/whatsapp
    ↓
Updates DB (status: DELIVERED/READ)
```

## Multi-Tenant Security & Configuration

To handle multiple projects securely:
- **API Keys:** Each project generates a unique API key used via the `X-API-Key` header.
- **Provider Credentials:** Projects can supply their own Telinfy API credentials and SMTP server details.
- **Encryption:** Sensitive credentials stored in the `project_configurations` table are encrypted at rest using an `ENCRYPTION_KEY` set in the environment variables.
- **Dynamic Fallbacks:** If a project does not have custom provider configurations set, the engine falls back to the global `.env` defaults (if available).

## Database Schema Highlights

- `organizations`, `users`, `projects`: Hierarchical multi-tenancy.
- `project_configurations`: Encrypted provider configurations.
- `messages`: Unified message tracking, linked to a specific project.
- `email_batches`, `email_batch_items`: Tracking for bulk email queues.
- `whatsapp_templates`, `email_templates`: Project-scoped template storage.
- `campaigns`: Groupings of bulk messages.
- `webhook_events`: Audit log of all received webhooks.
