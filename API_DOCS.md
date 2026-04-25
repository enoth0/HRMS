# API Documentation — HRMS

**Base URL**: `http://localhost:5000`  
**Auth**: All protected routes require `Authorization: Bearer <accessToken>` header.  
**Cookies**: Refresh token stored in `httpOnly` cookie `refreshToken`.

---

## Auth

### POST /api/auth/login
**Public**

Request:
```json
{ "email": "admin@company.com", "password": "secret123" }
```
Response `200`:
```json
{
  "accessToken": "eyJ...",
  "user": { "id": "...", "name": "Admin", "email": "...", "role": "admin" }
}
```
Sets `refreshToken` httpOnly cookie.

---

### POST /api/auth/register
**Admin only**

Request:
```json
{ "name": "Jane Doe", "email": "jane@co.com", "password": "pass", "role": "hr_recruiter" }
```
Response `201`:
```json
{ "message": "User created", "user": { "id": "...", "name": "Jane Doe", ... } }
```

---

### POST /api/auth/refresh
**Requires refreshToken cookie**

Response `200`:
```json
{ "accessToken": "eyJ..." }
```

---

### POST /api/auth/logout
**Bearer token**

Response `200`:
```json
{ "message": "Logged out successfully" }
```

---

## Employees

### GET /api/employees
**Roles**: admin, hr_recruiter, senior_manager  
**Query**: `?page=1&limit=20&search=john&department=Engineering&status=active`

Response `200`:
```json
{
  "employees": [{ "_id": "...", "employeeId": "EMP-00001", "name": "John", "department": "Eng", ... }],
  "pagination": { "page": 1, "limit": 20, "total": 120, "pages": 6 }
}
```

---

### POST /api/employees
**Roles**: admin, hr_recruiter

Request:
```json
{
  "name": "Alice Smith",
  "email": "alice@co.com",
  "phone": "9876543210",
  "department": "Engineering",
  "designation": "Software Engineer",
  "dateOfJoining": "2024-01-15",
  "salary": 80000
}
```
Response `201`: Employee object with auto-generated `employeeId`.

---

### PUT /api/employees/:id
**Roles**: admin, hr_recruiter  
Request: Partial employee fields.  
Response `200`: Updated employee.

---

### DELETE /api/employees/:id
**Roles**: admin  
Soft delete — sets `status: inactive`.  
Response `200`: `{ "message": "Employee deactivated" }`

---

### POST /api/employees/semantic-search
**Roles**: admin, hr_recruiter, senior_manager

Request:
```json
{ "query": "Python developer Chennai 3 years experience" }
```
Response `200`:
```json
{
  "results": [
    { "employee": { ... }, "score": 0.847 },
    { "employee": { ... }, "score": 0.731 }
  ]
}
```

---

## Attendance

### POST /api/attendance/checkin
**Role**: employee  
Response `201`:
```json
{ "message": "Checked in successfully", "record": { "checkIn": "2024-06-01T09:00:00Z", ... } }
```

---

### PUT /api/attendance/checkout
**Role**: employee  
Auto-computes `hoursWorked`. Sets `status: half-day` if < 4 hours.  
Response `200`: Updated attendance record.

---

### GET /api/attendance/my
**Role**: employee  
**Query**: `?page=1&limit=31`  
Response `200`: Array of attendance records.

---

### GET /api/attendance/report/:employeeId
**Roles**: admin, hr_recruiter, senior_manager  
**Query**: `?month=6&year=2024`

Response `200`:
```json
{
  "records": [...],
  "summary": { "present": 20, "absent": 2, "halfDay": 1, "wfh": 3, "totalHours": 168.5 },
  "month": 6, "year": 2024
}
```

---

## Payroll

### POST /api/payroll/generate
**Roles**: admin, hr_recruiter

Request:
```json
{ "month": 6, "year": 2024, "allowancesPercent": 20, "deductionsPercent": 10 }
```
Response `201`:
```json
{
  "message": "Payroll generated",
  "results": [{ "employeeId": "EMP-00001", "netSalary": 88000, "slipId": "..." }]
}
```

---

### GET /api/payroll/:employeeId/slips
**Roles**: employee (own only), admin, hr_recruiter  
**Query**: `?page=1&limit=12`  
Response `200`: Array of payroll records with populated employee.

---

### PUT /api/payroll/:id/process
**Role**: admin  
Response `200`: `{ "message": "Marked as paid", "slip": { "status": "paid", "processedAt": "..." } }`

---

## Performance

### POST /api/performance
**Roles**: admin, senior_manager

Request:
```json
{
  "employee": "<employeeObjectId>",
  "reviewPeriod": "Q2 2024",
  "goals": [
    { "title": "Deliver Feature X", "target": "5 features", "achieved": "4 features", "score": 8 }
  ]
}
```
Response `201`: Performance review object.

---

### PUT /api/performance/:id/submit
**Roles**: admin, senior_manager  
Triggers Gemini AI summary generation.

Response `200`:
```json
{
  "message": "Review submitted with AI analysis",
  "review": {
    "overallScore": 80,
    "status": "submitted",
    "aiSummary": {
      "executiveSummary": "...",
      "strengths": ["..."],
      "areasForImprovement": ["..."],
      "developmentRecommendations": ["..."],
      "rating": "Exceeds Expectations"
    }
  }
}
```

---

### GET /api/performance/my
**Role**: employee  
Response `200`: Array of own performance reviews.

---

## Recruitment

### POST /api/recruitment/apply
**Public**

Request:
```json
{
  "applicantName": "Rahul Kumar",
  "email": "rahul@gmail.com",
  "phone": "9876543210",
  "position": "Senior React Developer",
  "resumeText": "Experienced React developer with 4 years...",
  "resumeUrl": "https://..."
}
```
Response `201`: `{ "message": "Application submitted", "id": "..." }`

---

### POST /api/recruitment/screen/:id
**Roles**: admin, hr_recruiter

Request (optional):
```json
{ "jobDescription": "We need a React developer with TypeScript experience..." }
```
Response `200`:
```json
{
  "aiResult": {
    "score": 82,
    "summary": "Strong React developer with relevant skills...",
    "skillsMatched": ["React", "TypeScript", "Redux"],
    "skillsMissing": ["GraphQL"],
    "recommendation": "shortlist",
    "reasoning": "Candidate meets 90% of requirements..."
  }
}
```

---

### GET /api/recruitment/applications
**Roles**: admin, hr_recruiter, senior_manager  
**Query**: `?page=1&limit=20&status=shortlisted&position=React&minScore=60&maxScore=100`

Response `200`:
```json
{
  "applications": [...],
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
}
```

---

### PUT /api/recruitment/:id/status
**Roles**: admin, hr_recruiter

Request:
```json
{ "status": "shortlisted" }
```
Response `200`: Updated application.

---

## AI Chatbot

### POST /api/ai/chat
**Bearer token**

Request:
```json
{
  "message": "How many days of casual leave do I get per year?",
  "sessionId": "session-1717200000000",
  "context": { "name": "John Doe", "department": "Engineering" }
}
```
Response `200`:
```json
{
  "reply": "As per company policy, employees are entitled to 12 days of casual leave per year...",
  "sessionId": "session-1717200000000"
}
```

---

## Error Responses

All errors follow this shape:
```json
{ "message": "Human-readable error description" }
```

| Code | Meaning |
|---|---|
| 400 | Bad request / missing fields |
| 401 | Not authenticated / token expired |
| 403 | Access denied (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 500 | Internal server error |
| 502 | External AI service error |
