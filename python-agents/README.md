# RupAI Python Agents Setup

## Overview
This directory contains the Python-based AI agents for RupAI that handle financial analysis using LangGraph and OpenRouter.

## Setup Instructions

### 1. Install Dependencies
```bash
cd python-agents
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (not anon key)
- `OPENROUTER_API_KEY`: Your OpenRouter API key

### 3. Running Locally
```bash
# Run the FastAPI server
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will run on `http://localhost:8000`

### 4. Deployment Options

#### Option A: Local Development
- Run locally on `http://localhost:8000`
- Update your frontend `.env` with `PYTHON_AGENTS_URL=http://localhost:8000`

#### Option B: Railway (Recommended)
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`
4. Set environment variables in Railway dashboard
5. Use the provided Railway URL as your `PYTHON_AGENTS_URL`

#### Option C: Render
1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python main.py`
5. Add environment variables
6. Use the provided Render URL

#### Option D: Heroku
1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set KEY=value`
4. Deploy: `git push heroku main`

### 5. API Endpoints
- `POST /analyze-document` - Trigger document analysis
- `POST /chat` - Handle user queries
- `GET /user/{user_id}/insights` - Get user insights
- `POST /user/{user_id}/refresh-analysis` - Refresh analysis
- `GET /health` - Health check

### 6. Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test document analysis (replace with actual document_id)
curl -X POST http://localhost:8000/analyze-document \
  -H "Content-Type: application/json" \
  -d '{"document_id": "your-document-id"}'
```