# Setup & Running Guide

This guide covers setting up the Communication Engine backend, configuring the database and queues, and running the application in development and production environments.

## Prerequisites

- **Node.js** installed (v18+ recommended)
- **PostgreSQL** instance (e.g., Supabase, local PostgreSQL)
- **Redis** instance (for BullMQ job queues - local or Upstash)
- **Telinfy API Key** (optional global default for WhatsApp)
- **SMTP Credentials** (optional global default for Emails)

---

## Initial Setup

### 1. Clone & Install Dependencies
Navigate to the `backend` directory and install the necessary packages.

```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials.

```bash
# ─── Required ───
PORT=3000
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
REDIS_HOST=localhost
REDIS_PORT=6379
ENCRYPTION_KEY=<64-char hex>   # Required for project credential encryption

# Generate an encryption key:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ─── Optional: Default Telinfy (fallback for projects without config) ───
TELINFY_API_KEY=your_api_key
TELINFY_WHATSAPP_BUSINESS_ID=your_biz_id

# ─── Optional: Default SMTP (fallback for projects without config) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourapp.com
DEFAULT_FROM_NAME=YourApp
```

### 3. Database Migrations
Use Drizzle to generate and push schemas to your PostgreSQL database.

```bash
npm run db:generate
npm run db:push
# or npm run db:migrate if using migration files directly
```

---

## Running the Application

The Communication Engine requires two components to function properly: the **API Server** and the **Workers** (which process the Redis queues).

### Development Mode

For the best development experience with clean logs, it's recommended to run the server and the workers in separate terminals.

**Terminal 1: Start the API Server**
```bash
npm run dev:server
```
This handles HTTP requests, DB operations, and places jobs into Redis.

**Terminal 2: Start the Workers**
```bash
npm run dev:worker
```
This picks up jobs from Redis, calls provider APIs, and updates statuses.

**Alternative: Run everything together (Unified Process)**
If you prefer a single terminal, use:
```bash
npm run dev:all
```
This automatically sets `START_WORKERS=true` behind the scenes, spawning BullMQ workers in the same Node.js process.

### Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Run the server and workers:**
   You can either run them together in one process for a simpler setup:
   ```bash
   npm run start:all
   ```
   Or run them in separate processes for independent scaling:
   ```bash
   npm run start:server
   # In another process:
   npm run start:worker
   ```

---

## Verifying Setup

1. Check the health endpoint: `GET http://localhost:3000/health`
2. Create an admin user/organization via the `/api/auth/signup` endpoint or Supabase.
3. Use the frontend or Postman to create a Project and generate an API Key.
4. Send a test message via `/api/whatsapp/send-template` with your new API Key.
5. Verify in the worker terminal that the job was picked up and processed successfully.

---

## Troubleshooting

- **Error: `connect ECONNREFUSED localhost:6379`**: Your Redis server is not running. Install/Start Redis or check `REDIS_HOST`/`REDIS_PORT`.
- **Message stuck in QUEUED status**: Redis might be running, but your worker process (`npm run dev:worker`) is not. Ensure the worker is started.
- **Missing required environment variables**: Ensure your `.env` contains all required variables, particularly `DATABASE_URL` and `ENCRYPTION_KEY`.
