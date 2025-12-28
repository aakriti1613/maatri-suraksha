# Maternal Health AI Care Companion – Architecture

## Vision
- Provide ASHA workers, nurses, doctors, and admins a unified pregnancy tracking, risk prediction, and care management companion that works reliably in low-connectivity settings.
- Blend empathetic UI with explainable AI, actionable care plans, and ethical data practices tailored for rural India.

## High-Level System
- **Next.js (App Router)** web client with Tailwind UI, Recharts analytics, and PWA/offline support.
- **Appwrite Cloud** handles authentication (email/phone + OTP), role-based access control, database collections, and file storage.
- **Python FastAPI microservice** hosts the trained Logistic Regression and Random Forest models, exposes explainable risk prediction endpoints, and stores model artifacts.
- **Sync & Offline Layer** built with IndexedDB (`idb`) queues, background sync worker, and network status indicators.
- **Voice Interaction** via Web Speech API for speech-to-text inputs and `speechSynthesis` for guidance playback.

## Appwrite Data Model (Collections)
| Collection | Purpose | Key Fields | Notes |
| ---------- | ------- | ---------- | ----- |
| `users` | Role & profile metadata | `role`, `phone`, `languages`, `assignedVillages` | Mirrors Appwrite auth user via document ID |
| `pregnancies` | Core pregnancy records | `patientProfile`, `obHistory`, `currentPregnancy`, `status`, `timeline` | Partition by assigned staff |
| `healthRecords` | Visit-wise vitals/labs | `visitDate`, `indicators`, `voiceNotes`, `syncedAt` | Linked to pregnancy |
| `riskPredictions` | AI inference logs | `score`, `category`, `confidence`, `explanations`, `modelVersion` | Store for auditing |
| `medications` | Prescriptions & adherence | `name`, `dosage`, `start`, `end`, `compliance` | Per pregnancy |
| `dietPlans` | Trimester-specific diet | `trimester`, `mealPlan`, `vegetarian` | Admin curated |
| `alerts` | Reminders & escalations | `type`, `message`, `dueOn`, `status`, `priority` | Supports offline queue |

All collections enforce role-based read/write rules and record consent flags. Aggregated insights for analytics use Appwrite views/functions.

## Frontend Architecture
- **Entry Shell (`src/app/layout.tsx`)** provides theme, font, gradient background, Appwrite client context, offline banner, and speech services.
- **Route Groups**
  - `(public)` → splash, onboarding, login/register.
  - `(protected)` → dashboard, pregnancy flows, prediction, action plan, diet, meds, alerts.
  - `(admin)` → analytics, data privacy.
- **State Management**
  - React Query for server data & sync, persistent cache in IndexedDB.
  - Zustand slice for UI state (language, modals, voice state).
  - Custom hooks for Appwrite queries and offline queueing.
- **UI System**
  - Component library under `src/components/ui` (cards, stepper, forms, timeline, risk badge, voice button).
  - Animations via Framer Motion, CSS transitions in Tailwind.
  - Pastel palette tokens defined in `tailwind.config`.
- **Voice UX**
  - `useSpeechInput` hook handles mic permissions, transcription, and field binding.
  - `useSpeechOutput` for TTS playback of action plans and alerts.

## Backend Integration
- **Appwrite SDK**
  - Client: `AppwriteClientProvider` configures endpoint, project ID, persistent sessions.
  - Server actions & API routes use Appwrite Admin key for secure writes and role checks.
- **API Routes (`src/app/api/*`)**
  - `/api/auth/session` – session validation helper.
  - `/api/pregnancies/*` – orchestrates create/update with conflict handling.
  - `/api/sync` – accepts offline queue payloads, deduplicates via `clientMutationId`.
  - `/api/predictions` – proxies to FastAPI service, enriches with guidelines, stores to Appwrite.
  - `/api/alerts` & `/api/analytics` – aggregated data endpoints with role guard.

## AI Microservice
- **Directory** `ml-service/`
- Stack: FastAPI, scikit-learn, pandas, imbalanced-learn, joblib.
- Modules:
  - `train.py` – preprocesses dataset, applies SMOTE, trains Logistic Regression & Random Forest, exports models plus feature scaler, and metadata.
  - `service.py` – FastAPI app exposing `/predict`, `/health`, `/explain`. Combines model outputs (weighted ensemble) + SHAP-like explanations (feature contributions).
  - `schemas.py` – Pydantic request/response models shared with frontend.
  - `data/` – curated dataset & lookups for diet/med guidance features.
