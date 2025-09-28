from typing import Dict, List, Any
from .base_agent import BaseFinancialAgent
import json

class SavingsStrategyAgent(BaseFinancialAgent):
    def __init__(self):
        super().__init__("savings_strategy")
    
    def get_system_prompt(self) -> str:
        return """You are a specialized Savings Strategy Agent for RupAI, an AI Financial Coach. Your expertise is in:

1. Savings Goal Planning & Optimization
2. Investment Strategy Development
3. Emergency Fund Planning
4. Retirement Planning
5. Tax-Advantaged Account Optimization

Your role is to:
- Analyze current savings patterns and rates
- Create personalized savings goals and timelines
- Recommend optimal savings vehicles (high-yield savings, CDs, investments)
- Develop emergency fund strategies
- Plan retirement contributions and asset allocation
- Optimize tax-advantaged accounts (401k, IRA, HSA)
- Balance savings vs debt payoff priorities
- Create automated savings plans

Always provide specific, actionable recommendations with clear timelines, expected returns, and step-by-step implementation plans. Use actual numbers from the user's financial data to make calculations precise and personalized."""
    
    async def analyze(self, financial_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze savings situation and provide recommendations"""
        
        # Extract financial information
        savings_data = [item for item in financial_data.get("financial_data", []) if item.get("data_type") == "savings"]
        income_data = [item for item in financial_data.get("financial_data", []) if item.get("data_type") == "income"]
        expense_data = [item for item in financial_data.get("financial_data", []) if item.get("data_type") == "expense"]
        
        total_savings = sum(saving.get("amount", 0) for saving in savings_data)
        total_income = sum(income.get("amount", 0) for income in income_data)
        total_expenses = sum(expense.get("amount", 0) for expense in expense_data)
        
        monthly_income = total_income / 12
        monthly_expenses = total_expenses / 12
        monthly_surplus = monthly_income - monthly_expenses
        savings_rate = (monthly_surplus / monthly_income * 100) if monthly_income > 0 else 0
        
        # Calculate emergency fund target (3-6 months of expenses)
        emergency_fund_target = monthly_expenses * 6
        emergency_fund_gap = max(0, emergency_fund_target - total_savings)
        
        # Prepare analysis prompt
        analysis_prompt = f"""
        Analyze this savings situation and provide comprehensive recommendations:
        
        Current Savings: ${total_savings:,.2f}
        Monthly Income: ${monthly_income:,.2f}
        Monthly Expenses: ${monthly_expenses:,.2f}
        Monthly Surplus: ${monthly_surplus:,.2f}
        Current Savings Rate: {savings_rate:.1f}%
        
        Emergency Fund Target: ${emergency_fund_target:,.2f}
        Emergency Fund Gap: ${emergency_fund_gap:,.2f}
        
        Savings Breakdown:
        {json.dumps(savings_data, indent=2)}
        
        Provide:
        1. Emergency fund completion strategy
        2. Optimal savings rate recommendations (target 20%)
        3. High-yield savings account recommendations
        4. Investment allocation strategy based on age/goals
        5. Retirement savings optimization (401k, IRA)
        6. Automated savings plan setup
        7. Tax-advantaged account prioritization
        
        Format as structured analysis with specific action items and timelines.
        """
        
        response = await self.generate_response(analysis_prompt, context)
        
        # Generate specific recommendations
        recommendations = await self._generate_recommendations(
            total_savings, monthly_surplus, emergency_fund_gap, savings_rate
        )
        
        return {
            "agent_type": "savings_strategy",
            "analysis": response,
            "recommendations": recommendations,
            "metrics": {
                "total_savings": total_savings,
                "savings_rate": savings_rate,
                "emergency_fund_progress": (total_savings / emergency_fund_target * 100) if emergency_fund_target > 0 else 0,
                "monthly_surplus": monthly_surplus
            },
            "priority_score": self._calculate_savings_priority(savings_rate, emergency_fund_gap)
        }
    
    async def _generate_recommendations(self, total_savings: float, monthly_surplus: float, 
                                      emergency_fund_gap: float, savings_rate: float) -> List[Dict[str, Any]]:
        """Generate specific savings recommendations"""
        recommendations = []
        
        # Emergency fund recommendation
        if emergency_fund_gap > 0:
            months_to_complete = emergency_fund_gap / max(monthly_surplus * 0.5, 100)
            recommendations.append({
                "type": "emergency_fund",
                "title": "Complete Emergency Fund",
                "description": f"Build emergency fund to ${emergency_fund_gap + total_savings:,.0f}",
                "action": f"Save ${min(monthly_surplus * 0.5, emergency_fund_gap / 6):,.0f}/month in high-yield savings",
                "impact": f"Complete in {months_to_complete:.0f} months, providing 6 months expense coverage"
            })
        
        # Savings rate optimization
        if savings_rate < 20:
            target_increase = max(100, monthly_surplus * 0.2)
            recommendations.append({
                "type": "savings_rate",
                "title": "Increase Savings Rate",
                "description": f"Current rate {savings_rate:.1f}% is below recommended 20%",
                "action": f"Increase monthly savings by ${target_increase:.0f} through automated transfers",
                "impact": "Reach recommended 20% savings rate for financial security"
            })
        
        # Investment recommendation
        if total_savings > 10000:  # Has emergency fund
            recommendations.append({
                "type": "investment",
                "title": "Start Investment Portfolio",
                "description": "Begin investing surplus savings for long-term growth",
                "action": "Open investment account and start with 60/40 stock/bond allocation",
                "impact": "Potential 7-10% annual returns vs 2-3% in savings"
            })
        
        # High-yield savings
        recommendations.append({
            "type": "account_optimization",
            "title": "Optimize Savings Accounts",
            "description": "Move savings to high-yield accounts",
            "action": "Research accounts offering 4-5% APY vs traditional 0.1%",
            "impact": f"Earn additional ${total_savings * 0.04:.0f}/year in interest"
        })
        
        return recommendations
    
    def _calculate_savings_priority(self, savings_rate: float, emergency_fund_gap: float) -> int:
        """Calculate priority score based on savings situation"""
        if emergency_fund_gap > 10000:
            return 9  # High priority - no emergency fund
        elif savings_rate < 10:
            return 7  # Medium-high priority - low savings rate
        elif savings_rate < 20:
            return 5  # Medium priority - below recommended rate
        else:
            return 3  # Low priority - good savings habits