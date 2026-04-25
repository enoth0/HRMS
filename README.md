# HRMS — AI-Powered Human Resource Management System
```

┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Next.js)                     │
│  /login  /dashboard/*  /recruitment  /attendance  etc.   │
│  Components: DashboardLayout, ChatWidget, StatCard       │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API (JWT Bearer)
┌───────────────────────▼─────────────────────────────────┐
│                  SERVER (Express.js)                     │
│  Routes: auth, employees, attendance, payroll,           │
│          performance, recruitment, ai                    │
│  Middleware: auth, roleGuard, rateLimit, compression     │
└───────┬──────────────┬──────────────┬───────────────────┘
        │              │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼──────────────────┐
│   MongoDB    │ │  Gemini   │ │  HuggingFace Inference  │
│   (Atlas)    │ │   API     │ │  sentence-transformers  │
└──────────────┘ └───────────┘ └────────────────────────-┘
```

---

## Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free)
- Google Gemini API key (free)
- HuggingFace account (free)

### 1. Clone

```bash
git clone https://github.com/your-username/hrms-fwc.git
cd hrms-fwc
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Frontend

```bash
cd client
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

### 4. Docker (full stack)

```bash
cp server/.env.example .env
# Fill values
docker-compose up --build
```



##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TailwindCSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| AI | Google Gemini 1.5 Flash, LangChain.js, HuggingFace |
| Auth | JWT (access + refresh), bcrypt |
| DevOps | Docker, GitHub Actions, Render, Vercel |
