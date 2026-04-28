# Admin API Reference

The Admin API handles authentication, project lifecycle, per-project configurations, and team management. 

Most endpoints require a valid JWT token via a `Bearer` token or session cookie. The Project Config endpoints can be accessed by Superadmins or Project owners.

## Authentication (`/api/auth`)

### 1. Signup
**Endpoint:** `POST /api/auth/signup`

Creates a new user and an associated default organization.

### 2. Login
**Endpoint:** `POST /api/auth/login`

Authenticates a user and returns access/refresh tokens.

### 3. Refresh Token
**Endpoint:** `POST /api/auth/refresh`

Refreshes the session using the valid refresh token.

### 4. Get Current User
**Endpoint:** `GET /api/auth/me`

Returns the currently authenticated user's profile and organization details.

---

## Project Management (`/api/admin/projects`)

### 1. Register Project
**Endpoint:** `POST /api/admin/projects`

**Request:**
```json
{
  "name": "My Application",
  "description": "Optional description"
}
```

**Response (201):** Returns project details including the newly generated `apiKey`.

### 2. List Projects
**Endpoint:** `GET /api/admin/projects`

Returns a list of all projects associated with the authenticated organization.

### 3. Get API Key
**Endpoint:** `GET /api/admin/projects/:id/api-key`

Retrieves the currently active API Key for the specified project.

### 4. Regenerate API Key
**Endpoint:** `POST /api/admin/projects/:id/regenerate-key`

Invalidates the old API key and generates a new one.

### 5. Update Project Status
**Endpoint:** `PATCH /api/admin/projects/:id/status`

Update the status (e.g., active, inactive) of a project.

---

## Project Configuration (`/api/admin/projects/:projectId/config`)

Manage per-project Telinfy and SMTP credentials. These details override global defaults. Configuration secrets are stored encrypted.

### 1. Get Configuration
**Endpoint:** `GET /api/admin/projects/:projectId/config`

Returns the project configuration (passwords/API keys will be masked).

### 2. Create/Update Configuration
**Endpoint:** `PUT /api/admin/projects/:projectId/config`

**Request Body:**
```json
{
  "whatsapp": {
    "enabled": true,
    "telinfyApiKey": "your-key",
    "telinfyWhatsappBusinessId": "...",
    "telinfyAccessId": "...",
    "telinfyPhoneNumberId": "...",
    "telinfyUserName": "...",
    "telinfyBusinessAccountId": "..."
  },
  "email": {
    "enabled": true,
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 465,
    "smtpSecure": true,
    "smtpUser": "user@example.com",
    "smtpPassword": "password",
    "defaultFromEmail": "no-reply@example.com"
  }
}
```

### 3. Test Credentials
**WhatsApp Test:** `POST /api/admin/projects/:projectId/config/test-whatsapp`
**Email Test:** `POST /api/admin/projects/:projectId/config/test-email`

---

## Team Management (`/api/team`)

### 1. Get Team Members
**Endpoint:** `GET /api/team`

Returns the list of users associated with the organization.

### 2. Invite User
**Endpoint:** `POST /api/team/invite`

Invites a new member to the organization (Requires Owner/Admin role).

### 3. Remove User
**Endpoint:** `DELETE /api/team/:userId`

Removes a member from the organization.

---

## Admin Dashboard (`/api/admin`)

### 1. Dashboard Stats
**Endpoint:** `GET /api/admin/stats`

Returns message statistics, delivery rates, and queue health.

### 2. List Admin Messages
**Endpoint:** `GET /api/admin/messages`

Lists all messages sent by the organization.

### 3. List Admin Campaigns
**Endpoint:** `GET /api/admin/campaigns`

Lists all campaigns associated with the organization.
