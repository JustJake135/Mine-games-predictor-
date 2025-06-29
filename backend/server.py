from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from typing import List, Optional, Dict, Any
import asyncio

# Import our custom modules
from models import *
from probability_engine import MinesProbabilityEngine
from monte_carlo_engine import MonteCarloSimulationEngine
from provably_fair import ProvablyFairSystem

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize engines
prob_engine = MinesProbabilityEngine()
monte_carlo_engine = MonteCarloSimulationEngine()
provably_fair_system = ProvablyFairSystem()

# Create the main app
app = FastAPI(
    title="Advanced Mines Predictor API",
    description="Professional Mines game analysis and prediction system",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# === GAME SESSION ENDPOINTS ===

@api_router.post("/game/create", response_model=GameSession)
async def create_game_session(game_data: GameSessionCreate):
    """Create a new game session with provably fair setup"""
    try:
        # Setup provably fair system
        fair_setup = provably_fair_system.create_game_setup(game_data.client_seed)
        
        # Generate mine positions
        mine_positions = provably_fair_system.generate_game_result(
            fair_setup['server_seed'],
            fair_setup['client_seed'],
            0,  # nonce starts at 0
            game_data.mine_count
        )
        
        # Create tiles
        tiles = []
        for i in range(25):
            tile = Tile(
                position=i,
                is_mine=(i in mine_positions)
            )
            tiles.append(tile)
        
        # Create game session
        game_session = GameSession(
            mine_count=game_data.mine_count,
            bet_amount=game_data.bet_amount,
            tiles=tiles,
            server_seed=fair_setup['server_seed'],
            client_seed=fair_setup['client_seed'],
            nonce=0
        )
        
        # Save to database
        await db.game_sessions.insert_one(game_session.dict())
        
        # Return session without revealing mine positions
        safe_session = game_session.copy()
        for tile in safe_session.tiles:
            if tile.status == TileStatus.HIDDEN:
                tile.is_mine = False  # Hide mine information
        
        return safe_session
        
    except Exception as e:
        logger.error(f"Error creating game session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create game session")

@api_router.get("/game/{game_id}", response_model=GameSession)
async def get_game_session(game_id: str):
    """Get game session by ID"""
    try:
        game_doc = await db.game_sessions.find_one({"id": game_id})
        if not game_doc:
            raise HTTPException(status_code=404, detail="Game session not found")
        
        game_session = GameSession(**game_doc)
        
        # Hide mine positions for active games
        if game_session.status == GameStatus.ACTIVE:
            for tile in game_session.tiles:
                if tile.status == TileStatus.HIDDEN:
                    tile.is_mine = False
        
        return game_session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting game session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get game session")

@api_router.post("/game/{game_id}/reveal", response_model=GameSession)
async def reveal_tiles(game_id: str, update_data: GameSessionUpdate):
    """Reveal tiles in a game session"""
    try:
        game_doc = await db.game_sessions.find_one({"id": game_id})
        if not game_doc:
            raise HTTPException(status_code=404, detail="Game session not found")
        
        game_session = GameSession(**game_doc)
        
        if game_session.status != GameStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Game is not active")
        
        # Reveal tiles
        hit_mine = False
        for position in update_data.revealed_positions:
            if position < 0 or position >= 25:
                raise HTTPException(status_code=400, detail="Invalid tile position")
            
            tile = game_session.tiles[position]
            if tile.status != TileStatus.HIDDEN:
                continue  # Skip already revealed tiles
            
            if tile.is_mine:
                tile.status = TileStatus.REVEALED_MINE
                game_session.status = GameStatus.LOST
                hit_mine = True
                break
            else:
                tile.status = TileStatus.REVEALED_SAFE
                game_session.tiles_revealed += 1
        
        # Update multiplier
        if not hit_mine:
            game_session.current_multiplier = prob_engine.calculate_multiplier(
                game_session.mine_count, 
                game_session.tiles_revealed
            )
        
        # Check if all safe tiles revealed
        safe_tiles_total = 25 - game_session.mine_count
        if game_session.tiles_revealed >= safe_tiles_total:
            game_session.status = GameStatus.COMPLETED
            game_session.final_multiplier = game_session.current_multiplier
            game_session.cash_out_amount = game_session.bet_amount * game_session.current_multiplier
        
        # Update in database
        await db.game_sessions.replace_one({"id": game_id}, game_session.dict())
        
        return game_session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revealing tiles: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reveal tiles")

@api_router.post("/game/{game_id}/cashout", response_model=GameSession)
async def cash_out_game(game_id: str):
    """Cash out from current game session"""
    try:
        game_doc = await db.game_sessions.find_one({"id": game_id})
        if not game_doc:
            raise HTTPException(status_code=404, detail="Game session not found")
        
        game_session = GameSession(**game_doc)
        
        if game_session.status != GameStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Game is not active")
        
        # Calculate cash out amount
        game_session.cash_out_amount = game_session.bet_amount * game_session.current_multiplier
        game_session.final_multiplier = game_session.current_multiplier
        game_session.status = GameStatus.COMPLETED
        
        # Update in database
        await db.game_sessions.replace_one({"id": game_id}, game_session.dict())
        
        return game_session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cashing out: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cash out")

# === ANALYSIS ENDPOINTS ===

@api_router.get("/analysis/probability/{game_id}", response_model=ProbabilityAnalysis)
async def get_probability_analysis(game_id: str):
    """Get probability analysis for current game state"""
    try:
        game_doc = await db.game_sessions.find_one({"id": game_id})
        if not game_doc:
            raise HTTPException(status_code=404, detail="Game session not found")
        
        game_session = GameSession(**game_doc)
        analysis = prob_engine.analyze_game_state(game_session)
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing probability: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze probability")

@api_router.get("/analysis/strategy/{game_id}", response_model=StrategyRecommendation)
async def get_strategy_recommendation(game_id: str):
    """Get AI-powered strategy recommendation"""
    try:
        game_doc = await db.game_sessions.find_one({"id": game_id})
        if not game_doc:
            raise HTTPException(status_code=404, detail="Game session not found")
        
        game_session = GameSession(**game_doc)
        recommendation = prob_engine.generate_strategy_recommendation(game_session)
        
        return recommendation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating strategy: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate strategy")

# === MONTE CARLO SIMULATION ENDPOINTS ===

@api_router.post("/simulation/monte-carlo", response_model=MonteCarloResult)
async def run_monte_carlo_simulation(request: MonteCarloRequest):
    """Run Monte Carlo simulation for strategy optimization"""
    try:
        # Run simulation in background to avoid blocking
        result = await asyncio.get_event_loop().run_in_executor(
            None, 
            monte_carlo_engine.run_monte_carlo_simulation, 
            request
        )
        
        # Save result to database
        await db.monte_carlo_results.insert_one(result.dict())
        
        return result
        
    except Exception as e:
        logger.error(f"Error running Monte Carlo simulation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to run simulation")

@api_router.get("/simulation/risk-analysis/{mine_count}")
async def get_risk_analysis(mine_count: int, iterations: int = 10000):
    """Get comprehensive risk-reward analysis"""
    try:
        if mine_count < 1 or mine_count > 24:
            raise HTTPException(status_code=400, detail="Invalid mine count")
        
        # Run analysis in background
        analysis = await asyncio.get_event_loop().run_in_executor(
            None,
            monte_carlo_engine.analyze_risk_reward_profile,
            mine_count,
            iterations
        )
        
        return {"mine_count": mine_count, "analysis": analysis}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running risk analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to run risk analysis")

# === PROVABLY FAIR ENDPOINTS ===

@api_router.post("/provably-fair/verify", response_model=ProvablyFairVerification)
async def verify_provably_fair(verification: ProvablyFairVerification):
    """Verify provably fair game result"""
    try:
        result = provably_fair_system.verify_game_result(verification)
        return result
        
    except Exception as e:
        logger.error(f"Error verifying provably fair: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify provably fair")

@api_router.get("/provably-fair/generate-seeds")
async def generate_seeds(client_seed: Optional[str] = None):
    """Generate new provably fair seeds"""
    try:
        setup = provably_fair_system.create_game_setup(client_seed)
        return {
            "server_seed_hash": setup['server_seed_hash'],
            "client_seed": setup['client_seed']
        }
        
    except Exception as e:
        logger.error(f"Error generating seeds: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate seeds")

# === STATISTICS ENDPOINTS ===

@api_router.get("/stats/user/{user_id}", response_model=UserStatistics)
async def get_user_statistics(user_id: str):
    """Get user statistics and performance metrics"""
    try:
        # Get user stats from database
        stats_doc = await db.user_statistics.find_one({"user_id": user_id})
        
        if not stats_doc:
            # Create new user stats
            stats = UserStatistics(user_id=user_id)
            await db.user_statistics.insert_one(stats.dict())
            return stats
        
        return UserStatistics(**stats_doc)
        
    except Exception as e:
        logger.error(f"Error getting user statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user statistics")

@api_router.get("/stats/optimal-points")
async def get_optimal_stopping_points():
    """Get optimal stopping points for different mine counts"""
    try:
        results = {}
        for mine_count in range(1, 25):
            optimal_point = prob_engine.calculate_optimal_stopping_point(mine_count)
            results[mine_count] = optimal_point
        
        return {"optimal_stopping_points": results}
        
    except Exception as e:
        logger.error(f"Error calculating optimal points: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate optimal points")

# === LEGACY ENDPOINTS ===

@api_router.get("/")
async def root():
    """API health check"""
    return {"message": "Advanced Mines Predictor API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test database connection
        await db.admin.command('ismaster')
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "engines": {
            "probability": "loaded",
            "monte_carlo": "loaded",
            "provably_fair": "loaded"
        }
    }

# Include the router in the main app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)