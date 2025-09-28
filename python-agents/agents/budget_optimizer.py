from typing import Dict, List, Any
from .base_agent import BaseFinancialAgent
import json

class BudgetOptimizerAgent(BaseFinancialAgent):
    def __init__(self):
        super().__init__("budget_optimizer")
    
    def get_system_prompt(self) -> str:
        return """You are a specialized Budget Optimization Agent for RupAI, an AI Financial Coach. Your expertise is in:

1. Expense Analysis & Categorization
2. Budget Creation & Optimization
3. Spending Pattern Analysis
4. Cost Reduction Strategies
5. Cash Flow Management

Your role is to:
- Analyze spending patterns and identify optimization opportunities
- Create personalized budgets using the 50/30/20 rule or custom allocations
- Identify unnecessary expenses and subscriptions
- Recommend cost-cutting strategies without sacrificing quality of life
- Optimize recurring expenses (insurance, utilities, subscriptions)
- Track spending against budget goals
- Suggest automated budgeting tools and methods
- Balance needs vs wants spending

Always provide specific, actionable recommendations with clear dollar amounts, percentages, and step-by-step implementation plans. Use actual numbers from the user's financial data to make calculations precise and personalized."""
    
    async def analyze(self, financial_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze budget and spending patterns"""
        
        # Extract financial information
        expense_data = [item for item in financial_data.get("financial_data", []) if item.get("data_type") == "expense"]
        income_data = [item for item in financial_data.get("financial_data", []) if item.get("data_type") == "income"]
        
        total_income = sum(income.get("amount", 0) for income in income_data)
        total_expenses = sum(expense.get("amount", 0) for expense in expense_data)
        
        monthly_income = total_income / 12
        monthly_expenses = total_expenses / 12
        
        # Categorize expenses
        expense_categories = {}
        for expense in expense_data:
            category = expense.get("category", "Other")
            expense_categories[category] = expense_categories.get(category, 0) + expense.get("amount", 0)
        
        # Calculate percentages
        expense_percentages = {
            category: (amount / total_income * 100) if total_income > 0 else 0
            for category, amount in expense_categories.items()
        }
        
        # Identify largest expense categories
        sorted_expenses = sorted(expense_categories.items(), key=lambda x: x[1], reverse=True)
        
        # Prepare analysis prompt
        analysis_prompt = f"""
        Analyze this budget and spending patterns, provide optimization recommendations:
        
        Monthly Income: ${monthly_income:,.2f}
        Monthly Expenses: ${monthly_expenses:,.2f}
        Monthly Surplus/Deficit: ${monthly_income - monthly_expenses:,.2f}
        
        Expense Breakdown by Category:
        {json.dumps(expense_percentages, indent=2)}
        
        Top Expense Categories:
        {json.dumps(sorted_expenses[:5], indent=2)}
        
        Provide:
        1. Budget analysis using 50/30/20 rule (needs/wants/savings)
        2. Specific cost reduction opportunities in each category
        3. Subscription and recurring expense audit recommendations
        4. Optimization strategies for largest expense categories
        5. Automated budgeting and tracking recommendations
        6. Cash flow improvement strategies
        7. Emergency expense planning
        
        Format as structured analysis with specific dollar amounts and action items.
        """
        
        response = await self.generate_response(analysis_prompt, context)
        
        # Generate specific recommendations
        recommendations = await self._generate_recommendations(
            expense_categories, monthly_income, monthly_expenses
        )
        
        return {
            "agent_type": "budget_optimizer",
            "analysis": response,
            "recommendations": recommendations,
            "metrics": {
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "expense_ratio": (monthly_expenses / monthly_income * 100) if monthly_income > 0 else 0,
                "largest_expense_category": sorted_expenses[0][0] if sorted_expenses else "None"
            },
            "priority_score": self._calculate_budget_priority(monthly_income, monthly_expenses)
        }
    
    async def _generate_recommendations(self, expense_categories: Dict[str, float], 
                                      monthly_income: float, monthly_expenses: float) -> List[Dict[str, Any]]:
        """Generate specific budget optimization recommendations"""
        recommendations = []
        
        # Housing cost optimization
        housing_expenses = expense_categories.get("Housing", 0) + expense_categories.get("Rent", 0) + expense_categories.get("Mortgage", 0)
        housing_percentage = (housing_expenses / (monthly_income * 12) * 100) if monthly_income > 0 else 0
        
        if housing_percentage > 30:
            potential_savings = (housing_expenses - (monthly_income * 12 * 0.30)) / 12
            recommendations.append({
                "type": "housing_optimization",
                "title": "Reduce Housing Costs",
                "description": f"Housing costs are {housing_percentage:.1f}% of income (recommended: 30%)",
                "action": f"Consider refinancing, roommate, or downsizing to save ${potential_savings:.0f}/month",
                "impact": f"Could free up ${potential_savings * 12:.0f}/year for savings or debt payoff"
            })
        
        # Transportation optimization
        transportation = expense_categories.get("Transportation", 0) + expense_categories.get("Car", 0) + expense_categories.get("Gas", 0)
        if transportation > monthly_income * 12 * 0.15:  # More than 15% of income
            recommendations.append({
                "type": "transportation",
                "title": "Optimize Transportation Costs",
                "description": "Transportation costs are above recommended 15% of income",
                "action": "Review car insurance, consider carpooling, public transit, or more fuel-efficient vehicle",
                "impact": "Potential savings of $100-300/month"
            })
        
        # Subscription audit
        entertainment = expense_categories.get("Entertainment", 0) + expense_categories.get("Subscriptions", 0)
        if entertainment > 0:
            recommendations.append({
                "type": "subscription_audit",
                "title": "Audit Subscriptions and Entertainment",
                "description": f"Currently spending ${entertainment/12:.0f}/month on entertainment/subscriptions",
                "action": "Cancel unused subscriptions, negotiate better rates, bundle services",
                "impact": "Typical savings of $50-150/month from subscription optimization"
            })
        
        # Food and dining optimization
        food_expenses = expense_categories.get("Food", 0) + expense_categories.get("Dining", 0) + expense_categories.get("Groceries", 0)
        if food_expenses > monthly_income * 12 * 0.12:  # More than 12% of income
            recommendations.append({
                "type": "food_optimization",
                "title": "Optimize Food and Dining Expenses",
                "description": "Food expenses are above recommended 10-12% of income",
                "action": "Meal planning, cooking at home, bulk buying, reduce dining out frequency",
                "impact": f"Potential savings of ${(food_expenses - monthly_income * 12 * 0.10) / 12:.0f}/month"
            })
        
        # Emergency budget buffer
        if monthly_expenses >= monthly_income * 0.95:  # Spending more than 95% of income
            recommendations.append({
                "type": "emergency_buffer",
                "title": "Create Budget Buffer",
                "description": "Very tight budget with little room for unexpected expenses",
                "action": "Identify $200-500/month in expense reductions for emergency buffer",
                "impact": "Prevent debt accumulation from unexpected expenses"
            })
        
        return recommendations
    
    def _calculate_budget_priority(self, monthly_income: float, monthly_expenses: float) -> int:
        """Calculate priority score based on budget situation"""
        expense_ratio = (monthly_expenses / monthly_income) if monthly_income > 0 else 1
        
        if expense_ratio >= 1.0:  # Spending more than earning
            return 10  # Critical
        elif expense_ratio >= 0.95:  # Very tight budget
            return 8   # High
        elif expense_ratio >= 0.85:  # Moderate budget pressure
            return 6   # Medium
        elif expense_ratio >= 0.70:  # Reasonable budget
            return 4   # Low
        else:  # Lots of room in budget
            return 2   # Very low