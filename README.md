# AB-IDR

AB-IDR is an internal utility for managing and bulk-updating ad unit IDs across multiple mediation platforms from a single interface. It allows teams to fetch existing configurations, review proposed changes, and apply updates efficiently.

> **Note:** This project is intended for trusted internal use. Authentication and authorization are not included by default.

## Features

- Unified interface for multiple mediation platforms
- Bulk ad unit ID replacement and synchronization
- Preview changes before applying updates
- Preview and final CSV exports for auditing and verification
- Error handling and status notifications
- Support for multiple ad formats and applications

## Supported Platforms

- AppLovin MAX
- ironSource
- TradPlus

## Tech Stack

### Frontend

- React
- Vite

### Backend

- Node.js
- Express.js

## Project Structure

```text
AB-IDR/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── assets/
│   └── package.json
├── server/                 # Express API and integrations
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── controllers/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Backend Setup

```bash
cd server
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend will be available locally and will communicate with the backend API.

## Workflow

### Frontend

The application exposes dedicated pages for AppLovin MAX, ironSource, and TradPlus. Each page follows the same three-step workflow:

1. **Authenticate** by providing the required platform credentials.
2. **Review** the proposed changes and download a preview CSV.
3. **Confirm** the updates and download the final results CSV.

#### Required Credentials

| Platform | Required Inputs |
| --- | --- |
| AppLovin MAX | MAX Management Key |
| ironSource | Secret Key and Refresh Key |
| TradPlus | Bear Key and Secret Key |

The frontend first issues a `GET` request to preview changes. After user confirmation, a corresponding `POST` request applies the updates. This two-step approach ensures that all modifications can be reviewed before they are committed.

### Backend

For every platform, the backend follows the same two-phase flow:

1. **Preview (`GET`)** – Scan ad units, determine eligibility, and compute proposed replacements.
2. **Apply (`POST`)** – Re-run the same logic, apply the updates, and return the final status of each operation.

This guarantees that the preview CSV accurately reflects the changes that will be applied.

#### Eligibility Rules

An ad unit is eligible only if:

- It belongs to one of the configured AppBroda network codes.
- Its identifier ends with a version suffix of the form `_vN`, where `N` is numeric.

All other identifiers are left unchanged.

#### AppLovin MAX

The service scans both waterfall and A/B test ad units, focusing on active Google Ad Manager placements. Matching IDs are refreshed and the corresponding configurations are updated through the MAX Management API.

#### ironSource

The service authenticates using the provided Secret Key and Refresh Key and retrieves instances for the applications listed in `IRONSOURCE_APP_KEYS`. For eligible instances, the numeric suffix of `instanceConfig1` is incremented (for example, `banner_v3` → `banner_v4`). The provided credentials are used only to obtain an access token and are never persisted.

#### TradPlus

TradPlus placements are fetched using the Bear Key and Secret Key. Eligible placement IDs are identified using the configured AppBroda patterns, their version suffixes are incremented, and the updates are submitted in bulk.

## Configuration

Create the required environment variables in the backend `.env` file:

```env
PORT=3000
IRONSOURCE_APP_KEYS=app_key_1,app_key_2,app_key_3
```

`IRONSOURCE_APP_KEYS` defines the ironSource applications that will participate in the preview and refresh process.


## Operational Considerations

- **Timeouts:** Large mediation stacks may require several minutes to process. Configure sufficiently high application and reverse-proxy timeouts (for example, in Nginx, PM2, or your load balancer).
- **Rate Limits:** To avoid platform API throttling, many update operations are intentionally performed sequentially rather than fully in parallel.
- **Logging:** All update operations are logged to facilitate basic troubleshooting and auditing.

## Architecture

### Stateless Design

AB-IDR is designed as a stateless integration layer and does not require a local database. All ad unit metadata, configuration, and state are managed by the respective mediation platforms (AppLovin MAX, ironSource, and TradPlus) through their APIs.
This simplifies deployment and ensures that the application always operates on the latest data available from each platform.
If desired, a database can be introduced in the future to persist credentials, cache metadata, maintain audit logs, or support additional organization-specific workflows and features.

## Security

This project does **not** implement:

- User authentication
- Role-based access control
- Audit logging
- Persistent storage of user-provided API credentials

All credentials are supplied at runtime and are used only for the duration of the requested operation.

