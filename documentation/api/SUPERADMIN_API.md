# Superadmin API Reference

The Superadmin API handles platform-wide operations. Access to these endpoints is restricted strictly to users with the `superadmin` role.

---

## Endpoints

### 1. Superadmin Login
**Endpoint:** `POST /api/superadmin/login`

Authenticates a superadmin user and issues an elevated access token.

### 2. Platform Statistics
**Endpoint:** `GET /api/superadmin/stats`

Retrieves global statistics across the entire engine, including:
- Total registered organizations and projects.
- Aggregate message counts across all providers.
- Overall health and processing speed metrics of the Redis queues.

### 3. List Organizations
**Endpoint:** `GET /api/superadmin/organizations`

Retrieves a paginated list of all organizations operating on the platform, allowing the superadmin to view their status, limits, and configurations.
