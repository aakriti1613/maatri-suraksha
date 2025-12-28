<div align="center">
  <h1>🌸 Maatri Suraksha</h1>
  <p><strong>Maternal Health AI Risk Predictor & Care Companion</strong></p>
  <p>Crafted for ASHA workers, nurses, doctors, and programme admins to track, predict, and act on maternal health risks—even when the network drops.</p>
</div>

---

## 🎥 Demo 

> https://drive.google.com/file/d/1nUDe0se7cpKuLz-raxNwh4e6oFfKkLG4/view?usp=drivesdk

## 📸 Screenshots

| Feature | Preview |
| --- | --- |
| Splash & Onboarding | <img width="1593" height="782" alt="image" src="https://github.com/user-attachments/assets/e871570a-b3c9-4f36-92d5-b36b56f0f2e1" /> |
| Pregnancy Intake Wizard | <img width="1383" height="848" alt="image" src="https://github.com/user-attachments/assets/a41ee780-be51-4bd0-b167-076ff7c30adb" /> |
| AI Risk Prediction & Explainability | <img width="1412" height="709" alt="image" src="https://github.com/user-attachments/assets/da98998e-61cd-4133-ba1c-444b86bad725" /> |
| Personalised Action Plan | <img width="1483" height="628" alt="image" src="https://github.com/user-attachments/assets/fa75ebda-3556-42b1-a752-abeea8dc2645" /> |
| Medicine Dashboard | <img width="1486" height="523" alt="image" src="https://github.com/user-attachments/assets/4bc29e39-8a07-470e-93d7-e7910a4efe96" /> |

---

## ✨ What’s Inside

- **Soft pastel UI** with animated onboarding, bilingual language toggle (English/Hindi), and privacy-first messaging.
- **Role-aware Appwrite authentication** supporting email/password + phone OTP; redirects tailored for ASHA, Nurse/ANM, Doctor, and Admin.
- **Glassmorphic dashboard** summarising tracked pregnancies, high-risk counts, upcoming follow-ups, and alerts.
- **5-step pregnancy intake wizard**:
  - Auto-calculates BMI & Expected Delivery Date.
  - Zod + React Hook Form validation.
  - Voice dictation button on every field (Web Speech API).
  - Offline drafts saved to IndexedDB until sync.
- **Trimester timeline** view with tests, medicines, advice, and voice-friendly status.
- **AI risk prediction ensemble** (Logistic Regression + Random Forest):
  - Explainable contributions and confidence score.
  - Offline fallback (local inference) + Appwrite persistence when online.
- **Action plan composer** with immediate referral guidance, ANC schedule, nutrition, medicines, follow-ups, and counselling tips + Hindi text-to-speech.
- **Diet & medication modules** offering trimester-specific affordable guidance and adherence tracking.
- **Alerts & reminders** with offline queue, manual sync button, and lucide icons.
- **Doctor/Admin analytics** placeholders (risk distribution, anemia prevalence, BP trends, village-level insights).
- **Privacy & ethics manifesto** highlighting human-in-loop AI, consent, and data minimisation principles.

---

## 🧱 Architecture Overview

```
Next.js (App Router, React 19, Tailwind 4)
│
├── Context Providers
│   ├── Appwrite client (browser)
│   ├── Voice (STT/TTS)
│   ├── Offline queue + IndexedDB (idb)
│   ├── React Query cache
│   └── Language dictionary (en, hi)
│
├── API Routes (Node runtime)
│   ├── /api/auth/register      -> Appwrite Users + profile documents
│   ├── /api/pregnancies        -> Create/list pregnancies with offline safe fallback
│   ├── /api/predictions        -> Ensemble risk scoring + action plans
│   ├── /api/alerts             -> Alerts fetch/complete
│   └── /api/dashboard          -> Cards + risk trend data
│
├── Appwrite Cloud
│   ├── Authentication (email/password, phone OTP)
│   ├── Database (users, pregnancies, healthRecords, riskPredictions, medications, dietPlans, alerts)
│   └── Storage (future: diet/media assets)
│
└── AI Layer
    ├── Local ensemble (LogReg + RandomForest) in `src/lib/ai/riskModel.ts`
    ├── Explainable contributions
    └── Action plan heuristic generator
```

> ✅ `.next/` and `node_modules/` folders are kept in the repo structure locally (but ignored in git) so you can run instantly. Mentioned here per request.

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS v4, custom glassmorphism tokens, Framer Motion micro-interactions.
- **Forms & Validation:** React Hook Form + Zod.
- **State/Data:** React Query 5, IndexedDB (`idb`) offline cache, Zustand for client Appwrite store.
- **UI Primitives:** Custom Buttons, Inputs, Selects, Steppers, Voice buttons (with `class-variance-authority`).
- **Charts:** Recharts.
- **Voice:** Web Speech API (speech recognition and synthesis).
- **Backend:** Node API routes with `node-appwrite` SDK for secure Users/Databases access.
- **Notifications:** Sonner toasts with pastel theming.
- **AI:** In-app ensemble risk scorer + action plan builder (SHAP-like contributions). Future FastAPI microservice optional.

---

