# 🐳 Saral Setu - Docker Containerization Guide

This project is fully containerized with **Docker** and **Docker Compose**, providing a complete multi-container environment with:
1. **`app`**: FastAPI backend, AI Reasoning Engine, ReportLab PDF Generator, and static frontend portal.
2. **`mongodb`**: Persistent encrypted citizen vault & document storage database.
3. **`mongo-express`**: Web-based visual database management dashboard.

---

## 🚀 1-Click Quickstart

### On Windows:
Double-click [`start-docker.bat`](file:///c:/Users/466mo/OneDrive/Desktop/New%20folder/Form_assistan/start-docker.bat) or run:
```cmd
start-docker.bat
```

### On Linux / macOS:
```bash
chmod +x start-docker.sh stop-docker.sh
./start-docker.sh
```

---

## 🌐 Container Services & Ports

| Service | Description | URL | Credentials |
| :--- | :--- | :--- | :--- |
| **Saral Setu Web App** | Main Portal, Voice Assistant & Form Engine | [http://localhost:8000](http://localhost:8000) | Citizen account created in UI |
| **API Documentation** | Interactive FastAPI Swagger UI | [http://localhost:8000/docs](http://localhost:8000/docs) | N/A |
| **Database Dashboard** | Mongo-Express visual database manager | [http://localhost:8081](http://localhost:8081) | Username: `admin` / Password: `admin` |
| **Database Instance** | MongoDB 7.0 daemon | `localhost:27017` | `saralsetu_db` |

---

## 🛠️ Common Docker Compose Commands

### Start containers in background:
```bash
docker compose up -d --build
```

### View live logs:
```bash
docker compose logs -f app
```

### Stop all containers:
```bash
docker compose down
```

### Reset database volumes (fresh start):
```bash
docker compose down -v
```

---

## ⚙️ Environment Configuration

The application automatically reads configuration from `.env` or `backend/.env`.

Key parameters configured in `docker-compose.yml`:
- `GEMINI_API_KEY`: Google Gemini AI Key for Form Schema & Document Analysis
- `HUGGINGFACE_API_KEY`: Hugging Face Key for OCR model (`microsoft/trocr-base-printed`)
- `MONGO_URI`: `mongodb://mongodb:27017` (internal Docker bridge network)
- `MONGO_DB_NAME`: `saralsetu_db`
- `JWT_SECRET`: Secret key for Citizen JWT tokens
