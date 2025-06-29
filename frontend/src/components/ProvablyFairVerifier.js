import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProvablyFairVerifier = () => {
  const [verification, setVerification] = useState({
    server_seed: '',
    client_seed: '',
    nonce: 0,
    game_result: []
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seedGeneration, setSeedGeneration] = useState({
    client_seed: ''
  });
  const [generatedSeeds, setGeneratedSeeds] = useState(null);

  const verifyGame = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/provably-fair/verify`, {
        ...verification,
        game_result: verification.game_result.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error verifying game:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSeeds = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/provably-fair/generate-seeds`, {
        params: seedGeneration.client_seed ? { client_seed: seedGeneration.client_seed } : {}
      });
      setGeneratedSeeds(response.data);
    } catch (error) {
      console.error('Error generating seeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Provably Fair Verifier</h1>
        <p className="text-gray-300">
          Cryptographic verification system using HMAC-SHA256 for game fairness validation
        </p>
      </div>

      {/* Seed Generation */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Generate New Seeds</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client Seed (Optional - Leave empty for random)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={seedGeneration.client_seed}
                onChange={(e) => setSeedGeneration({...seedGeneration, client_seed: e.target.value})}
                placeholder="Enter custom client seed or leave empty"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={generateSeeds}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Generate
              </button>
            </div>
          </div>

          {generatedSeeds && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Generated Seeds</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-400">Server Seed Hash:</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs bg-gray-800 p-2 rounded text-green-400 font-mono">
                      {generatedSeeds.server_seed_hash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedSeeds.server_seed_hash)}
                      className="text-yellow-400 hover:text-yellow-300"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Client Seed:</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs bg-gray-800 p-2 rounded text-blue-400 font-mono">
                      {generatedSeeds.client_seed}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedSeeds.client_seed)}
                      className="text-yellow-400 hover:text-yellow-300"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Verify Game Result</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server Seed (Revealed after game)
              </label>
              <input
                type="text"
                value={verification.server_seed}
                onChange={(e) => setVerification({...verification, server_seed: e.target.value})}
                placeholder="64-character hex string"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Seed
              </label>
              <input
                type="text"
                value={verification.client_seed}
                onChange={(e) => setVerification({...verification, client_seed: e.target.value})}
                placeholder="Your client seed"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nonce (Game round number)
              </label>
              <input
                type="number"
                min="0"
                value={verification.nonce}
                onChange={(e) => setVerification({...verification, nonce: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mine Positions (comma-separated: 0-24)
              </label>
              <textarea
                value={verification.game_result}
                onChange={(e) => setVerification({...verification, game_result: e.target.value})}
                placeholder="e.g., 3, 7, 12, 18, 23"
                rows="3"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <button
              onClick={verifyGame}
              disabled={loading || !verification.server_seed || !verification.client_seed}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Game Fairness'}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">How to Verify</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-400 font-bold">1.</span>
                <div>
                  <strong>Before the game:</strong> The server publishes a hash of the server seed. 
                  You provide your client seed.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-400 font-bold">2.</span>
                <div>
                  <strong>During the game:</strong> Mine positions are determined using HMAC-SHA256 
                  of server seed + client seed + nonce.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-400 font-bold">3.</span>
                <div>
                  <strong>After the game:</strong> The server reveals the unhashed server seed. 
                  You can verify the game was fair.
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <h4 className="text-yellow-400 font-semibold mb-2">Example Values</h4>
              <div className="space-y-1 text-xs font-mono">
                <div>
                  <span className="text-gray-400">Server Seed:</span>
                  <div className="text-green-400">a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456</div>
                </div>
                <div>
                  <span className="text-gray-400">Client Seed:</span>
                  <div className="text-blue-400">my_custom_seed_123</div>
                </div>
                <div>
                  <span className="text-gray-400">Nonce:</span>
                  <div className="text-white">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Result */}
      {result && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Verification Result</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className={`text-center p-6 rounded-lg mb-4 ${
                result.is_valid ? 'bg-green-900 border border-green-500' : 'bg-red-900 border border-red-500'
              }`}>
                <div className="text-4xl mb-2">
                  {result.is_valid ? '✅' : '❌'}
                </div>
                <div className={`text-xl font-bold ${result.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                  {result.is_valid ? 'Game is Provably Fair' : 'Verification Failed'}
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  {result.is_valid 
                    ? 'The game result matches the cryptographic verification'
                    : 'The provided seeds do not generate the claimed mine positions'
                  }
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Verification Hash:</label>
                  <code className="block text-xs bg-gray-700 p-2 rounded text-purple-400 font-mono mt-1">
                    {result.verification_hash}
                  </code>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Generated Mine Positions:</label>
                  <div className="bg-gray-700 p-2 rounded mt-1">
                    <div className="text-white font-mono">
                      [{result.game_result.join(', ')}]
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Grid */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Mine Positions Visualization</h3>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 25 }, (_, i) => (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center text-sm font-bold rounded ${
                      result.game_result.includes(i)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-600 text-gray-400'
                    }`}
                  >
                    {result.game_result.includes(i) ? '💣' : i}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-300">
                <p>
                  <span className="text-red-400">Red tiles (💣)</span> show mine positions generated 
                  from the cryptographic hash.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Cryptographic Implementation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">HMAC-SHA256 Process</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>1. <strong>Hash Generation:</strong> HMAC-SHA256(server_seed, client_seed:nonce)</p>
              <p>2. <strong>Randomness Extraction:</strong> Convert hash bytes to random numbers</p>
              <p>3. <strong>Fisher-Yates Shuffle:</strong> Use random numbers to select mine positions</p>
              <p>4. <strong>Position Selection:</strong> Choose mine positions from available tiles</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Security Properties</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Pre-image Resistance:</strong> Cannot reverse hash to find server seed</p>
              <p>• <strong>Collision Resistance:</strong> Cannot find different inputs with same hash</p>
              <p>• <strong>Deterministic:</strong> Same inputs always produce same mine positions</p>
              <p>• <strong>Unpredictable:</strong> Cannot predict outcome without server seed</p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white text-lg">Processing Verification...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvablyFairVerifier;