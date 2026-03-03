# Running Server and Worker Separately

## Overview

The server and worker can now run in **separate terminal windows** for cleaner logs.

---

## Quick Start

### Terminal 1: Start the API Server

```bash
npm run dev:server
```

**What you'll see:**
```
[INFO] Configuration validated successfully
[INFO] Worker disabled - run separately with "npm run dev:worker"
[INFO] Server started on port 3000
[INFO] Endpoints:
[INFO]   POST /api/whatsapp/send-template
[INFO]   POST /webhooks/whatsapp
[INFO]   GET  /health
```

### Terminal 2: Start the Worker

```bash
npm run dev:worker
```

**What you'll see:**
```
╔════════════════════════════════════════════════════╗
║     WhatsApp Message Worker - STARTED             ║
╚════════════════════════════════════════════════════╝

[INFO] ✓ Configuration validated
[INFO] ✓ Worker connected to Redis and listening for jobs
[INFO] ✓ Ready to process messages from queue

📊 Worker Status:
   - Queue: whatsapp-message-queue
   - Concurrency: 5 jobs at a time
   - Retry: 3 attempts with exponential backoff
   - Waiting for jobs...
```

---

## How It Works

1. **API Server** (Terminal 1):
   - Receives HTTP requests
   - Stores messages in database
   - Adds jobs to Redis queue
   - Handles webhooks

2. **Worker** (Terminal 2):
   - Picks up jobs from Redis
   - Calls Telinfy API
   - Updates message status
   - Shows detailed progress

---

## Worker Log Example

When a message is sent, you'll see clean, readable output in the worker terminal:

```
┌─────────────────────────────────────────────────────
│ 📤 Processing Job #abc123
│ Message ID: 550e8400-e29b-41d4-a716-446655440000
└─────────────────────────────────────────────────────
  ⏳ Fetching message from database...
  ✓ Message found - To: +919876543210
  ✓ Template: hello_world
  🚀 Sending to Telinfy API...
  ✓ Telinfy accepted - WAM ID: wamid.XXXXX
  ✓ Database updated - Status: SENT
  ✅ SUCCESS - Message sent successfully

✅ Job #abc123 completed successfully
```

---

## Alternative: Run Both Together (Single Process)

If you prefer to run both the API Server and the Workers in a single terminal (useful for local development or simplified production deployments), you can use the unified commands:

```bash
# Development (with hot reload)
npm run dev:all
```

This command automatically sets `START_WORKERS=true` behind the scenes, telling the Express server to spawn the BullMQ workers in the same Node.js process.

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | **Server + Workers** in one process (Recommended for ease of use) |
| `npm run dev:server` | API server only |
| `npm run dev:worker` | Worker only (run in a separate terminal) |
| `npm run dev` | Server only |

---

## Testing the Flow

1. **Start both terminals** (server + worker)

2. **Send a message:**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/send-template \
     -H "Content-Type: application/json" \
     -d '{
       "to": "+919876543210",
       "templateName": "hello_world",
       "language": "en"
     }'
   ```

3. **Watch Terminal 1 (Server):**
   ```
   [INFO] POST /api/whatsapp/send-template
   [INFO] Creating new template message
   [INFO] Message queued successfully
   ```

4. **Watch Terminal 2 (Worker):**
   ```
   ┌─────────────────────────────────────
   │ 📤 Processing Job #abc123
   └─────────────────────────────────────
   ✓ Message sent successfully
   ```

---

## Benefits of Separate Processes

✅ **Cleaner logs** - Server logs separate from worker logs  
✅ **Easier debugging** - Focus on one process at a time  
✅ **Better monitoring** - See exactly what each component is doing  
✅ **Independent scaling** - Can run multiple workers if needed  
✅ **Graceful shutdown** - Stop worker without affecting API

---

## Troubleshooting

### Worker shows "Waiting for jobs..." forever
- Server might not be running
- Redis might not be running
- Check if message was actually created (`SELECT * FROM messages;`)

### Error: connect ECONNREFUSED localhost:6379
- Redis is not running
- Start Redis before starting the worker

### Worker immediately exits
- Likely a configuration error
- Check `.env` file has all required variables
- Check console for error messages

---

## Production

For production builds:

```bash
# Build
npm run build

# Option 1: Run everything in one process (Recommended for simple setups)
npm run start:all

# Option 2: Run separately (Recommended for multi-server setups)
# Terminal 1: Server
npm run start:server

# Terminal 2: Worker  
npm run start:worker
```
