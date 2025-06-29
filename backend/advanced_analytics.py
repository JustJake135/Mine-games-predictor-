import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from models import GameSession, UserStatistics
import logging

logger = logging.getLogger(__name__)

class UserBehaviorAnalytics:
    """Advanced user behavior analysis for personalized predictions"""
    
    def __init__(self):
        self.risk_profiles = {
            'conservative': {'max_risk': 0.3, 'preferred_multiplier': 1.5},
            'balanced': {'max_risk': 0.5, 'preferred_multiplier': 2.0},
            'aggressive': {'max_risk': 0.7, 'preferred_multiplier': 3.0}
        }
    
    def analyze_user_behavior(self, game_sessions: List[GameSession]) -> Dict:
        """Analyze user behavior patterns from historical game sessions"""
        if not game_sessions:
            return self._default_behavior_profile()
        
        # Extract behavioral features
        features = {
            'avg_bet_size': np.mean([session.bet_amount for session in game_sessions]),
            'preferred_mine_counts': self._analyze_mine_preferences(game_sessions),
            'risk_tolerance': self._calculate_risk_tolerance(game_sessions),
            'timing_patterns': self._analyze_timing_patterns(game_sessions),
            'cash_out_patterns': self._analyze_cash_out_patterns(game_sessions),
            'session_length_preference': self._analyze_session_lengths(game_sessions),
            'win_streak_behavior': self._analyze_streak_behavior(game_sessions),
            'loss_recovery_pattern': self._analyze_loss_recovery(game_sessions)
        }
        
        # Determine risk profile
        risk_profile = self._classify_risk_profile(features)
        
        return {
            'risk_profile': risk_profile,
            'behavioral_features': features,
            'personalized_recommendations': self._generate_personalized_recommendations(features, risk_profile)
        }
    
    def _default_behavior_profile(self) -> Dict:
        """Return default behavior profile for new users"""
        return {
            'risk_profile': 'balanced',
            'behavioral_features': {
                'avg_bet_size': 1.0,
                'preferred_mine_counts': [3, 5],
                'risk_tolerance': 0.5,
                'timing_patterns': {'avg_decision_time': 5.0},
                'cash_out_patterns': {'avg_cash_out_point': 3},
                'session_length_preference': 10,
                'win_streak_behavior': {'continue_probability': 0.6},
                'loss_recovery_pattern': {'bet_increase_factor': 1.1}
            },
            'personalized_recommendations': {
                'recommended_mine_count': 3,
                'recommended_cash_out_point': 3,
                'recommended_bet_size': 1.0
            }
        }
    
    def _analyze_mine_preferences(self, sessions: List[GameSession]) -> List[int]:
        """Analyze preferred mine counts"""
        mine_counts = [session.mine_count for session in sessions]
        # Return top 3 most frequent mine counts
        from collections import Counter
        return [count for count, _ in Counter(mine_counts).most_common(3)]
    
    def _calculate_risk_tolerance(self, sessions: List[GameSession]) -> float:
        """Calculate user's risk tolerance based on behavior"""
        if not sessions:
            return 0.5
        
        # Factors indicating risk tolerance
        high_mine_sessions = sum(1 for s in sessions if s.mine_count >= 10)
        total_sessions = len(sessions)
        high_mine_ratio = high_mine_sessions / total_sessions
        
        # Average tiles revealed before cash-out
        cash_out_sessions = [s for s in sessions if s.status == 'completed']
        if cash_out_sessions:
            avg_tiles_revealed = np.mean([s.tiles_revealed for s in cash_out_sessions])
            risk_from_tiles = min(avg_tiles_revealed / 15, 1.0)  # Normalize to 0-1
        else:
            risk_from_tiles = 0.5
        
        # Combine factors
        risk_tolerance = (high_mine_ratio * 0.4) + (risk_from_tiles * 0.6)
        return min(max(risk_tolerance, 0.1), 0.9)  # Clamp between 0.1 and 0.9
    
    def _analyze_timing_patterns(self, sessions: List[GameSession]) -> Dict:
        """Analyze timing patterns in user behavior"""
        # For now, return default timing patterns
        # In a real implementation, this would analyze time between moves
        return {
            'avg_decision_time': 5.0,
            'quick_decision_threshold': 2.0,
            'slow_decision_threshold': 10.0
        }
    
    def _analyze_cash_out_patterns(self, sessions: List[GameSession]) -> Dict:
        """Analyze cash-out behavior patterns"""
        cash_out_sessions = [s for s in sessions if s.status == 'completed' and s.tiles_revealed > 0]
        
        if not cash_out_sessions:
            return {'avg_cash_out_point': 3, 'cash_out_variance': 1.0}
        
        cash_out_points = [s.tiles_revealed for s in cash_out_sessions]
        return {
            'avg_cash_out_point': np.mean(cash_out_points),
            'cash_out_variance': np.var(cash_out_points),
            'early_cash_out_tendency': sum(1 for p in cash_out_points if p <= 2) / len(cash_out_points)
        }
    
    def _analyze_session_lengths(self, sessions: List[GameSession]) -> float:
        """Analyze preferred session length (number of games)"""
        # For now, return a default value
        # In a real implementation, this would group sessions by time periods
        return len(sessions) / max(1, len(set(s.created_at.date() for s in sessions)))
    
    def _analyze_streak_behavior(self, sessions: List[GameSession]) -> Dict:
        """Analyze behavior during winning/losing streaks"""
        # Simplified streak analysis
        winning_sessions = [s for s in sessions if s.status == 'completed']
        losing_sessions = [s for s in sessions if s.status == 'lost']
        
        return {
            'continue_probability': len(winning_sessions) / max(1, len(sessions)),
            'win_streak_aggression': 0.6,  # Default value
            'loss_streak_caution': 0.7     # Default value
        }
    
    def _analyze_loss_recovery(self, sessions: List[GameSession]) -> Dict:
        """Analyze loss recovery patterns"""
        return {
            'bet_increase_factor': 1.1,  # Default martingale-like behavior
            'recovery_strategy': 'gradual'  # conservative, gradual, aggressive
        }
    
    def _classify_risk_profile(self, features: Dict) -> str:
        """Classify user into risk profile categories"""
        risk_tolerance = features['risk_tolerance']
        
        if risk_tolerance < 0.4:
            return 'conservative'
        elif risk_tolerance > 0.6:
            return 'aggressive'
        else:
            return 'balanced'
    
    def _generate_personalized_recommendations(self, features: Dict, risk_profile: str) -> Dict:
        """Generate personalized recommendations based on behavior analysis"""
        profile_settings = self.risk_profiles[risk_profile]
        
        # Recommend mine count based on risk profile and preferences
        preferred_mines = features['preferred_mine_counts']
        if preferred_mines:
            recommended_mine_count = preferred_mines[0]
        else:
            mine_recommendations = {'conservative': 3, 'balanced': 5, 'aggressive': 8}
            recommended_mine_count = mine_recommendations[risk_profile]
        
        # Recommend cash-out point
        cash_out_patterns = features['cash_out_patterns']
        base_cash_out = cash_out_patterns.get('avg_cash_out_point', 3)
        
        # Adjust based on risk profile
        risk_adjustments = {'conservative': 0.8, 'balanced': 1.0, 'aggressive': 1.3}
        recommended_cash_out = int(base_cash_out * risk_adjustments[risk_profile])
        
        return {
            'recommended_mine_count': recommended_mine_count,
            'recommended_cash_out_point': max(1, recommended_cash_out),
            'recommended_bet_size': features['avg_bet_size'],
            'max_recommended_risk': profile_settings['max_risk'],
            'target_multiplier': profile_settings['preferred_multiplier']
        }


