#!/bin/bash

echo "🚀 RupAI Python Agents Deployment Script"
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ Missing required environment variables. Please check your .env file."
    echo "Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY"
    exit 1
fi

echo "✅ Environment variables configured"

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run tests (if any)
echo "🧪 Running health check..."
python -c "
import requests
import time
import subprocess
import signal
import os

# Start server in background
proc = subprocess.Popen(['python', 'main.py'])
time.sleep(5)  # Wait for server to start

try:
    response = requests.get('http://localhost:8000/health')
    if response.status_code == 200:
        print('✅ Health check passed')
    else:
        print('❌ Health check failed')
        exit(1)
except Exception as e:
    print(f'❌ Health check failed: {e}')
    exit(1)
finally:
    proc.terminate()
"

echo "🎉 Python agents are ready for deployment!"
echo ""
echo "Deployment options:"
echo "1. Local: python main.py (runs on http://localhost:8000)"
echo "2. Railway: railway up"
echo "3. Render: Connect GitHub repo to Render"
echo "4. Heroku: git push heroku main"
echo ""
echo "Don't forget to update PYTHON_AGENTS_URL in your frontend .env file!"