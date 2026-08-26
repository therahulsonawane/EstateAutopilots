# 🏢 Leads-CRM — Complete Project Analysis
### Real Estate CRM Platform: Features, Architecture & Market Problem-Solving

---

## Executive Summary

**Leads-CRM** (branded as **NeetiCRM**) is a full-stack, multi-tenant Customer Relationship Management platform purpose-built for the **Indian real estate market**. It is not a generic CRM — every feature traces back to a specific pain point that real estate developers, builders, and agencies experience daily: leads leaking through the cracks, slow follow-ups, disconnected communication channels, zero visibility into ad spend ROI, and agents not using the tools they're given.

The platform is structured as a **monorepo** with four deployable applications:

| App | Technology | Audience |
|---|---|---|
| `backend/` | Node.js + Express + Prisma + PostgreSQL | API server for all clients |
| `frontend/` | React + Vite + TailwindCSS | Agents & Managers (web) |
| `admin/` | React + Vite | Super admin & agency owners |
| `mobile/` | React Native + Expo | Field agents (iOS & Android) |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                        │
│  [Frontend - Agent Web]  [Admin Panel]  [Mobile - React Native] │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                  BACKEND API (Express.js)                     │
│  Rate Limiting │ CORS │ JWT Auth │ White-Label Middleware      │
│                                                               │
│  Routes → Controllers → Services → Prisma ORM → PostgreSQL   │
│                                                               │
│  Background Workers: CronScheduler, BroadcastWorker, CAPI    │
│  Real-time: Socket.io (WebSocket)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
  PostgreSQL       AWS S3            External APIs
  (Primary DB)  (Media Storage)  Meta/WhatsApp/Vapi/Google
```

**Key backend design decisions:**
- **Prisma ORM** with PostgreSQL for type-safe, multi-tenant data access
- **Socket.io** for real-time updates (new leads, WhatsApp messages, call events)
- **Encryption** (`ENCRYPTION_KEY`) for all third-party access tokens stored in the database
- **Rate limiting** — 300 req/15 min for general API, 30 req/15 min for auth, 60 req/min for webhooks
- **Compression middleware** on all HTTP responses for faster mobile performance

---

## Feature #1 — Lead Management (Core CRM)

### What it does
The heart of the platform. Leads flow in from **5+ sources** and are organized through a structured lifecycle.

**Lead Sources Supported:**
- Meta (Facebook/Instagram) Lead Ads → via webhook
- Manual entry by agents
- CSV / Excel bulk import
- Inbound webhook (website contact forms, landing pages)
- Google Sheets sync (reverse — sheets → CRM)

**Lead Status Pipeline:**
```
New → Attempted Contact → Contacted → Interested → Nurturing
    → Qualified → [Site Visit Scheduled → Site Visit Done]
    → Converted / Lost – Unqualified / Lost – Closed Lost
