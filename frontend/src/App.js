import React from 'react';
import { Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <a href="#main" className="skip-link">Skip to main content</a>
      
      <header role="banner">
        <div className="container">
          <h1>WeP - Web News Provenance</h1>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><Link to="/articles">Browse Articles</Link></li>
              <li><Link to="/articles/create">Create Article</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" role="main">
        <div className="container">
          <h2>Welcome to Web News Provenance Platform</h2>
          <p>Track and manage the provenance of online newspaper articles using semantic web technologies.</p>
        </div>
      </main>

      <footer role="contentinfo">
        <div className="container">
          <p>&copy; 2024 WeP Platform</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
