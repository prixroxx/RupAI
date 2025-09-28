from typing import Dict, List, Any, Optional
from .debt_analyzer import DebtAnalyzerAgent
from .savings_strategy import SavingsStrategyAgent
from .budget_optimizer import BudgetOptimizerAgent
from database.supabase_client import SupabaseClient
import asyncio
import json

class AgentOrchestrator:
    def __init__(self, debt_agent: DebtAnalyzerAgent, savings_agent: SavingsStrategyAgent, 
                 budget_agent: BudgetOptimizerAgent, supabase_client: SupabaseClient):
        self.debt_agent = debt_agent
        self.savings_agent = savings_agent
        self.budget_agent = budget_agent
        self.supabase_client = supabase_client
    
    async def analyze_document(self, document_id: str) -> Dict[str, Any]:
        """Orchestrate analysis of a document by all agents"""
        try:
            # Get document chunks and extract user_id
            chunks = await self.supabase_client.get_document_chunks(document_id)
            if not chunks:
                raise ValueError("No document chunks found")
            
            # Get user_id from document
            documents = await self.supabase_client.get_user_documents(chunks[0].get("user_id", ""))
            user_id = None
            for doc in documents:
                if doc["id"] == document_id:
                    user_id = doc["user_id"]
                    break
            
            if not user_id:
                raise ValueError("Could not determine user_id for document")
            
            # Get user's financial data
            financial_data = await self.supabase_client.get_user_financial_data(user_id)
            financial_summary = await self.supabase_client.get_financial_summary(user_id)
            
            # Prepare context for agents
            context = {
                "document_chunks": chunks,
                "financial_summary": financial_summary,
                "user_id": user_id
            }
            
            # Run all agents in parallel
            debt_analysis, savings_analysis, budget_analysis = await asyncio.gather(
                self.debt_agent.analyze({"financial_data": financial_data}, context),
                self.savings_agent.analyze({"financial_data": financial_data}, context),
                self.budget_agent.analyze({"financial_data": financial_data}, context)
            )
            
            # Store insights in database
            await self._store_agent_insights(user_id, [debt_analysis, savings_analysis, budget_analysis])
            
            return {
                "document_id": document_id,
                "user_id": user_id,
                "analyses": {
                    "debt_analysis": debt_analysis,
                    "savings_analysis": savings_analysis,
                    "budget_analysis": budget_analysis
                },
                "summary": await self._generate_summary(debt_analysis, savings_analysis, budget_analysis)
            }
            
        except Exception as e:
            # Update document status to failed
            await self.supabase_client.update_document_status(document_id, "failed", {"error": str(e)})
            raise e
    
    async def handle_user_query(self, user_id: str, message: str, session_id: str) -> str:
        """Handle user query by routing to appropriate agent(s)"""
        
        # Get user context
        financial_data = await self.supabase_client.get_user_financial_data(user_id)
        financial_summary = await self.supabase_client.get_financial_summary(user_id)
        recent_insights = await self.supabase_client.get_user_insights(user_id)
        
        context = {
            "financial_data": financial_data,
            "financial_summary": financial_summary,
            "recent_insights": recent_insights
        }
        
        # Determine which agent(s) should handle the query
        query_lower = message.lower()
        
        if any(keyword in query_lower for keyword in ["debt", "loan", "credit", "payoff", "interest"]):
            response = await self.debt_agent.generate_response(message, context)
        elif any(keyword in query_lower for keyword in ["save", "saving", "investment", "retire", "emergency fund"]):
            response = await self.savings_agent.generate_response(message, context)
        elif any(keyword in query_lower for keyword in ["budget", "expense", "spending", "cost", "subscription"]):
            response = await self.budget_agent.generate_response(message, context)
        else:
            # General financial query - use the most relevant agent based on user's situation
            response = await self._handle_general_query(message, context)
        
        return response
    
    async def refresh_user_analysis(self, user_id: str) -> Dict[str, Any]:
        """Refresh all agent analysis for a user"""
        
        # Get user's financial data
        financial_data = await self.supabase_client.get_user_financial_data(user_id)
        financial_summary = await self.supabase_client.get_financial_summary(user_id)
        
        context = {
            "financial_summary": financial_summary,
            "user_id": user_id
        }
        
        # Deactivate old insights
        await asyncio.gather(
            self.supabase_client.deactivate_old_insights(user_id, "debt_analyzer"),
            self.supabase_client.deactivate_old_insights(user_id, "savings_strategy"),
            self.supabase_client.deactivate_old_insights(user_id, "budget_optimizer")
        )
        
        # Run fresh analysis
        debt_analysis, savings_analysis, budget_analysis = await asyncio.gather(
            self.debt_agent.analyze({"financial_data": financial_data}, context),
            self.savings_agent.analyze({"financial_data": financial_data}, context),
            self.budget_agent.analyze({"financial_data": financial_data}, context)
        )
        
        # Store new insights
        await self._store_agent_insights(user_id, [debt_analysis, savings_analysis, budget_analysis])
        
        return {
            "debt_insights": len(debt_analysis.get("recommendations", [])),
            "savings_insights": len(savings_analysis.get("recommendations", [])),
            "budget_insights": len(budget_analysis.get("recommendations", []))
        }
    
    async def _store_agent_insights(self, user_id: str, analyses: List[Dict[str, Any]]):
        """Store agent insights in the database"""
        
        for analysis in analyses:
            agent_type = analysis.get("agent_type")
            
            # Store main analysis
            await self.supabase_client.store_agent_insight(
                user_id=user_id,
                agent_type=agent_type,
                insight_type="analysis",
                title=f"{agent_type.replace('_', ' ').title()} Analysis",
                content=analysis.get("analysis", ""),
                recommendations=analysis.get("recommendations", []),
                priority_score=analysis.get("priority_score", 5)
            )
            
            # Store individual recommendations
            for rec in analysis.get("recommendations", []):
                await self.supabase_client.store_agent_insight(
                    user_id=user_id,
                    agent_type=agent_type,
                    insight_type="recommendation",
                    title=rec.get("title", ""),
                    content=rec.get("description", ""),
                    recommendations=[rec],
                    priority_score=8 if rec.get("type") in ["emergency_fund", "debt_prioritization"] else 5
                )
    
    async def _generate_summary(self, debt_analysis: Dict, savings_analysis: Dict, budget_analysis: Dict) -> str:
        """Generate a comprehensive summary of all agent analyses"""
        
        summary_parts = []
        
        # Debt summary
        debt_metrics = debt_analysis.get("metrics", {})
        if debt_metrics.get("total_debt", 0) > 0:
            summary_parts.append(f"Debt Analysis: ${debt_metrics.get('total_debt', 0):,.0f} total debt with {debt_metrics.get('debt_to_income_ratio', 0):.1f}% debt-to-income ratio")
        
        # Savings summary
        savings_metrics = savings_analysis.get("metrics", {})
        summary_parts.append(f"Savings Analysis: {savings_metrics.get('savings_rate', 0):.1f}% savings rate, ${savings_metrics.get('total_savings', 0):,.0f} current savings")
        
        # Budget summary
        budget_metrics = budget_analysis.get("metrics", {})
        summary_parts.append(f"Budget Analysis: {budget_metrics.get('expense_ratio', 0):.1f}% expense ratio, largest category: {budget_metrics.get('largest_expense_category', 'N/A')}")
        
        return " | ".join(summary_parts)
    
    async def _handle_general_query(self, message: str, context: Dict[str, Any]) -> str:
        """Handle general financial queries by selecting the most appropriate agent"""
        
        # Analyze user's financial situation to determine priority
        financial_summary = context.get("financial_summary", {})
        
        total_debt = financial_summary.get("total_debt", 0)
        savings_rate = context.get("savings_rate", 0)
        
        # If high debt, prioritize debt agent
        if total_debt > 10000:
            return await self.debt_agent.generate_response(message, context)
        # If low savings rate, prioritize savings agent
        elif savings_rate < 15:
            return await self.savings_agent.generate_response(message, context)
        # Otherwise, use budget agent
        else:
            return await self.budget_agent.generate_response(message, context)