```

**Lead Record Fields:**
- Personal: First/Last Name, Email, Phone
- Attribution: UTM Source, UTM Medium, UTM Campaign, UTM Content, UTM Term, Google Click ID (gclid)
- Business: Status, Source, Assigned Agent, Project, Value (deal size)
- Meta fields: Campaign Name, Adset Name, Ad Name, Form Name, Ad Questions
- WhatsApp opt-out flag + reason
- Custom fields (JSON — extensible for any project-specific data)

**Activity Timeline:** Every lead has a full audit trail — status changes, calls made, WhatsApp messages sent, notes added, emails sent, and automation actions — all timestamped and attributed to the user who performed them.

**Notes System:**
- Note types: General, Call, Meeting, Email, Important
- Pin notes to top of timeline
- Set follow-up dates on notes (surfaces as tasks)
- Author attribution (agent name + timestamp)

**Access Control:**
- Admins/Managers see ALL leads in the organization
- Agents see ONLY leads assigned to them
- Role-based enforcement at the database query level (not just UI hiding)

### Real Estate Problem it Solves

> **"We get 500 leads a month from Facebook and don't know which ones are serious."**

In traditional real estate operations, leads from Meta Ads arrive in an Excel sheet email from the marketing team, agents manually call through the list, there is no record of who called whom, duplicate leads get created when the same person inquires twice, and there's zero visibility into which lead is at what stage.

This CRM solves:
1. **Lead leakage** — Every lead is captured automatically, timestamped, and assigned
2. **Duplicate management** — Phone + email dedup on import and webhook intake
3. **Accountability** — Every action is logged; managers can see which agents are active
4. **Structured pipeline** — Clear status progression mirrors the real estate sales funnel (from first inquiry to site visit to booking)

---

## Feature #2 — Smart Lead Assignment Engine

### What it does

Leads don't sit in a "pool" — the system automatically assigns them based on configurable rules.

**Assignment Modes** (configured per organization):

| Mode | How it works |
|---|---|
| `MANUAL` | Admin assigns leads manually |
| `ROUND_ROBIN` | Each new lead goes to the next agent in rotation |
| `LOAD_BALANCED` | Assigns to agent with fewest open leads |
| `SOURCE_BASED` | Different agents handle different lead sources (e.g., Meta vs. website) |
| `FORM_BASED` | Different agents per Facebook form |
| `PROJECT_BASED` | Each project (e.g., "Skyline Heights") has dedicated agents |

**Advanced: Project-Level Overrides**
A project can have its own assignment mode and agent pool, overriding the organization default.

**Auto-Welcome Messages on Assignment:**
When a lead is assigned to a project, the system can automatically send a WhatsApp welcome message from that project's pre-configured template — without the agent needing to do anything.

### Real Estate Problem it Solves

> **"Our sales managers spend 2 hours every morning manually distributing leads across agents."**

In real estate companies with multiple projects, agents are specialized. The "Luxury Villa" team shouldn't get "Budget Apartment" leads. The Round Robin mode prevents star agents from hoarding the best leads while juniors sit idle. Load-balanced assignment ensures no agent is overwhelmed with 200 leads while another has 20.

---

## Feature #3 — WhatsApp CRM (Meta Cloud API)

### What it does

This is the platform's most complex feature — a **full two-way WhatsApp Business inbox** integrated directly into the CRM.

**Capabilities:**
- OAuth-based connection with Meta WhatsApp Business API (WABA)
- **Inbox view** — all conversations in one place, organized by lead
- Send/receive: text, images, documents, audio, video, stickers
- **Template messages** — send approved Meta business templates with variable substitution
- Message delivery status tracking: `sent → delivered → read` (with timestamps)
- **Opt-out management** — leads can opt out of WhatsApp; system respects this in all broadcasts and automations
- Real-time message receipt via **Meta webhook** with HMAC signature verification
- **Media caching** — uploaded files are stored in AWS S3; Meta media IDs are cached to avoid re-uploading identical files
- Welcome messages per project — automatic greeting when a new lead is assigned

**Technical Security:**
- Access tokens are AES-256 encrypted before storing in the database
- Meta webhook signatures are verified server-side on every inbound event
- CORS fully open for `/api/webhooks/inbound` (Meta's IP can send webhooks from anywhere)

**Conversation Architecture:**
Each (agent, lead) pair has one `Conversation` record. All messages belong to that conversation. When a different agent is assigned, a new conversation is created for the new relationship, preserving the old chat history.

### Real Estate Problem it Solves

> **"My agents are chatting with buyers on their personal WhatsApp numbers. We have no visibility, and when an agent leaves, all those conversations are lost."**

WhatsApp is the #1 communication channel in India for real estate inquiries. But when agents use personal numbers:
- Company has **zero visibility** into what's being said
- Leads go cold when an agent leaves the company
- No compliance record for disputes over verbal commitments
- No way to know which messages were delivered vs. read

This feature centralizes all WhatsApp communication in the CRM — every message is logged, managers can audit conversations, and when an agent is replaced, the new agent can see the full conversation history.

---

## Feature #4 — WhatsApp Broadcast Campaigns

### What it does

Send **bulk WhatsApp template messages** to segmented lead lists — scheduled or immediate.

**How it works:**
1. Admin creates a broadcast with a name and description
2. Selects an audience using filters (by status, source, project, assignment)
3. Chooses an approved Meta template with variable mappings (e.g., `lead.firstName` maps to `{{1}}` in the template)
4. Schedules for a future date/time or sends immediately
5. Background worker (`broadcastWorker.js`) processes messages in **batches of 50** with **50ms throttling** between messages to comply with Meta's rate limits

**Status tracking per recipient:**
`queued → sending → sent → delivered → read → replied` (or `failed` / `skipped`)

**Opt-out respect:** Leads with `whatsappOptOut = true` are automatically skipped with reason logged.

**Usage cost logging:** Every message's cost in INR is logged (`WhatsappUsageLog`):
- Marketing template: ₹0.8631 per message
- Utility template: ₹0.1150 per message

**Analytics:** Delivered count, read count, reply count, failure breakdown — all queryable per broadcast.

### Real Estate Problem it Solves

> **"We have a new project launch this weekend. We want to message 3,000 interested leads but our team can't manually WhatsApp them all."**

Broadcast campaigns replace the nightmare of exporting leads to Excel → importing to WhatsApp → sending manually (against Meta's TOS and risking number ban). The platform:
- Uses approved templates (no ban risk)
- Handles throttling automatically (no flooding Meta's API)
- Tracks who opened, read, and replied
- Skips opted-out contacts automatically

---

## Feature #5 — WhatsApp Automation Builder (Visual Workflow)

### What it does

A **visual, no-code automation workflow builder** that creates event-driven WhatsApp sequences.

**Trigger Types:**
- `Lead Created` — when a new lead enters the CRM
- `Stage Changed` — when a lead's status is updated (e.g., moves to "Interested")
- `WhatsApp Reply` — when a lead responds to a message

**Step/Action Types:**
- **Send WhatsApp** — send a Meta-approved template with variable substitution
- **Wait** — pause the flow for N minutes/hours/days
- **Condition (If/Else)** — branch based on lead properties (source, status, project, etc.)
- **Assign Agent** — re-assign the lead to a specific agent
- **Change Stage** — programmatically move the lead to a new status
- **Send Email** — trigger an email via the connected email account

**Builder UI features:**
- Visual step-by-step canvas with drag-and-drop ordering
- Live simulator — test the flow against a hypothetical lead before publishing
- Flow analytics (total runs, reply rate, conversion rate)
- Active/inactive toggle (publishing a flow activates it)
- When a flow is updated, active runs for the old version are automatically cancelled with a log entry

**Automation Execution:**
Runs are persisted in `AutomationRun` records with a `stepLog` (full audit of every action taken). `Wait` nodes set a `resumeAt` timestamp; the cron scheduler resumes waiting runs every minute.

### Real Estate Problem it Solves

> **"When we get a Meta lead, our agent calls them in 2 hours. By then, the lead has already called 3 competitors."**

Speed-to-lead is the #1 differentiator in real estate. Buyers browse multiple developer websites in one session and fill multiple inquiry forms. The first developer to respond wins the appointment.

This automation builder allows:
1. **Instant WhatsApp greeting** when lead is created (sub-second)
2. **Follow-up sequence** if the lead doesn't reply in 24 hours
3. **Different messages for different projects** (conditional branching)
4. **Auto-escalation** — if no reply in 3 days, assign to senior agent

---

## Feature #6 — AI Voice Calling (VAPI Integration)

### What it does

Integrates with **VAPI** (Voice AI Platform) to deploy an AI voice assistant that can automatically call new leads.

**Configuration:**
- Organization-specific VAPI assistant provisioned with a custom **system prompt** (editable via UI)
- Custom **knowledge base** files uploaded per organization (PDFs, documents about the projects)
- Outbound phone number configured per org
- `autoCallEnabled` flag — when ON, new leads can be auto-called by the AI

**Call Flow:**
1. New lead arrives → AI assistant calls the lead's phone number
2. AI uses RAG (Retrieval Augmented Generation) over the uploaded knowledge base to answer questions about the project
3. Call transcript and summary are sent back via **VAPI webhook**
4. Summary is saved as a note on the lead record
5. Activity is logged in the lead timeline
6. Real-time notification pushed to the assigned agent via WebSocket

**Knowledge Files:**
PDFs and documents are uploaded to VAPI's file storage. The assistant uses these as its knowledge base during calls — it can answer "What is the price per square foot?" or "Where is the project located?" from the uploaded brochure.

### Real Estate Problem it Solves

> **"We can't afford to call 500 leads in the first 5 minutes. Our agents only work 9am-7pm. Leads at 11pm go cold."**

Real estate inquiries spike in evenings and weekends when agents are unavailable. An AI calling agent:
- Calls the lead within **60 seconds** of inquiry submission (24/7, including weekends)
- Qualifies the lead (budget range, timeline, configuration preference)
- Captures responses and updates the lead record
- Books a site visit if the lead is interested
- Agents wake up to pre-qualified leads with call transcripts, not cold leads

---

## Feature #7 — AI Sales Coach: Objection Playbook

### What it does

An AI-powered in-app coaching tool that helps agents handle real estate sales objections in real-time.

**Technical Implementation:**
- Uses **Google Gemini** with **Context Caching** for efficiency
- The system is pre-loaded with a **104,800-token document** (`Common Objections in Sales of Real Estate.md` — a ~460KB comprehensive objection-handling guide)
- This document is stored in **Gemini's context cache** (5-hour TTL, auto-refreshed)
- Agents type in the objection they're facing (e.g., "The customer says the price is too high")
- Gemini answers with specific tactics, scripts, and responses — all backed by the pre-cached real estate playbook

**Cost Efficiency:**
```
Cached query:   ~475 wallet tokens  (89% cheaper)
Uncached query: ~4,295 wallet tokens
```
Caching reduces per-query cost by **89%** because only the agent's short question is sent on each call — the 104K-token document is fetched from Google's cache.

**AI Wallet System:**
Every AI feature consumes tokens from the organization's AI Wallet:
- Wallet starts at 0 (no free credits)
- Recharged via **Razorpay** (payment gateway):
  - Starter Pack: ₹500 → 500,000 tokens
  - Basic Pack: ₹1,000 → 1,050,000 tokens (+5% bonus)
  - Pro Pack: ₹2,500 → 2,750,000 tokens (+10% bonus)
  - Business Pack: ₹5,000 → 6,000,000 tokens (+20% bonus)
- Usage is logged per feature, per model, per user

### Real Estate Problem it Solves

> **"Our junior agents don't know how to handle objections. 'Location is bad', 'Price is too high', 'I need to think about it'. They just say okay and hang up."**

Real estate sales is objection-heavy. Senior agents have years of experience handling each one. This AI tool democratizes that expertise — any agent, on any call, can instantly get expert guidance on exactly how to respond to the specific objection they're facing, with scripts, analogies, and closing techniques.

---

## Feature #8 — Meta Ads Integration (Lead Ads + Ad Insights)

### What it does

**Part A: Lead Ads Webhook**
- Connects to **Facebook/Instagram Lead Generation Ads** via Meta Business API
- When a user submits a lead form on Facebook/Instagram, Meta sends a webhook event
- The system verifies the webhook signature (HMAC-SHA256), fetches the full lead data from Meta Graph API, and creates a lead record in the CRM — all within seconds
- Supports **multiple connected pages** per organization (one organization can manage leads from 5 different Facebook pages)
- **Token health monitoring** (`metaTokenHealthService.js`) — proactively checks if page access tokens are valid and alerts if they're expiring

**Part B: Ad Performance Insights**
- Pulls **Meta Ads performance data** (impressions, clicks, reach, spend, CPM, CTR, CPC, CPL) directly from Meta Marketing API
- Displayed on the Dashboard alongside lead data, allowing true **ROI calculation**
- Timeframe filters: Today, Last 7 days, This Month, Last Month, YTD

**Page-to-Project Mapping:**
Each Facebook page can be mapped to a specific real estate project. When leads come from "Skyline Heights Facebook Page", they're auto-tagged to the "Skyline Heights" project in the CRM.

### Real Estate Problem it Solves

> **"Our marketing team says we spent ₹10 lakhs on Facebook ads last month. We have no idea how many of those leads actually converted to bookings."**

This integration closes the loop between ad spend and sales outcomes. With Meta Ads integrated into the CRM:
- See CPL (Cost Per Lead) alongside conversion rates
- Identify which campaigns produce high-quality leads (not just high volume)
- Calculate true **Cost Per Booking** — the metric that actually matters in real estate

---

## Feature #9 — Meta Conversions API (CAPI)

### What it does

**CAPI** (Conversions API) sends **real-world conversion events** back to Meta's ad servers to optimize ad delivery.

**How it works:**
1. When a lead's status changes (e.g., from "Interested" to "Converted"), the system queues a CAPI event
2. A background worker sends this event to the **Meta Conversions API** with hashed user data (phone, email, name) for privacy compliance
3. Meta uses this signal to understand which ad audiences actually convert — and serves future ads to similar users

**Status → Meta Event Mapping (Auto Mode):**
```
New               → Lead
Contacted         → Contact  
Interested        → ViewContent
Site Visit Scheduled → Schedule
Booked/Converted  → Purchase
Lost – Unqualified → LeadDisqualified
```

**Manual Mode:**
Organizations can configure custom mappings — e.g., "Qualified" = `CompleteRegistration` for one project, `SubmitApplication` for another.

**Privacy Compliance:**
All PII (phone, email, name, IP) is **SHA-256 hashed** before sending to Meta, as required by GDPR/privacy frameworks.

### Real Estate Problem it Solves

> **"We keep getting leads from Facebook but the quality is terrible. They're all time-wasters."**

Meta's algorithm optimizes for people likely to fill forms — not people likely to actually buy property. Without CAPI, Meta doesn't know who actually converted. With CAPI:
- Meta learns which users became buyers (not just form-fillers)
- The algorithm shifts to target similar high-intent audiences
- Lead quality improves over time → CPL decreases → sales team handles fewer junk leads

---

## Feature #10 — Google Sheets Sync (Bi-directional)

### What it does

A **real-time bi-directional sync** between the CRM and a Google Spreadsheet.

**Sync Modes:**
- `REALTIME` — every lead change triggers an immediate sync
- `SCHEDULED` — syncs every N minutes (configurable)
- `MANUAL` — only syncs when explicitly triggered

**What syncs:**
- Lead ID, Name, Email, Phone, Status, Source, Assigned Agent, Custom Fields, Created/Updated timestamps
- Configurable column mappings (add/remove/rename columns in the sheet)
- Status and source filters (only sync "Interested" or "Qualified" leads, for example)

**Architecture:**
- Uses a **sync queue** (`GoogleSheetsSyncQueue`) to handle high volumes without blocking
- Each lead change creates a queue entry; the cron scheduler processes the queue every minute
- Retry logic with error message capture for failed syncs
- OAuth2 integration with Google (access + refresh tokens, encrypted at rest)

### Real Estate Problem it Solves

> **"Our CFO and project head want to see leads in Google Sheets, not a CRM. Our agents are in the CRM. We need both."**

Real estate developers often have senior management who are comfortable with spreadsheets but don't want to log into a CRM. This sync satisfies both worlds — agents work in the CRM, leadership views a Google Sheet that auto-updates. It also enables reporting in Google Data Studio/Looker connected to the sheet.

---

## Feature #11 — Project 360° Dashboard

### What it does

A dedicated analytics view per real estate **project** that consolidates all performance metrics in one place.

**Metrics tracked:**
- Total leads, qualified leads, site visits, bookings (conversions)
- Cost per lead, cost per visit, cost per booking
- Ad spend breakdown by channel (Meta, Google, Offline)
- Lead source distribution chart
- Sell-Out Timeline — a visual projection of how many units will be sold per month based on booking targets

**Sell-Out Plan:**
Each project has a sell-out configuration:
- Total units to sell (e.g., 240)
- Project start date
- Base months for sell-out (e.g., 10 months)
- Monthly targets: leads, site visits, bookings

The `SellOutTimeline` component visualizes actual vs. target progress month by month.

**Multi-Project Support:**
Organizations can manage multiple active projects simultaneously. Each project has:
- A name, location, description, color badge
- Its own Meta page mappings
- Its own agent pool for assignment
- Its own welcome message template

### Real Estate Problem it Solves

> **"I have 5 projects running simultaneously. I have no idea which project is performing well and which one needs more ad spend or more agents."**

Project 360 gives developers a helicopter view across all their inventory. Instead of looking at aggregate numbers, they can drill into "Skyline Heights" specifically and see: ₹12 CPL, 18% site visit rate, 8% conversion — vs. "Park Residences" at ₹28 CPL, 9% site visit rate, 2% conversion. Immediately actionable intelligence.

---

## Feature #12 — Kanban Board (Visual Pipeline)

### What it does

A **drag-and-drop Kanban board** where each column represents a pipeline stage and each card is a lead.

- Drag a lead card from "Contacted" to "Interested" to update its status
- Cards show lead name, project, source, and last activity date
- Filter by project, source, assigned agent
- Visual count per column

### Real Estate Problem it Solves

> **"Our agents are CRM-averse. They don't like clicking through menus to update lead status."**

The Kanban board lowers friction. For visual thinkers (most sales people), moving a card from one column to another is more intuitive than opening a form and selecting a status from a dropdown. Higher adoption = more accurate data = better reporting.

---

## Feature #13 — Email Integration (SMTP / OAuth)

### What it does

Connects the CRM to the organization's email account for **outbound email communication**.

**Supported providers:**
- Google (Gmail/Google Workspace) — via OAuth
- Microsoft (Outlook/Microsoft 365) — via OAuth
- Custom SMTP (any provider)

**Features:**
- Send emails directly from the lead detail view
- **Email templates** with merge variables (`{firstName}`, `{lastName}`, etc.)
- Auto-email on lead creation (configurable welcome email)
- Email activity logged in the lead's timeline
- Token auto-refresh for OAuth accounts (tokens expire; system refreshes automatically using the stored refresh token)

### Real Estate Problem it Solves

> **"Our agents send follow-up emails from their personal Gmail. There's no record of what was promised to which buyer."**

Centralizing email through the CRM ensures all email communication is recorded, attributed, and auditable. Compliance, dispute resolution, and handover between agents are all improved.

---

## Feature #14 — Inbound Webhook Integrations

### What it does

Allows **any website, landing page, or third-party tool** to push leads into the CRM.

**Setup:**
1. Admin creates a "Webhook Integration" with a name, source label, and field mappings
2. System generates a unique token (UUID)
3. The webhook endpoint is: `POST /api/webhooks/inbound/{token}`
4. Any form submission hitting this endpoint with the mapped fields creates a lead

**Field Mapping:**
The admin configures how incoming form field names map to CRM fields:
```json
{
  "your_name": "firstName",
  "mobile_number": "phone",
  "your_email": "email"
}
```

**Security:**
- Optional **domain lock** — only accept webhooks from a specific domain
- Token-based authentication (no API key to manage)
- Rate limited to 60 requests/minute per IP

### Real Estate Problem it Solves

> **"We're running 10 landing pages on different platforms. We have to manually copy leads from each one into the CRM every day."**

Real estate marketing teams run campaigns on custom landing pages (WordPress, Webflow, Unbounce, etc.). With inbound webhooks, every form submission anywhere on the internet can feed directly into the CRM instantly, with the correct source label and field mapping.

---

## Feature #15 — CSV/Excel Import & Export

### What it does

**Import:**
- Upload CSV or Excel (`.xlsx`) files with lead data
- **Duplicate detection** — checks phone and email against existing leads before importing
- Merge strategy choices: skip duplicates, overwrite, or create as new
- Import status report: X created, Y updated, Z skipped (with reasons)
- CSV injection protection (sanitizes cells starting with `=`, `+`, `-`, `@`)

**Export:**
- Export all leads or filtered leads to CSV
- Configurable columns
- Phone numbers exported in `="91XXXXXXXXXX"` format (prevents Excel from stripping leading zeros/plus signs)
- Notes, custom fields, and all metadata included

### Real Estate Problem it Solves

> **"We just signed a new project. The builder gave us a list of 2,000 people who inquired last year. We need to import them."**

Bulk import enables historical data migration. Export enables reporting outside the CRM for presentations, investor decks, and external analytics tools.

---

## Feature #16 — Task Management

### What it does

A lightweight **to-do system** tied to leads and agents.

- Create tasks with a title, due date, and lead link
- Assigned to a specific agent
- Status: `pending` → `completed`
- Tasks surface on the **Dashboard** as a widget
- Follow-up date on a lead note automatically creates a task

**Dashboard Task Widget:**
- Shows all pending tasks for the logged-in agent
- Upcoming tasks toggle (tasks due in the next 7 days)
- One-click mark-as-complete

### Real Estate Problem it Solves

> **"My agent said he'd call back Mrs. Sharma on Friday. It's now Monday and she hasn't been called."**

Tasks are the accountability layer that converts verbal commitments into tracked obligations. When a task is created for "Call back Mrs. Sharma on Friday", it appears on the agent's dashboard and the manager's oversight view. Nothing falls through.

---

## Feature #17 — Real-Time Notifications (WebSocket + Push)

### What it does

**In-App Notifications (WebSocket):**
- New lead arrives → instant notification to assigned agent
- New WhatsApp message → instant notification to the conversation owner
- AI call completes → notification with call summary
- Import completed → notification to the admin who triggered it

**Push Notifications (Mobile):**
- Uses **Expo Push Service** with device tokens stored per user
- Push notification sent when:
  - New lead assigned to the agent
  - WhatsApp message received
  - AI call completed

**Notification Center:**
- Bell icon in the UI with unread count badge
- Mark individual or all notifications as read
- Notification types: `new_lead`, `whatsapp_message`, `call_completed`, `assignment`, `import_done`

### Real Estate Problem it Solves

> **"By the time our agent sees the new lead in the morning, the buyer has already booked with a competitor."**

Real estate leads are time-critical. Speed-to-contact in the first 5 minutes dramatically increases conversion probability. Push notifications ensure the assigned agent is alerted within seconds of lead arrival, even if they're not actively looking at the CRM.

---

## Feature #18 — Reporting & Analytics Dashboard

### What it does

**Main Dashboard Stats:**
- Total Leads, New Leads, Contacted, Nurturing, Qualified, Converted — with period-over-period trend indicators (▲▼)
- Time frame selector: Today, 7 Days, This Month, Last Month, YTD, 30 Days (default)
- All metrics respect the **client's timezone** (offset passed from browser)

**Charts:**
- **Lead Volume Trend** — area chart showing daily lead inflow over time
- **Lead Source Distribution** — pie chart of leads by source (Meta, Website, Referral, etc.)
- **Status Distribution** — bar chart of leads across pipeline stages
- **Agent Performance** — leads handled and conversion rates per agent
- **Meta Ads Insights** — spend, impressions, clicks, CPM, CTR overlaid with CRM data

**Reports Page:**
- Dedicated reports section (expandable)
- Filterable by timeframe, project, source, agent

### Real Estate Problem it Solves

> **"Our monthly management meeting takes 3 hours to prepare the presentation because we're pulling data from 6 different places."**

The dashboard gives management a single-pane view of the entire business in real-time. The marketing team sees CPL by campaign. The sales head sees conversion rates by agent. The project director sees booking progress vs. target. All without anyone preparing a presentation.

---

## Feature #19 — White-Label Platform (Agency Mode)

### What it does

The platform is architected to be fully **white-labeled** — resold under any brand by agencies.

**White-Label Configuration per Organization:**
- Custom domain (e.g., `crm.myagency.com`) with DNS verification
- Brand name (replaces "NeetiCRM")
- Logo (light + dark mode versions)
- Favicon
- Primary and secondary brand colors
- Sidebar background color
- Support email and URL
- Terms and Privacy URLs
- Custom SMTP configuration for system emails (emails are sent from the agency's domain)

**Domain Resolution:**
The `whiteLabelMiddleware` inspects every incoming request's `Origin`/`Host`/`X-Forwarded-Host` header. If it matches a configured custom domain, that organization's branding is loaded and returned — making every login page, email, and UI look like the agency's product.

**Agency Hierarchy:**
```
Super Admin (Platform Owner)
    └── Agency Organization (reseller)
            ├── Sub-Account 1 (builder/developer client)
            ├── Sub-Account 2 (builder/developer client)
            └── Sub-Account 3 (builder/developer client)
