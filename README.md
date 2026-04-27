# KudiLoc — ATM Locator for Angola

**A crowd-sourced ATM cash availability platform for Angola**

> Solving Angola's ATM cash availability crisis through community-driven reporting and real-time data.

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
- [Deployment](#deployment)
- [Testing](#testing)

---

## Overview

KudiLoc is a full-stack platform with three components:

- **.NET 8 REST API** — Clean Architecture backend with MongoDB Atlas
- **React Native mobile app** — iOS & Android (Expo + Mapbox)
- **React web frontend** — browser-based map view

Users find nearby ATMs with available cash, submit crowd-sourced status reports in real time, and help the community avoid wasted trips. The system uses a reputation-weighted algorithm to determine ATM reliability.

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
│   Infrastructure Layer (Data Access)    │  ← MongoDB + Redis repositories
└─────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology |
|---|---|
| Backend | .NET 8, C# |
| Database | MongoDB Atlas |
| Cache | Redis (Upstash) |
| Authentication | JWT + OTP via SMS (Africa's Talking) |
| Phone encryption | AES-256-CBC + HMAC-SHA256 |
| Validation | FluentValidation |
| API Docs | Swagger / OpenAPI |
| Media | Cloudinary |
| Mobile app | React Native, Expo, Expo Router |
| Mobile map | Mapbox (rnmapbox/maps) |
| Web frontend | React 18, Vite, Tailwind CSS |
| Deployment | Render (Docker) |
| Mobile builds | EAS Build (Expo Application Services) |

---

## Project Structure

```
KudiLoc/
├── KudivilaATMLocator/              # Backend (.NET 8)
│   ├── ATMLocator.API/              # Controllers, middleware, Program.cs
│   │   ├── Controllers/
│   │   │   ├── ATMController.cs     # ATM CRUD, nearby search, admin status
│   │   │   ├── AuthController.cs    # OTP request/verify, refresh, logout
│   │   │   ├── UserController.cs    # Profile management
│   │   │   ├── StatusReportController.cs
│   │   │   ├── CommentController.cs
│   │   │   └── AnalyticsController.cs
│   │   └── Middleware/
│   │       ├── ApiKeyMiddleware.cs
│   │       ├── ErrorHandlingMiddleware.cs
│   │       ├── SecurityHeadersMiddleware.cs
│   │       └── CorrelationIdMiddleware.cs
│   ├── ATMLocator.Application/      # Services, DTOs, validators
│   ├── ATMLocator.Core/             # Domain entities, interfaces, settings
│   ├── ATMLocator.Infrastructure/   # MongoDB + Redis repositories
│   ├── ATMLocator.Tests/            # Unit + integration tests
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── render.yaml
│
├── mobile/                          # React Native app (Expo)
│   ├── app/
│   │   ├── (tabs)/                  # Map, list, leaderboard, profile
│   │   ├── atm/[id]/                # ATM detail + report screen
│   │   ├── admin/                   # Admin panel (add ATM)
│   │   ├── legal/                   # Privacy policy, terms, support
│   │   ├── login.tsx
│   │   └── onboarding.tsx
│   ├── src/
│   │   ├── api/                     # API client (atm, user, auth)
│   │   ├── context/                 # AuthContext
│   │   ├── store/                   # localAtms (pub-sub status store)
│   │   └── types/                   # Shared TypeScript types
│   ├── app.json
│   └── eas.json
│
├── frontend/                        # React web app
└── docs/                            # GitHub Pages (privacy policy)
```

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string
- [Node.js 18+](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (for the mobile app)

### 1. Clone

```bash
git clone https://github.com/kiumaveloso/KudiLoc.git
```

### 2. Run the API

```bash
cd KudiLoc/KudivilaATMLocator/ATMLocator.API
dotnet run
```

- API: `http://localhost:5054`
- Swagger: `http://localhost:5054/swagger`

Required environment variables (see `appsettings.json`):

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `Jwt__Key` | JWT signing secret (32+ chars) |
| `Encryption__Key` | AES-256 key (base64, 32 bytes) |
| `Encryption__HmacKey` | HMAC key (base64, 32+ bytes) |
| `AfricasTalking__ApiKey` | SMS OTP provider |
| `AfricasTalking__Username` | Africa's Talking username |
| `Cloudinary__CloudName` | Photo uploads |
| `Cloudinary__ApiKey` | Cloudinary API key |
| `Cloudinary__ApiSecret` | Cloudinary API secret |

### 3. Run the Mobile App

```bash
cd KudiLoc/mobile
npm install
npx expo start
```

Scan the QR code with the Expo Go app, or run on a simulator.

For a production build (iOS):

```bash
eas build --platform ios --profile production
```

### 4. Run the Web Frontend

```bash
cd KudiLoc/frontend
npm install
VITE_API_URL=http://localhost:5054 npm run dev
```

### 5. Docker

```bash
cd KudiLoc/KudivilaATMLocator
docker-compose up
```

---

## API Reference

All responses use **snake_case** field names. Production base URL: `https://kudiloc-api.onrender.com/api`

### Authentication (OTP)

```http
POST /api/auth/otp/request   # Send OTP SMS to phone number
POST /api/auth/otp/verify    # Verify OTP → returns JWT + sets httpOnly refresh cookie
POST /api/auth/refresh        # Refresh access token (uses cookie)
POST /api/auth/logout         # Revoke refresh token
GET  /api/auth/me             # Current user profile (requires JWT)
```

### ATMs

```http
GET  /api/atm                          # All ATMs (paginated)
GET  /api/atm/{id}                     # Single ATM
GET  /api/atm/search?query={term}      # Text search
GET  /api/atm/province/{province}      # Filter by province
GET  /api/atm/bank/{bankName}          # Filter by bank
POST /api/atm/nearby/auto/sorted       # Nearby ATMs sorted by distance
PATCH /api/atm/{id}                    # Partial update
POST  /api/atm                         # Create ATM (Admin only)
DELETE /api/atm/{id}                   # Delete ATM (Admin only)
PATCH /api/atm/{id}/status             # Admin: set cash/operational status directly
POST  /api/atm/{id}/photo              # Upload photo (requires JWT)
```

### Status Reports

```http
POST /api/statusreport                 # Submit crowd-sourced report
GET  /api/statusreport/atm/{atmId}     # Report history for an ATM
```

### Comments

```http
GET  /api/comment/atm/{atmId}          # Get comments for an ATM
POST /api/comment                      # Post a comment
POST /api/comment/{id}/helpful         # Mark comment as helpful
```

### Users & Analytics

```http
GET    /api/user/{id}                  # Requires JWT
PUT    /api/user/{id}                  # Update profile
DELETE /api/user/{id}                  # Delete account
GET    /api/analytics/stats            # System-wide statistics
```

### System

```http
GET /health        # Instant health check (always 200)
GET /health/db     # MongoDB connectivity check
GET /swagger       # Interactive API documentation
```

---

## Crowd-Sourcing Algorithm

Reports from the last **30 minutes** are collected per ATM. Each report is weighted by reporter reputation:

```
weight = 0.5 + (reputation / 100)
```

The side (has cash / no cash) with the higher total weight wins. A reliability score (0–100) is calculated:

| Component | Max Points | Description |
|---|---|---|
| Volume bonus | 50 | More reports = higher confidence |
| Consensus bonus | 30 | How unanimous the reports are |
| Trust bonus | 20 | Winning side's total reputation weight |

Accurate reporters gain **+2 reputation**; reporters who contradict consensus lose **-3 reputation**.

Admin users can bypass crowd-source logic and set ATM status directly via `PATCH /api/atm/{id}/status`.

---

## Security

- JWT stored in memory only (never localStorage)
- httpOnly refresh token cookie (SameSite=None, Secure, 30-day TTL)
- Phone numbers encrypted at rest (AES-256-CBC) with HMAC-SHA256 hash for lookups
- Login audit trail with 90-day TTL
- Brute-force protection: 5 failed OTP attempts in 15 min → 429
- CSP + HSTS headers
- IP rate limiting via AspNetCoreRateLimit

---

## Deployment

The API is deployed on **Render** via Docker. Every push to `main` triggers an automatic redeploy.

Key environment variables to set in the Render dashboard:

```
MONGO_URI
Jwt__Key
Encryption__Key
Encryption__HmacKey
AfricasTalking__ApiKey
AfricasTalking__Username
Cloudinary__CloudName
Cloudinary__ApiKey
Cloudinary__ApiSecret
```

---

## Testing

```bash
cd KudivilaATMLocator
dotnet test
```

| Suite | What it covers |
|---|---|
| ATM Service | CRUD, search, geospatial |
| Status Report Service | Crowd-sourcing, cooldowns, reputation |
| User Service | Registration, retrieval, updates |
| Integration | Full HTTP request/response cycle |

---

## Author

**Veloso** — [@kiumaveloso](https://github.com/kiumaveloso)

---

<p align="center">Making cash more accessible, one ATM at a time.</p>
