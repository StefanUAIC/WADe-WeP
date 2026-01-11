import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Articles from './components/Articles';
import CreateArticle from './components/CreateArticle';
import ArticleDetail from './components/ArticleDetail';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/create" element={<CreateArticle />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
