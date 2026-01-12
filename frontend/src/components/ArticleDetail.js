import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import ProvenanceGraph from './ProvenanceGraph';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [provenance, setProvenance] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [jsonld, setJsonld] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [validation, setValidation] = useState(null);
  const [rdfData, setRdfData] = useState(null);
  const [showRDF, setShowRDF] = useState(false);

  useEffect(() => {
    loadArticleData();
  }, [id]);

  const loadArticleData = async () => {
    try {
      const [articleRes, provRes, qrRes, jsonldRes, recRes, valRes, rdfRes] = await Promise.all([
        axios.get(`${API_URL}/api/articles/${id}`),
        axios.get(`${API_URL}/api/provenance/${id}`),
        axios.get(`${API_URL}/api/articles/${id}/qrcode`),
        axios.get(`${API_URL}/api/articles/${id}/jsonld`),
        axios.get(`${API_URL}/api/articles/${id}/recommendations`),
        axios.get(`${API_URL}/api/articles/${id}/validate`),
        axios.get(`${API_URL}/api/articles/${id}/rdf?format=turtle`)
      ]);
      
      setArticle(articleRes.data);
      setProvenance(provRes.data);
      setQrCode(qrRes.data.qr_code);
      setJsonld(jsonldRes.data);
      setRecommendations(recRes.data.recommendations);
      setValidation(valRes.data);
      setRdfData(rdfRes.data.data);
    } catch (error) {
      console.error('Error loading article:', error);
    }
  };

  if (!article) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-xl">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <article vocab="http://schema.org/" typeof="NewsArticle" className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 property="headline" className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span property="author" typeof="Person" className="flex items-center gap-2">
                <span className="font-semibold">👤 Author:</span>
                <span property="name">{article.author}</span>
              </span>
              <span className="text-gray-400">•</span>
              <span property="publisher" typeof="Organization" className="flex items-center gap-2">
                <span className="font-semibold">📰 Publication:</span>
                <span property="name">{article.publication}</span>
              </span>
              <span className="text-gray-400">•</span>
              <time property="dateCreated" dateTime={article.created_at} className="flex items-center gap-2">
                <span className="font-semibold">📅</span>
                {new Date(article.created_at).toLocaleDateString()}
              </time>
              <span className="text-gray-400">•</span>
              <span property="inLanguage" className="flex items-center gap-2">
                <span className="font-semibold">🌐</span>
                {article.language.toUpperCase()}
              </span>
            </div>
            
            <button 
              onClick={() => setShowQR(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2 text-sm"
            >
              📱 QR Code
            </button>
          </div>

          {article.audio_urls && article.audio_urls.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                🎧 Audio/Podcasts ({article.audio_urls.length})
              </h3>
              <div className="space-y-3">
                {article.audio_urls.map((url, i) => (
                  <audio 
                    key={i}
                    property="audio" 
                    controls 
                    className="w-full"
                    src={url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                ))}
              </div>
            </div>
          )}

          {article.image_urls && article.image_urls.length > 0 && (
            <div className="mb-8 -mx-8 grid grid-cols-1 gap-4">
              {article.image_urls.map((url, i) => (
                <figure key={i}>
                  <img 
                    property="image" 
                    src={url} 
                    alt={`${article.title} - Image ${i + 1}`} 
                    className="w-full h-96 object-cover"
                  />
                </figure>
              ))}
            </div>
          )}

          <div property="articleBody" className="prose prose-lg max-w-none text-gray-800 leading-relaxed mb-8">
            {article.content}
          </div>

          {article.video_urls && article.video_urls.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎥 Video Content ({article.video_urls.length})
              </h3>
              <div className="space-y-6">
                {article.video_urls.map((url, i) => (
                  <div key={i} className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      property="video"
                      src={url}
                      title={`Article video ${i + 1}`}
                      className="w-full h-full"
                      allowFullScreen
                    ></iframe>
                  </div>
                ))}
              </div>
            </div>
          )}

          {article.keywords && article.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-200">
              <span className="font-semibold text-gray-700">Keywords:</span>
              {article.keywords.map((kw, i) => (
                <span key={i} property="keywords" className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </article>

        <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔗 Provenance Chain (W3C PROV)</h2>
          {provenance && <ProvenanceGraph data={provenance} />}
        </section>

        {validation && (
          <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✓ SHACL Validation</h2>
            <div className={`p-4 rounded-lg mb-4 ${validation.conforms ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
              <p className="text-lg font-semibold">
                {validation.conforms ? '✓ Valid RDF Data' : '✗ Invalid RDF Data'}
              </p>
              <p className="text-sm mt-1 text-gray-600">
                {validation.conforms 
                  ? 'This article conforms to W3C PROV and Schema.org constraints' 
                  : 'This article has validation issues'}
              </p>
            </div>
            
            {rdfData && (
              <div>
                <button
                  onClick={() => setShowRDF(!showRDF)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm mb-3"
                >
                  {showRDF ? '▼ Hide RDF Data (Turtle)' : '▶ Show RDF Data (Turtle)'}
                </button>
                
                {showRDF && (
                  <div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs font-mono max-h-96 mb-3">
                      {rdfData}
                    </pre>
                    <p className="text-xs text-gray-500">
                      This RDF includes: Dublin Core (dc:), Schema.org, W3C PROV, IPTC subjects, and DBpedia entities
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <Link 
                to="/validate" 
                className="text-purple-600 hover:text-purple-800 font-medium text-sm"
              >
                → Go to SHACL Validation page to see constraints
              </Link>
            </div>
          </section>
        )}

        {showQR && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowQR(false)}
          >
            <div 
              className="bg-white rounded-lg p-8 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">📱 Share Article</h3>
              {qrCode && (
                <div className="text-center">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64 mx-auto mb-4 border-2 border-gray-200 rounded-lg" />
                  <p className="text-sm text-gray-600">Scan to view article on mobile</p>
                </div>
              )}
              <button 
                onClick={() => setShowQR(false)}
                className="mt-6 w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {jsonld && (
          <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📄 JSON-LD (Schema.org)</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm font-mono">
              {JSON.stringify(jsonld, null, 2)}
            </pre>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Recommended Articles</h2>
            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
                  <h3 className="text-lg font-semibold mb-2">
                    <Link to={`/articles/${rec.id}`} className="text-blue-600 hover:text-blue-800">
                      {rec.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600">
                    {rec.author} • {rec.publication}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ArticleDetail;
