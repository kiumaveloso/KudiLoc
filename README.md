# KudiLoc — ATM Locator for Angola

**A crowd-sourced ATM cash availability platform for Angola**

> Solving Angola's ATM cash availability crisis through community-driven reporting and intelligent crowd-sourcing.

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Crowd-Sourcing Algorithm](#crowd-sourcing-algorithm)
- [Frontend](#frontend)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Overview

KudiLoc is a full-stack platform with a **.NET C# REST API** backend and a **React web frontend**. Users can find ATMs with available cash, report ATM status in real-time, and help the community avoid wasted trips.

The system uses a reputation-weighted crowd-sourcing algorithm to determine ATM reliability and cash availability.

---

## The Problem

Angola faces a persistent ATM cash availability crisis:

- **2.3 ATMs** visited on average before finding cash
- **45 minutes** average time wasted per trip
- **500–1500 Kz** in transport costs per failed attempt
- **No real-time information** about ATM status

This affects **34+ million people** across Angola.

---

## Architecture

Clean Architecture with four layers:

```
┌─────────────────────────────────────────┐
│          API Layer (Controllers)        │  ← HTTP, auth, routing
├─────────────────────────────────────────┤
│    Application Layer (Business Logic)   │  ← Services, DTOs, validators
├─────────────────────────────────────────┤
│       Core Layer (Domain Entities)      │  ← Entities, interfaces, rules
├─────────────────────────────────────────┤
│   Infrastructure Layer (Data Access)    │  ← MongoDB repositories
└─────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend | .NET 8, C# |
| Database | MongoDB Atlas |
| Authentication | JWT Bearer |
| Validation | FluentValidation |
| API Docs | Swagger / OpenAPI |
| Frontend | React 18, Vite, Tailwind CSS |
| Map | React Leaflet (OpenStreetMap) |
| Deployment | Render (Docker) |

---

## Project Structure

```
KudivilaATMLocator/
├── ATMLocator.API/                  # Web API — controllers, middleware, startup
│   ├── Controllers/
│   │   ├── ATMController.cs         # ATM CRUD + nearby search
│   │   ├── ReportController.cs      # /api/reports (frontend-compatible)
│   │   ├── StatusReportController.cs
│   │   ├── AuthController.cs
│   │   ├── UserController.cs
│   │   └── AnalyticsController.cs
│   ├── Middleware/
│   │   ├── ApiKeyMiddleware.cs
│   │   ├── ErrorHandlingMiddleware.cs
│   │   ├── RequestLoggingMiddleware.cs
│   │   ├── SecurityHeadersMiddleware.cs
│   │   └── CorrelationIdMiddleware.cs
│   └── Program.cs
│
├── ATMLocator.Application/          # Business logic — services, DTOs, validators
├── ATMLocator.Core/                 # Domain — entities, interfaces, settings
├── ATMLocator.Infrastructure/       # Data access — MongoDB repositories
├── ATMLocator.Tests/                # Unit + integration tests
│
├── frontend/                        # React web app
│   ├── src/
│   │   ├── api/base44Client.js      # Custom API client → KudiLoc C# API
│   │   ├── pages/                   # Home, ATMDetail, ReportATM, Profile
│   │   └── components/              # Map, ATM markers, bottom sheets
│   └── package.json
│
├── Dockerfile
├── docker-compose.yml
├── render.yaml
└── KudiLoc.sln
```

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [MongoDB](https://www.mongodb.com/try/download/community) or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string
- [Node.js 18+](https://nodejs.org/) (for the frontend)

### 1. Clone

```bash
git clone https://github.com/kiumaveloso/KudiLoc.git
cd KudiLoc/KudivilaATMLocator
```

### 2. Configure the API

Edit `ATMLocator.API/appsettings.json`:

```json
{
  "MongoDbSettings": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "KudiLoc"
  },
  "Jwt": {
    "Key": "YourSecretKeyAtLeast32CharactersLong!",
    "Issuer": "KudiLoc",
    "Audience": "KudiLoc",
    "ExpirationDays": 30
  }
}
```

### 3. Run the API

```bash
cd ATMLocator.API
dotnet run
```

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger`

### 4. Run the Frontend

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:5000 npm run dev
```

- Frontend: `http://localhost:5173`

### 5. Docker (optional)

```bash
docker-compose up
```

---

## API Reference

All responses use **snake_case** field names. No authentication required for browsing ATMs or submitting reports.

### Authentication

```http
POST /api/auth/register      # Register with phone number
POST /api/auth/login         # Login, returns JWT
POST /api/auth/otp/request   # Request OTP code
POST /api/auth/otp/verify    # Verify OTP, returns JWT
GET  /api/auth/me            # Current user profile (requires JWT)
```

### ATMs

```http
# List / filter (no auth required)
GET  /api/atm                                     # All ATMs, sorted by updated_date
GET  /api/atm?id={id}                             # Filter by ID (returns array)
GET  /api/atm?sort=-updated_date&limit=200

# Geospatial search
GET  /api/atm/nearby?latitude={lat}&longitude={lon}&radiusKm={km}
POST /api/atm/nearby/auto                         # Body: { latitude, longitude, radiusKm }
POST /api/atm/nearby/auto/sorted                  # Sorted by walking distance

# Lookup
GET  /api/atm/{id}
GET  /api/atm/search?query={term}
GET  /api/atm/province/{province}
GET  /api/atm/bank/{bankName}

# Write (no auth required)
POST   /api/atm                                   # Create ATM
PATCH  /api/atm/{id}                              # Partial update (status, connectivity…)
PUT    /api/atm/{id}                              # Full update
DELETE /api/atm/{id}                              # Delete

# Media
POST /api/atm/{id}/photo                          # Upload photo (requires JWT)
```

**ATM response format:**
```json
{
  "id": "abc123",
  "bank_name": "Banco BAI",
  "location_name": "Talatona Shopping, piso 0",
  "latitude": -8.9470,
  "longitude": 13.1844,
  "status": "has_money",
  "is_online": "online",
  "has_paper": true,
  "reliability_score": 87,
  "recent_reports_count": 4,
  "last_report_time": "2026-03-11T10:30:00Z",
  "updated_date": "2026-03-11T10:30:00Z"
}
```

### Reports

```http
POST /api/reports                                 # Submit report (no auth required)
GET  /api/reports?atm_id={id}&limit=20            # Reports for an ATM
GET  /api/reports?created_by={email}&limit=100    # Reports by a user
GET  /api/statusreport/atm/{atmId}                # Paginated report history
```

**Submit report:**
```json
{
  "atm_id": "abc123",
  "status_reported": "has_money",
  "reporter_reputation": 50
}
```

### Users & Analytics

```http
GET    /api/user/{id}                 # Requires JWT
PUT    /api/user/{id}                 # Update profile
DELETE /api/user/{id}                 # Delete account
GET    /api/analytics/stats           # System-wide statistics
GET    /api/analytics/atm/{id}/activity
```

### System

```http
GET /health       # Instant health check (always 200)
GET /health/db    # MongoDB connectivity check
GET /             # API version and status
GET /swagger      # Interactive API documentation
```

---

## Crowd-Sourcing Algorithm

Reports from the last **30 minutes** are collected per ATM. Each report is weighted by reporter reputation:

```
weight = 0.5 + (reputation / 100)
```

The side (has money / no money) with the higher total weight wins. A reliability score (0–100) is then calculated:

| Component | Max Points | Description |
|-----------|-----------|-------------|
| Volume bonus | 50 | More reports = higher confidence |
| Consensus bonus | 30 | How unanimous the reports are |
| Trust bonus | 20 | Winning side's total reputation weight |

After each report cycle, accurate reporters gain **+2 reputation**; reporters who contradict consensus lose **-3 reputation**.

---

## Frontend

The React frontend lives at `KudivilaATMLocator/frontend/`.

**Features:**
- Interactive map with real-time ATM markers (Leaflet + OpenStreetMap)
- Report cash status, connectivity, and paper availability directly from the map
- ATM detail page with reliability ring, report history, and Google Maps navigation
- Add new ATMs using GPS coordinates
- Favorites stored locally in the browser

**To build for production:**
```bash
cd KudivilaATMLocator/frontend
npm install
VITE_API_URL=https://kudiloc-api.onrender.com npm run build
```

The `VITE_API_URL` environment variable tells the frontend which API to connect to.

---

## Deployment

The project is configured for **Render** using `render.yaml`. Every push to `main` triggers an automatic redeploy.

### Steps

1. Connect the `kiumaveloso/KudiLoc` GitHub repo to [Render](https://render.com)
2. Render reads `render.yaml` and configures the service automatically
3. Set one environment variable manually in the Render dashboard:
   - `MongoDbSettings__ConnectionString` — your MongoDB Atlas URI

### Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `MongoDbSettings__ConnectionString` | MongoDB Atlas URI | Set manually |
| `MongoDbSettings__DatabaseName` | Database name | `render.yaml` (`KudiLoc`) |
| `Jwt__Key` | JWT signing key | Auto-generated by Render |
| `ASPNETCORE_ENVIRONMENT` | Runtime environment | `render.yaml` (`Production`) |
| `ApiKey` | Optional endpoint protection key | Set manually if needed |

### Docker

```bash
cd KudivilaATMLocator
docker build -t kudiloc-api .
docker run -p 5000:8080 \
  -e MongoDbSettings__ConnectionString="your-atlas-uri" \
  kudiloc-api
```

---

## Testing

```bash
cd KudivilaATMLocator
dotnet test
```

| Suite | Tests | What it covers |
|-------|-------|----------------|
| ATM Service | 9 | CRUD, search, geospatial |
| Status Report Service | 5 | Crowd-sourcing, cooldowns, reputation |
| User Service | 5 | Registration, retrieval, updates |
| Auth Service | 4 | JWT generation, login, register |
| Integration | 15 | Full HTTP request/response cycle |

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Open a Pull Request

---

## Author

**Veloso** — [@kiumaveloso](https://github.com/kiumaveloso)

---

<p align="center">Making cash more accessible, one ATM at a time.</p>