class EnsemblePredictionSystem:
    """Ensemble system combining multiple prediction methods"""
    
    def __init__(self, prob_engine, monte_carlo_engine, behavior_analytics):
        self.prob_engine = prob_engine
        self.monte_carlo_engine = monte_carlo_engine
        self.behavior_analytics = behavior_analytics
        
        # Ensemble weights (can be tuned based on performance)
        self.weights = {
            'mathematical': 0.4,
            'simulation': 0.3,
            'behavioral': 0.2,
            'historical': 0.1
        }
    
    def get_ensemble_prediction(self, game_session: GameSession, user_history: List[GameSession] = None) -> Dict:
        """Generate ensemble prediction combining multiple methods"""
        
        predictions = {}
        
        # 1. Mathematical Engine Prediction
        try:
            math_analysis = self.prob_engine.analyze_game_state(game_session)
            math_recommendation = self.prob_engine.generate_strategy_recommendation(game_session)
            
            predictions['mathematical'] = {
                'action': math_recommendation.action,
                'confidence': math_recommendation.confidence,
                'expected_value': math_analysis.expected_value,
                'risk_level': math_analysis.risk_level
            }
        except Exception as e:
            logger.error(f"Mathematical prediction failed: {e}")
            predictions['mathematical'] = self._default_prediction()
        
        # 2. Simulation-Based Prediction
        try:
            # Quick simulation for current state
            quick_sim_result = self._quick_simulation_analysis(game_session)
            predictions['simulation'] = quick_sim_result
        except Exception as e:
            logger.error(f"Simulation prediction failed: {e}")
            predictions['simulation'] = self._default_prediction()
        
        # 3. Behavioral Prediction
        if user_history:
            try:
                behavior_analysis = self.behavior_analytics.analyze_user_behavior(user_history)
                behavioral_pred = self._behavioral_prediction(game_session, behavior_analysis)
                predictions['behavioral'] = behavioral_pred
            except Exception as e:
                logger.error(f"Behavioral prediction failed: {e}")
                predictions['behavioral'] = self._default_prediction()
        else:
            predictions['behavioral'] = self._default_prediction()
        
        # 4. Historical Pattern Prediction
        predictions['historical'] = self._historical_pattern_prediction(game_session)
        
        # Combine predictions using ensemble weights
        ensemble_result = self._combine_predictions(predictions)
        
        return {
            'ensemble_prediction': ensemble_result,
            'individual_predictions': predictions,
            'prediction_weights': self.weights,
            'confidence_score': self._calculate_ensemble_confidence(predictions)
        }
    
    def _quick_simulation_analysis(self, game_session: GameSession) -> Dict:
        """Run quick simulation analysis for current game state"""
        mines_remaining = game_session.mine_count
        tiles_revealed = game_session.tiles_revealed
        safe_tiles_remaining = (25 - game_session.mine_count) - tiles_revealed
        
        if safe_tiles_remaining <= 0:
            return {
                'action': 'cash_out',
                'confidence': 1.0,
                'expected_value': game_session.bet_amount * game_session.current_multiplier,
                'risk_level': 'Low'
            }
        
        # Simulate next few moves
        continue_ev = self._simulate_continue_scenario(game_session)
        cash_out_value = game_session.bet_amount * game_session.current_multiplier
        
        if continue_ev > cash_out_value * 1.1:  # 10% threshold
            return {
                'action': 'continue',
                'confidence': 0.7,
                'expected_value': continue_ev,
                'risk_level': 'Medium'
            }
        else:
            return {
                'action': 'cash_out',
                'confidence': 0.8,
                'expected_value': cash_out_value,
                'risk_level': 'Low'
            }
    
    def _simulate_continue_scenario(self, game_session: GameSession) -> float:
        """Simulate the expected value of continuing"""
        mines_remaining = game_session.mine_count
        tiles_remaining = 25 - game_session.tiles_revealed
        safe_tiles_remaining = tiles_remaining - mines_remaining
        
        if safe_tiles_remaining <= 0 or tiles_remaining <= 0:
            return 0.0
        
        safe_prob = safe_tiles_remaining / tiles_remaining
        next_multiplier = self.prob_engine.calculate_multiplier(
            game_session.mine_count, 
            game_session.tiles_revealed + 1
        )
        
        continue_value = safe_prob * game_session.bet_amount * next_multiplier
        return continue_value
    
    def _behavioral_prediction(self, game_session: GameSession, behavior_analysis: Dict) -> Dict:
        """Generate prediction based on user behavior analysis"""
        behavioral_features = behavior_analysis['behavioral_features']
        recommendations = behavior_analysis['personalized_recommendations']
        
        # Adjust recommendation based on current game state vs. user preferences
        current_tiles = game_session.tiles_revealed
        recommended_cash_out = recommendations['recommended_cash_out_point']
        
        if current_tiles >= recommended_cash_out:
            return {
                'action': 'cash_out',
                'confidence': 0.8,
                'expected_value': game_session.bet_amount * game_session.current_multiplier,
                'risk_level': 'Personalized'
            }
        else:
            risk_tolerance = behavioral_features['risk_tolerance']
            confidence = 0.5 + (risk_tolerance * 0.3)  # Higher risk tolerance = more confident in continuing
            
            return {
                'action': 'continue',
                'confidence': confidence,
                'expected_value': game_session.bet_amount * game_session.current_multiplier * 1.2,
                'risk_level': 'Personalized'
            }
    
    def _historical_pattern_prediction(self, game_session: GameSession) -> Dict:
        """Generate prediction based on historical patterns"""
        # Simplified historical pattern analysis
        # In a real implementation, this would analyze historical game outcomes
        
        tiles_revealed = game_session.tiles_revealed
        
        # Simple heuristic based on common patterns
        if tiles_revealed < 2:
            return {
                'action': 'continue',
                'confidence': 0.6,
                'expected_value': game_session.bet_amount * 1.5,
                'risk_level': 'Historical'
            }
        elif tiles_revealed >= 5:
            return {
                'action': 'cash_out',
                'confidence': 0.7,
                'expected_value': game_session.bet_amount * game_session.current_multiplier,
                'risk_level': 'Historical'
            }
        else:
            return {
                'action': 'continue',
                'confidence': 0.5,
                'expected_value': game_session.bet_amount * game_session.current_multiplier * 1.3,
                'risk_level': 'Historical'
            }
    
    def _default_prediction(self) -> Dict:
        """Return default prediction when specific method fails"""
        return {
            'action': 'cash_out',
            'confidence': 0.5,
            'expected_value': 1.0,
            'risk_level': 'Unknown'
        }
    
    def _combine_predictions(self, predictions: Dict) -> Dict:
        """Combine individual predictions using ensemble weights"""
        
        # Count action votes
        action_votes = {'continue': 0, 'cash_out': 0, 'high_risk': 0}
        weighted_confidence = 0
        weighted_ev = 0
        
        for method, weight in self.weights.items():
            if method in predictions:
                pred = predictions[method]
                action_votes[pred['action']] += weight
                weighted_confidence += pred['confidence'] * weight
                weighted_ev += pred['expected_value'] * weight
        
        # Determine ensemble action
        ensemble_action = max(action_votes, key=action_votes.get)
        
        # Adjust confidence based on agreement
        max_vote = max(action_votes.values())
        agreement_factor = max_vote / sum(self.weights.values())
        final_confidence = weighted_confidence * agreement_factor
        
        return {
            'action': ensemble_action,
            'confidence': min(final_confidence, 1.0),
            'expected_value': weighted_ev,
            'risk_level': 'Ensemble',
            'action_distribution': action_votes,
            'agreement_score': agreement_factor
        }
    
    def _calculate_ensemble_confidence(self, predictions: Dict) -> float:
        """Calculate overall confidence in ensemble prediction"""
        confidences = [pred['confidence'] for pred in predictions.values()]
        
        if not confidences:
            return 0.5
        
        # Calculate weighted average confidence
        weighted_conf = sum(
            predictions[method]['confidence'] * self.weights.get(method, 0)
            for method in predictions.keys()
        )
        
        # Boost confidence if predictions agree
        actions = [pred['action'] for pred in predictions.values()]
        agreement = len(set(actions)) == 1
        
        if agreement:
            weighted_conf *= 1.2
        
        return min(weighted_conf, 1.0)


