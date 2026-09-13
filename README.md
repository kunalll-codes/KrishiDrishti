# Krishi Drishti (कृषि दृष्टि)
> **"Smarter Farming. Healthier Crops."**  
> An AI-assisted agricultural intelligence and crop disease diagnosis web platform for farmers.  
> *Developed for the National College Innovation Competition by a 1st-Year BCA Student Team.*

---

## 1. Project Purpose

Smallholder farmers often struggle with delayed plant disease identification, inaccurate informal recommendations, and volatile localized mandi prices. **Krishi Drishti** is a modern, minimal, mobile-first agricultural assistant engineered to:

1. **Diagnose Crop Diseases:** Upload or snap a leaf photo for instant preliminary disease analysis with confidence scoring, observable symptom breakdown, cultural next steps, and preventive guidance.
2. **Consult Krishi Assistant:** Ask natural farming and cultivation questions in plain, farmer-friendly English or Hindi (via text or voice).
3. **Access Market Insights:** Review transparent regional mandi prices (e.g. Jaipur, Karnal, Bhopal, Pune, Indore) to make informed crop-selling decisions.
4. **Track Field Health:** Maintain an uncomplicated history of crop scans and disease alerts directly on a clean farmer dashboard.

---

## 2. Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Web Speech API
- **Backend:** Node.js, Express.js (proxying AI requests securely)
- **AI Engine:** Google Gemini API (`@google/genai` TypeScript SDK with model `gemini-3.8-flash`)
- **Build & Dev Tooling:** Vite, `tsx`, `esbuild`

---

## 3. Environment Variables

Create a `.env` file at the project root based on `.env.example`:

```env
# Gemini API key for live multimodal analysis and farming assistant chat
GEMINI_API_KEY="your_gemini_api_key_here"

# Application URL
APP_URL="http://localhost:3000"
```

### Note on Competition Demo Resilience:
If `GEMINI_API_KEY` is not provided or if the system is offline, **Krishi Drishti automatically enters Demo Mode**. An unobtrusive badge is displayed, and the app serves structured, scientifically validated agricultural knowledge base results. It **never** crashes or falsely claims that demo samples are live AI.

---

## 4. How Gemini Integration Works

All Gemini API calls are executed strictly **server-side** via Express in `server.ts` to keep API keys completely hidden from browser bundles:

1. **Multimodal Leaf Diagnosis (`POST /api/diagnose`):**
   - Receives: `{ crop, imageBase64, mimeType, language }`
   - Uses `ai.models.generateContent` with `gemini-3.8-flash` and strict JSON schema enforcement (`responseSchema`).
   - System instructions mandate ethical safety: no dangerous chemical prescriptions, clear statement of visual uncertainty, and mandatory advisories to consult local Krishi Vigyan Kendras (KVKs).
   - Full bilingual output support in Hindi and English.

2. **Krishi Assistant Chat (`POST /api/chat`):**
   - Receives user questions and conversational context.
   - Grounded with a farmer-friendly persona that speaks in clear, accessible language, offering agronomic guidance without pretending to be a certified government official or guaranteeing yields.

---

## 5. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode (starts Express server with Vite middleware on port 3000)
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 6. How to Build & Deploy for Production

```bash
# Build frontend static assets and bundle backend server
npm run build

# Start production server
npm start
```

---

## 7. Key Design Principles

- **Mobile-First Touch Target:** Minimum 44px interactive targets, easy thumb navigation, and camera drag/drop upload.
- **Restrained Agricultural Palette:** Deep natural greens (`#1b4332`, `#2d6a4f`), soft earthy greens, warm neutrals (`#fbfbfa`), and charcoal typography.
- **Anti-Slop Craft:** No neon gradients, no clutter, no fake percentage bars, and no ungrounded claims.
- **Language Inclusivity:** Instant switching between English and natural Hindi (Devanagari script) across the entire interface.
