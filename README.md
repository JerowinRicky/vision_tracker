# VisionTrack AI 🎯
### AI-Powered Video Object Tracking, Re-Identification & Analytics Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.13-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.0+-green.svg)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178c6.svg)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38bdf8.svg)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed.svg)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 🌟 Executive Overview

**VisionTrack AI** is an enterprise-grade AI video intelligence platform designed for continuous multi-camera tracking, appearance-based re-identification (ReID), spatial analytics, and automated visitor dossier reporting.

The system ingests both **real-time camera streams** (RTSP, IP cameras, USB webcams, simulated synthetic streams) and **recorded video files** (MP4, AVI, MKV, MOV). It executes YOLOv8 object detection, ByteTrack and BoT-SORT multi-object tracking, deep visual feature extraction for ReID, and evaluates polygon zone rules (perimeter breach, dwell time, occupancy limits).

---

## 🏗️ High-Level Architecture

```
Camera Stream (RTSP / USB / IP) or Video Upload
                     │
                     ▼
             Video Input Layer
                     │
                     ▼
         Frame Processing Pipeline (Frame Skipping & Resizing)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  Object Detection        Object Tracking
  (YOLOv8 / MobileNet)    (ByteTrack / BoT-SORT)
         │                       │
         └───────────┬───────────┘
                     ▼
      Appearance Re-Identification (ReID)
   (Multi-scale Color Moments & Histograms)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  Spatial Zone Rules       Evidence Capture
(Point-in-Polygon Engine) (JPEG Snapshot Gallery)
         │                       │
         └───────────┬───────────┘
                     ▼
        Event Persistence & Celery Worker
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    REST API Layer        WebSocket Bus
(Django REST Framework)   (Django Channels)
         │                       │
         └───────────┬───────────┘
                     ▼
        React 18 TypeScript Dashboard
```

---

## 🚀 Key Modules & Capabilities

### 1. Object Detection Engine
- Target classes: **Person, Car, Motorcycle, Bus, Truck, Bicycle, Dog, Cat, Bird**
- Native YOLOv8 model integration with configurable confidence and IoU thresholds
- Adaptive contour/motion fallback for lightweight CPU-only environments

### 2. Multi-Object Tracking Engine
- **ByteTrack (Default)**: Two-stage Kalman filter association associating high-confidence detections first, then matching remaining tracklets with low-confidence detections
- **BoT-SORT (Advanced)**: Camera motion compensation and Kalman state vector estimation
- Trajectory path memory and movement trail rendering

### 3. Visual Appearance Re-Identification (ReID)
- Normalized spatial color moments (HSV & RGB mean/variance) + multi-scale Hue/Value spatial histograms
- Unit sphere L2 normalization for lightning-fast Cosine Similarity queries
- Internal anonymous identification system (`Person #0042`, `Car #0017`)
- Strict candidate thresholding with probabilistic labels (*"Likely same object"*, *"Possible match"*)

### 4. Visitor & Session Grouping
- Groups continuous tracking events into distinct **Visits**
- Computes start time, end time, session duration, and multi-camera visit counts
- Automated evidence snapshot tagging on entry and exit

### 5. Automated Reporting & Export
- Formats: **PDF Dossier (ReportLab)**, **Excel (OpenPyXL)**, and **CSV**
- Reports: **Daily Visitor Report**, **Weekly Analytics**, **Monthly Overview**, and **Custom Range**
- Includes summary KPI cards, visitor tables with timestamps, and camera activity breakdowns

### 6. Geofenced Polygon Zones & Alerts
- User-drawn polygon zones over camera feeds
- Configurable rules: Restricted area breach, Max dwell time (loitering), Max occupancy limits
- Real-time alert notifications over WebSockets

---

## 📁 Project Directory Structure

```
visiontrack-ai/
├── backend/
│   ├── config/              # Django settings, ASGI/WSGI, Celery, routing
│   ├── apps/
│   │   ├── authentication/  # JWT auth, User roles (Admin, Operator, Viewer)
│   │   ├── cameras/         # Camera models, encrypted credentials, live MJPEG
│   │   ├── videos/          # Video uploads & background processing status
│   │   ├── detection/       # Historical detection records
│   │   ├── tracking/        # Trajectory & tracklet records
│   │   ├── reidentification/# ReID embeddings
│   │   ├── objects/         # PersistentObject & EvidenceImage entities
│   │   ├── visits/          # Visit session groupings
│   │   ├── reports/         # Report generation & exports (PDF, Excel, CSV)
│   │   ├── alerts/          # Alert events & acknowledged states
│   │   ├── zones/           # Polygon zones & rule definitions
│   │   ├── analytics/       # Aggregated KPIs & hourly trends
│   │   ├── settings/        # Configurable system hyperparameters
│   │   └── audit/           # Immutable structured audit logs
│   ├── manage.py
│   └── seed_data.py         # Production demo seeding script
├── ai/
│   ├── detection/           # ObjectDetector engine
│   ├── tracking/            # MultiObjectTracker (ByteTrack/BoT-SORT) & Kalman
│   ├── reid/                # ReID appearance feature extractor & similarity
│   ├── zones/               # Ray-casting point-in-polygon analyzer
│   └── pipeline.py          # Unified video processing pipeline
├── workers/
│   └── tasks/video_tasks.py # Celery asynchronous background tasks
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, AppLayout
│   │   ├── contexts/        # Auth, Theme, WebSocket contexts
│   │   ├── pages/           # 16 complete production UI pages
│   │   ├── services/        # Axios API client with JWT interceptors
│   │   └── types/           # TypeScript domain interfaces
├── docker/                  # Dockerfiles for backend, worker, frontend
├── nginx/                   # Nginx reverse proxy configuration
├── tests/                   # Pytest unit & integration test suite
├── docker-compose.yml       # Complete multi-container deployment
└── requirements.txt         # Python dependencies
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### 1. Backend Setup
```bash
# 1. Activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply database migrations
cd backend
python manage.py migrate

# 4. Seed initial demonstration data
python seed_data.py

# 5. Start the backend server
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` in your web browser.

---

## 🐳 Docker Deployment

To launch the full production stack (Frontend, Backend, PostgreSQL, Redis, Celery Worker, Nginx):

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and start containers
docker compose up --build -d

# 3. Seed initial database inside container
docker compose exec backend python seed_data.py
```

The application is served at `http://localhost`.

---

## 🔐 Default Credentials

| Username | Password | Role | Permissions |
|:---|:---|:---|:---|
| **admin** | `admin123456` | Administrator | Root access: system settings, user management, audit logs |
| **operator** | `operator123456` | Operator | Process videos, configure cameras, create zones, view live |
| **viewer** | `viewer123456` | Viewer | Read-only access to dashboards, objects, visits, and reports |

---

## 🧪 Running Automated Tests

Run the full automated test suite covering AI pipelines, ByteTrack association, ReID similarity, point-in-polygon verification, and REST API security:

```bash
python run_tests.py
```

---

## 🛡️ Security Implementation
- **JWT Authentication**: Short-lived access tokens (60 min) with rolling refresh tokens (7 days).
- **Encrypted Camera Passwords**: Camera credentials encrypted using AES/Fernet and never exposed to the frontend.
- **Upload Validation**: File extension whitelisting, UUID sanitization to prevent path traversal, and file size limits.
- **RBAC**: View-level permission checks (`IsAdminRole`, `IsOperatorOrAdmin`, `ReadOnlyOrAdmin`).
- **Audit Logging**: Structured auditing for every administrative action, camera modification, and processing task.
