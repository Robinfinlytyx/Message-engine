# Communication Engine Documentation

Welcome to the documentation for the Communication Engine!

This engine is a **multi-channel communication platform** designed to send WhatsApp messages and Emails via APIs, supporting multi-tenant configurations, background message processing, and campaign sending.

## Table of Contents

### Core Documentation
- [Architecture Overview](ARCHITECTURE.md)
  - System Design, Database Schema, Message Queues, and Message Lifecycle
- [Setup & Running Guide](SETUP_GUIDE.md)
  - Prerequisites, Installation, Configuration, Database Migrations, and running the server/worker processes.

### API Reference

Detailed specifications for all API endpoints grouped by functionality:

- [Admin & Configuration API](api/ADMIN_API.md)
  - Authentication, Project Management, Project Configuration, Team Management, and Dashboard Stats.
- [Email API](api/EMAIL_API.md)
  - Email Template Management, Single/Bulk Email Sending, and Delivery Status.
- [WhatsApp API](api/WHATSAPP_API.md)
  - WhatsApp Template Management, Single/Bulk Message Sending, Webhooks, and Status Tracking.
- [Campaign API](api/CAMPAIGN_API.md)
  - Creating and Listing Bulk Campaigns for Messages.
- [Superadmin API](api/SUPERADMIN_API.md)
  - Superadmin Authentication, Platform Statistics, and Organization Listings.