class AnomalyDetector:
    """Real-time anomaly detection for unusual game patterns"""
    
    def __init__(self):
        self.normal_ranges = {
            'bet_amount': (0.01, 1000.0),
            'mine_count': (1, 24),
            'tiles_revealed': (0, 24),
            'session_duration': (1, 3600),  # seconds
            'decision_time': (0.1, 60.0)    # seconds
        }
    
    def detect_anomalies(self, game_session: GameSession, user_history: List[GameSession] = None) -> Dict:
        """Detect anomalies in current game session"""
        
        anomalies = []
        confidence_adjustments = {}
        
        # 1. Check for unusual bet amounts
        if user_history:
            historical_bets = [s.bet_amount for s in user_history[-10:]]  # Last 10 games
            if historical_bets:
                avg_bet = np.mean(historical_bets)
                bet_std = np.std(historical_bets)
                
                if abs(game_session.bet_amount - avg_bet) > 3 * bet_std:
                    anomalies.append({
                        'type': 'unusual_bet_amount',
                        'severity': 'medium',
                        'description': f'Bet amount {game_session.bet_amount} significantly different from average {avg_bet:.2f}'
                    })
                    confidence_adjustments['bet_anomaly'] = -0.1
        
        # 2. Check for unusual mine count selection
        if user_history:
            mine_counts = [s.mine_count for s in user_history[-20:]]
            if mine_counts:
                from collections import Counter
                common_mines = Counter(mine_counts).most_common(3)
                common_mine_values = [count for count, _ in common_mines]
                
                if game_session.mine_count not in common_mine_values:
                    anomalies.append({
                        'type': 'unusual_mine_count',
                        'severity': 'low',
                        'description': f'Mine count {game_session.mine_count} not in usual selection'
                    })
                    confidence_adjustments['mine_anomaly'] = -0.05
        
        # 3. Check for extreme risk-taking
        risk_ratio = game_session.mine_count / 25
        if risk_ratio > 0.6:  # More than 60% mines
            anomalies.append({
                'type': 'extreme_risk',
                'severity': 'high',
                'description': f'Extremely high mine ratio: {risk_ratio:.2f}'
            })
            confidence_adjustments['extreme_risk'] = -0.2
        
        # 4. Check for rapid successive plays (if timestamps available)
        # This would require session timing data
        
        return {
            'anomalies_detected': len(anomalies) > 0,
            'anomaly_list': anomalies,
            'confidence_adjustments': confidence_adjustments,
            'risk_score': self._calculate_anomaly_risk_score(anomalies),
            'recommendations': self._generate_anomaly_recommendations(anomalies)
        }
    
    def _calculate_anomaly_risk_score(self, anomalies: List[Dict]) -> float:
        """Calculate risk score based on detected anomalies"""
        if not anomalies:
            return 0.0
        
        severity_weights = {'low': 0.1, 'medium': 0.3, 'high': 0.6}
        total_score = sum(severity_weights.get(anomaly['severity'], 0.2) for anomaly in anomalies)
        
        return min(total_score, 1.0)
    
    def _generate_anomaly_recommendations(self, anomalies: List[Dict]) -> List[str]:
        """Generate recommendations based on detected anomalies"""
        recommendations = []
        
        for anomaly in anomalies:
            if anomaly['type'] == 'unusual_bet_amount':
                recommendations.append("Consider returning to your typical bet size for consistency")
            elif anomaly['type'] == 'extreme_risk':
                recommendations.append("High mine count detected - consider lower risk strategy")
            elif anomaly['type'] == 'unusual_mine_count':
                recommendations.append("You've selected an unusual mine count - ensure this aligns with your strategy")
        
        if not recommendations:
            recommendations.append("No unusual patterns detected - playing within normal parameters")
        
        return recommendations