## 📂 Project Layout

```
maternal-health-app/
├── .next/                  # Generated dev/build output (keep locally, ignored by git)
├── node_modules/           # Installed dependencies
├── public/                 # Static assets (icons, vectors)
├── docs/                   # Demo video & screenshots (add your media here)
├── src/
│   ├── app/
│   │   ├── (public)/       # Splash, onboarding, auth
│   │   ├── (protected)/    # Dashboard, wizard, predictions, action plan, diet, meds, analytics
│   │   └── api/            # Appwrite-backed API routes
│   ├── components/
│   │   ├── providers/      # App-wide contexts
│   │   └── ui/             # Reusable UI components
│   ├── lib/
│   │   ├── ai/             # Risk model + action plan logic
│   │   ├── appwrite/       # Client & server SDK helpers
│   │   ├── offline/        # IndexedDB helpers
│   │   └── validation/     # Shared Zod schemas
│   └── styles/             # Global Tailwind theme
├── .env.local              # Environment variables (create manually)
├── package.json            # Scripts & dependencies
└── README.md               # You are here
```

---

## ⚙️ Environment Setup

1. **Clone & Install**
   ```bash
   git clone <your-repo>
   cd maternal-health-app
   npm install
   ```

2. **Create `.env.local`**
   ```bash
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT=<project-id>
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=<database-id>
   NEXT_PUBLIC_APPWRITE_BUCKET_ID=<bucket-id-or-blank>

   APPWRITE_API_ENDPOINT=https://nyc.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=<project-id>
   APPWRITE_API_KEY=<server-api-key>
   APPWRITE_DATABASE_ID=<database-id>
   APPWRITE_BUCKET_ID=<bucket-id-or-blank>

   # Optional AI microservice (future)
   AI_SERVICE_URL=
   AI_SERVICE_API_KEY=
   ```

   > **Server key:** grant `users.*`, `databases.*`, and optionally `storage.*`. Rotate immediately if exposed.

3. **Run Dev Server**
   ```bash
   npm run dev
   # open http://localhost:3000
   ```

4. **Appwrite Prep Checklist**
   - Enable email/password and phone OTP auth.
   - Create collections (`users`, `pregnancies`, `healthRecords`, `riskPredictions`, `medications`, `dietPlans`, `alerts`).
   - Optional: seed `dietPlans`, `medications` for demo data.

---

## 🧪 Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Start Next.js in development |
| `npm run build` | Produce production build |
| `npm run start` | Serve the built app |
| `npm run lint` | ESLint (TypeScript aware) |

Add unit (Vitest) or e2e (Playwright) scripts as you expand test coverage.

---

## 📡 Offline, Voice & Sync Tips

- Offline banner shows status + pending mutation count; tap “Sync now” to flush.
- Voice dictation:
  - Works best on Chrome/Edge (Desktop & Android). Safari autocompletes require `webkitSpeechRecognition`.
  - Permissions prompt appears on first use.
- Action plan TTS defaults to Hindi (`hi-IN`); fallback to `en-IN` voices if unavailable.
- Predictions run locally when offline and store results in `localStorage`; revisit when online to sync.

---

## 🔍 Explainable AI

- Logistic regression weights and random forest voting rules live in `src/lib/ai/riskModel.ts`.
- `evaluateRisk()` returns logistic probability, RF vote, ensemble score, risk category, and top contributions.
- `buildActionPlan()` maps risk category to referral, ANC, nutrition, medication, follow-up, and counselling sections.
- Future work: plug into a FastAPI microservice with real model artefacts, SHAP values, and joblib persistence.

---

## 🔒 Ethics & Compliance

- No Aadhaar or sensitive PII stored.
- Consent captured during onboarding; a dedicated Privacy & Ethics page outlines rights.
- All predictions log input snapshot, model version, risk score, confidence, and generated plan for audit.
- Action plan emphasises escalation to human experts (doctors) for high-risk cases.
- Role-based analytics ensure only admins/doctors see population-level data.

---

## 🛤 Roadmap Inspiration

- [ ] Integrate real FastAPI microservice for ensemble scoring.
 - [ ] Build Appwrite Functions for analytics aggregation.
 - [ ] Ship full PWA with background sync + push notifications (Web Push/SMS).
 - [ ] Extend language support (Marathi, Bengali, Telugu, etc.).
 - [ ] Add E2E tests (Playwright) covering offline + voice flows.
 - [ ] Introduce configurable risk thresholds via environment and admin UI.

---

## 🤝 Contributing

1. Fork & create a feature branch (`feat/your-idea`).
2. Keep styling consistent (Tailwind tokens, glass-card class, voice buttons).
3. Run `npm run lint` before opening a PR.
4. Provide screenshots/videos for major UI work.

Bug reports & feature requests are welcome via Issues.

---

## 🙌 Credits

- Built with Next.js, Tailwind, React Query, Zod, Recharts, Appwrite, and a lot of empathy.
- Voice capabilities courtesy of the Web Speech API.
- Icons by [Lucide](https://lucide.dev/).

Made with 🫶 by GPT-5 Codex—your friendly teammate dedicated to safer motherhood journeys. 🌼
