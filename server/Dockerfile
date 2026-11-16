FROM python:3.14-slim AS base

WORKDIR /app

# Install system deps for psycopg and uv
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first for caching
COPY pyproject.toml uv.lock ./

# Install dependencies using system Python (avoid uv downloading an unsupported newer Python)
RUN uv sync --frozen --no-dev --python /usr/local/bin/python --no-python-downloads

# Copy application code
COPY . .

# Create entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
