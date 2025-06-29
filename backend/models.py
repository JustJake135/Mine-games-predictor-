from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from enum import Enum

class GameStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    LOST = "lost"

class TileStatus(str, Enum):
    HIDDEN = "hidden"
    REVEALED_SAFE = "revealed_safe"
    REVEALED_MINE = "revealed_mine"

class Tile(BaseModel):
    position: int = Field(..., description="Position on 5x5 grid (0-24)")
    status: TileStatus = TileStatus.HIDDEN
    is_mine: bool = False

class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    mine_count: int = Field(..., ge=1, le=24, description="Number of mines (1-24)")
    bet_amount: float = Field(..., gt=0, description="Initial bet amount")
    current_multiplier: float = Field(default=1.0, description="Current multiplier")
    tiles_revealed: int = Field(default=0, description="Number of safe tiles revealed")
    status: GameStatus = GameStatus.ACTIVE
    tiles: List[Tile] = Field(default_factory=list)
    server_seed: Optional[str] = None
    client_seed: Optional[str] = None
    nonce: int = Field(default=0)
    cash_out_amount: Optional[float] = None
    final_multiplier: Optional[float] = None

class GameSessionCreate(BaseModel):
    mine_count: int = Field(..., ge=1, le=24)
    bet_amount: float = Field(..., gt=0)
    client_seed: Optional[str] = None

class GameSessionUpdate(BaseModel):
    revealed_positions: List[int] = Field(..., description="List of tile positions to reveal")

class ProbabilityAnalysis(BaseModel):
    safe_probability: float = Field(..., description="Probability of next tile being safe")
    mine_probability: float = Field(..., description="Probability of next tile being mine")
    expected_value: float = Field(..., description="Expected value of continuing")
    optimal_cash_out: bool = Field(..., description="Whether to cash out now")
    risk_level: str = Field(..., description="Low, Medium, High risk assessment")

class MonteCarloResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mine_count: int
    iterations: int = Field(..., description="Number of simulation runs")
    average_multiplier: float
    success_rate: float
    variance: float
    optimal_cash_out_point: int = Field(..., description="Optimal number of tiles to reveal")
    expected_profit: float
    confidence_interval: Dict[str, float] = Field(..., description="95% confidence interval")

class MonteCarloRequest(BaseModel):
    mine_count: int = Field(..., ge=1, le=24)
    iterations: int = Field(default=10000, ge=1000, le=100000)
    bet_amount: float = Field(default=1.0, gt=0)
    cash_out_points: Optional[List[int]] = Field(default=None, description="Specific cash-out points to analyze")

class StrategyRecommendation(BaseModel):
    action: str = Field(..., description="continue, cash_out, or high_risk")
    confidence: float = Field(..., ge=0, le=1, description="Confidence level 0-1")
    reasoning: str = Field(..., description="Explanation of recommendation")
    risk_assessment: str = Field(..., description="Risk level description")
    expected_value: float = Field(..., description="Expected value of recommended action")
    alternative_actions: List[Dict[str, Any]] = Field(default_factory=list)

class ProvablyFairVerification(BaseModel):
    server_seed: str
    client_seed: str
    nonce: int
    game_result: List[int] = Field(..., description="Mine positions from verification")
    is_valid: bool = Field(..., description="Whether the game is provably fair")
    verification_hash: str

class UserStatistics(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total_games: int = Field(default=0)
    total_wagered: float = Field(default=0.0)
    total_won: float = Field(default=0.0)
    net_profit: float = Field(default=0.0)
    win_rate: float = Field(default=0.0)
    average_multiplier: float = Field(default=0.0)
    favorite_mine_count: int = Field(default=3)
    longest_winning_streak: int = Field(default=0)
    longest_losing_streak: int = Field(default=0)
    risk_profile: str = Field(default="balanced", description="conservative, balanced, aggressive")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)