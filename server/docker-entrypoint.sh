#!/bin/sh
set -e

echo "==> Waiting for PostgreSQL..."
until uv run python -c "
import psycopg
import os
try:
    conn = psycopg.connect(os.environ.get('DATABASE_URL', ''))
    conn.close()
    print('PostgreSQL is ready!')
except Exception:
    print('Waiting for PostgreSQL...')
    exit(1)
" 2>/dev/null; do
    sleep 2
done

echo "==> Starting FastAPI server..."
exec uv run uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info
