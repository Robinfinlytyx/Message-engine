# Multi-Channel Communication Engine

A scalable, multi-channel communication engine supporting WhatsApp, Email, SMS, and Push notifications.

## Features

- ✅ **WhatsApp** messaging via Telinfy
- ✅ **Email** support via Nodemailer with batching and retry
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
# DATABASE_URL, REDIS_HOST, REDIS_PORT, TELINFY_API_KEY

# Push schema to database
npm run db:push
```

### Run in Development

**Option 1: Separate Processes (Recommended)**

```bash
# Terminal 1: API Server
npm run dev:server

# Terminal 2: Worker
npm run dev:worker
```

**Option 2: Single Process**

```bash
ENABLE_WORKER=true npm run dev
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

### webhook_events
- `channel` - webhook source channel
- `provider` - webhook provider
- `event_type` - status update, inbound, error
- `payload` - raw webhook data

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Setup Guide](./SETUP_GUIDE.md) - Installation and configuration
- [Running Separately](./RUNNING_SEPARATELY.md) - Server + Worker guide
- [Implementation Plan](./brain/implementation_plan.md) - Multi-channel architecture
- [Walkthrough](./brain/walkthrough.md) - Implementation details

## Project Structure

```
src/
├── providers/         # Channel providers (Telinfy, SendGrid, etc.)
├── queues/           # BullMQ queues (whatsapp, email, sms)
├── workers/          # Background workers
├── services/         # Business logic (channel-agnostic)
├── controllers/      # API request handlers
├── routes/           # Express routes
├── db/
│   └── schema/      # Multi-channel database schema
├── types/           # TypeScript definitions
└── utils/           # Helpers and utilities
```

## Environment Variables

```bash
PORT=3000
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
TELINFY_API_KEY=your_key

# Optional: Enable worker in server process
ENABLE_WORKER=false

# Email Service (Nodemailer - SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourapp.com
DEFAULT_FROM_NAME=YourApp

# Email Service Tuning
EMAIL_BATCH_SIZE=100
EMAIL_MAX_RETRIES=3
EMAIL_WORKER_CONCURRENCY=5
```

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
