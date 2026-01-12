import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="bg-white shadow-sm border-b-2 border-blue-600">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link to="/" className="block mb-4">
          <h1 className="text-4xl font-bold text-gray-900">WeP - Web News Provenance</h1>
          <p className="text-gray-600 mt-2">
            Track and manage news article provenance using semantic web technologies
          </p>
        </Link>
        <nav className="flex gap-6">
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            🏠 Home
          </Link>
          <Link to="/sparql" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            🔍 SPARQL Query
          </Link>
          <Link to="/validate" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            ✓ SHACL Validation
          </Link>
          <Link to="/statistics" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            📊 Statistics
          </Link>
          <Link to="/explorer" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            🌐 Entity Explorer
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
