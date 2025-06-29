import math
import random
from typing import List, Tuple, Dict
from .models import GameSession, ProbabilityAnalysis, StrategyRecommendation

class MinesProbabilityEngine:
    """Advanced probability calculation engine for Mines game analysis"""
    
    def __init__(self):
        self.grid_size = 25  # 5x5 grid
        
    def calculate_safe_probability(self, mines_remaining: int, tiles_remaining: int) -> float:
        """Calculate probability of next tile being safe"""
        if tiles_remaining <= 0:
            return 0.0
        safe_tiles = tiles_remaining - mines_remaining
        return max(0.0, safe_tiles / tiles_remaining)
    
    def calculate_mine_probability(self, mines_remaining: int, tiles_remaining: int) -> float:
        """Calculate probability of next tile being a mine"""
        if tiles_remaining <= 0:
            return 0.0
        return min(1.0, mines_remaining / tiles_remaining)
    
    def calculate_multiplier(self, mines: int, tiles_revealed: int) -> float:
        """Calculate current multiplier based on mines and tiles revealed"""
        if tiles_revealed == 0:
            return 1.0
        
        # Simplified multiplier calculation - in reality this would match Rainbet's exact formula
        safe_tiles_total = self.grid_size - mines
        multiplier = 1.0
        
        for i in range(tiles_revealed):
            remaining_safe = safe_tiles_total - i
            remaining_total = self.grid_size - i
            if remaining_total > 0:
                risk_factor = remaining_total / remaining_safe
                multiplier *= risk_factor * 0.95  # House edge factor
        
        return round(multiplier, 4)
    
    def calculate_expected_value(self, game_session: GameSession, next_multiplier: float) -> float:
        """Calculate expected value of revealing another tile"""
        mines_remaining = game_session.mine_count
        tiles_remaining = self.grid_size - game_session.tiles_revealed
        safe_tiles_remaining = tiles_remaining - mines_remaining
        
        if tiles_remaining <= 0 or safe_tiles_remaining <= 0:
            return 0.0
        
        safe_prob = safe_tiles_remaining / tiles_remaining
        mine_prob = mines_remaining / tiles_remaining
        
        # Expected value = (probability of success * reward) - (probability of failure * loss)
        success_reward = game_session.bet_amount * next_multiplier
        failure_loss = game_session.bet_amount * game_session.current_multiplier
        
        expected_value = (safe_prob * success_reward) - (mine_prob * failure_loss)
        return round(expected_value, 4)
    
    def analyze_game_state(self, game_session: GameSession) -> ProbabilityAnalysis:
        """Comprehensive analysis of current game state"""
        mines_remaining = game_session.mine_count
        tiles_remaining = self.grid_size - game_session.tiles_revealed
        safe_tiles_remaining = tiles_remaining - mines_remaining
        
        safe_prob = self.calculate_safe_probability(mines_remaining, tiles_remaining)
        mine_prob = self.calculate_mine_probability(mines_remaining, tiles_remaining)
        
        next_multiplier = self.calculate_multiplier(game_session.mine_count, game_session.tiles_revealed + 1)
        expected_value = self.calculate_expected_value(game_session, next_multiplier)
        
        # Determine risk level
        if mine_prob <= 0.2:
            risk_level = "Low"
        elif mine_prob <= 0.5:
            risk_level = "Medium" 
        else:
            risk_level = "High"
        
        # Simple optimal cash out logic (can be enhanced)
        current_value = game_session.bet_amount * game_session.current_multiplier
        optimal_cash_out = expected_value < current_value or mine_prob > 0.6
        
        return ProbabilityAnalysis(
            safe_probability=safe_prob,
            mine_probability=mine_prob,
            expected_value=expected_value,
            optimal_cash_out=optimal_cash_out,
            risk_level=risk_level
        )
    
    def generate_strategy_recommendation(self, game_session: GameSession) -> StrategyRecommendation:
        """Generate AI-powered strategy recommendation"""
        analysis = self.analyze_game_state(game_session)
        
        mines_remaining = game_session.mine_count
        tiles_remaining = self.grid_size - game_session.tiles_revealed
        
        # Advanced recommendation logic
        if analysis.mine_probability > 0.7:
            action = "cash_out"
            confidence = 0.9
            reasoning = f"High mine probability ({analysis.mine_probability:.2%}). Recommended to secure current winnings."
        elif analysis.expected_value > game_session.bet_amount * game_session.current_multiplier * 0.1:
            action = "continue"
            confidence = min(0.8, analysis.safe_probability)
            reasoning = f"Positive expected value. Safe probability: {analysis.safe_probability:.2%}"
        elif game_session.current_multiplier > 2.0 and analysis.mine_probability > 0.4:
            action = "cash_out"
            confidence = 0.7
            reasoning = f"Good multiplier achieved ({game_session.current_multiplier:.2f}x) with moderate risk."
        else:
            action = "continue"
            confidence = analysis.safe_probability
            reasoning = f"Continue with caution. Monitor risk levels."
        
        # Alternative actions
        alternatives = []
        if action == "continue":
            alternatives.append({
                "action": "cash_out",
                "expected_value": game_session.bet_amount * game_session.current_multiplier,
                "reasoning": "Secure current winnings"
            })
        else:
            alternatives.append({
                "action": "continue",
                "expected_value": analysis.expected_value,
                "reasoning": f"Risk one more tile for {analysis.safe_probability:.2%} chance of success"
            })
        
        return StrategyRecommendation(
            action=action,
            confidence=confidence,
            reasoning=reasoning,
            risk_assessment=analysis.risk_level,
            expected_value=analysis.expected_value,
            alternative_actions=alternatives
        )
    
    def calculate_optimal_stopping_point(self, mine_count: int, bet_amount: float = 1.0) -> int:
        """Calculate theoretical optimal stopping point using dynamic programming"""
        safe_tiles_total = self.grid_size - mine_count
        
        # Dynamic programming approach for optimal stopping
        max_expected_value = 0
        optimal_point = 0
        
        for tiles_revealed in range(safe_tiles_total):
            current_multiplier = self.calculate_multiplier(mine_count, tiles_revealed)
            current_value = bet_amount * current_multiplier
            
            # Expected value of continuing
            if tiles_revealed < safe_tiles_total:
                next_multiplier = self.calculate_multiplier(mine_count, tiles_revealed + 1)
                tiles_remaining = self.grid_size - tiles_revealed
                mines_remaining = mine_count
                safe_prob = (tiles_remaining - mines_remaining) / tiles_remaining
                
                continue_ev = safe_prob * bet_amount * next_multiplier
                
                if continue_ev > current_value and current_value > max_expected_value:
                    max_expected_value = current_value
                    optimal_point = tiles_revealed
            else:
                if current_value > max_expected_value:
                    max_expected_value = current_value
                    optimal_point = tiles_revealed
        
        return optimal_point