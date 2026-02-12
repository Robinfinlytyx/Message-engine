# WhatsApp Message Engine - Setup Guide

## Prerequisites

✅ **Completed:**
- [x] Node.js installed
- [x] PostgreSQL (Supabase) configured
- [x] Database tables created

⚠️ **Still needed:**
- [ ] Redis (for BullMQ job queue)
- [ ] Telinfy API key

---

## What This Project Does

This is a **multi-channel communication engine** that:

1. **Accepts API requests** to send WhatsApp and Email messages
2. **Queues messages** using BullMQ (Redis-backed)
3. **Sends via providers** (Telinfy for WhatsApp, Nodemailer for Email)
4. **Tracks message lifecycle** (QUEUED → SENT → DELIVERED → FAILED)
5. **Receives webhooks** for status updates
6. **Supports bulk email campaigns** with automatic batching and retries

---

## Architecture Flow

```
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
Calls Telinfy API
    ↓
Updates DB (status: SENT)
    ↓
Telinfy sends webhook
    ↓
POST /webhooks/whatsapp
    ↓
Updates DB (status: DELIVERED/READ)
```

---

## Current Status

### ✅ Completed

1. **Database Setup**
   - Tables created in Supabase:
     - `messages` - Stores all outbound messages
     - `webhook_events` - Stores webhook payloads
   
2. **Codebase**
   - Express server
   - Drizzle ORM configured
   - BullMQ queue/worker setup
   - Telinfy API provider
   - Controllers, services, routes
   - TypeScript compilation passes

3. **Environment**
   - `.env` file configured with Supabase URL

### ⚠️ Pending

1. **Redis** - Required for BullMQ job queue
2. **Telinfy API Key** - Required to actually send messages

---

## Next Steps

### Option 1: Quick Test (Without Redis)

You can test the API endpoint creation, but messages won't be processed until Redis is available.

```bash
# Start server (will error on worker but API will work)
npm run dev

# In another terminal, test the endpoint
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "templateName": "test_template",
    "language": "en",
    "header": null,
    "body": null,
    "button": null
  }'

# Check Supabase - you'll see message with status QUEUED
```

### Option 2: Full Setup

#### Step 1: Install/Setup Redis

**Windows:**
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Install and run `redis-server.exe`

**OR use Cloud Redis (Recommended):**
1. Go to https://upstash.com (free tier)
2. Create a Redis database
3. Update `.env`:
   ```
   REDIS_HOST=your-upstash-endpoint.upstash.io
   REDIS_PORT=6379
   ```

#### Step 2: Add Telinfy API Key

Update `.env`:
```
TELINFY_API_KEY=your_actual_telinfy_api_key
```

Get this from your Telinfy dashboard.

#### Step 3: Start the Server

```bash
npm run dev
```

You should see:
```
[INFO] Configuration validated successfully
[INFO] WhatsApp worker started
[INFO] Server started on port 3000
[INFO] Endpoints:
[INFO]   POST /api/whatsapp/send-template
[INFO]   POST /webhooks/whatsapp
[INFO]   GET  /health
```

#### Step 4: Test Message Sending

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

Expected response:
```json
{
  "messageId": "uuid",
  "status": "QUEUED"
}
```

#### Step 5: Verify Message Flow

1. **Check logs** - Watch worker pick up the job
2. **Check Supabase** - Message status should update to SENT
3. **View in Telinfy** - Message should appear in Telinfy dashboard

#### Step 6: Configure Webhook (Production)

Once deployed:
1. Go to Telinfy dashboard
2. Set webhook URL: `https://your-domain.com/webhooks/whatsapp`
3. Webhooks will update message status automatically

---

## Project Structure

```
src/
├── app.ts                  # Express setup
├── server.ts               # Entry point
├── config/                 # Environment config
├── controllers/            # Request handlers
│   └── whatsapp.controller.ts
├── services/               # Business logic
│   ├── message.service.ts
│   └── webhook.service.ts
├── db/                     # Database
│   ├── db.ts              # Connection
│   └── schema/            # Table schemas
├── queues/                # BullMQ
│   ├── whatsapp.queue.ts
│   └── whatsapp.worker.ts
├── providers/             # External APIs
│   └── telinfy.provider.ts
├── routes/                # Endpoints
│   └── whatsapp.routes.ts
├── types/                 # TypeScript types
└── utils/                 # Logger
```

---

## Available Scripts

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Database migrations
npm run db:push
npm run db:generate
npm run db:migrate
```

---

## API Endpoints

### 1. Send Template Message
```
POST /api/whatsapp/send-template
```
See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full details.

### 2. Webhook Handler
```
POST /webhooks/whatsapp
```
Receives status updates from Telinfy.

### 3. Health Check
```
GET /health
```
Returns server status.

---

## Environment Variables

```bash
# .env file
PORT=5000
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
REDIS_HOST=localhost
REDIS_PORT=6379
TELINFY_API_KEY=your_api_key

# Email Service (Nodemailer - SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourapp.com
DEFAULT_FROM_NAME=YourApp
```

**Important:** If password contains special characters, URL-encode them:
- `/` → `%2F`
- `@` → `%40`
- `:` → `%3A`

---

## Troubleshooting

### Error: "connect ECONNREFUSED localhost:6379"
**Issue:** Redis not running  
**Fix:** Install and start Redis

### Error: "Missing required environment variables"
**Issue:** `.env` file missing or invalid  
**Fix:** Copy `.env.example` to `.env` and fill in values

### Message stuck in QUEUED
**Issue:** Worker not running or Redis down  
**Fix:** Ensure Redis is running and restart server

### Telinfy API error
**Issue:** Invalid template or API key  
**Fix:** Verify template is approved in Telinfy dashboard

---

## Documentation

- **API Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **README:** [README.md](./README.md)
- **Telinfy API Docs:** See PDF in project root

---

## Support

For issues with:
- **Telinfy API:** Contact Telinfy support
- **Supabase:** Check Supabase dashboard logs
- **Code errors:** Check console logs for detailed error messages
