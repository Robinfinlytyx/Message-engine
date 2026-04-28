# Multi-Channel Communication Engine

A scalable, multi-channel, **multi-project** communication engine supporting WhatsApp, Email, SMS, and Push notifications.

## Features

- ✅ **WhatsApp** messaging via Telinfy
- ✅ **Email** support via Nodemailer with batching and retry
- 🏢 **Multi-project** — each project has its own Telinfy & SMTP credentials (encrypted at rest)
- 📱 **SMS** support (ready to implement)
- 🔔 **Push Notifications** (ready to implement)
- 🎯 Multi-channel architecture with independent queues
- 📊 Channel-specific analytics and tracking
- 🔄 Async processing with BullMQ
- 📝 Comprehensive webhook handling
- 🗄️ PostgreSQL (Supabase) with channel-aware schema

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (Supabase)
- Redis
- Telinfy API Key (for WhatsApp)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with your credentials
# DATABASE_URL, REDIS_HOST, REDIS_PORT, ENCRYPTION_KEY
# Optionally: TELINFY_API_KEY, SMTP_HOST, etc. (as global defaults)

# Push schema to database
npm run db:push

# Migrate existing projects (creates per-project config rows)
npx ts-node src/scripts/migrate_project_configs.ts
```

### Run in Development

**Option 1: Single Process (Recommended)**
Runs both the HTTP server and all background workers (WhatsApp & Email) in one terminal.
```bash
npm run dev:all
```

**Option 2: Separate Processes**
If you need to debug workers separately from the server:
```bash
# Terminal 1: API Server
npm run dev:server

# Terminal 2: Worker
npm run dev:worker
```

## Architecture

```
Client → API Server → Database (channel-aware)
                   ↓
              Queue (by channel)
                   ↓
          Worker (channel-specific)
                   ↓
         Provider (Telinfy, SendGrid, Twilio)
```

## API Endpoints

### Project Configuration (Admin)

```bash
# Get project config (secrets masked)
GET /api/admin/projects/:projectId/config

# Create or update project config
PUT /api/admin/projects/:projectId/config
{
  "whatsapp": {
    "enabled": true,
    "telinfyApiKey": "your-key",
    "whatsappBusinessId": "your-biz-id"
  },
  "email": {
    "enabled": true,
    "smtpHost": "mail.example.com",
    "smtpPort": 465,
    "smtpSecure": true,
    "smtpUser": "user@example.com",
    "smtpPassword": "pass",
    "defaultFromEmail": "noreply@example.com"
  }
}

# Delete project config (revert to global defaults)
DELETE /api/admin/projects/:projectId/config

# Test WhatsApp credentials
POST /api/admin/projects/:projectId/config/test-whatsapp

# Test SMTP credentials
POST /api/admin/projects/:projectId/config/test-email
```

### WhatsApp

```bash
# Send template message
POST /api/whatsapp/send-template
{
  "to": "+919876543210",
  "templateName": "hello_world",
  "language": "en"
}

# Webhook
POST /webhooks/whatsapp
```

### Email

```bash
# Send single email (X-API-Key header required)
POST /api/email/send
{
  "to": "user@example.com",
  "subject": "Welcome",
  "html": "<h1>Welcome!</h1>",
  "text": "Welcome!"
}

# Send bulk emails
POST /api/email/send-bulk
{
  "batchName": "Newsletter",
  "emails": [...]
}

# Get batch status
GET /api/email/batch/:batchId

