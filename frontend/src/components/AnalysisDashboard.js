import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalysisDashboard = () => {
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [selectedMineCount, setSelectedMineCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [optimalPoints, setOptimalPoints] = useState({});

  useEffect(() => {
    loadOptimalPoints();
    loadRiskAnalysis();
  }, []);

  useEffect(() => {
    loadRiskAnalysis();
  }, [selectedMineCount]);

  const loadOptimalPoints = async () => {
    try {
      const response = await axios.get(`${API}/stats/optimal-points`);
      setOptimalPoints(response.data.optimal_stopping_points);
    } catch (error) {
      console.error('Error loading optimal points:', error);
    }
  };

  const loadRiskAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/simulation/risk-analysis/${selectedMineCount}?iterations=5000`);
      setRiskAnalysis(response.data);
    } catch (error) {
      console.error('Error loading risk analysis:', error);
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
        <h1 className="text-4xl font-bold text-white mb-4">Analysis Dashboard</h1>
        <p className="text-gray-300">
          Comprehensive statistical analysis and strategy optimization
        </p>
      </div>

      {/* Mine Count Selector */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Analysis Configuration</h2>
        <div className="flex items-center space-x-4">
          <label className="text-gray-300 font-medium">Mine Count:</label>
          <select
            value={selectedMineCount}
            onChange={(e) => setSelectedMineCount(parseInt(e.target.value))}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map(count => (
              <option key={count} value={count}>{count} mines</option>
            ))}
          </select>
          <button
            onClick={loadRiskAnalysis}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Optimal Points Overview */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Optimal Stopping Points</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {Object.entries(optimalPoints).map(([mines, point]) => (
            <div
              key={mines}
              className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                parseInt(mines) === selectedMineCount
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedMineCount(parseInt(mines))}
            >
              <div className="font-bold text-lg">{mines}</div>
              <div className="text-sm opacity-80">mines</div>
              <div className="font-bold text-lg mt-1">{point}</div>
              <div className="text-sm opacity-80">tiles</div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Analysis Results */}
      {riskAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Risk-Reward Table */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Risk-Reward Analysis ({selectedMineCount} mines)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 text-gray-300">Tiles</th>
                    <th className="text-left py-2 text-gray-300">Success Rate</th>
                    <th className="text-left py-2 text-gray-300">Avg Multiplier</th>
                    <th className="text-left py-2 text-gray-300">Expected Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(riskAnalysis.analysis).slice(0, 12).map(([tiles, data]) => (
                    <tr key={tiles} className="border-b border-gray-700">
                      <td className="py-2 text-white font-medium">{tiles}</td>
                      <td className="py-2 text-green-400">{formatPercent(data.success_rate)}</td>
                      <td className="py-2 text-yellow-400">{formatNumber(data.average_multiplier)}x</td>
                      <td className="py-2 text-blue-400">{formatNumber(data.expected_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistical Metrics */}
          <div className="space-y-4">
            {/* Best Strategy */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Optimal Strategy</h3>
              {riskAnalysis.analysis && (
                (() => {
                  const bestStrategy = Object.entries(riskAnalysis.analysis)
                    .reduce((best, [tiles, data]) => 
                      data.expected_value > (best.data?.expected_value || 0) 
                        ? { tiles: parseInt(tiles), data } 
                        : best
                    , {});
                  
                  return bestStrategy.tiles ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-400 mb-2">
                          {bestStrategy.tiles} tiles
                        </div>
                        <div className="text-sm text-gray-400">Optimal cash-out point</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-700 rounded-lg p-3">
                          <div className="text-gray-400">Success Rate</div>
                          <div className="text-green-400 font-bold">
                            {formatPercent(bestStrategy.data.success_rate)}
                          </div>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3">
                          <div className="text-gray-400">Expected Value</div>
                          <div className="text-yellow-400 font-bold">
                            {formatNumber(bestStrategy.data.expected_value)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">No data available</div>
                  );
                })()
              )}
            </div>

            {/* Risk Metrics */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Risk Metrics</h3>
              {riskAnalysis.analysis && (
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(riskAnalysis.analysis).slice(0, 5).map(([tiles, data]) => (
                    <div key={tiles} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{tiles} tiles</span>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Risk-Adjusted Return</div>
                          <div className="text-yellow-400 font-bold">
                            {formatNumber(data.risk_adjusted_return)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Volatility Analysis */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Volatility Analysis</h3>
              {riskAnalysis.analysis && (
                <div className="space-y-2">
                  {Object.entries(riskAnalysis.analysis).slice(0, 5).map(([tiles, data]) => (
                    <div key={tiles} className="flex justify-between items-center">
                      <span className="text-gray-300">{tiles} tiles</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-red-400 h-2 rounded-full"
                            style={{ width: `${Math.min(data.volatility * 50, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400 w-16">
                          {formatNumber(data.volatility)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mathematical Explanation */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Mathematical Foundation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Probability Theory</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Safe Probability:</strong> (25 - mines - revealed) / (25 - revealed)</p>
              <p>• <strong>Mine Probability:</strong> mines / (25 - revealed)</p>
              <p>• <strong>Expected Value:</strong> P(safe) × reward - P(mine) × loss</p>
              <p>• <strong>Multiplier:</strong> Compound risk factor per tile</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Risk Metrics</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Volatility:</strong> Standard deviation of returns</p>
              <p>• <strong>Downside Risk:</strong> Risk of negative outcomes</p>
              <p>• <strong>Risk-Adjusted Return:</strong> Profit per unit of risk</p>
              <p>• <strong>Max Drawdown:</strong> Worst-case scenario loss</p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white text-lg">Running Analysis...</p>
            <p className="text-gray-400 text-sm">This may take a few seconds</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;