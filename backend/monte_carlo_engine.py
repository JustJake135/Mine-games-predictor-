import random
import statistics
import math
from typing import List, Dict, Tuple
from models import MonteCarloResult, MonteCarloRequest
from probability_engine import MinesProbabilityEngine

class MonteCarloSimulationEngine:
    """Advanced Monte Carlo simulation engine for Mines game strategy optimization"""
    
    def __init__(self):
        self.prob_engine = MinesProbabilityEngine()
        self.grid_size = 25
    
    def simulate_single_game(self, mine_count: int, cash_out_point: int) -> Tuple[float, bool]:
        """Simulate a single game with specified parameters"""
        # Generate mine positions
        mine_positions = set(random.sample(range(self.grid_size), mine_count))
        
        # Simulate revealing tiles
        revealed_positions = set()
        multiplier = 1.0
        
        for reveal_count in range(cash_out_point):
            # Choose random unrevealed position
            available_positions = [i for i in range(self.grid_size) if i not in revealed_positions]
            if not available_positions:
                break
                
            position = random.choice(available_positions)
            revealed_positions.add(position)
            
            # Check if hit mine
            if position in mine_positions:
                return 0.0, False  # Lost the game
            
            # Update multiplier
            multiplier = self.prob_engine.calculate_multiplier(mine_count, len(revealed_positions))
        
        return multiplier, True  # Successfully cashed out
    
    def run_monte_carlo_simulation(self, request: MonteCarloRequest) -> MonteCarloResult:
        """Run comprehensive Monte Carlo simulation"""
        results = []
        successes = 0
        
        # Determine cash out points to test
        if request.cash_out_points:
            cash_out_points = request.cash_out_points
        else:
            max_safe_tiles = self.grid_size - request.mine_count
            cash_out_points = list(range(1, min(max_safe_tiles + 1, 15)))  # Test up to 14 tiles
        
        best_point = 1
        best_expected_value = 0
        point_results = {}
        
        # Test each cash out point
        for cash_out_point in cash_out_points:
            point_multipliers = []
            point_successes = 0
            
            for _ in range(request.iterations):
                multiplier, success = self.simulate_single_game(request.mine_count, cash_out_point)
                point_multipliers.append(multiplier)
                if success:
                    point_successes += 1
            
            success_rate = point_successes / request.iterations
            average_multiplier = statistics.mean(point_multipliers)
            expected_value = success_rate * average_multiplier * request.bet_amount
            
            point_results[cash_out_point] = {
                'success_rate': success_rate,
                'average_multiplier': average_multiplier,
                'expected_value': expected_value,
                'variance': statistics.variance(point_multipliers) if len(point_multipliers) > 1 else 0,
                'multipliers': point_multipliers
            }
            
            if expected_value > best_expected_value:
                best_expected_value = expected_value
                best_point = cash_out_point
        
        # Get results for optimal point
        optimal_results = point_results[best_point]
        
        # Calculate confidence interval
        multipliers = optimal_results['multipliers']
        if len(multipliers) > 1:
            std_error = statistics.stdev(multipliers) / math.sqrt(len(multipliers))
            confidence_interval = {
                'lower': max(0, statistics.mean(multipliers) - 1.96 * std_error),
                'upper': statistics.mean(multipliers) + 1.96 * std_error
            }
        else:
            confidence_interval = {'lower': 0, 'upper': 0}
        
        return MonteCarloResult(
            mine_count=request.mine_count,
            iterations=request.iterations,
            average_multiplier=optimal_results['average_multiplier'],
            success_rate=optimal_results['success_rate'],
            variance=optimal_results['variance'],
            optimal_cash_out_point=best_point,
            expected_profit=(best_expected_value - request.bet_amount),
            confidence_interval=confidence_interval
        )
    
    def analyze_risk_reward_profile(self, mine_count: int, iterations: int = 10000) -> Dict:
        """Comprehensive risk-reward analysis across different strategies"""
        max_safe_tiles = self.grid_size - mine_count
        results = {}
        
        for cash_out_point in range(1, min(max_safe_tiles + 1, 16)):
            multipliers = []
            profits = []
            
            for _ in range(iterations):
                multiplier, success = self.simulate_single_game(mine_count, cash_out_point)
                multipliers.append(multiplier)
                profit = multiplier - 1.0 if success else -1.0  # Assuming bet of 1
                profits.append(profit)
            
            success_rate = sum(1 for m in multipliers if m > 0) / iterations
            avg_multiplier = statistics.mean(multipliers)
            avg_profit = statistics.mean(profits)
            volatility = statistics.stdev(profits) if len(profits) > 1 else 0
            
            # Risk metrics
            downside_risk = statistics.stdev([p for p in profits if p < 0]) if any(p < 0 for p in profits) else 0
            max_drawdown = min(profits) if profits else 0
            
            # Sharpe-like ratio (profit to volatility)
            risk_adjusted_return = avg_profit / volatility if volatility > 0 else 0
            
            results[cash_out_point] = {
                'success_rate': success_rate,
                'average_multiplier': avg_multiplier,
                'average_profit': avg_profit,
                'volatility': volatility,
                'downside_risk': downside_risk,
                'max_drawdown': max_drawdown,
                'risk_adjusted_return': risk_adjusted_return,
                'expected_value': success_rate * avg_multiplier
            }
        
        return results
    
    def simulate_bankroll_management(self, mine_count: int, cash_out_point: int, 
                                   initial_bankroll: float, bet_size: float, 
                                   num_games: int = 1000) -> Dict:
        """Simulate bankroll management over multiple games"""
        bankroll = initial_bankroll
        bankroll_history = [bankroll]
        wins = 0
        losses = 0
        
        for game in range(num_games):
            if bankroll < bet_size:
                break  # Bankrupt
            
            multiplier, success = self.simulate_single_game(mine_count, cash_out_point)
            
            if success:
                profit = bet_size * (multiplier - 1)
                bankroll += profit
                wins += 1
            else:
                bankroll -= bet_size
                losses += 1
            
            bankroll_history.append(bankroll)
        
        return {
            'final_bankroll': bankroll,
            'total_games_played': len(bankroll_history) - 1,
            'wins': wins,
            'losses': losses,
            'win_rate': wins / (wins + losses) if (wins + losses) > 0 else 0,
            'max_bankroll': max(bankroll_history),
            'min_bankroll': min(bankroll_history),
            'bankroll_history': bankroll_history[-100:],  # Last 100 games only
            'went_bankrupt': bankroll < bet_size
        }