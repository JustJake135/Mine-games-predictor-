import requests
import json
import unittest
import time
import random
import string
from typing import List, Dict, Any

# Get the backend URL from the frontend .env file
import os
from dotenv import load_dotenv
import sys

# Load environment variables from frontend .env
load_dotenv("frontend/.env")
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL")
API_URL = f"{BACKEND_URL}/api"

class MinesPredictorBackendTest(unittest.TestCase):
    """Test suite for the Advanced Mines Predictor backend system"""

    def setUp(self):
        """Setup for each test"""
        self.api_url = API_URL
        # Generate a random client seed for testing
        self.client_seed = ''.join(random.choices(string.ascii_lowercase + string.digits, k=16))
        self.game_session = None

    def test_01_health_check(self):
        """Test the health check endpoint"""
        response = requests.get(f"{self.api_url}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("database", data)
        self.assertIn("engines", data)
        print("✅ Health check endpoint working")

    def test_02_create_game(self):
        """Test game creation endpoint"""
        payload = {
            "mine_count": 3,
            "bet_amount": 1.0,
            "client_seed": self.client_seed
        }
        response = requests.post(f"{self.api_url}/game/create", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["mine_count"], 3)
        self.assertEqual(data["bet_amount"], 1.0)
        self.assertEqual(data["client_seed"], self.client_seed)
        self.assertEqual(data["status"], "active")
        self.assertEqual(len(data["tiles"]), 25)
        
        # Save game session for later tests
        self.game_id = data["id"]
        self.game_session = data
        print(f"✅ Game creation endpoint working - Game ID: {self.game_id}")

    def test_03_get_game(self):
        """Test retrieving a game session"""
        # First create a game if not already created
        if not hasattr(self, 'game_id'):
            self.test_02_create_game()
            
        response = requests.get(f"{self.api_url}/game/{self.game_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.game_id)
        self.assertEqual(data["mine_count"], 3)
        self.assertEqual(data["bet_amount"], 1.0)
        print("✅ Get game endpoint working")

    def test_04_probability_analysis(self):
        """Test probability analysis endpoint"""
        # First create a game if not already created
        if not hasattr(self, 'game_id'):
            self.test_02_create_game()
            
        response = requests.get(f"{self.api_url}/analysis/probability/{self.game_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("safe_probability", data)
        self.assertIn("mine_probability", data)
        self.assertIn("expected_value", data)
        self.assertIn("optimal_cash_out", data)
        self.assertIn("risk_level", data)
        
        # Verify probabilities sum to 1
        self.assertAlmostEqual(data["safe_probability"] + data["mine_probability"], 1.0, places=5)
        print("✅ Probability analysis endpoint working")

    def test_05_strategy_recommendation(self):
        """Test strategy recommendation endpoint"""
        # First create a game if not already created
        if not hasattr(self, 'game_id'):
            self.test_02_create_game()
            
        response = requests.get(f"{self.api_url}/analysis/strategy/{self.game_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("action", data)
        self.assertIn("confidence", data)
        self.assertIn("reasoning", data)
        self.assertIn("risk_assessment", data)
        self.assertIn("expected_value", data)
        self.assertIn("alternative_actions", data)
        
        # Verify action is one of the expected values
        self.assertIn(data["action"], ["continue", "cash_out", "high_risk"])
        print("✅ Strategy recommendation endpoint working")

    def test_06_reveal_tiles(self):
        """Test revealing tiles in a game"""
        # First create a game if not already created
        if not hasattr(self, 'game_id'):
            self.test_02_create_game()
            
        # Reveal tile at position 0
        payload = {
            "revealed_positions": [0]
        }
        response = requests.post(f"{self.api_url}/game/{self.game_id}/reveal", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check if the tile was revealed
        self.assertIn(data["tiles"][0]["status"], ["revealed_safe", "revealed_mine"])
        
        # If we hit a mine, create a new game and try again with a different position
        if data["status"] == "lost":
            print("Hit a mine on first try, creating new game...")
            self.test_02_create_game()
            payload = {
                "revealed_positions": [5]
            }
            response = requests.post(f"{self.api_url}/game/{self.game_id}/reveal", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
        
        # Save updated game session
        self.game_session = data
        print("✅ Reveal tiles endpoint working")

    def test_07_cashout(self):
        """Test cashing out from a game"""
        # First create a game and reveal a tile if not already done
        if not hasattr(self, 'game_id') or not self.game_session or self.game_session["status"] != "active":
            self.test_02_create_game()
            self.test_06_reveal_tiles()
            
        # If game is still active, cash out
        if self.game_session["status"] == "active":
            response = requests.post(f"{self.api_url}/game/{self.game_id}/cashout")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "completed")
            self.assertIsNotNone(data["cash_out_amount"])
            self.assertIsNotNone(data["final_multiplier"])
            print("✅ Cash out endpoint working")
        else:
            print("⚠️ Game not active, skipping cash out test")

    def test_08_monte_carlo_simulation(self):
        """Test Monte Carlo simulation endpoint"""
        payload = {
            "mine_count": 3,
            "iterations": 1000,
            "bet_amount": 1.0
        }
        response = requests.post(f"{self.api_url}/simulation/monte-carlo", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["mine_count"], 3)
        self.assertEqual(data["iterations"], 1000)
        self.assertIn("average_multiplier", data)
        self.assertIn("success_rate", data)
        self.assertIn("variance", data)
        self.assertIn("optimal_cash_out_point", data)
        self.assertIn("expected_profit", data)
        self.assertIn("confidence_interval", data)
        print("✅ Monte Carlo simulation endpoint working")

    def test_09_risk_analysis(self):
        """Test risk analysis endpoint"""
        response = requests.get(f"{self.api_url}/simulation/risk-analysis/3?iterations=1000")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["mine_count"], 3)
        self.assertIn("analysis", data)
        
        # Check if analysis contains data for different cash out points
        analysis = data["analysis"]
        self.assertTrue(len(analysis) > 0)
        
        # Check first cash out point data
        first_point = list(analysis.keys())[0]
        point_data = analysis[first_point]
        self.assertIn("success_rate", point_data)
        self.assertIn("average_multiplier", point_data)
        self.assertIn("average_profit", point_data)
        self.assertIn("volatility", point_data)
        print("✅ Risk analysis endpoint working")

    def test_10_provably_fair_generate_seeds(self):
        """Test generating provably fair seeds"""
        response = requests.get(f"{self.api_url}/provably-fair/generate-seeds")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("server_seed_hash", data)
        self.assertIn("client_seed", data)
        
        # Save for verification test
        self.pf_client_seed = data["client_seed"]
        print("✅ Provably fair seed generation endpoint working")

    def test_11_provably_fair_verification(self):
        """Test provably fair verification"""
        # First create a game to get server and client seeds
        payload = {
            "mine_count": 3,
            "bet_amount": 1.0
        }
        response = requests.post(f"{self.api_url}/game/create", json=payload)
        self.assertEqual(response.status_code, 200)
        game_data = response.json()
        
        # Get the full game to see mine positions (this is a test-only operation)
        game_id = game_data["id"]
        response = requests.get(f"{self.api_url}/game/{game_id}")
        self.assertEqual(response.status_code, 200)
        game_data = response.json()
        
        # Extract mine positions (in a real scenario, these would be revealed after the game)
        mine_positions = []
        for tile in game_data["tiles"]:
            if tile["is_mine"]:
                mine_positions.append(tile["position"])
        
        # Verify using the provably fair endpoint
        verification_payload = {
            "server_seed": game_data["server_seed"],
            "client_seed": game_data["client_seed"],
            "nonce": 0,
            "game_result": mine_positions,
            "is_valid": True,
            "verification_hash": ""
        }
        
        response = requests.post(f"{self.api_url}/provably-fair/verify", json=verification_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_valid"])
        print("✅ Provably fair verification endpoint working")

    def test_12_optimal_stopping_points(self):
        """Test optimal stopping points endpoint"""
        response = requests.get(f"{self.api_url}/stats/optimal-points")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("optimal_stopping_points", data)
        
        # Check if we have data for all mine counts
        stopping_points = data["optimal_stopping_points"]
        self.assertEqual(len(stopping_points), 24)  # 1-24 mines
        print("✅ Optimal stopping points endpoint working")

    def test_13_user_statistics(self):
        """Test user statistics endpoint"""
        # Generate a random user ID for testing
        user_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        
        response = requests.get(f"{self.api_url}/stats/user/{user_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user_id"], user_id)
        self.assertIn("total_games", data)
        self.assertIn("total_wagered", data)
        self.assertIn("total_won", data)
        self.assertIn("net_profit", data)
        self.assertIn("win_rate", data)
        print("✅ User statistics endpoint working")

    def test_14_game_flow(self):
        """Test complete game flow"""
        # 1. Create a new game with 3 mines
        payload = {
            "mine_count": 3,
            "bet_amount": 1.0,
            "client_seed": self.client_seed
        }
        response = requests.post(f"{self.api_url}/game/create", json=payload)
        self.assertEqual(response.status_code, 200)
        game_data = response.json()
        game_id = game_data["id"]
        
        # 2. Get probability analysis for initial state
        response = requests.get(f"{self.api_url}/analysis/probability/{game_id}")
        self.assertEqual(response.status_code, 200)
        initial_prob = response.json()
        
        # 3. Reveal first tile (position 0)
        reveal_payload = {"revealed_positions": [0]}
        response = requests.post(f"{self.api_url}/game/{game_id}/reveal", json=reveal_payload)
        self.assertEqual(response.status_code, 200)
        game_data = response.json()
        
        # If we hit a mine, try a different position
        if game_data["status"] == "lost":
            # Create a new game
            response = requests.post(f"{self.api_url}/game/create", json=payload)
            self.assertEqual(response.status_code, 200)
            game_data = response.json()
            game_id = game_data["id"]
            
            # Try position 5
            reveal_payload = {"revealed_positions": [5]}
            response = requests.post(f"{self.api_url}/game/{game_id}/reveal", json=reveal_payload)
            self.assertEqual(response.status_code, 200)
            game_data = response.json()
        
        # If still active, continue with the game
        if game_data["status"] == "active":
            # 4. Get updated probability analysis
            response = requests.get(f"{self.api_url}/analysis/probability/{game_id}")
            self.assertEqual(response.status_code, 200)
            updated_prob = response.json()
            
            # 5. Get strategy recommendation
            response = requests.get(f"{self.api_url}/analysis/strategy/{game_id}")
            self.assertEqual(response.status_code, 200)
            strategy = response.json()
            
            # 6. Reveal another tile (position 1)
            reveal_payload = {"revealed_positions": [1]}
            response = requests.post(f"{self.api_url}/game/{game_id}/reveal", json=reveal_payload)
            self.assertEqual(response.status_code, 200)
            game_data = response.json()
            
            # 7. If still active, cash out
            if game_data["status"] == "active":
                response = requests.post(f"{self.api_url}/game/{game_id}/cashout")
                self.assertEqual(response.status_code, 200)
                final_data = response.json()
                self.assertEqual(final_data["status"], "completed")
                print("✅ Complete game flow test successful")
            else:
                print("⚠️ Hit a mine during game flow test, but API handled it correctly")
        else:
            print("⚠️ Hit a mine during game flow test, but API handled it correctly")

    def test_15_edge_cases(self):
        """Test edge cases and error handling"""
        # Test invalid mine count (too high)
        payload = {
            "mine_count": 25,  # Invalid: max is 24
            "bet_amount": 1.0
        }
        response = requests.post(f"{self.api_url}/game/create", json=payload)
        self.assertNotEqual(response.status_code, 200)
        
        # Test invalid mine count (too low)
        payload = {
            "mine_count": 0,  # Invalid: min is 1
            "bet_amount": 1.0
        }
        response = requests.post(f"{self.api_url}/game/create", json=payload)
        self.assertNotEqual(response.status_code, 200)
        
        # Test invalid bet amount
        payload = {
            "mine_count": 3,
            "bet_amount": -1.0  # Invalid: must be positive
        }
        response = requests.post(f"{self.api_url}/game/create", json=payload)
        self.assertNotEqual(response.status_code, 200)
        
        # Test non-existent game ID
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{self.api_url}/game/{fake_id}")
        self.assertEqual(response.status_code, 404)
        
        # Test invalid tile position
        if hasattr(self, 'game_id'):
            payload = {
                "revealed_positions": [25]  # Invalid: max is 24
            }
            response = requests.post(f"{self.api_url}/game/{self.game_id}/reveal", json=payload)
            self.assertNotEqual(response.status_code, 200)
        
        print("✅ Edge cases and error handling working correctly")


if __name__ == "__main__":
    # Run the tests
    print(f"Testing backend API at: {API_URL}")
    unittest.main(argv=['first-arg-is-ignored'], exit=False)