import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import components
import Dashboard from './components/Dashboard';
import MinesGame from './components/MinesGame';
import AnalysisDashboard from './components/AnalysisDashboard';
import MonteCarloSimulator from './components/MonteCarloSimulator';
import ProvablyFairVerifier from './components/ProvablyFairVerifier';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await axios.get(`${API}/health`);
      setIsConnected(response.data.status === 'healthy');
    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing Advanced Mines Predictor...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl font-bold mb-2">Connection Failed</h1>
          <p className="text-gray-400 mb-4">Unable to connect to the prediction engine</p>
          <button 
            onClick={checkConnection}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        {/* Background pattern */}
        <div className="fixed inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1720962158915-34d95b9b5072')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}></div>
        </div>
        
        <div className="relative z-10">
          <Navbar />
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/game" element={<MinesGame />} />
              <Route path="/analysis" element={<AnalysisDashboard />} />
              <Route path="/simulator" element={<MonteCarloSimulator />} />
              <Route path="/verifier" element={<ProvablyFairVerifier />} />
              <Route path="/advanced" element={<AdvancedAnalytics />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;