FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ARG INSTALL_CPLEX=false
WORKDIR /app
COPY requirements.txt /app/requirements.txt
# Install build deps, then install Python packages. If `INSTALL_CPLEX` is not set to true,
# filter out local/file-based cplex entries that are not available inside the container.
RUN apt-get update && apt-get install -y build-essential libpq-dev coinor-cbc --no-install-recommends \
    && if [ "$INSTALL_CPLEX" = "true" ]; then \
        pip install --no-cache-dir -r /app/requirements.txt ; \
    else \
        # filter out any lines that start with "cplex" (e.g. cplex==...) or local file:// requirements
        grep -vE '(^[[:space:]]*cplex\b|file://)' /app/requirements.txt > /app/requirements.docker.txt && \
        pip install --no-cache-dir -r /app/requirements.docker.txt ; \
    fi && \
    apt-get purge -y --auto-remove build-essential && rm -rf /var/lib/apt/lists/*
COPY . /app
EXPOSE 8000
# Use the WSGI wrapper that injects CORS headers and handles OPTIONS preflight
CMD ["gunicorn","pythonMS.wsgi_cors:application","--bind","0.0.0.0:8000","--workers","3"]
