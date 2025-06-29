import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalGames: 0,
    winRate: 0,
    averageMultiplier: 0,
    netProfit: 0
  });
  const [optimalPoints, setOptimalPoints] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get optimal stopping points
      const optimalResponse = await axios.get(`${API}/stats/optimal-points`);
      setOptimalPoints(optimalResponse.data.optimal_stopping_points);
      
      // Get user stats (using default user for demo)
      try {
        const statsResponse = await axios.get(`${API}/stats/user/demo-user`);
        setStats(statsResponse.data);
      } catch (error) {
        console.log('No user stats yet');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'Mines Game',
      description: 'Interactive mines game with real-time probability analysis',
      icon: '🎮',
      link: '/game',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Analysis Dashboard',
      description: 'Comprehensive statistical analysis and visualization',
      icon: '📊',
      link: '/analysis',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Monte Carlo Simulator',
      description: 'Advanced simulations for strategy optimization',
      icon: '🔬',
      link: '/simulator',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Provably Fair Verifier',
      description: 'Cryptographic verification of game fairness',
      icon: '✅',
      link: '/verifier',
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Advanced <span className="text-yellow-400">Mines Predictor</span>
        </h1>
        <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
          Professional-grade mathematical analysis and prediction system for Rainbet's Mines game. 
          Featuring Monte Carlo simulations, provably fair verification, and AI-powered strategy recommendations.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/game"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-8 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all transform hover:scale-105"
          >
            Start Analyzing
          </Link>
          <Link
            to="/simulator"
            className="bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Run Simulation
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Total Games</h3>
          <p className="text-2xl font-bold text-white">{stats.totalGames ? stats.totalGames.toLocaleString() : '0'}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Win Rate</h3>
          <p className="text-2xl font-bold text-green-400">{stats.winRate ? (stats.winRate * 100).toFixed(1) : '0'}%</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Avg Multiplier</h3>
          <p className="text-2xl font-bold text-yellow-400">{stats.averageMultiplier ? stats.averageMultiplier.toFixed(2) : '0.00'}x</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Net Profit</h3>
          <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.netProfit !== undefined ? (stats.netProfit >= 0 ? '+' : '') + stats.netProfit.toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.link}
            className="block group"
          >
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-yellow-500 transition-colors group-hover:transform group-hover:scale-105 transition-transform duration-200">
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 text-2xl`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
              <div className="mt-4 flex items-center text-yellow-400 group-hover:text-yellow-300">
                <span className="text-sm font-medium">Explore →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Optimal Stopping Points */}
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Optimal Stopping Points</h2>
        <p className="text-gray-400 mb-6">
          Theoretical optimal cash-out points for different mine counts based on mathematical analysis
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(optimalPoints).slice(0, 12).map(([mines, point]) => (
            <div key={mines} className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-yellow-400 font-bold text-lg">{mines}</div>
              <div className="text-gray-400 text-sm">mines</div>
              <div className="text-white font-semibold">{point}</div>
              <div className="text-gray-400 text-xs">tiles</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mathematical Foundation */}
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Mathematical Foundation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">∑</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Probability Theory</h3>
            <p className="text-gray-400 text-sm">
              Advanced probability calculations and expected value analysis
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">∫</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Monte Carlo Methods</h3>
            <p className="text-gray-400 text-sm">
              Statistical simulations and convergence analysis
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">∂</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Optimization Theory</h3>
            <p className="text-gray-400 text-sm">
              Optimal stopping and decision theory applications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;