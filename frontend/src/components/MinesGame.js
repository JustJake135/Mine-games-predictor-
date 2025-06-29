import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MinesGame = () => {
  const [gameSession, setGameSession] = useState(null);
  const [gameConfig, setGameConfig] = useState({
    mineCount: 3,
    betAmount: 1.0
  });
  const [probability, setProbability] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const createGame = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/game/create`, {
        mine_count: gameConfig.mineCount,
        bet_amount: gameConfig.betAmount
      });
      setGameSession(response.data);
      setGameStarted(true);
      await loadAnalysis(response.data.id);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setLoading(false);
    }
  };

  const revealTile = async (position) => {
    if (!gameSession || gameSession.status !== 'active') return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/game/${gameSession.id}/reveal`, {
        revealed_positions: [position]
      });
      setGameSession(response.data);
      
      if (response.data.status === 'active') {
        await loadAnalysis(response.data.id);
      }
    } catch (error) {
      console.error('Error revealing tile:', error);
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
    if (!gameSession || gameSession.status !== 'active') return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/game/${gameSession.id}/cashout`);
      setGameSession(response.data);
      setProbability(null);
      setStrategy(null);
    } catch (error) {
      console.error('Error cashing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async (gameId) => {
    try {
      const [probResponse, strategyResponse] = await Promise.all([
        axios.get(`${API}/analysis/probability/${gameId}`),
        axios.get(`${API}/analysis/strategy/${gameId}`)
      ]);
      setProbability(probResponse.data);
      setStrategy(strategyResponse.data);
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  };

  const resetGame = () => {
    setGameSession(null);
    setGameStarted(false);
    setProbability(null);
    setStrategy(null);
  };

  const getTileColor = (tile) => {
    if (tile.status === 'revealed_safe') return 'bg-green-500';
    if (tile.status === 'revealed_mine') return 'bg-red-500';
    return 'bg-gray-600 hover:bg-gray-500';
  };

  const getTileContent = (tile) => {
    if (tile.status === 'revealed_safe') return '💎';
    if (tile.status === 'revealed_mine') return '💣';
    return '';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Mines Game Analyzer</h1>
        <p className="text-gray-300">
          Real-time probability analysis and strategy recommendations
        </p>
      </div>

      {!gameStarted ? (
        /* Game Setup */
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Game Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Mines (1-24)
              </label>
              <input
                type="range"
                min="1"
                max="24"
                value={gameConfig.mineCount}
                onChange={(e) => setGameConfig({...gameConfig, mineCount: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>1</span>
                <span className="text-yellow-400 font-bold">{gameConfig.mineCount}</span>
                <span>24</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={gameConfig.betAmount}
                onChange={(e) => setGameConfig({...gameConfig, betAmount: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <button
              onClick={createGame}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Game...' : 'Start Game'}
            </button>
          </div>
        </div>
      ) : (
        /* Game Board */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Grid */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Game Board</h2>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Current Multiplier</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {gameSession?.current_multiplier?.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* 5x5 Grid */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {Array.from({ length: 25 }, (_, i) => {
                  const tile = gameSession?.tiles?.[i];
                  return (
                    <button
                      key={i}
                      onClick={() => revealTile(i)}
                      disabled={loading || !tile || tile.status !== 'hidden' || gameSession.status !== 'active'}
                      className={`aspect-square w-full rounded-lg text-2xl font-bold transition-all ${getTileColor(tile)} ${
                        tile?.status === 'hidden' && gameSession.status === 'active' 
                          ? 'hover:scale-105 cursor-pointer' 
                          : 'cursor-not-allowed'
                      }`}
                    >
                      {getTileContent(tile)}
                    </button>
                  );
                })}
              </div>

              {/* Game Status */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Tiles Revealed: {gameSession?.tiles_revealed || 0} / {25 - gameConfig.mineCount}
                </div>
                <div className="space-x-2">
                  {gameSession?.status === 'active' && (
                    <button
                      onClick={cashOut}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      Cash Out ({(gameSession.bet_amount * gameSession.current_multiplier).toFixed(2)})
                    </button>
                  )}
                  <button
                    onClick={resetGame}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    New Game
                  </button>
                </div>
              </div>

              {/* Game Result */}
              {gameSession?.status !== 'active' && (
                <div className="mt-4 p-4 rounded-lg bg-gray-700">
                  <div className="text-center">
                    {gameSession?.status === 'completed' ? (
                      <div>
                        <div className="text-green-400 text-2xl font-bold mb-2">🎉 Success!</div>
                        <div className="text-white">
                          Cashed out at {gameSession.final_multiplier}x for {gameSession.cash_out_amount.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-red-400 text-2xl font-bold mb-2">💣 Game Over</div>
                        <div className="text-white">Hit a mine! Better luck next time.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Probability Analysis */}
            {probability && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Probability Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Safe Probability</span>
                    <span className="text-green-400 font-bold">
                      {(probability.safe_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mine Probability</span>
                    <span className="text-red-400 font-bold">
                      {(probability.mine_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Value</span>
                    <span className="text-yellow-400 font-bold">
                      {probability.expected_value.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Level</span>
                    <span className={`font-bold ${
                      probability.risk_level === 'Low' ? 'text-green-400' :
                      probability.risk_level === 'Medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {probability.risk_level}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Strategy Recommendation */}
            {strategy && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">AI Recommendation</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-2 ${
                      strategy.action === 'continue' ? 'text-green-400' :
                      strategy.action === 'cash_out' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {strategy.action === 'continue' ? '🎯 Continue' :
                       strategy.action === 'cash_out' ? '💰 Cash Out' :
                       '⚠️ High Risk'}
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      Confidence: {(strategy.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-300">{strategy.reasoning}</p>
                  </div>

                  {strategy.alternative_actions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Alternative Actions</h4>
                      {strategy.alternative_actions.map((alt, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-2 mb-2">
                          <div className="text-sm text-white font-medium">{alt.action}</div>
                          <div className="text-xs text-gray-400">{alt.reasoning}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Game Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Game Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mines</span>
                  <span className="text-white">{gameConfig.mineCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bet Amount</span>
                  <span className="text-white">{gameConfig.betAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-bold ${
                    gameSession?.status === 'active' ? 'text-green-400' :
                    gameSession?.status === 'completed' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {gameSession?.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinesGame;