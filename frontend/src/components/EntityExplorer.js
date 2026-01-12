import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import Navbar from './Navbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function EntityExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dbpediaInfo, setDbpediaInfo] = useState(null);
  const [wikidataResults, setWikidataResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const svgRef = useRef();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setDbpediaInfo(null);
    setWikidataResults(null);

    try {
      const dbpediaUri = `http://dbpedia.org/resource/${searchTerm.replace(/ /g, '_')}`;
      
      const [dbpediaRes, wikidataRes] = await Promise.all([
        axios.get(`${API_URL}/api/dbpedia/entity?uri=${encodeURIComponent(dbpediaUri)}`),
        axios.get(`${API_URL}/api/wikidata/search?q=${encodeURIComponent(searchTerm)}`)
      ]);

      setDbpediaInfo({ uri: dbpediaUri, data: dbpediaRes.data });
      setWikidataResults(wikidataRes.data.results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dbpediaInfo || !wikidataResults) return;

    const width = 900;
    const height = 600;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      .style('border-radius', '8px');

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const nodes = [
      { id: 'center', label: searchTerm, x: 450, y: 300, type: 'center' }
    ];

    const wikidataSameAs = dbpediaInfo.data.results?.bindings
      ?.filter(b => b.property.value.includes('owl#sameAs') && b.value.value.includes('wikidata.org'))
      ?.map(b => b.value.value) || [];

    wikidataSameAs.slice(0, 3).forEach((uri, i) => {
      nodes.push({
        id: `wikidata-sameas-${i}`,
        label: 'Wikidata',
        sublabel: uri.split('/').pop(),
        x: 200 + i * 250,
        y: 150,
        type: 'wikidata',
        uri: uri
      });
    });

    if (wikidataResults && wikidataResults.length > 0) {
      wikidataResults.slice(0, 4).forEach((result, i) => {
        nodes.push({
          id: `wikidata-result-${i}`,
          label: result.itemLabel?.value?.substring(0, 15) || 'Wikidata',
          sublabel: result.item.value.split('/').pop(),
          x: 150 + i * 200,
          y: 450,
          type: 'wikidata',
          uri: result.item.value
        });
      });
    }

    const relatedEntities = dbpediaInfo.data.results?.bindings
      ?.filter(b => b.property.value.includes('seeAlso'))
      ?.slice(0, 5)
      ?.map(b => b.value.value) || [];

    relatedEntities.forEach((uri, i) => {
      const angle = (i / relatedEntities.length) * 2 * Math.PI;
      nodes.push({
        id: `related-${i}`,
        label: uri.split('/').pop().replace(/_/g, ' ').substring(0, 15),
        x: 450 + Math.cos(angle) * 200,
        y: 300 + Math.sin(angle) * 200,
        type: 'related',
        uri: uri
      });
    });

    const links = [];
    nodes.slice(1).forEach(n => {
      links.push({ source: nodes[0], target: n });
    });

    g.append('defs').append('marker')
      .attr('id', 'arrow-explorer')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', 'white');

    const linkElements = links.map(link => {
      return g.append('line')
        .attr('x1', link.source.x)
        .attr('y1', link.source.y)
        .attr('x2', link.target.x)
        .attr('y2', link.target.y)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrow-explorer)')
        .style('opacity', 0.6);
    });

    const updateLinks = () => {
      links.forEach((link, i) => {
        linkElements[i]
          .attr('x1', link.source.x)
          .attr('y1', link.source.y)
          .attr('x2', link.target.x)
          .attr('y2', link.target.y);
      });
    };

    const colors = {
      center: '#f59e0b',
      wikidata: '#06b6d4',
      related: '#ec4899'
    };

    nodes.forEach(node => {
      const nodeGroup = g.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .style('cursor', 'move')
        .call(d3.drag()
          .on('drag', function(event) {
            node.x = event.x;
            node.y = event.y;
            d3.select(this).attr('transform', `translate(${event.x}, ${event.y})`);
            updateLinks();
          }))
        .on('click', () => {
          if (node.uri) {
            window.open(node.uri, '_blank');
          }
        });

      nodeGroup.append('circle')
        .attr('r', node.type === 'center' ? 70 : 50)
        .attr('fill', colors[node.type])
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))')
        .on('mouseover', function() {
          d3.select(this).transition().duration(200).attr('r', node.type === 'center' ? 80 : 60);
        })
        .on('mouseout', function() {
          d3.select(this).transition().duration(200).attr('r', node.type === 'center' ? 70 : 50);
        });

      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', node.sublabel ? -5 : 5)
        .attr('fill', 'white')
        .attr('font-size', node.type === 'center' ? '16px' : '13px')
        .attr('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(node.label);

      if (node.sublabel) {
        nodeGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 10)
          .attr('fill', 'white')
          .attr('font-size', '11px')
          .style('opacity', 0.9)
          .style('pointer-events', 'none')
          .text(node.sublabel);
      }
    });

  }, [dbpediaInfo, wikidataResults, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔍 Entity Explorer</h1>
          <p className="text-gray-600">
            Explore entities from DBpedia and Wikidata with visual knowledge graph
          </p>
        </header>

        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <label htmlFor="search" className="block text-lg font-semibold text-gray-900 mb-3">
            Search Entity
          </label>
          <div className="flex gap-3">
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., Elon Musk, Paris, NASA, Albert Einstein..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? '⏳ Searching...' : '🔍 Search'}
            </button>
          </div>
        </form>

        {(dbpediaInfo || wikidataResults) && (
          <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🕸️ Knowledge Graph</h2>
            <p className="text-sm text-gray-600 mb-4">
              🟠 Center: {searchTerm} • 🔵 Cyan: Wikidata • 🔴 Pink: Related • Drag nodes to reposition • Scroll to zoom • Click to open
            </p>
            <svg ref={svgRef} className="w-full rounded-lg shadow-lg"></svg>
          </section>
        )}

        {wikidataResults && wikidataResults.length > 0 && (
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🌐 Wikidata Results ({wikidataResults.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wikidataResults.slice(0, 6).map((result, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    <a 
                      href={result.item.value} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {result.itemLabel?.value || 'Unknown'}
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{result.description?.value || 'No description'}</p>
                  <p className="text-xs text-gray-400">ID: {result.item.value.split('/').pop()}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default EntityExplorer;
