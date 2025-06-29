import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MonteCarloSimulator = () => {
  const [simulation, setSimulation] = useState({
    mine_count: 3,
    iterations: 10000,
    bet_amount: 1.0,
    cash_out_points: []
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState([]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/simulation/monte-carlo`, simulation);
      setResults(response.data);
      setSimulationHistory(prev => [response.data, ...prev.slice(0, 4)]); // Keep last 5 results
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBatchSimulations = async () => {
    setLoading(true);
    const batchResults = [];
    
    try {
      for (let mines = 1; mines <= 12; mines++) {
        const batchSimulation = { ...simulation, mine_count: mines, iterations: 5000 };
        const response = await axios.post(`${API}/simulation/monte-carlo`, batchSimulation);
        batchResults.push({ mines, ...response.data });
      }
      
      setResults({ 
        batch_results: batchResults,
        type: 'batch'
      });
      
    } catch (error) {
      console.error('Error running batch simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toFixed(4);
  };

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '0%';
    return (num * 100).toFixed(1) + '%';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Monte Carlo Simulator</h1>
        <p className="text-gray-300">
          Advanced statistical simulations for strategy optimization and risk analysis
        </p>
      </div>

      {/* Simulation Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Simulation Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mine Count (1-24)
            </label>
            <input
              type="range"
              min="1"
              max="24"
              value={simulation.mine_count}
              onChange={(e) => setSimulation({...simulation, mine_count: parseInt(e.target.value)})}
              className="w-full mb-2"
            />
            <div className="text-center text-yellow-400 font-bold">
              {simulation.mine_count} mines
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Iterations
            </label>
            <select
              value={simulation.iterations}
              onChange={(e) => setSimulation({...simulation, iterations: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
              <option value={25000}>25,000</option>
              <option value={50000}>50,000</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bet Amount
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={simulation.bet_amount}
              onChange={(e) => setSimulation({...simulation, bet_amount: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-2 px-4 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
            <button
              onClick={runBatchSimulations}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Batch Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className="space-y-8">
          {results.type === 'batch' ? (
            /* Batch Results */
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Batch Simulation Results</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 text-gray-300">Mines</th>
                      <th className="text-left py-2 text-gray-300">Optimal Tiles</th>
                      <th className="text-left py-2 text-gray-300">Success Rate</th>
                      <th className="text-left py-2 text-gray-300">Avg Multiplier</th>
                      <th className="text-left py-2 text-gray-300">Expected Profit</th>
                      <th className="text-left py-2 text-gray-300">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.batch_results.map((result) => (
                      <tr key={result.mines} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-2 text-white font-medium">{result.mines}</td>
                        <td className="py-2 text-yellow-400 font-bold">{result.optimal_cash_out_point}</td>
                        <td className="py-2 text-green-400">{formatPercent(result.success_rate)}</td>
                        <td className="py-2 text-blue-400">{formatNumber(result.average_multiplier)}x</td>
                        <td className="py-2 text-purple-400">{formatNumber(result.expected_profit)}</td>
                        <td className="py-2 text-gray-300">
                          {formatNumber(result.confidence_interval.lower)} - {formatNumber(result.confidence_interval.upper)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Single Simulation Results */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Results */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Simulation Results</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      {results.optimal_cash_out_point}
                    </div>
                    <div className="text-sm text-gray-400">Optimal Tiles</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {formatPercent(results.success_rate)}
                    </div>
                    <div className="text-sm text-gray-400">Success Rate</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Multiplier</span>
                    <span className="text-blue-400 font-bold">
                      {formatNumber(results.average_multiplier)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Profit</span>
                    <span className="text-purple-400 font-bold">
                      {formatNumber(results.expected_profit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Variance</span>
                    <span className="text-red-400 font-bold">
                      {formatNumber(results.variance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Iterations</span>
                    <span className="text-white font-bold">
                      {results.iterations.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Interval */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Statistical Confidence</h3>
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-yellow-400 font-semibold mb-2">95% Confidence Interval</h4>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {formatNumber(results.confidence_interval.lower)} - {formatNumber(results.confidence_interval.upper)}
                      </div>
                      <div className="text-sm text-gray-400">Multiplier Range</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-green-400 font-semibold mb-2">Strategy Recommendation</h4>
                    <p className="text-sm text-gray-300">
                      Based on {results.iterations.toLocaleString()} simulations, the optimal strategy 
                      for {results.mine_count} mines is to cash out after revealing{' '}
                      <span className="text-yellow-400 font-bold">{results.optimal_cash_out_point}</span> tiles.
                      This provides a <span className="text-green-400 font-bold">{formatPercent(results.success_rate)}</span> success 
                      rate with an expected profit of{' '}
                      <span className="text-purple-400 font-bold">{formatNumber(results.expected_profit)}</span>.
                    </p>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-blue-400 font-semibold mb-2">Risk Assessment</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level</span>
                        <span className={`font-bold ${
                          results.variance < 0.5 ? 'text-green-400' :
                          results.variance < 2.0 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {results.variance < 0.5 ? 'Low' :
                           results.variance < 2.0 ? 'Medium' : 'High'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            results.variance < 0.5 ? 'bg-green-400' :
                            results.variance < 2.0 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(results.variance * 20, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulation History */}
      {simulationHistory.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Recent Simulations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 text-gray-300">Mines</th>
                  <th className="text-left py-2 text-gray-300">Iterations</th>
                  <th className="text-left py-2 text-gray-300">Optimal Tiles</th>
                  <th className="text-left py-2 text-gray-300">Success Rate</th>
                  <th className="text-left py-2 text-gray-300">Expected Profit</th>
                </tr>
              </thead>
              <tbody>
                {simulationHistory.map((result, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-2 text-white font-medium">{result.mine_count}</td>
                    <td className="py-2 text-gray-400">{result.iterations.toLocaleString()}</td>
                    <td className="py-2 text-yellow-400 font-bold">{result.optimal_cash_out_point}</td>
                    <td className="py-2 text-green-400">{formatPercent(result.success_rate)}</td>
                    <td className="py-2 text-purple-400">{formatNumber(result.expected_profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methodology */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Monte Carlo Methodology</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Simulation Process</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>1. <strong>Random Mine Placement:</strong> Generate random mine positions for each simulation</p>
              <p>2. <strong>Strategy Testing:</strong> Test different cash-out points systematically</p>
              <p>3. <strong>Statistical Aggregation:</strong> Calculate success rates and average returns</p>
              <p>4. <strong>Optimization:</strong> Identify the cash-out point with highest expected value</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Statistical Measures</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Success Rate:</strong> Percentage of simulations that didn't hit mines</p>
              <p>• <strong>Expected Value:</strong> Average return across all simulations</p>
              <p>• <strong>Variance:</strong> Measure of return volatility and risk</p>
              <p>• <strong>Confidence Interval:</strong> 95% range of expected multipliers</p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white text-lg">Running Monte Carlo Simulation...</p>
            <p className="text-gray-400 text-sm">
              Processing {simulation.iterations.toLocaleString()} iterations
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonteCarloSimulator;