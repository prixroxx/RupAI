# RupAI - AI Financial Insights Platform

RupAI is an AI-powered financial coaching platform that uses specialized agents to analyze your financial documents and provide personalized insights for debt management, savings optimization, and budget planning.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI with LangChain agents
- **Database**: Supabase (PostgreSQL with vector extensions)
- **AI**: OpenRouter API for LLM access
- **Storage**: Supabase Storage for document uploads

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd rupai-financial-platform
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration (see Configuration section below)
```

### 3. Python Agents Setup

```bash
# Navigate to Python agents directory
cd python-agents

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### 4. Start the Services

**Terminal 1 - Python Agents:**
```bash
cd python-agents
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173 (use HTTP, not HTTPS)
- Python Agents API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

### Manual Docker Setup

**Build Python Agents:**
```bash
cd python-agents
docker build -t rupai-agents .
docker run -p 8000:8000 --env-file .env rupai-agents
```

**Build Frontend:**
```bash
docker build -t rupai-frontend .
docker run -p 5173:5173 rupai-frontend
```

## ⚙️ Configuration

### Required Environment Variables

Create `.env` files in both the root directory and `python-agents/` directory:

**Root `.env` (Frontend):**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Python Agents URL
VITE_PYTHON_AGENTS_URL=http://localhost:8000
```

**`python-agents/.env` (Backend):**
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Setting Up Supabase

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Run Database Migrations:**
   ```bash
   # Install Supabase CLI
   npm install -g @supabase/cli

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref your-project-id

   # Push database schema
   supabase db push
   ```

3. **Enable Vector Extension:**
   In your Supabase SQL editor, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Setting Up OpenRouter

1. Go to [openrouter.ai](https://openrouter.ai)
2. Create an account and get your API key
3. Add credits to your account for API usage

## 🔧 Development

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Python Agents Development

```bash
cd python-agents

# Start with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Run tests (if available)
python -m pytest

# Format code
black .
```

### Database Development

```bash
# Generate new migration
supabase migration new your_migration_name

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

## 📁 Project Structure

```
rupai-financial-platform/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   └── services/                # API services
├── python-agents/               # Python backend
│   ├── agents/                  # AI agent implementations
│   ├── database/                # Database utilities
│   └── main.py                  # FastAPI application
├── supabase/                    # Supabase configuration
│   ├── functions/               # Edge functions
│   └── migrations/              # Database migrations
├── public/                      # Static assets
└── docker-compose.yml           # Docker configuration
```

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting provider

3. Set environment variables in your hosting dashboard

### Python Agents Deployment

**Railway (Recommended):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

**Render:**
1. Connect your GitHub repository
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python main.py`

**Heroku:**
```bash
# Install Heroku CLI and login
heroku create your-app-name
git push heroku main
```

### Environment Variables for Production

Update your production environment variables:
- `VITE_PYTHON_AGENTS_URL`: Your deployed Python agents URL
- `PYTHON_AGENTS_URL`: Same as above (for edge functions)

## 🔍 Troubleshooting

### Common Issues

**1. "AI Agents: Offline" Status**
- Ensure Python agents are running on port 8000
- Check that `VITE_PYTHON_AGENTS_URL` is set correctly
- Access frontend via HTTP (not HTTPS) for local development

**2. "Failed to fetch" Errors**
- Mixed content error: Use `http://localhost:5173` instead of `https://`
- CORS issues: Ensure Python agents allow frontend origin
- Network issues: Check if agents server is accessible

**3. Supabase Connection Issues**
- Verify your Supabase URL and keys are correct
- Check if your Supabase project is active
- Ensure database migrations have been applied

**4. Document Upload Fails**
- Check Supabase Storage is configured
- Verify file size limits (10MB default)
- Ensure proper authentication

### Debug Mode

Enable detailed logging:

**Frontend:**
```bash
# Open browser developer tools (F12)
# Check Console tab for detailed logs
```

**Python Agents:**
```bash
# Add debug logging
export LOG_LEVEL=DEBUG
python main.py
```

### Health Checks

**Check Python Agents:**
```bash
curl http://localhost:8000/health
```

**Check Frontend:**
```bash
curl http://localhost:5173
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test` and `python -m pytest`
5. Commit changes: `git commit -m "Add feature"`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

## 🔮 Roadmap

- [ ] Mobile app support
- [ ] Additional AI agents (investment advisor, tax optimizer)
- [ ] Real-time financial data integration
- [ ] Advanced visualization dashboards
- [ ] Multi-language support
- [ ] Automated financial goal tracking

---

**Happy Financial Coaching with RupAI! 🚀💰**