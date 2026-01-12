import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SHACLValidation() {
  const [rdfData, setRdfData] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [shapes, setShapes] = useState('');
  const [showShapes, setShowShapes] = useState(false);

  useEffect(() => {
    loadShapes();
  }, []);

  const loadShapes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/shacl/shapes`);
      setShapes(response.data.shapes);
    } catch (err) {
      console.error('Error loading shapes:', err);
    }
  };

  const exampleRDF = `@prefix schema: <http://schema.org/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix dc: <http://purl.org/dc/elements/1.1/> .

<http://localhost:8000/article/test123> a schema:NewsArticle ;
    dc:title "Test Article" ;
    dc:creator "John Doe" ;
    schema:headline "Test Article" ;
    schema:author "John Doe" ;
    schema:articleBody "This is test content." ;
    prov:wasGeneratedBy <http://localhost:8000/activity/act123> .`;

  const handleValidate = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/validate`, { rdf: rdfData });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Validation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SHACL Validation</h1>
          <p className="text-gray-600">
            Validate RDF data against W3C PROV and Schema.org constraints
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <button
            onClick={() => setRdfData(exampleRDF)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
          >
            Load Example RDF
          </button>
          <button
            onClick={() => setShowShapes(!showShapes)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
          >
            {showShapes ? 'Hide' : 'Show'} SHACL Shapes
          </button>
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors text-center"
          >
            API Documentation
          </a>
        </div>

        {showShapes && shapes && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">SHACL Shapes (Constraints)</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs font-mono max-h-96">
              {shapes}
            </pre>
            <p className="text-sm text-gray-600 mt-3">
              These shapes define the constraints for NewsArticle validation (headline, author, provenance required).
            </p>
          </div>
        )}

        <form onSubmit={handleValidate} className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label htmlFor="rdf-data" className="block text-lg font-semibold text-gray-900 mb-3">
            RDF Data (Turtle format)
          </label>
          <textarea
            id="rdf-data"
            value={rdfData}
            onChange={(e) => setRdfData(e.target.value)}
            placeholder="Enter RDF data in Turtle format..."
            rows="15"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button 
            type="submit"
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors"
          >
            ✓ Validate RDF
          </button>
        </form>

        {error && (
          <div role="alert" className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="font-semibold text-red-800">Validation Error</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Validation Results</h2>
            
            <div className={`p-4 rounded-lg mb-4 ${result.conforms ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
              <p className="text-lg font-semibold">
                {result.conforms ? '✓ Valid' : '✗ Invalid'}
              </p>
              <p className="text-sm mt-1">
                {result.conforms ? 'RDF data conforms to SHACL constraints' : 'RDF data does not conform to SHACL constraints'}
              </p>
            </div>

            {result.results_text && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Details:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                  {result.results_text}
                </pre>
              </div>
            )}

            {result.validation_report && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Validation Report (Turtle):</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {result.validation_report}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default SHACLValidation;
