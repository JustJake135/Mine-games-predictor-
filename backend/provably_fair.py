import hashlib
import hmac
import secrets
import json
from typing import List, Tuple
from models import ProvablyFairVerification

class ProvablyFairSystem:
    """Cryptographic provably fair system for Mines game verification"""
    
    def __init__(self):
        self.grid_size = 25
    
    def generate_server_seed(self) -> str:
        """Generate cryptographically secure server seed"""
        return secrets.token_hex(32)  # 64 character hex string
    
    def generate_client_seed(self) -> str:
        """Generate default client seed (user can override)"""
        return secrets.token_hex(16)  # 32 character hex string
    
    def create_seed_hash(self, server_seed: str) -> str:
        """Create SHA-256 hash of server seed for pre-commitment"""
        return hashlib.sha256(server_seed.encode()).hexdigest()
    
    def generate_game_result(self, server_seed: str, client_seed: str, nonce: int, mine_count: int) -> List[int]:
        """Generate mine positions using HMAC-SHA256"""
        # Combine seeds and nonce
        message = f"{client_seed}:{nonce}"
        
        # Generate HMAC
        hmac_result = hmac.new(
            server_seed.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Convert hex to bytes and use for random generation
        random_bytes = bytes.fromhex(hmac_result)
        
        # Use Fisher-Yates shuffle algorithm with the random bytes
        positions = list(range(self.grid_size))
        mine_positions = []
        
        byte_index = 0
        for i in range(mine_count):
            if byte_index >= len(random_bytes):
                # If we run out of bytes, generate more
                message = f"{client_seed}:{nonce}:{i}"
                hmac_result = hmac.new(
                    server_seed.encode(),
                    message.encode(),
                    hashlib.sha256
                ).hexdigest()
                random_bytes = bytes.fromhex(hmac_result)
                byte_index = 0
            
            # Use bytes to select position
            available_positions = [pos for pos in positions if pos not in mine_positions]
            if not available_positions:
                break
                
            # Generate index from bytes
            random_value = 0
            bytes_needed = min(4, len(random_bytes) - byte_index)  # Use up to 4 bytes
            for j in range(bytes_needed):
                random_value = (random_value << 8) | random_bytes[byte_index + j]
            byte_index += bytes_needed
            
            selected_index = random_value % len(available_positions)
            mine_positions.append(available_positions[selected_index])
        
        return sorted(mine_positions)
    
    def verify_game_result(self, verification: ProvablyFairVerification) -> ProvablyFairVerification:
        """Verify that a game result is provably fair"""
        try:
            # Generate expected result
            expected_positions = self.generate_game_result(
                verification.server_seed,
                verification.client_seed,
                verification.nonce,
                len(verification.game_result)
            )
            
            # Create verification hash
            verification_data = {
                'server_seed': verification.server_seed,
                'client_seed': verification.client_seed,
                'nonce': verification.nonce,
                'mine_positions': expected_positions
            }
            verification_hash = hashlib.sha256(
                json.dumps(verification_data, sort_keys=True).encode()
            ).hexdigest()
            
            # Check if results match
            is_valid = sorted(verification.game_result) == sorted(expected_positions)
            
            return ProvablyFairVerification(
                server_seed=verification.server_seed,
                client_seed=verification.client_seed,
                nonce=verification.nonce,
                game_result=expected_positions,
                is_valid=is_valid,
                verification_hash=verification_hash
            )
            
        except Exception as e:
            return ProvablyFairVerification(
                server_seed=verification.server_seed,
                client_seed=verification.client_seed,
                nonce=verification.nonce,
                game_result=[],
                is_valid=False,
                verification_hash=""
            )
    
    def create_game_setup(self, client_seed: str = None) -> Dict[str, str]:
        """Create initial game setup with seeds"""
        server_seed = self.generate_server_seed()
        if not client_seed:
            client_seed = self.generate_client_seed()
        
        server_seed_hash = self.create_seed_hash(server_seed)
        
        return {
            'server_seed': server_seed,
            'server_seed_hash': server_seed_hash,
            'client_seed': client_seed
        }
    
    def validate_fairness_parameters(self, server_seed: str, client_seed: str, nonce: int) -> bool:
        """Validate that fairness parameters are properly formatted"""
        try:
            # Check server seed format (should be 64 hex chars)
            if not isinstance(server_seed, str) or len(server_seed) != 64:
                return False
            int(server_seed, 16)  # Validate hex format
            
            # Check client seed format (should be valid string)
            if not isinstance(client_seed, str) or len(client_seed) == 0:
                return False
            
            # Check nonce (should be non-negative integer)
            if not isinstance(nonce, int) or nonce < 0:
                return False
            
            return True
        except (ValueError, TypeError):
            return False