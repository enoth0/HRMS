# HRMS — AI-Powered Human Resource Management System
### FWC Hackathon 2024

A production-ready, full-stack HRMS built with Next.js, Node.js/Express, MongoDB, and Google Gemini AI. Features 4 AI capabilities, JWT auth, role-based access, and is deployable on free-tier infrastructure.

---

## 🚀 Features

- **4 AI Features**: Resume screening, HR chatbot, performance analysis, semantic employee search
- **Role-Based Dashboards**: Admin, HR Recruiter, Senior Manager, Employee
- **Modules**: Employees, Attendance, Payroll (with PDF), Performance, Recruitment
- **Security**: JWT (httpOnly cookies), bcrypt, rate limiting, CORS
- **Scalable**: MongoDB indexing, pagination, connection pooling, response compression
- **DevOps**: Docker, docker-compose, GitHub Actions CI/CD

---

## 🏗️ Architecture

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

## ⚙️ Setup

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

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 32+ char secret for access tokens |
| `JWT_REFRESH_SECRET` | 32+ char secret for refresh tokens |
| `GEMINI_API_KEY` | Google Gemini API key |
| `HF_API_TOKEN` | HuggingFace Inference API token |
| `CLIENT_URL` | Frontend origin for CORS |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend |

---

## 🤖 AI Features

| # | Feature | Model | Trigger |
|---|---|---|---|
| 1 | Resume Screener | Gemini 1.5 Flash | HR clicks "Run AI Screen" |
| 2 | HR Chatbot | Gemini + LangChain | Floating chat widget |
| 3 | Performance Analyzer | Gemini 1.5 Flash | Manager submits review |
| 4 | Semantic Employee Search | HF `all-MiniLM-L6-v2` | POST /api/employees/semantic-search |

---

## 👥 Roles & Access

| Role | Access |
|---|---|
| `admin` | Full access to all modules |
| `hr_recruiter` | Recruitment, attendance, payroll generation |
| `senior_manager` | Read employees, approve reviews, team analytics |
| `employee` | Own profile, own attendance/payroll/performance |

---

## 🌐 API Endpoints

See [API_DOCS.md](./API_DOCS.md) for full reference.

**Base URL**: `http://localhost:5000`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/login | Public | Login, get JWT |
| POST | /api/auth/refresh | Cookie | Refresh access token |
| POST | /api/auth/logout | Bearer | Logout |
| POST | /api/auth/register | Admin | Create user |
| GET | /api/employees | HR/Admin/Manager | List all employees |
| POST | /api/employees | HR/Admin | Create employee |
| PUT | /api/employees/:id | HR/Admin | Update employee |
| DELETE | /api/employees/:id | Admin | Soft delete |
| POST | /api/employees/semantic-search | HR/Admin | Semantic search |
| POST | /api/attendance/checkin | Employee | Log check-in |
| PUT | /api/attendance/checkout | Employee | Log check-out |
| GET | /api/attendance/my | Employee | Own history |
| GET | /api/attendance/report/:id | HR/Admin | Monthly report |
| POST | /api/payroll/generate | HR/Admin | Generate payroll |
| GET | /api/payroll/:id/slips | Employee | Own payslips |
| PUT | /api/payroll/:id/process | Admin | Mark as paid |
| POST | /api/performance | Manager | Create review |
| PUT | /api/performance/:id/submit | Manager | Submit + AI analysis |
| GET | /api/performance/my | Employee | Own reviews |
| POST | /api/recruitment/apply | Public | Submit application |
| POST | /api/recruitment/screen/:id | HR | AI screening |
| GET | /api/recruitment/applications | HR/Admin | List applications |
| PUT | /api/recruitment/:id/status | HR | Update status |
| POST | /api/ai/chat | Bearer | HR chatbot |

---

## 🚢 Deployment

### Backend → Render
1. Push code to GitHub
2. Create a new **Web Service** on render.com
3. Set **Root Directory** to `server`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node index.js`
6. Add all environment variables in Render dashboard
7. Copy the **Deploy Hook URL** to GitHub secret `RENDER_DEPLOY_HOOK_URL`

### Frontend → Vercel
1. Import GitHub repo on vercel.com
2. Set **Root Directory** to `client`
3. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
4. Deploy
5. Copy **Org ID**, **Project ID**, and **Token** to GitHub secrets

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TailwindCSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| AI | Google Gemini 1.5 Flash, LangChain.js, HuggingFace |
| Auth | JWT (access + refresh), bcrypt |
| DevOps | Docker, GitHub Actions, Render, Vercel |
