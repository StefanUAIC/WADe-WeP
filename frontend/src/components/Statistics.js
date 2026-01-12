import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Statistics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/statistics`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (!stats) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-xl">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Detailed Statistics</h1>
          <p className="text-gray-600">
            Comprehensive analytics from the RDF knowledge base
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-5xl font-bold mb-2">{stats.total_articles}</div>
            <div className="text-blue-100">Total Articles</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-5xl font-bold mb-2">{stats.total_authors}</div>
            <div className="text-green-100">Unique Authors</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-5xl font-bold mb-2">{stats.articles_by_language?.length || 0}</div>
            <div className="text-purple-100">Languages</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 Articles by Language</h2>
            <div className="space-y-3">
              {stats.articles_by_language?.map((lang, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">{lang.language.toUpperCase()}</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">{lang.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🏷️ Top Keywords</h2>
            <div className="space-y-3">
              {stats.top_keywords?.map((kw, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">{kw.keyword}</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">{kw.count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Statistics;
