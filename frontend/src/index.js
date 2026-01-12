import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ArticleDetail from './components/ArticleDetail';
import SPARQLQuery from './components/SPARQLQuery';
import SHACLValidation from './components/SHACLValidation';
import Statistics from './components/Statistics';
import EntityExplorer from './components/EntityExplorer';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        <Route path="/sparql" element={<SPARQLQuery />} />
        <Route path="/validate" element={<SHACLValidation />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/explorer" element={<EntityExplorer />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
