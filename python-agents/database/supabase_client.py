import os
from supabase import create_client, Client
from typing import List, Dict, Any, Optional
import json

class SupabaseClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.client: Client = create_client(self.url, self.key)
    
    async def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all chunks for a document"""
        response = self.client.table("document_chunks").select("*").eq("document_id", document_id).execute()
        return response.data
    
    async def get_user_financial_data(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all financial data for a user"""
        response = self.client.table("financial_data").select("*").eq("user_id", user_id).execute()
        return response.data
    
    async def get_financial_summary(self, user_id: str) -> Dict[str, Any]:
        """Get financial summary using the database function"""
        response = self.client.rpc("get_user_financial_summary", {"user_id": user_id}).execute()
        return response.data if response.data else {}
    
    async def store_agent_insight(self, user_id: str, agent_type: str, insight_type: str, 
                                title: str, content: str, recommendations: List[Dict], 
                                priority_score: int = 5) -> str:
        """Store an agent insight"""
        data = {
            "user_id": user_id,
            "agent_type": agent_type,
            "insight_type": insight_type,
            "title": title,
            "content": content,
            "recommendations": recommendations,
            "priority_score": priority_score
        }
        response = self.client.table("agent_insights").insert(data).execute()
        return response.data[0]["id"] if response.data else None
    
    async def get_user_insights(self, user_id: str, agent_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get insights for a user, optionally filtered by agent type"""
        query = self.client.table("agent_insights").select("*").eq("user_id", user_id).eq("is_active", True)
        if agent_type:
            query = query.eq("agent_type", agent_type)
        response = query.order("created_at", desc=True).execute()
        return response.data
    
    async def deactivate_old_insights(self, user_id: str, agent_type: str):
        """Deactivate old insights for a specific agent type"""
        self.client.table("agent_insights").update({"is_active": False}).eq("user_id", user_id).eq("agent_type", agent_type).execute()
    
    async def search_similar_chunks(self, user_id: str, query_embedding: List[float], 
                                  threshold: float = 0.7, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar document chunks using vector similarity"""
        response = self.client.rpc("match_document_chunks", {
            "query_embedding": query_embedding,
            "match_threshold": threshold,
            "match_count": limit,
            "user_id": user_id
        }).execute()
        return response.data if response.data else []
    
    async def get_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all documents for a user"""
        response = self.client.table("financial_documents").select("*").eq("user_id", user_id).execute()
        return response.data
    
    async def update_document_status(self, document_id: str, status: str, metadata: Dict = None):
        """Update document processing status"""
        update_data = {"upload_status": status}
        if metadata:
            update_data["processing_metadata"] = metadata
        self.client.table("financial_documents").update(update_data).eq("id", document_id).execute()