# Implementation Plan: Google Ads API Integration

Integrate Google Ads API into **Enterprise Meta Leads CRM** (`Leads-CRM`). This plan covers 4 main technical components:
1. **OAuth 2.0 Authorization & Integration Configuration**: Enable organizations to connect their Google Ads account.
2. **Inbound Lead Form Webhook**: Handle direct Google Ads Lead Form Extension submissions.
3. **Offline Conversion Uploads (OCI & EC4L)**: Automatically upload offline conversion events (`gclid` or SHA-256 hashed customer parameters) to Google Ads when lead stages update (e.g., `Qualified`, `Won`).
4. **Google Ads ROI Analytics**: Fetch campaign performance metrics (Spend, Clicks, CPL, ROAS) to display in the CRM dashboard alongside Meta Ads.

---

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.prisma](file:///b:/Leads-CRM/backend/prisma/schema.prisma)
- Add `GoogleAdsIntegration` model for storing encrypted credentials (`refreshTokenEncrypted`, `developerTokenEncrypted`), customer ID, connection status, and stage-to-conversion-action mapping.
- Add `GoogleAdsConversionQueue` model to queue offline conversion events, record delivery status, and handle retries.
- Add relations to `Organization` and `Lead` models.

---

### Backend Services & API Layer

#### [NEW] [googleAdsService.js](file:///b:/Leads-CRM/backend/services/googleAdsService.js)
- Implement `buildGoogleAdsAuthUrl`: Generates Google OAuth 2.0 authorization URL with `adwords` scope and state token.
- Implement `handleGoogleAdsCallback`: Exchanges code for tokens and saves encrypted refresh token.
- Implement `uploadOfflineConversion`: Uploads click conversions to Google Ads API using `gclid` or Enhanced Conversions for Leads (`hashed_email`, `hashed_phone_number`).
- Implement `fetchCampaignPerformance`: Queries Google Ads API (GAQL) for spend, clicks, impressions, and conversions.
- Implement `getGoogleAdsConfig`, `updateGoogleAdsConfig`, and `disconnectGoogleAds`.

#### [NEW] [googleAdsRoutes.js](file:///b:/Leads-CRM/backend/routes/googleAdsRoutes.js)
- Public Endpoint: `GET /api/google-ads/callback` (Renders popup response).
- Authenticated Endpoints:
  - `GET /api/google-ads/auth-url` (Generates OAuth flow link).
  - `GET /api/google-ads/config` (Gets current integration status & mappings).
  - `POST /api/google-ads/config` (Updates customer ID, developer token, and conversion mappings).
  - `POST /api/google-ads/disconnect` (Disconnects account).
  - `GET /api/google-ads/campaigns` (Fetches campaign reporting data).
  - `POST /api/google-ads/test-conversion` (Tests conversion event upload).

#### [MODIFY] [server.js](file:///b:/Leads-CRM/backend/server.js)
- Import `googleAdsRoutes` and mount under `/api/google-ads`.

#### [MODIFY] [leadService.js](file:///b:/Leads-CRM/backend/services/leadService.js)
- Wire status transition listener (`updateLeadStatus` / stage change handlers) to invoke `uploadOfflineConversion` based on the organization's `conversionEventMapping`.

#### [MODIFY] [webhookIntegrationService.js](file:///b:/Leads-CRM/backend/services/webhookIntegrationService.js)
- Add parser for Google Lead Form Extension payload structure (`user_column_data` array containing `FULL_NAME`, `USER_EMAIL`, `USER_PHONE_NUMBER`, `gclid`).

---

### Frontend UI Layer

#### [NEW] [GoogleAdsSettings.jsx](file:///b:/Leads-CRM/frontend/src/components/settings/GoogleAdsSettings.jsx)
- OAuth Connect / Disconnect button with status badge.
- Customer ID (10-digit) and Developer Token input fields.
- Conversion Mapping UI: Allows admins to map CRM pipeline stages (e.g. `Qualified`, `Proposal`, `Won`) to Google Conversion Action IDs.
- Test Conversion trigger button.

#### [MODIFY] [Settings.jsx](file:///b:/Leads-CRM/frontend/src/pages/Settings.jsx)
- Add "Google Ads" tab/section under Integrations.

#### [MODIFY] [Dashboard.jsx](file:///b:/Leads-CRM/frontend/src/pages/Dashboard.jsx) or [ReportPage.jsx](file:///b:/Leads-CRM/frontend/src/pages/ReportPage.jsx)
- Display Google Ads KPI summary cards (Ad Spend, Clicks, Cost Per Lead, ROI) alongside Meta Ads metrics.

---

## Verification Plan

### Automated / Service Testing
1. **Prisma Generation & Migration**:
   - Run `npx prisma generate` and `npx prisma migrate dev --name add_google_ads_integration` in `backend`.
2. **OAuth Callback Verification**:
   - Verify `GET /api/google-ads/callback` handles errors, valid auth codes, and state validation, returning formatted popup HTML via `popupHelper`.
3. **Conversion Payload SHA-256 Hashing Test**:
   - Verify SHA-256 normalization for emails and phone numbers for Enhanced Conversions for Leads (EC4L).

### Manual Verification
1. **Google Ads OAuth Connect**:
   - Test opening popup, granting permissions, and verifying that tokens save encrypted in database and status updates to connected.
2. **Inbound Webhook Test**:
   - Send simulated Google Lead Form Extension POST payload to webhook endpoint and confirm lead creation in CRM.
3. **Pipeline Stage Conversion Upload**:
   - Change a lead status to `Qualified` / `Won` in CRM UI and confirm conversion event queuing / upload.
