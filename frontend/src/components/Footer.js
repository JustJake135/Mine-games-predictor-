import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">M</span>
              </div>
              <span className="text-white font-bold text-xl">Mines Predictor Pro</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Advanced mathematical analysis and prediction system for Rainbet's Mines game. 
              Featuring Monte Carlo simulations, provably fair verification, and AI-powered strategy recommendations.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-yellow-400">🎯</span>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-yellow-400">🔬</span>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-yellow-400">📊</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Real-time Probability Analysis</li>
              <li>• Monte Carlo Simulations</li>
              <li>• Strategy Optimization</li>
              <li>• Risk Assessment</li>
              <li>• Provably Fair Verification</li>
            </ul>
          </div>

          {/* Analytics */}
          <div>
            <h3 className="text-white font-semibold mb-4">Analytics</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Expected Value Calculations</li>
              <li>• Optimal Stopping Theory</li>
              <li>• Bankroll Management</li>
              <li>• Performance Tracking</li>
              <li>• Statistical Modeling</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Mines Predictor Pro. Educational and research tool for mathematical analysis.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-gray-400 text-sm">Cryptographic Verification</span>
            <span className="text-gray-400 text-sm">HMAC-SHA256</span>
            <span className="text-gray-400 text-sm">Provably Fair</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;