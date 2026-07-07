# MediCore — Hospital Management System

A full-stack Hospital Management System with a FastAPI backend and a React 19 admin dashboard,
covering 12 modules: Authentication, Dashboard, Patients, Doctors, Departments, Appointments,
Billing, Pharmacy, Laboratory, Inventory, Staff, and Reports.

```
hospital-management-api/   FastAPI + SQLAlchemy + Pydantic + JWT + SQLite backend
hospital-management-ui/    React 19 + Vite + React Router + Axios + Recharts frontend
```

## Backend setup

```bash
cd hospital-management-api
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Seed the database with sample data (patients, doctors, invoices, etc.)
python -m app.seed

# Run the API
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`, with interactive docs at
`http://127.0.0.1:8000/docs`.

**Demo logins (created by the seed script):**
- `admin@hospital.com` / `Admin@123` (Admin role)
- `reception@hospital.com` / `Reception@123` (Receptionist role)

Architecture: each module follows a **Repository → Service → Router** pattern —
`app/repositories/*` handle raw SQLAlchemy queries, `app/services/*` hold business logic and
validation, and `app/routers/*` expose FastAPI endpoints. Pydantic schemas in `app/schemas/*`
validate input/output. JWT auth is implemented in `app/core/security.py` and enforced via the
`get_current_user` / `require_roles` dependencies in `app/core/deps.py`.

## Frontend setup

```bash
cd hospital-management-ui
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173` and proxies `/api` requests to the backend at
`http://127.0.0.1:8000` (configured in `vite.config.js`). Make sure the backend is running first.

Architecture: `src/api/*` holds one Axios-based module per resource; `src/context/AuthContext.jsx`
manages the JWT session; `src/components/common/*` holds the shared DataTable/Modal/Form building
blocks reused across every module page in `src/pages/*`.

## Building for production

```bash
# Frontend
cd hospital-management-ui
npm run build   # outputs to dist/

# Backend — run with a production ASGI server, e.g.
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

For a real deployment, swap the SQLite `DATABASE_URL` in `.env` for a PostgreSQL connection
string, set a strong `SECRET_KEY`, and update `BACKEND_CORS_ORIGINS` to your frontend's domain.
