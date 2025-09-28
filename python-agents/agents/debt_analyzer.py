from typing import Dict, List, Any
from .base_agent import BaseFinancialAgent
import json

class DebtAnalyzerAgent(BaseFinancialAgent):
    def __init__(self):
        super().__init__("debt_analyzer")
    
    def get_system_prompt(self) -> str:
        return """You are a specialized Debt Analysis Agent for RupAI, an AI Financial Coach. Your expertise is in:

1. Debt Analysis & Optimization
2. Interest Rate Calculations
3. Payoff Strategy Development
4. Debt Consolidation Assessment
5. Credit Score Impact Analysis

Your role is to:
- Analyze all forms of debt (credit cards, loans, mortgages, etc.)
- Calculate optimal payoff strategies (avalanche vs snowball methods)
- Identify consolidation opportunities
- Assess refinancing options
- Provide actionable debt reduction plans
- Monitor debt-to-income ratios
- Suggest credit score improvement strategies

Always provide specific, actionable recommendations with clear timelines and expected outcomes. Use actual numbers from the user's financial data to make calculations precise and personalized."""
    
    async def analyze(self, financial_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze debt situation and provide recommendations"""
        
        # Extract debt information
        debts = [item for item in financial_data.get("financial_data", []) if item.get("data_type") == "debt"]
        income_data = [item for item in financial_data.get("financial_data", []) if item.get("data_type") == "income"]
        
        total_debt = sum(debt.get("amount", 0) for debt in debts)
        total_income = sum(income.get("amount", 0) for income in income_data)
        
        # Calculate debt-to-income ratio
        debt_to_income = (total_debt / total_income * 100) if total_income > 0 else 0
        
        # Prepare analysis prompt
        analysis_prompt = f"""
        Analyze this debt situation and provide comprehensive recommendations:
        
        Total Debt: ${total_debt:,.2f}
        Total Annual Income: ${total_income:,.2f}
        Debt-to-Income Ratio: {debt_to_income:.1f}%
        
        Individual Debts:
        {json.dumps(debts, indent=2)}
        
        Provide:
        1. Debt prioritization strategy (avalanche vs snowball)
        2. Optimal payoff timeline with specific monthly payments
        3. Potential interest savings with optimization
        4. Consolidation opportunities
        5. Credit score improvement strategies
        6. Emergency fund considerations while paying debt
        
        Format as structured analysis with specific action items.
        """
        
        response = await self.generate_response(analysis_prompt, context)
        
        # Generate specific recommendations
        recommendations = await self._generate_recommendations(debts, total_income)
        
        return {
            "agent_type": "debt_analyzer",
            "analysis": response,
            "recommendations": recommendations,
            "metrics": {
                "total_debt": total_debt,
                "debt_to_income_ratio": debt_to_income,
                "debt_count": len(debts)
            },
            "priority_score": self._calculate_debt_priority(debt_to_income, total_debt)
        }
    
    async def _generate_recommendations(self, debts: List[Dict], total_income: float) -> List[Dict[str, Any]]:
        """Generate specific debt recommendations"""
        recommendations = []
        
        if not debts:
            return recommendations
        
        # Sort debts by interest rate for avalanche method
        sorted_debts = sorted(debts, key=lambda x: x.get("metadata", {}).get("interest_rate", 0), reverse=True)
        
        if sorted_debts:
            highest_interest_debt = sorted_debts[0]
            recommendations.append({
                "type": "debt_prioritization",
                "title": "Focus on Highest Interest Debt First",
                "description": f"Prioritize paying off {highest_interest_debt.get('category', 'debt')} with {highest_interest_debt.get('metadata', {}).get('interest_rate', 'unknown')}% interest rate",
                "action": f"Pay minimum on all debts, then put extra ${min(500, total_income * 0.1 / 12):.0f}/month toward this debt",
                "impact": "Could save thousands in interest payments"
            })
        
        # Debt consolidation recommendation
        if len(debts) > 2:
            recommendations.append({
                "type": "consolidation",
                "title": "Consider Debt Consolidation",
                "description": "Multiple debts could benefit from consolidation",
                "action": "Research personal loans or balance transfer cards with lower rates",
                "impact": "Simplify payments and potentially reduce interest rates"
            })
        
        return recommendations
    
    def _calculate_debt_priority(self, debt_to_income: float, total_debt: float) -> int:
        """Calculate priority score based on debt situation"""
        if debt_to_income > 40:
            return 10  # Critical
        elif debt_to_income > 30:
            return 8   # High
        elif debt_to_income > 20:
            return 6   # Medium
        elif total_debt > 0:
            return 4   # Low
        else:
            return 1   # Minimal