- Security: API key header, CORS restricted to app domain.

## Offline & Sync Strategy
- Detect connection via `navigator.onLine` + `online/offline` events.
- IndexedDB stores:
  - `pendingMutations` queue (pregnancy drafts, vitals, meds).
  - Cached reference data (diet plans, checklists).
  - Last AI predictions for offline review.
- Background sync worker attempts push on reconnect, surfaces conflicts.
- UI shows sync status badges and manual "Sync Now" CTA.

## Analytics & Reporting
- `analytics` route fetches aggregated stats from Appwrite functions:
  - Risk distribution by category.
  - Hemoglobin / BP trendlines.
  - Village-wise counts & outcomes.
  - Month-over-month follow-up completion.
- Charts using Recharts with pastel gradients, accessible tooltips, data download (CSV).

## Security, Privacy, Ethics
- No national ID storage. Minimal personally identifiable information.
- Encryption via Appwrite at rest; transport via HTTPS.
- Consent captured on onboarding; privacy page links to detailed policy.
- AI disclaimers shown with each prediction; human-in-loop requirement prompt.
- Audit trail: store who triggered predictions and action plan acknowledgements.

## Implementation Phases
1. **Foundation** – Configure Tailwind theme, Appwrite client, auth guards, routing skeleton.
2. **Core Flows** – Onboarding, login/register, dashboard, pregnancy wizard, timeline.
3. **AI Integration** – Train models, build FastAPI microservice, connect prediction UI with explanations.
4. **Care Guidance** – Action plans, diet module, medicine tracking, alerts with TTS.
5. **Offline & Voice** – Speech hooks, offline queueing, sync indicators, background worker.
6. **Analytics & Ethics** – Doctor/admin dashboards, privacy page, audit logging.
7. **Testing & Hardening** – Unit/integration tests, linting, accessibility review, deployment scripts.

This architecture balances usability in low-resource settings, trustworthy AI, and maintainable full-stack engineering aligned with the project goals.


## Detailed Implementation Backlog

### Sprint 1 – Platform Foundation
- Scaffold `(public)`, `(protected)`, `(admin)` route groups with dedicated layouts, transitions, and Appwrite session guards.
- Build shared UI primitives (cards, buttons, inputs, steppers, timelines, status badges) in `src/components/ui`.
- Configure Tailwind tokens, motion presets, and gradient surfaces to match the pastel maternal palette.
- Finalize Appwrite SDK hooks (`useSession`, `useRoleGuard`), offline queue helpers, toast notifications, and speech hooks.

### Sprint 2 – Access & Onboarding
- Implement splash + onboarding carousel with language toggle (English/Hindi) and consent acknowledgement.
- Deliver email/phone + OTP authentication with registration that seeds the `users` collection and assigns roles.
- Establish role-aware navigation shell showcasing offline state, sync badges, and quick actions.

### Sprint 3 – Pregnancy Capture Flow
- Create the 5-step pregnancy intake wizard with voice-enabled inputs, validation via Zod/React Hook Form, and auto EDD/BMI calculations.
- Persist pregnancies and associated health records to Appwrite, with offline drafts stored in IndexedDB until sync completes.
- Surface follow-up tasks, recent vitals, and risk flags on the dashboard cards.

### Sprint 4 – Predictive Intelligence
- Build FastAPI microservice (`ml-service/`) with training pipeline (SMOTE, Logistic Regression, Random Forest) and SHAP-inspired explanations persisted via joblib.
- Expose `/predict` and `/explain` endpoints secured by API key, integrate with Next.js API proxy for authenticated requests.
- Render explainable AI output: score, category, confidence, top contributing factors, and human-readable narratives.

### Sprint 5 – Care Guidance & Voice
- Compose action plan generator layering clinical rules, nutrition guidance, and follow-up scheduling tailored per risk category.
- Add text-to-speech playback for advice, printable/downloadable care summaries, and manual acknowledgement logging.
- Implement trimester timeline, diet module, medicine adherence tracker, and alerts with local notifications + offline queue.

### Sprint 6 – Analytics & Ethics
- Deliver doctor/admin analytics with Recharts (risk distribution, anemia prevalence, BP trends, village insights, MoM outcomes).
- Publish privacy & ethics page, consent records, audit trail views, and configurable risk thresholds.
- Harden role-based access policies, add testing coverage, and document deployment + Appwrite infrastructure setup.

Each sprint concludes with integration testing, cross-role walkthroughs, and UX polish to ensure the experience remains reliable in low-connectivity rural contexts.


