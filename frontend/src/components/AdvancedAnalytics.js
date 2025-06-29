import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdvancedAnalytics = () => {
  const [userBehavior, setUserBehavior] = useState(null);
  const [ensemblePrediction, setEnsemblePrediction] = useState(null);
  const [anomalyDetection, setAnomalyDetection] = useState(null);
  const [personalizedRec, setPersonalizedRec] = useState(null);
  const [userId] = useState('demo-user'); // Demo user for testing
  const [loading, setLoading] = useState({
    behavior: false,
    ensemble: false,
    anomaly: false,
    personalized: false
  });

  useEffect(() => {
    loadUserBehaviorAnalysis();
    loadPersonalizedRecommendations();
  }, []);

  const loadUserBehaviorAnalysis = async () => {
    setLoading(prev => ({ ...prev, behavior: true }));
    try {
      const response = await axios.get(`${API}/analytics/user-behavior/${userId}`);
      setUserBehavior(response.data);
    } catch (error) {
      console.error('Error loading user behavior:', error);
    } finally {
      setLoading(prev => ({ ...prev, behavior: false }));
    }
  };

  const loadPersonalizedRecommendations = async () => {
    setLoading(prev => ({ ...prev, personalized: true }));
    try {
      const response = await axios.post(`${API}/analytics/personalized-recommendation`, {
        user_id: userId,
        game_state: {
          recent_losses: 1,
          winning_streak: 0
        }
      });
      setPersonalizedRec(response.data);
    } catch (error) {
      console.error('Error loading personalized recommendations:', error);
    } finally {
      setLoading(prev => ({ ...prev, personalized: false }));
    }
  };

  const testEnsemblePrediction = async () => {
    setLoading(prev => ({ ...prev, ensemble: true }));
    try {
      // First create a demo game
      const gameResponse = await axios.post(`${API}/game/create`, {
        mine_count: 3,
        bet_amount: 1.0
      });
      
      const gameId = gameResponse.data.id;
      
      // Get ensemble prediction
      const response = await axios.get(`${API}/analytics/ensemble-prediction/${gameId}?user_id=${userId}`);
      setEnsemblePrediction(response.data);
    } catch (error) {
      console.error('Error testing ensemble prediction:', error);
    } finally {
      setLoading(prev => ({ ...prev, ensemble: false }));
    }
  };

  const testAnomalyDetection = async () => {
    setLoading(prev => ({ ...prev, anomaly: true }));
    try {
      // Create a game with unusual parameters to test anomaly detection
      const gameResponse = await axios.post(`${API}/game/create`, {
        mine_count: 20, // Unusually high
        bet_amount: 100.0 // Unusually high
      });
      
      const gameId = gameResponse.data.id;
      
      // Test anomaly detection
      const response = await axios.get(`${API}/analytics/anomaly-detection/${gameId}?user_id=${userId}`);
      setAnomalyDetection(response.data);
    } catch (error) {
      console.error('Error testing anomaly detection:', error);
    } finally {
      setLoading(prev => ({ ...prev, anomaly: false }));
    }
  };

  const formatRiskProfile = (profile) => {
    const colors = {
      conservative: 'text-green-400',
      balanced: 'text-yellow-400',
      aggressive: 'text-red-400'
    };
    return colors[profile] || 'text-gray-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Advanced Analytics Suite</h1>
        <p className="text-gray-300">
          AI-powered user behavior analysis, ensemble predictions, and anomaly detection
        </p>
      </div>

      {/* User Behavior Analysis */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">User Behavior Analysis</h2>
          <button
            onClick={loadUserBehaviorAnalysis}
            disabled={loading.behavior}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading.behavior ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>

        {userBehavior ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Risk Profile</h3>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className={`text-2xl font-bold mb-2 ${formatRiskProfile(userBehavior.risk_profile)}`}>
                  {userBehavior.risk_profile.charAt(0).toUpperCase() + userBehavior.risk_profile.slice(1)}
                </div>
                <div className="text-sm text-gray-400">
                  Risk Tolerance: {(userBehavior.behavioral_features.risk_tolerance * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Behavioral Patterns</h3>
              <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Bet Size</span>
                  <span className="text-white">{userBehavior.behavioral_features.avg_bet_size.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Preferred Mines</span>
                  <span className="text-white">{userBehavior.behavioral_features.preferred_mine_counts.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Cash-out Point</span>
                  <span className="text-white">{userBehavior.behavioral_features.cash_out_patterns.avg_cash_out_point.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            {loading.behavior ? 'Analyzing user behavior...' : 'Click "Refresh Analysis" to load user behavior data'}
          </div>
        )}
      </div>

      {/* Ensemble Prediction System */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Ensemble Prediction System</h2>
          <button
            onClick={testEnsemblePrediction}
            disabled={loading.ensemble}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading.ensemble ? 'Testing...' : 'Test Ensemble Prediction'}
          </button>
        </div>

        {ensemblePrediction ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Ensemble Result</h3>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className={`text-2xl font-bold mb-2 ${
                    ensemblePrediction.ensemble_prediction.action === 'continue' ? 'text-green-400' :
                    ensemblePrediction.ensemble_prediction.action === 'cash_out' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {ensemblePrediction.ensemble_prediction.action === 'continue' ? '🎯 Continue' :
                     ensemblePrediction.ensemble_prediction.action === 'cash_out' ? '💰 Cash Out' :
                     '⚠️ High Risk'}
                  </div>
                  <div className="text-sm text-gray-400">
                    Confidence: {(ensemblePrediction.ensemble_prediction.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">
                    Agreement: {(ensemblePrediction.ensemble_prediction.agreement_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Individual Predictions</h3>
              <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                {Object.entries(ensemblePrediction.individual_predictions).map(([method, prediction]) => (
                  <div key={method} className="flex justify-between items-center">
                    <span className="text-gray-400 capitalize">{method}</span>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        prediction.action === 'continue' ? 'text-green-400' :
                        prediction.action === 'cash_out' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {prediction.action}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(prediction.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            Click "Test Ensemble Prediction" to see how multiple AI models work together
          </div>
        )}
      </div>

      {/* Anomaly Detection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Anomaly Detection</h2>
          <button
            onClick={testAnomalyDetection}
            disabled={loading.anomaly}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading.anomaly ? 'Detecting...' : 'Test Anomaly Detection'}
          </button>
        </div>

        {anomalyDetection ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${
                anomalyDetection.anomalies_detected ? 'bg-red-500' : 'bg-green-500'
              }`}></div>
              <span className="text-white font-medium">
                {anomalyDetection.anomalies_detected ? 'Anomalies Detected' : 'Normal Behavior'}
              </span>
              <span className="text-gray-400">
                Risk Score: {(anomalyDetection.risk_score * 100).toFixed(1)}%
              </span>
            </div>

            {anomalyDetection.anomaly_list.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-red-400 font-semibold mb-2">Detected Anomalies:</h4>
                {anomalyDetection.anomaly_list.map((anomaly, index) => (
                  <div key={index} className="mb-2">
                    <div className={`text-sm font-medium ${
                      anomaly.severity === 'high' ? 'text-red-400' :
                      anomaly.severity === 'medium' ? 'text-yellow-400' :
                      'text-orange-400'
                    }`}>
                      {anomaly.type.replace('_', ' ').toUpperCase()} ({anomaly.severity})
                    </div>
                    <div className="text-xs text-gray-400">{anomaly.description}</div>
                  </div>
                ))}
              </div>
            )}

            {anomalyDetection.recommendations.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">Recommendations:</h4>
                {anomalyDetection.recommendations.map((rec, index) => (
                  <div key={index} className="text-sm text-gray-300 mb-1">
                    • {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            Click "Test Anomaly Detection" to analyze unusual gaming patterns
          </div>
        )}
      </div>

      {/* Personalized Recommendations */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Personalized Recommendations</h2>
          <button
            onClick={loadPersonalizedRecommendations}
            disabled={loading.personalized}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading.personalized ? 'Loading...' : 'Refresh Recommendations'}
          </button>
        </div>

        {personalizedRec ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-2">
                {personalizedRec.personalized_recommendations.recommended_mine_count}
              </div>
              <div className="text-sm text-gray-400">Recommended Mines</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {personalizedRec.personalized_recommendations.recommended_cash_out_point}
              </div>
              <div className="text-sm text-gray-400">Recommended Cash-out</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {personalizedRec.personalized_recommendations.recommended_bet_size.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Recommended Bet Size</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            {loading.personalized ? 'Loading personalized recommendations...' : 'Personalized recommendations will appear here'}
          </div>
        )}
      </div>

      {/* Feature Explanation */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Advanced Analytics Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Machine Learning Integration</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Behavioral Analysis:</strong> Pattern recognition from user gaming history</p>
              <p>• <strong>Risk Profiling:</strong> Automatic classification of user risk preferences</p>
              <p>• <strong>Adaptive Recommendations:</strong> Personalized strategy suggestions</p>
              <p>• <strong>Ensemble Methods:</strong> Combining multiple AI models for better accuracy</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Real-time Monitoring</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Anomaly Detection:</strong> Identifies unusual gaming patterns</p>
              <p>• <strong>Risk Assessment:</strong> Real-time evaluation of decision quality</p>
              <p>• <strong>Behavioral Alerts:</strong> Warnings for potentially harmful patterns</p>
              <p>• <strong>Performance Tracking:</strong> Continuous model improvement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;