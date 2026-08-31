# 🚀 Deploying VetPaw on Render

This guide walks you through deploying the **VetPaw** application onto [Render](https://render.com) with a managed PostgreSQL database and production Gunicorn WSGI server.

---

## 📋 Prerequisites

1. A [GitHub](https://github.com/) account with the VetPaw repository pushed.
2. A free [Render](https://render.com/) account.

---

## 🌟 Method 1: Deploy with Render Blueprint (Recommended - 1-Click)

The repository includes a `render.yaml` file that automatically provisions both the **PostgreSQL database** and the **Flask Web Service**.

### Steps:
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub repository containing VetPaw.
4. Render will detect `render.yaml` and display:
   - **Database**: `vetpaw-db` (PostgreSQL)
   - **Web Service**: `vetpaw` (Python)
5. Click **Apply**.
6. Render will automatically:
   - Create and launch the PostgreSQL instance.
   - Run `./build.sh` (installs packages and runs `init_db.py` to create tables and seed default data).
   - Start the web service using `gunicorn app:app`.
7. Once deployment finishes, click on your service URL (e.g. `https://vetpaw.onrender.com`).

---

## 🛠️ Method 2: Manual Setup via Render Dashboard

If you prefer setting up services individually via the dashboard UI:

### Step 1: Create the PostgreSQL Database
1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **PostgreSQL**.
2. Fill in:
   - **Name**: `vetpaw-db`
   - **Database**: `vetpaw`
   - **User**: `vetpaw_user`
   - **Plan**: `Free` (or desired tier)
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (or **External Database URL** if connecting externally).

### Step 2: Create the Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Name**: `vetpaw`
   - **Environment**: `Python`
   - **Region**: (Choose the same region as your database)
   - **Branch**: `main` (or your deployment branch)
   - **Build Command**: `./build.sh` *(or `pip install -r requirements.txt && python init_db.py`)*
   - **Start Command**: `gunicorn app:app`
   - **Plan**: `Free`

### Step 3: Add Environment Variables
In the **Environment Variables** section of your Web Service, add:

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `<Your Render PostgreSQL Internal Connection String>` | From Step 1 |
| `SECRET_KEY` | *(Click "Generate" or enter a secure random string)* | Required for session security |
| `DEBUG` | `False` | Disables debug mode in production |
| `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python runtime |

4. Click **Create Web Service**.

---

## 🔑 Default Admin Credentials

Upon initial deployment and database seeding via `init_db.py`:
- **Email**: `admin@vetpaw.com`
- **Password**: `admin123`

> **Note**: Log in as admin to change the password and manage clinic, vet, and pet records.

---

## 🔍 Verification & Health Check

After deployment completes:
1. Visit your public Render URL: `https://<your-service-name>.onrender.com`.
2. Check the **Landing Page**, test **Chatbot triage**, **Clinics**, **Pet Essentials**, and **User Login / Registration**.
3. Check the **Logs** tab in Render Dashboard to monitor real-time traffic and application status.

---

## ❓ Troubleshooting

- **Database Connection Issues**: Render's PostgreSQL connection URLs may start with `postgres://`. The application's `config.py` automatically converts this to `postgresql://` for SQLAlchemy compatibility.
- **Cold Starts on Free Tier**: Render's free tier spins down web services after 15 minutes of inactivity. The first request after spin-down may take ~30-50 seconds to respond.
- **Re-seeding Database**: You can trigger a database re-seed anytime from the Render Web Service **Shell** tab by running:
  ```bash
  python init_db.py
  ```
