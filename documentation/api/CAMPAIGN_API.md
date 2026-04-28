# Campaign API Reference

Campaigns are used to send bulk template messages to multiple recipients. These endpoints require project API key authentication.

## Authentication

```bash
curl -H "X-API-Key: your-project-api-key" ...
```

---

## Campaign Endpoints

### 1. Create Campaign
**Endpoint:** `POST /api/whatsapp/campaign`

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
      "body": {
        "parameters": [
          { "type": "text", "text": "John" }
        ]
      }
    },
    {
      "to": "+919876543211",
      "templateName": "welcome_message",
      "language": "en",
      "body": {
        "parameters": [
          { "type": "text", "text": "Jane" }
        ]
      }
    }
  ]
}
```

> **Note on Security:** You do not need to pass sensitive Telinfy authentication details like `accessId` or `phoneNumberId` in this request. The Communication Engine securely fetches these from your Project Configuration and dynamically injects them into the provider payloads.

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

---

### 2. List Campaigns
**Endpoint:** `GET /api/whatsapp/campaigns`

Returns a paginated list of campaigns for the authenticated project.

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

---

### 3. Get Campaign Details
**Endpoint:** `GET /api/whatsapp/campaign/:id`

Retrieves detailed information about a specific campaign, including its processing status and tracking identifiers.

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
