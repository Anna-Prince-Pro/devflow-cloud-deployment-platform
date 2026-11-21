# DevFlow — Frontend Web Application

The modern developer dashboard for **DevFlow**, a Cloud-Native Deployment Management Platform. Built with React 18, TypeScript, Vite, Tailwind CSS, React Router v6, and Axios.

---

## 🎨 Design Direction

- **Developer Platform Aesthetic**: Dark navy palette (`#0B0F19`, `#0F172A`, `#131D31`) with subtle cyan (`#38BDF8`), indigo/violet (`#818CF8`), and emerald accents.
- **Persistent Sidebar Navigation**: Clean navigation for authenticated developers covering Overview, Projects, Deployments, and Settings.
- **Deterministic Lifecycle State Badges**: Visual indicators matching backend deployment status rules (`pending` ➔ `running` ➔ `succeeded` or `failed`).
- **Data Integrity**: Real-time calculated dashboard statistics derived directly from live project and deployment telemetry—no hardcoded fake metrics.

---

## 📂 Project Architecture

```
frontend/
├── src/
│   ├── api/                     # Centralized Axios client and API services
│   │   ├── axios.ts             # Base client with JWT & 401 interceptors
│   │   ├── auth.ts              # Login & registration endpoints
│   │   ├── projects.ts          # Project CRUD operations
│   │   └── deployments.ts       # Deployment trigger & status transition calls
│   ├── components/
│   │   ├── layout/              # Structural components
│   │   │   ├── Sidebar.tsx      # Persistent navigation & user profile
│   │   │   ├── Header.tsx       # Breadcrumb, status pill & quick actions
│   │   │   └── DashboardLayout.tsx
│   │   └── ui/                  # Reusable UI primitives
│   │       ├── Button.tsx       # Polymorphic button with loading states
│   │       ├── Modal.tsx        # Accessible dialog with ESC listener
│   │       ├── StatusBadge.tsx  # Color-coded deployment status badge
│   │       ├── LoadingSpinner.tsx
│   │       └── EmptyState.tsx   # Meaningful empty state callouts
│   ├── context/
│   │   └── AuthContext.tsx      # Centralized auth state, JWT decoding & session
│   ├── pages/                   # Application views
│   │   ├── Login.tsx            # Sign in with validation & error handling
│   │   ├── Register.tsx         # Account registration (min. 8 char pass)
│   │   ├── Dashboard.tsx        # Telemetry metrics, Recharts & recent runs
│   │   ├── Projects.tsx         # Project cards, creation modal, edit & delete
│   │   ├── ProjectDetails.tsx   # Deep dive, repo link & project deployments
│   │   ├── Deployments.tsx      # Deployments table, filters & status machine
│   │   └── Settings.tsx         # Profile info, token details & architecture
│   ├── routes/
│   │   └── ProtectedRoute.tsx   # Client-side route guard
│   ├── types/                   # TypeScript interfaces matching backend models
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   └── deployment.ts
│   ├── App.tsx                  # Router & provider tree
│   ├── main.tsx                 # Root entrypoint
│   └── index.css                # Tailwind directives & custom scrollbars
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## ⚙️ Environment Variables

Configure environment variables in `.env`:

```bash
# Base URL for the FastAPI Backend API
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🚀 Running the Frontend

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### 3. Build for Production

```bash
npm run build
```

Production assets are compiled with code-splitting into `frontend/dist/`.

### 4. Type Checking

```bash
npm run lint
# or: npx tsc --noEmit
```

---

## 🔗 Backend API Integration

The frontend integrates directly with the DevFlow FastAPI backend:

| Page | Backend Endpoints | Description |
|---|---|---|
| **Auth** | `POST /api/v1/users/register`<br>`POST /api/v1/users/login` | Registration & JWT token acquisition |
| **Dashboard** | `GET /api/v1/projects/`<br>`GET /api/v1/deployments/` | Live stats, recent executions & charts |
| **Projects** | `GET /api/v1/projects/`<br>`POST /api/v1/projects/`<br>`PUT /api/v1/projects/{id}`<br>`DELETE /api/v1/projects/{id}` | Project CRUD (owner auto-assigned) |
| **Project Details** | `GET /api/v1/projects/{id}`<br>`GET /api/v1/deployments/projects/{id}` | Deep dive and project-scoped runs |
| **Deployments** | `GET /api/v1/deployments/`<br>`POST /api/v1/deployments/`<br>`PATCH /api/v1/deployments/{id}/status` | Trigger deployments & state transitions |
