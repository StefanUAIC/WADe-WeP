import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUrls, setImageUrls] = useState(['']);
  const [videoUrls, setVideoUrls] = useState(['']);
  const [audioUrls, setAudioUrls] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadArticles();
    loadStats();
  }, []);

  const loadArticles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/articles`);
      setArticles(response.data.articles);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/statistics`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadArticles();
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/search?q=${searchQuery}`);
      setArticles(response.data.results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const keywords = formData.get('keywords').split(',').map(k => k.trim()).filter(k => k);
    const iptcSubjects = Array.from(formData.getAll('iptc_subjects'));
    
    const articleData = {
      title: formData.get('title'),
      content: formData.get('content'),
      author: formData.get('author'),
      publication: formData.get('publication'),
      language: formData.get('language'),
      keywords: keywords,
      iptc_subjects: iptcSubjects,
      image_urls: imageUrls.filter(url => url.trim()),
      video_urls: videoUrls.filter(url => url.trim()),
      audio_urls: audioUrls.filter(url => url.trim()),
      based_on_article_id: formData.get('based_on_article_id') || null,
      derivation_type: formData.get('derivation_type') || null,
      url: formData.get('url') || null
    };

    try {
      await axios.post(`${API_URL}/api/articles`, articleData);
      setShowCreateForm(false);
      setImageUrls(['']);
      setVideoUrls(['']);
      setAudioUrls(['']);
      loadArticles();
      loadStats();
      e.target.reset();
    } catch (error) {
      console.error('Error creating article:', error);
      alert('Error creating article');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main" className="skip-link">Skip to main content</a>
      
      <Navbar />

      <main id="main" className="max-w-7xl mx-auto px-4 py-8">
        {stats && (
          <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Statistics</h2>
              <Link to="/statistics" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm">
                View Detailed →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.total_articles}</div>
                <div className="text-sm opacity-90">Total Articles</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.total_authors}</div>
                <div className="text-sm opacity-90">Total Authors</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.articles_by_language?.length || 0}</div>
                <div className="text-sm opacity-90">Languages</div>
              </div>
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
            >
              {showCreateForm ? '✕ Cancel' : '+ Create New Article'}
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <label htmlFor="search" className="sr-only">Search articles</label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title, content, or author..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              type="submit" 
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition-colors"
            >
              🔍 Search
            </button>
          </form>

          {showCreateForm && (
            <form onSubmit={handleCreateArticle} className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Create New Article</h3>
              
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input 
                  id="title" 
                  name="title" 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>

              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                <textarea 
                  id="content" 
                  name="content" 
                  required 
                  rows="6" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="author" className="block text-sm font-semibold text-gray-700 mb-2">Author *</label>
                  <input 
                    id="author" 
                    name="author" 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label htmlFor="publication" className="block text-sm font-semibold text-gray-700 mb-2">Publication *</label>
                  <input 
                    id="publication" 
                    name="publication" 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="language" className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                  <select 
                    id="language" 
                    name="language" 
                    defaultValue="en" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="ro">Romanian</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="keywords" className="block text-sm font-semibold text-gray-700 mb-2">Keywords (comma-separated)</label>
                  <input 
                    id="keywords" 
                    name="keywords" 
                    type="text" 
                    placeholder="AI, technology, research" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">📎 Multimedia (Optional)</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                  {imageUrls.map((url, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input 
                        type="url" 
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...imageUrls];
                          newUrls[i] = e.target.value;
                          setImageUrls(newUrls);
                        }}
                        placeholder="https://example.com/image.jpg" 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
                      />
                      {imageUrls.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setImageUrls([...imageUrls, ''])}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Image
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
                  {videoUrls.map((url, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input 
                        type="url" 
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...videoUrls];
                          newUrls[i] = e.target.value;
                          setVideoUrls(newUrls);
                        }}
                        placeholder="https://youtube.com/embed/..." 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
                      />
                      {videoUrls.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setVideoUrls(videoUrls.filter((_, idx) => idx !== i))}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setVideoUrls([...videoUrls, ''])}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Video
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Audio/Podcasts</label>
                  {audioUrls.map((url, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input 
                        type="url" 
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...audioUrls];
                          newUrls[i] = e.target.value;
                          setAudioUrls(newUrls);
                        }}
                        placeholder="https://example.com/podcast.mp3" 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
                      />
                      {audioUrls.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setAudioUrls(audioUrls.filter((_, idx) => idx !== i))}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setAudioUrls([...audioUrls, ''])}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Audio
                  </button>
                </div>
              </div>

              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">🔗 Provenance (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="based_on_article_id" className="block text-sm font-medium text-gray-700 mb-1">Based on Article</label>
                    <select 
                      id="based_on_article_id" 
                      name="based_on_article_id" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Original)</option>
                      {articles.map(a => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="derivation_type" className="block text-sm font-medium text-gray-700 mb-1">Derivation Type</label>
                    <select 
                      id="derivation_type" 
                      name="derivation_type" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Derivation">General Derivation</option>
                      <option value="Translation">Translation</option>
                      <option value="Revision">Revision/Update</option>
                      <option value="Summary">Summary</option>
                      <option value="Quotation">Quotation</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">Original Source URL</label>
                    <input 
                      id="url" 
                      name="url" 
                      type="url" 
                      placeholder="https://nytimes.com/article/..." 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="iptc_subjects" className="block text-sm font-semibold text-gray-700 mb-2">IPTC Subject Codes</label>
                <select 
                  id="iptc_subjects" 
                  name="iptc_subjects" 
                  multiple 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  size="4"
                >
                  <option value="04000000">Economy, business and finance</option>
                  <option value="11000000">Politics</option>
                  <option value="15000000">Science and technology</option>
                  <option value="01000000">Arts, culture and entertainment</option>
                  <option value="10000000">Health</option>
                  <option value="16000000">Sport</option>
                  <option value="14000000">Social issue</option>
                  <option value="06000000">Education</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '⏳ Creating...' : '✓ Create Article'}
              </button>
            </form>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Articles ({articles.length})
          </h2>
          
          {articles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No articles found. Create your first article!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {articles.map((article) => (
                <article 
                  key={article.id}
                  vocab="http://schema.org/"
                  typeof="NewsArticle"
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                >
                  <h3 property="headline" className="text-2xl font-bold text-gray-900 mb-3">
                    {article.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                    <span property="author" typeof="Person" className="flex items-center gap-1">
                      <span className="font-semibold">👤</span>
                      <span property="name">{article.author}</span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span property="publisher" typeof="Organization" className="flex items-center gap-1">
                      <span className="font-semibold">📰</span>
                      <span property="name">{article.publication}</span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span property="inLanguage" className="flex items-center gap-1">
                      <span className="font-semibold">🌐</span>
                      {article.language.toUpperCase()}
                    </span>
                  </div>

                  <p property="articleBody" className="text-gray-700 mb-4 line-clamp-3">
                    {article.content}
                  </p>

                  <div className="flex gap-3">
                    <Link 
                      to={`/articles/${article.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      View Full Article →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>&copy; 2026 WeP Platform - Web News Provenance</p>
          <p className="text-sm mt-2">Built with W3C PROV, Schema.org, and Semantic Web Technologies</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
