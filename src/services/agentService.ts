const PYTHON_AGENTS_URL = import.meta.env.VITE_PYTHON_AGENTS_URL || 'http://localhost:8000';

export interface DocumentAnalysisRequest {
  documentId: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
  sessionId: string;
}

export interface AgentInsight {
  id: string;
  agent_type: string;
  title: string;
  content: string;
  recommendations: any[];
  priority_score: number;
}

class AgentService {
  private baseUrl: string;

  constructor() {
    // Use HTTP for local development to avoid mixed content issues
    this.baseUrl = import.meta.env.VITE_PYTHON_AGENTS_URL || 'http://localhost:8000';
  }

  async analyzeDocument(documentId: string): Promise<any> {
    console.log('Analyzing document with Python agents at:', PYTHON_AGENTS_URL);
    const response = await fetch(`${PYTHON_AGENTS_URL}/analyze-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document_id: documentId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to analyze document: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async chatWithAgents(userId: string, message: string, sessionId: string): Promise<string> {
    const response = await fetch(`${PYTHON_AGENTS_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        message,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get agent response: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.response;
  }

  async getUserInsights(userId: string): Promise<AgentInsight[]> {
    const response = await fetch(`${PYTHON_AGENTS_URL}/user/${userId}/insights`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get user insights: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.insights;
  }

  async refreshUserAnalysis(userId: string): Promise<any> {
    const response = await fetch(`${PYTHON_AGENTS_URL}/user/${userId}/refresh-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh analysis: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      console.log('Attempting agent health check at:', `${this.baseUrl}/health`);
      
      // Check for mixed content issues
      if (window.location.protocol === 'https:' && this.baseUrl.startsWith('http:')) {
        console.warn('Mixed content detected: HTTPS frontend trying to connect to HTTP backend');
        console.warn('Try accessing the frontend via http://localhost:5173 instead');
      }
      
      // Create timeout controller for better browser compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      
      if (isHealthy) {
        const data = await response.json();
        console.log('Agent health check successful:', data);
      } else {
        console.log('Agent health check failed with status:', response.status);
      }
      
      return isHealthy;
    } catch (error) {
      console.error('Agent health check failed:', error);
      
      // Provide specific guidance for mixed content errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('This might be a mixed content error (HTTPS -> HTTP)');
        console.error('Try accessing your frontend at http://localhost:5173 instead of https://localhost:5173');
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Agent health check timed out');
        } else {
          console.error('Agent health check failed:', error.message);
        }
      } else {
        console.error('Agent health check failed with unknown error:', error);
      }
      return false;
    }
  }
}

export const agentService = new AgentService();