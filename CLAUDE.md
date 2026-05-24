# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

HouseTab is a shared home expense tracker for roommates. Currency is Turkish Lira (₺) only. The repo is a monorepo with two projects:

- `SharedHomeFinance/` — Spring Boot 3.2.5 (Java 21) REST API
- `SharedHomeFinanceMobile/` — React Native + Expo (TypeScript) mobile app

Each subdirectory has its own `CLAUDE.md` with detailed domain-specific guidance.

## Commands

### Backend (`SharedHomeFinance/`)

```bash
./mvnw spring-boot:run      # Run on port 8080
./mvnw test                  # Run all tests
./mvnw clean package         # Build JAR
./mvnw test -Dtest=ClassName # Run a single test class
```

Requires PostgreSQL on `localhost:5432` and Firebase credentials configured.

### Frontend (`SharedHomeFinanceMobile/`)

```bash
npm start        # Start Expo dev server
npm run android  # Open on Android emulator
npm run ios      # Open on iOS simulator
```

## Architecture

### How the two projects connect

The mobile app authenticates users via **Firebase Auth** (email/password). After sign-in, it retrieves a Firebase ID token and sends it as `Authorization: Bearer <token>` on every API call. The backend validates this token via `FirebaseTokenFilter` (Spring Security), looks up or creates the local `User` entity, and proceeds.

API base URLs:
- Android emulator → `http://10.0.2.2:8080/api`
- iOS simulator → `http://localhost:8080/api`
- Production → `https://sharedhomefinance.railway.app/api`

### Backend structure

Layered architecture: `Controller → Service → Repository → Entity`. Each domain lives in its own package under `org.calik.sharedhomefinance.domain.*`:

`user`, `home`, `expense`, `debt`, `category`, `analytics`, `notification`, `audit`, `settings`, `invitation`

Cross-cutting infrastructure lives in:
- `config/` — Firebase, Spring Security, application setup
- `common/exception/` — `GlobalExceptionHandler` with typed exceptions (`ResourceNotFoundException`, `BusinessException`, `UnauthorizedException`)
- `common/response/ApiResponse` — all endpoints return this wrapper
- `ai/` — `AIService` interface + `GeminiAIService` (Gemini 2.0 via Vertex AI)

Rules enforced in the service layer:
- Every operation checks the caller's `HomeMembership` before proceeding
- Expenses are never deleted — only cancelled (`status = CANCELLED`, `cancel_note` required)
- All expense edits create an `ExpenseVersion` snapshot
- Only one `OWNER` per home; owner must transfer role before leaving
- Debts are auto-generated when an expense is created and auto-resolved when cancelled

### Frontend structure

Navigation gates control screen access:

```
RootNavigator
├── AuthStack       (no Firebase session)
├── HomeSelectionStack  (session exists but no active home)
└── MainStack → BottomTabNavigator  (session + active home)
```

State split:
- **React Query** — all server state (expenses, debts, analytics)
- **Context API** — `AuthContext` (Firebase user + JWT), `HomeContext` (active home), `ThemeContext`

All API calls go through `src/services/`. Screens never call Axios directly. Strings always come from `src/i18n/` (TR/EN), never hardcoded. Firebase token is stored in `expo-secure-store`, not `AsyncStorage`.

### AI features (Gemini API)

Three endpoints under `/api/ai/`:
- `POST /suggest-category` — infers a category from an expense title
- `POST /monthly-report` — generates a natural-language monthly summary
- `POST /detect-anomaly` — flags unusual spending patterns


Before editing any file, read it first. Before modifying a function, grep for all callers. Research before you edit.
