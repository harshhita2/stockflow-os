# StockFlow OS - Containerized Inventory & Order Management System

A production-ready full-stack **Inventory & Order Management System** built with **FastAPI** (Python), **React** (Vite + Vanilla CSS), and **PostgreSQL**, fully containerized via **Docker** and **Docker Compose**.

---

## Key Features

1. **Product Catalog**: Add, view, edit, and delete products (fields: Name, SKU, Price, Stock).
2. **Customer Directory**: Add, view, and delete customer records (fields: Name, Email, Phone).
3. **Order Register**: Place customer orders with multi-product selections, live client-side stock checking, automatic price calculation, database transaction locks, and automatic inventory stock deduction.
4. **Order Cancellation**: Cancel previous orders to delete order records and automatically restore quantities back to inventory stock.
5. **Dashboard Insights**: Summary widgets showing total products, total customers, total orders, and real-time low-stock product warning indicators (stock < 5).
6. **Robust Validations**: Unique product SKUs, unique customer emails, non-negative stock counts, and email layout formats are validated at the API, Pydantic, database-constraint, and React form levels.

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── config.py           # Configuration helper (reads ENV variables)
│   │   ├── database.py         # SQLAlchemy DB session engine (handles SQLite & Postgres dialects)
│   │   ├── main.py             # FastAPI routes, lifespans, CORS and Transaction controllers
│   │   ├── models.py           # SQLAlchemy tables (Product, Customer, Order, OrderItem)
│   │   └── schemas.py          # Pydantic data schemas & validators
│   ├── tests/
│   │   └── verify_apis.py      # Integration testing suite (urllib base, zero external deps)
│   ├── Dockerfile              # Multi-stage production Python slim image
│   ├── .dockerignore           # Prevent cache/local environment copying
│   └── requirements.txt        # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx   # Overview KPIs & warning charts
│   │   │   ├── ProductList.jsx # Products CRUD modal interfaces
│   │   │   ├── CustomerList.jsx# Customer directories
│   │   │   └── OrderList.jsx   # Orders log & order creation wizard
│   │   ├── App.jsx             # React routing hub & global notification banners
│   │   ├── index.css           # Premium styling theme, layouts and animations
│   │   └── main.jsx            # Vite React entrypoint
│   ├── index.html              # HTML shell
│   ├── nginx.conf              # SPA route-friendly Nginx config
│   ├── Dockerfile              # Builds Vite assets & serves them via Nginx Alpine
│   └── .dockerignore           # Exclude local build assets
├── docker-compose.yml          # Container orchestration (frontend, backend, db)
├── .env.example                # Config template file
└── README.md                   # Project documentation
```

---

## Getting Started

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

### 1. Docker Compose Execution (Recommended)
Clone the repository and run:
```bash
# Copy settings
cp .env.example .env

# Build and start services
docker compose up --build
```
Once initialized:
* **Frontend Dashboard**: Open `http://localhost:3000` in your web browser.
* **Backend API Docs**: View Swagger interactive API docs at `http://localhost:8000/docs`.
* **PostgreSQL DB**: Runs internally on port `5432` with data persisted in named volume `postgres_data`.

---

## Host-Level Development & Verification

If Docker is not running in your local workspace environment, you can run the services directly on the host using your local runtimes.

### 1. Run Backend Locally (SQLite Mode)
The backend automatically falls back to an SQLite file (`local_test.db`) if `DATABASE_URL` starts with `sqlite` (or if none is supplied and the connection is forced to sqlite).
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # On Linux: source venv/bin/activate
pip install -r requirements.txt

# Run integration checks
python tests/verify_apis.py

# Launch server
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Run Frontend Locally (Development Server)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to interact with the frontend. By default, it communicates with the backend running at `http://localhost:8000`.

---

## Deployment Configuration

* **Backend Deployment (e.g. Render / Railway)**:
  * Deploy the `backend/` folder using Python startup command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  * Set `DATABASE_URL` to point to a production PostgreSQL database instance.
* **Frontend Deployment (e.g. Vercel / Netlify)**:
  * Deploy the `frontend/` folder.
  * Set the build environment variable `VITE_API_URL` to point to the deployed URL of your backend.
