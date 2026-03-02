# Trip Planner & ELD Log Generator

A full-stack web application designed for property-carrying drivers. It calculates Hours of Service (HOS) compliant driving schedules and automatically generates 24-hour Electronic Logging Device (ELD) grids based on FMCSA rules.

## Features

- **HOS Calculation Engine:** Enforces the 11-hour driving limit, 14-hour on-duty window, mandatory 30-minute break after 8 hours, and the 70-hour/8-day cycle rule.
- **Auto-Generated ELD Logs:** Draws accurate 24-hour FMCSA log grids visually representing Off Duty, Driving, and On Duty sections.
- **Interactive Map:** Displays route polylines, start/pickup/dropoff markers, and automatically calculates fuel stops (every 1,600 km).
- **Trip History:** Dashboard to view and review past trips and schedules.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Leaflet Maps, React Router.
- **Backend:** Django, Django REST Framework.
- **Database:** MySQL.
- **Routing/Geocoding:** OSRM + Nominatim (Free, no API keys required).

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MySQL Server

### 1. Backend Setup

1. Open your MySQL client (e.g., MySQL Workbench) and run:
   ```sql
   CREATE DATABASE trip_planner;
   ```
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory:
   ```
   SECRET_KEY=your-secret-key-development
   DEBUG=True
   ALLOWED_HOSTS=*
   
   DB_NAME=trip_planner
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_HOST=localhost
   DB_PORT=3306
   
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

## Deployment

### Frontend (Vercel)

The frontend is fully configured for deployment on Vercel. A `vercel.json` file is included to handle React Router client-side routing.

1. Push your repository to GitHub.
2. Sign in to Vercel and click Add New -> Project.
3. Import your GitHub repository.
4. Set the Framework Preset to **Vite**.
5. Set the Root Directory to `frontend`.
6. Add the environment variable for your production backend API (if applicable).
7. Click Deploy.

### Backend (Railway / Render)

1. Connect your GitHub repository to Railway or Render.
2. Set the Root Directory to `backend`.
3. Set the Build Command: `pip install -r requirements.txt`
4. Set the Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Add the appropriate environment variables (`DB_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, etc.).