```

An agency can create and manage multiple client sub-accounts, each with their own users, leads, and settings — all isolated from each other.

### Real Estate Problem it Solves

> **"We're a real estate marketing agency. We want to offer our clients their own CRM as a service, under our brand."**

Digital marketing agencies servicing multiple real estate developers can now offer a fully branded CRM to each client. The client sees the agency's logo and colors, not "NeetiCRM". The agency charges a monthly SaaS fee and earns recurring revenue, while the platform does the heavy lifting.

---

## Feature #20 — Super Admin Panel

### What it does

A completely **separate React application** (`admin/`) for the platform owner (or agency admin).

**Capabilities:**
- **Organization Management** — create, view, edit, suspend, delete organizations
- **User Management** — view all users across all organizations
- **Impersonation** — log in as any user for support purposes (fully audit-logged)
- **Feature Flag Control** — enable/disable specific features per organization:
  - `whatsapp`, `metaAds`, `automations`, `vapi`, `googleSheets`, `webhooks`
- **AI Wallet Management** — manually grant tokens, view usage per organization
- **White-Label Management** — configure branding for any organization
- **Audit Log** — full trail of all admin actions (who did what, when, from which IP)
- **System Metrics** — total organizations, users, leads, messages across the platform
- **Registration Trend** — 30-day new organization chart

**Security:**
- Every admin action is written to the `AuditLog` table with `userId`, `action`, `details`, `ipAddress`
- Impersonation generates a temporary access token — the action is logged with both the admin's ID and the target user's ID

### Real Estate Problem it Solves

> **"We built a SaaS product and have 50 clients. We can't SSH into the database every time someone needs their account reset or feature toggled."**

The super admin panel eliminates the need for developer intervention in routine operations. Support teams can reset passwords, activate accounts, adjust AI token balances, and debug issues — all without touching the database.

---

## Feature #21 — Session & Device Management

### What it does

Enterprise-grade **session management** with full device tracking.

**For every login, the system records:**
- IP Address
- User Agent string
- Device Type (Desktop / Mobile / Tablet)
- Browser + version (e.g., "Chrome 127")
- OS (e.g., "Windows 11", "iOS 17.5")
- Client App (`web` or `mobile`)
- Device ID (persistent UUID from client)
- Device Name (e.g., "iPhone 15 Pro")
- Last Active timestamp

**Refresh Token Architecture:**
- Short-lived JWT access tokens (15 minutes)
- Long-lived refresh tokens stored in the database (30 days for web, 90 days for mobile)
- Multiple concurrent sessions per user (e.g., logged in on phone + laptop + tablet)
- Users can view and revoke individual sessions from the settings page

### Real Estate Problem it Solves

> **"One of our agents' accounts was accessed by someone we don't recognize at 2am from a different city."**

Device tracking enables security auditing. Suspicious sessions can be identified and revoked. The mobile app gets longer refresh token validity so agents don't get logged out mid-client-visit.

---

## Feature #22 — Lead Detail Page (360° Lead View)

### What it does

The most information-dense page in the application — a complete **360° profile of a single lead**.

**Sections:**
1. **Header** — Name, status badge, project badge, source, assigned agent, deal value
2. **Contact Info** — Phone (click-to-call), Email (click-to-email), WhatsApp button
3. **Attribution** — UTM parameters and gclid (for Google Ads tracking)
4. **Notes** — Pinned + chronological timeline, filterable by type
5. **Activity Timeline** — All actions ever taken on this lead
6. **WhatsApp Chat** — Embedded conversation window with full message history
7. **Tasks** — Lead-specific tasks with due dates
8. **VAPI Call History** — All AI call transcripts and summaries
9. **Automation Status** — Active automation runs triggered by this lead
10. **Custom Fields** — Any project-specific data (form responses, survey answers)
11. **Facebook Ad Data** — Campaign, adset, ad name, form name, ad questions

**Actions from this page:**
- Change status (with CAPI event automatically queued)
- Assign/reassign agent
- Add note
- Create task
- Send WhatsApp message
- Initiate AI call
- Send email
- Mark WhatsApp opt-out

### Real Estate Problem it Solves

> **"When a buyer calls back, the agent has no idea of what was discussed before. They ask the same questions again, frustrating the buyer."**

The 360° lead view is the "buyer file" that agents check before every call. In one glance, the agent knows: where the lead came from, which project they're interested in, the last 3 conversation messages, what was promised in the last note, and what the next follow-up task is. No more "Can I ask who referred you?" when they already filled in a Facebook form.

---

## 🔒 Security Architecture

| Layer | Implementation |
|---|---|
| Authentication | JWT (15-min access token) + Refresh Token (DB-stored, per-device) |
| Password Storage | bcrypt hashing |
| Token Storage | AES-256 encryption for all third-party tokens (Meta, Google, SMTP) |
| Webhook Verification | HMAC-SHA256 signature verification for Meta webhooks |
| Rate Limiting | 300 req/15min (API), 30 req/15min (auth), 60 req/min (webhooks) |
| File Upload Security | Strict CSP headers on `/uploads` to prevent stored XSS |
| Audit Trail | Every admin action logged with user + IP + action + details |
| CORS | Restricted to known origins; fully open only for inbound webhook path |
| Role-Based Access | Database-level query scoping (not just UI hiding) |

---

## 🛠️ Tech Stack Summary

**Backend:**
- Node.js + Express.js (REST API)
- Prisma ORM + PostgreSQL (primary database)
- Socket.io (real-time WebSocket)
- AWS S3 (media file storage)
- Redis-style in-memory caching (template cache, cron scheduler)
- Docker + Nginx (deployment)

**Frontend (Agent Web App):**
- React + Vite (SPA)
- TailwindCSS (styling)
- Recharts (data visualization)
- Zustand (state management)
- React Router v6

**Admin Panel:**
- React + Vite (separate SPA)
- TailwindCSS

**Mobile (React Native):**
- Expo (managed workflow)
- TypeScript
- Expo Push Notifications
- Google Services (Firebase for push on Android)

**External Integrations:**
- Meta Graph API (Lead Ads, WhatsApp Business, Ads Insights)
- VAPI (AI voice calling)
- Google Gemini API (AI features)
- Google Sheets API (bi-directional sync)
- Razorpay (payment processing for AI wallet)
- AWS S3 (file storage)
- Expo Push Notification Service

---

## 🎯 Platform Positioning: Who is this For?

| User Type | Primary Use Case |
|---|---|
| **Real Estate Developer** | Track all leads from all projects, measure ad ROI, monitor agent performance |
| **Real Estate Marketing Agency** | White-label the platform, manage multiple developer clients |
| **Real Estate Sales Team (Manager)** | Monitor agent activity, ensure follow-ups, see pipeline health |
| **Sales Agent** | Manage assigned leads, communicate via WhatsApp/Call/Email, update status |
| **Field Agent (Mobile)** | View leads and update status on-the-go between site visits |
| **Platform Operator (SaaS)** | Manage all client organizations via the super admin panel |

---

## 📊 Problems Solved — Summary Matrix

| Real Estate Pain Point | CRM Feature That Solves It |
|---|---|
| Leads from FB ads don't reach agents quickly | Meta Lead Ads Webhook (instant capture) |
| Agents manually distribute leads | Smart Lead Assignment Engine |
| No WhatsApp communication record | WhatsApp CRM Inbox |
| Can't message 3,000 leads for a launch | WhatsApp Broadcast Campaigns |
| Slow first-response time | WhatsApp Automation + AI Voice Calling |
| Junior agents can't handle objections | AI Objection Playbook |
| Can't measure ad spend vs. bookings | Meta Ads Insights + Project 360 |
| Meta showing low-quality leads | Meta CAPI (conversion feedback loop) |
| Management wants Google Sheets | Google Sheets Bi-directional Sync |
| Website leads not captured in CRM | Inbound Webhook Integration |
| Legacy lead data in Excel | CSV/Excel Import |
| Agents forget follow-ups | Task Management |
| No speed-to-lead alerts | Real-time Push Notifications |
| Each project needs separate tracking | Project 360° Dashboard |
| Agency wants to resell the CRM | White-Label + Agency Mode |
| Unauthorized account access | Device & Session Management |
| Agent leaves, conversation history lost | Centralized WhatsApp CRM |

---

*This document reflects the codebase state as of **August 2026**. The platform is under active development.*
