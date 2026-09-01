# =========================================================================
# SARAL SETU - OFFICIAL DOCKERFILE
# Multi-Language AI Form Assistant & Citizen Identity Vault
# =========================================================================

FROM python:3.11-slim

# Set environment flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    MONGO_URI=mongodb://mongodb:27017 \
    MONGO_DB_NAME=saralsetu_db

# Install system dependencies needed for OCR, PDF generation, Pillow & curl healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7 \
    libtiff6 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application and frontend web assets
COPY backend /app/backend
COPY frontend /app/frontend

# Expose FastAPI application port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/vault || exit 1

# Working directory for server runtime
WORKDIR /app/backend

# Launch FastAPI Uvicorn Server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
