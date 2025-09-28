from abc import ABC, abstractmethod
from typing import Dict, List, Any
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import os

class BaseFinancialAgent(ABC):
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.llm = ChatOpenAI(
            model="anthropic/claude-3.5-sonnet",
            openai_api_key=os.getenv("OPENROUTER_API_KEY"),
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0.1
        )
    
    @abstractmethod
    async def analyze(self, financial_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze financial data and return insights"""
        pass
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        pass
    
    async def generate_response(self, user_input: str, context: Dict[str, Any]) -> str:
        """Generate a response to user input with context"""
        system_prompt = self.get_system_prompt()
        context_str = self._format_context(context)
        
        messages = [
            SystemMessage(content=f"{system_prompt}\n\nContext:\n{context_str}"),
            HumanMessage(content=user_input)
        ]
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format context data for the LLM"""
        formatted = []
        
        if "financial_summary" in context:
            formatted.append(f"Financial Summary: {context['financial_summary']}")
        
        if "recent_insights" in context:
            formatted.append(f"Recent Insights: {context['recent_insights']}")
        
        if "document_chunks" in context:
            formatted.append(f"Relevant Document Content: {context['document_chunks']}")
        
        return "\n\n".join(formatted)
    
    def _calculate_priority_score(self, analysis: Dict[str, Any]) -> int:
        """Calculate priority score for insights (1-10, 10 being highest priority)"""
        # Base implementation - can be overridden by specific agents
        return 5