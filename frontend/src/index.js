import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ArticleDetail from './components/ArticleDetail';
import SPARQLQuery from './components/SPARQLQuery';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        <Route path="/sparql" element={<SPARQLQuery />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
