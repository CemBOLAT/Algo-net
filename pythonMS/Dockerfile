# Use Python 3.11 as specified in your original file
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Argument to toggle CPLEX installation
ARG INSTALL_CPLEX=true

WORKDIR /app

# Copy requirements and any wheel files in the current directory
COPY requirements.txt /app/
# We use a wildcard so the build doesn't fail if the .whl isn't there
COPY *.whl /app/ 

# 1. Install system dependencies
# 2. Check if CPLEX should be installed
# 3. If yes, install the local .whl first, then requirements
# 4. If no, strip CPLEX from requirements and install the rest
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    coinor-cbc \
    --no-install-recommends \
    && if [ "$INSTALL_CPLEX" = "true" ]; then \
        if ls /app/cplex*.whl 1> /dev/null 2>&1; then \
            pip install --no-cache-dir /app/cplex*.whl; \
        fi; \
        pip install --no-cache-dir -r /app/requirements.txt; \
    else \
        grep -vE '(^[[:space:]]*cplex\b|file://)' /app/requirements.txt > /app/requirements.docker.txt && \
        pip install --no-cache-dir -r /app/requirements.docker.txt; \
    fi \
    && apt-get purge -y --auto-remove build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code
COPY . /app

EXPOSE 8000

# Using your custom WSGI wrapper for CORS and Gunicorn
CMD ["gunicorn", "pythonMS.wsgi_cors:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "3000"]
