from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from agents.debt_analyzer import DebtAnalyzerAgent
from agents.savings_strategy import SavingsStrategyAgent
from agents.budget_optimizer import BudgetOptimizerAgent
from agents.orchestrator import AgentOrchestrator
from database.supabase_client import SupabaseClient

load_dotenv()

app = FastAPI(title="RupAI Financial Agents", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients and agents
supabase_client = SupabaseClient()
debt_agent = DebtAnalyzerAgent()
savings_agent = SavingsStrategyAgent()
budget_agent = BudgetOptimizerAgent()
orchestrator = AgentOrchestrator(debt_agent, savings_agent, budget_agent, supabase_client)

class DocumentAnalysisRequest(BaseModel):
    document_id: str

class ChatRequest(BaseModel):
    user_id: str
    message: str
    session_id: str

@app.post("/analyze-document")
async def analyze_document(request: DocumentAnalysisRequest):
    """Trigger comprehensive financial analysis by all agents"""
    try:
        result = await orchestrator.analyze_document(request.document_id)
        return {"success": True, "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_agents(request: ChatRequest):
    """Handle user queries with agent orchestration"""
    try:
        response = await orchestrator.handle_user_query(
            request.user_id, 
            request.message, 
            request.session_id
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}/insights")
async def get_user_insights(user_id: str):
    """Get all active insights for a user"""
    try:
        insights = await supabase_client.get_user_insights(user_id)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/{user_id}/refresh-analysis")
async def refresh_user_analysis(user_id: str):
    """Refresh all agent analysis for a user"""
    try:
        result = await orchestrator.refresh_user_analysis(user_id)
        return {"success": True, "updated_insights": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "agents": ["debt_analyzer", "savings_strategy", "budget_optimizer"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)