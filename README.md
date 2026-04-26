# SkillMatch AI

An AI-powered volunteer-to-task allocation platform built for NGOs. Upload a volunteer roster and a task database, run the matchmaking engine, and get structured allocations with confidence scores and AI reasoning — all in one dashboard.

---

## Repository Structure

```
skillmatchai/           # Next.js frontend
skillmatchai-backend/   # FastAPI backend
```

---

## How It Works

1. Upload a CSV or JSON volunteer roster and task database through the dashboard
2. Click "Run Matchmaking Engine"
3. The frontend sends both datasets to the backend via POST /api/v1/optimize-allocation
4. The backend builds a structured prompt and sends it to Gemini (primary) or Groq Llama 3.1 8B (fallback)
5. The AI returns a JSON allocation array with confidence scores and reasoning per match
6. Results populate the dashboard — KPI cards, confidence distribution chart, and the full allocation table
7. Export results as CSV or view per-match AI reasoning inline

---

## Frontend

### Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- Sonner (toast notifications)

### Project Structure

```
skillmatchai/
  src/
    app/
      dashboard/
        components/
          ConfidenceChart.tsx     # Bar + area charts, computed from live results
          DashboardHeader.tsx
          KPIBentoGrid.tsx        # 4 KPI cards, live stats from context
          ResultsSection.tsx      # Allocation results table with search + sort
          TerminalEngine.tsx      # Animated terminal, fires real API mid-animation
          UploadSection.tsx       # File upload, CSV/JSON parser, triggers engine
      volunteers/
      tasks/
    components/
      AppLayout.tsx
      Sidebar.tsx
    lib/
      api.ts                      # File parsers + fetch client for backend
      AllocationContext.tsx       # Shared state across dashboard components
      mockData.ts                 # Type definitions (no mock data used in UI)
```

### Local Setup

```bash
cd skillmatchai
npm install
cp .env.example .env
# set NEXT_PUBLIC_API_URL in .env
npm run dev
```

Runs on http://localhost:4028

### Environment Variables

| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Backend base URL (e.g. http://localhost:8000 or Railway URL) |

### File Format

Volunteers CSV:
```
id,name,skills,availability
vol-001,Jane Smith,Python|Teaching|Data Analysis,available
```

Tasks CSV:
```
id,title,required_skills,urgency_level
task-001,Youth Coding Workshop,Python|Teaching,High
```

Skills and required_skills are pipe-separated. urgency_level must be one of: Critical, High, Medium, Low.

JSON format is also accepted — must be an array of objects with the same field names.

### Available Scripts

```bash
npm run dev          # Start dev server on port 4028
npm run build        # Production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run type-check   # TypeScript check
```

---

## Backend

### Tech Stack

- Python 3.11+
- FastAPI
- Uvicorn
- httpx (async HTTP)
- Pydantic v2
- pydantic-settings

### Project Structure

```
skillmatchai-backend/
  main.py               # App entry, CORS, router mount
  config.py             # Environment settings via pydantic-settings
  logging_config.py     # Structured JSON logging
  requirements.txt
  Procfile              # Railway deployment
  api/
    routes.py           # POST /api/v1/optimize-allocation
    schemas.py          # Pydantic request validation
    service.py          # Gemini + Groq API calls, retry logic, response sanitization
```

### Local Setup

```bash
cd skillmatchai-backend
pip install -r requirements.txt
cp .env.example .env
# add your API keys to .env
python main.py
```

Runs on http://localhost:8000

Interactive API docs at http://localhost:8000/docs

### Environment Variables

| Variable | Description |
|---|---|
| GEMINI_API_KEY | Google Gemini API key (primary AI provider) |
| GROQ_API_KEY | Groq API key (fallback — free at console.groq.com) |

### API Reference

#### POST /api/v1/optimize-allocation

Request body:
```json
{
  "volunteers": [
    {
      "id": "vol-001",
      "name": "Jane Smith",
      "skills": ["Python", "Teaching"],
      "availability": "available"
    }
  ],
  "tasks": [
    {
      "id": "task-001",
      "title": "Youth Coding Workshop",
      "required_skills": ["Python", "Teaching"],
      "urgency_level": "High"
    }
  ]
}
```

Response:
```json
{
  "allocations": [
    {
      "task_id": "task-001",
      "volunteer_id": "vol-001",
      "confidence_score": 91,
      "allocation_reasoning": "Strong skill vector alignment across all required competencies."
    }
  ]
}
```

Error responses:
- 400 — invalid request schema
- 502 — AI provider failed after retries

### AI Provider Logic

Gemini (gemini-2.0-flash) is called first with up to 3 retries and exponential backoff (5s, 10s, 20s) on rate limit errors. If Gemini exhausts all retries, the request automatically falls back to Groq (llama-3.1-8b-instant) with the same retry logic. If both fail, a 502 is returned with a user-friendly message.

The AI response is sanitized before returning — markdown code fences are stripped and the JSON array is extracted and validated before it reaches the client.

### Logging

All logs are structured JSON. PII is never logged. Each request logs volunteer count, task count, AI provider used, attempt number, and allocation count on success.

---

## Deployment

### Backend — Railway

1. Connect the repo to Railway, set root directory to `skillmatchai-backend`
2. Add environment variables: `GEMINI_API_KEY`, `GROQ_API_KEY`
3. Railway uses the `Procfile` to start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend — Vercel

1. Connect the repo to Vercel, set root directory to `skillmatchai`
2. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app`
3. Deploy

---

## Contributing

Clone the repo, create a branch, make your changes, open a pull request. Set up both services locally using the steps above. API keys are never committed — get your own from Google AI Studio (Gemini) and console.groq.com (Groq).