# Retry failed emails
POST /api/email/batch/:batchId/retry
```

### SMS (Future)

```bash
POST /api/sms/send
{
  "channel": "sms",
  "to": "+919876543210",
  "message": "Your OTP is 123456"
}
```

## Database Schema

### messages
- `channel` - whatsapp | email | sms | push
- `provider` - telinfy | sendgrid | twilio
- `to` - recipient (phone/email)
- `payload` - complete request data
- `status` - QUEUED | SENT | DELIVERED | READ | FAILED
- `channel_specific_data` - channel metadata

### project_configurations
- `project_id` - FK to projects (1:1)
- `telinfy_api_key` - encrypted Telinfy API key
- `telinfy_whatsapp_business_id` - WhatsApp Business ID
- `smtp_host`, `smtp_port`, `smtp_user`, `smtp_password` (encrypted) — SMTP credentials
- `whatsapp_enabled`, `email_enabled` — feature flags per project

### webhook_events
- `channel` - webhook source channel
- `provider` - webhook provider
- `event_type` - status update, inbound, error
- `payload` - raw webhook data

## Documentation

All documentation has been moved to the `/documentation` directory:

- [Documentation Index](./documentation/INDEX.md)
- [Architecture Overview](./documentation/ARCHITECTURE.md)
- [Setup & Running Guide](./documentation/SETUP_GUIDE.md)
- [Admin API Reference](./documentation/api/ADMIN_API.md)
- [Email API Reference](./documentation/api/EMAIL_API.md)
- [WhatsApp API Reference](./documentation/api/WHATSAPP_API.md)
- [Campaign API Reference](./documentation/api/CAMPAIGN_API.md)
- [Superadmin API Reference](./documentation/api/SUPERADMIN_API.md)

## Project Structure

```
src/
├── providers/
│   ├── telinfy.provider.ts      # WhatsApp (accepts per-project config)
│   ├── nodemailer.provider.ts   # Email (accepts per-project config)
│   └── provider.factory.ts      # LRU-cached factory for per-project providers
├── queues/                      # BullMQ queues & workers
├── services/
│   ├── project-config.service.ts # Per-project config CRUD + encryption
│   ├── whatsapp.service.ts
│   ├── campaign.service.ts
│   └── email.service.ts
├── controllers/                 # API request handlers
├── routes/                      # Express routes
├── db/
│   └── schema/                  # Drizzle schemas incl. project_configurations
├── scripts/
│   └── migrate_project_configs.ts  # Migration for existing projects
├── utils/
│   ├── crypto.ts                # AES-256-GCM encryption
│   └── logger.ts
└── types/
```

## Environment Variables

```bash
# ─── Required ───
PORT=3000
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
ENCRYPTION_KEY=<64-char hex>  # For encrypting project credentials at rest

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ─── Optional: Default Telinfy credentials (fallback for projects without config) ───
TELINFY_API_KEY=your_key
TELINFY_WHATSAPP_BUSINESS_ID=your_biz_id

# ─── Optional: Default SMTP credentials (fallback for projects without config) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourapp.com
DEFAULT_FROM_NAME=YourApp

# ─── Email Service Tuning ───
EMAIL_BATCH_SIZE=100
EMAIL_MAX_RETRIES=3
EMAIL_WORKER_CONCURRENCY=5
```

> **Note:** Telinfy and SMTP variables are now **optional global defaults**. Each project can have its own credentials stored encrypted in the database via the Project Configuration API.

## Scripts

```bash
# Development
npm run dev:server    # API server only
npm run dev:worker    # Worker only
npm run dev           # Server only (worker disabled by default)

# Production
npm run build
npm run start:server
npm run start:worker

# Database
npm run db:push       # Push schema changes
npm run db:generate   # Generate migrations
```

## Adding New Channels

### Example: Email via SendGrid

1. **Install Provider SDK**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Create Provider**
   ```typescript
   // src/providers/email/sendgrid.provider.ts
   export class SendGridProvider {
     channel = 'email';
     async send(payload) { ... }
   }
   ```

3. **Create Queue & Worker**
   ```typescript
   // src/queues/email.queue.ts
   export const emailQueue = new Queue('email-message-queue');
   
   // src/workers/email.worker.ts
   export function createEmailWorker() { ... }
   ```

4. **Add Endpoint**
   ```typescript
   // src/routes/email.routes.ts
   router.post('/send', emailController);
   ```

## Multi-Channel Benefits

- ✅ **Independent Scaling** - Scale workers per channel
- ✅ **Isolated Failures** - One channel down doesn't affect others
- ✅ **Provider Flexibility** - Switch providers without code changes
- ✅ **Analytics** - Track metrics per channelç
- ✅ **Future-Proof** - Easy to add new channels

## Testing

```bash
# Test WhatsApp endpoint
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "hello_world",
    "language": "en"
  }'

# Check database
SELECT channel, status, COUNT(*) FROM messages GROUP BY channel, status;
```

## License

ISC

## Support

For issues or questions, check the documentation in the `/docs` folder or review the implementation plan.
