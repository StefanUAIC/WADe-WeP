import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

function ProvenanceGraph({ data }) {
  const svgRef = useRef();
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState('drag');
  const nodesRef = useRef([]);
  const gRef = useRef(null);

  useEffect(() => {
    if (!data || !data.entity) return;

    const width = 1000;
    const height = 500;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Interactive provenance graph visualization')
      .style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      .style('border-radius', '8px');

    const g = svg.append('g');
    gRef.current = g;

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    if (nodesRef.current.length === 0) {
      nodesRef.current = [
        { id: 'entity', label: 'Entity', sublabel: 'NewsArticle', x: 500, y: 250, type: 'entity' },
        { id: 'activity', label: 'Activity', sublabel: 'Creation', x: 300, y: 250, type: 'activity' },
        { id: 'agent', label: 'Agent', sublabel: data.agent?.name || 'Author', x: 100, y: 250, type: 'agent' }
      ];

      if (data.derived_from && data.derived_from.length > 0) {
        data.derived_from.forEach((uri, i) => {
          nodesRef.current.push({
            id: `derived-${i}`,
            label: 'Source',
            sublabel: uri.includes('article') ? 'Article' : 'External',
            x: 700,
            y: 150 + i * 100,
            type: 'derived'
          });
        });
      }

      if (data.related_entities && data.related_entities.length > 0) {
        data.related_entities.slice(0, 3).forEach((uri, i) => {
          nodesRef.current.push({
            id: `entity-${i}`,
            label: 'DBpedia',
            sublabel: uri.split('/').pop().substring(0, 10),
            x: 700,
            y: 350 + i * 80,
            type: 'external'
          });
        });
      }
    }

    const nodes = nodesRef.current;

    const links = [
      { source: nodes[1], target: nodes[0], label: 'generated' },
      { source: nodes[2], target: nodes[1], label: 'associated' }
    ];

    const derivedNodes = nodes.filter(n => n.type === 'derived');
    derivedNodes.forEach(n => {
      links.push({ source: n, target: nodes[0], label: 'derivedFrom' });
    });

    const externalNodes = nodes.filter(n => n.type === 'external');
    externalNodes.forEach(n => {
      links.push({ source: nodes[0], target: n, label: 'mentions' });
    });

    g.append('defs').append('marker')
      .attr('id', 'arrowhead-white')
      .attr('markerWidth', 12)
      .attr('markerHeight', 12)
      .attr('refX', 10)
      .attr('refY', 4)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 12 4, 0 8')
      .attr('fill', 'white');

    const linkElements = links.map(link => {
      const line = g.append('line')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('marker-end', 'url(#arrowhead-white)')
        .style('opacity', 0.9);

      const rect = g.append('rect')
        .attr('width', 140)
        .attr('height', 30)
        .attr('fill', 'rgba(255, 255, 255, 0.2)')
        .attr('rx', 4);

      const text = g.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', 'white')
        .text(link.label);

      return { line, rect, text, link };
    });

    const updateLinks = () => {
      linkElements.forEach(({ line, rect, text, link }) => {
        const source = link.source;
        const target = link.target;
        
        line
          .attr('x1', source.x + 60)
          .attr('y1', source.y)
          .attr('x2', target.x - 60)
          .attr('y2', target.y);

        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;

        rect
          .attr('x', midX - 70)
          .attr('y', midY - 25);

        text
          .attr('x', midX)
          .attr('y', midY - 5);
      });
    };

    updateLinks();

    nodes.forEach(node => {
      const colors = {
        entity: '#10b981',
        activity: '#3b82f6',
        agent: '#f59e0b',
        derived: '#8b5cf6',
        external: '#ec4899'
      };

      const nodeGroup = g.append('g')
        .style('cursor', mode === 'drag' ? 'move' : 'pointer')
        .attr('class', `node-${node.id}`);

      if (mode === 'drag') {
        nodeGroup.call(d3.drag()
          .on('drag', function(event) {
            node.x = event.x;
            node.y = event.y;
            d3.select(this)
              .attr('transform', `translate(${event.x}, ${event.y})`);
            updateLinks();
          }));
      } else {
        nodeGroup.on('click', function() {
          if (node.type === 'derived' || node.type === 'external') {
            const uri = node.type === 'derived' 
              ? (data.derived_from?.[parseInt(node.id.split('-')[1])] || '')
              : (data.related_entities?.[parseInt(node.id.split('-')[1])] || '');
            if (uri) {
              window.open(uri, '_blank');
            }
          }
        });
      }

      nodeGroup.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 60)
        .attr('fill', colors[node.type])
        .attr('stroke', 'white')
        .attr('stroke-width', 4)
        .style('filter', 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))')
        .on('mouseover', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 70);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 60);
        })
        .on('click', function() {
          if (mode === 'click' && (node.type === 'derived' || node.type === 'external')) {
            const uri = node.type === 'derived' 
              ? (data.derived_from?.[parseInt(node.id.split('-')[1])] || '')
              : (data.related_entities?.[parseInt(node.id.split('-')[1])] || '');
            if (uri) {
              window.open(uri, '_blank');
            }
          }
        });

      nodeGroup.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text(node.label);

      nodeGroup.append('text')
        .attr('x', 0)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '13px')
        .style('opacity', 0.9)
        .text(node.sublabel);

      nodeGroup.attr('transform', `translate(${node.x}, ${node.y})`);
    });

  }, [data, mode]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          🔍 Scroll to zoom • Zoom: {zoom.toFixed(1)}x
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('drag')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              mode === 'drag' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🖱️ Drag Mode
          </button>
          <button
            onClick={() => setMode('click')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              mode === 'click' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔗 Click to Open
          </button>
        </div>
      </div>
      <svg ref={svgRef} className="w-full rounded-lg shadow-lg"></svg>
      <div className="mt-4 space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
        <p><span className="font-semibold text-gray-900">📦 Entity:</span> NewsArticle</p>
        <p><span className="font-semibold text-gray-900">⚡ Activity:</span> {data.activity?.uri?.split('/').pop()}</p>
        <p><span className="font-semibold text-gray-900">👤 Agent:</span> {data.agent?.name}</p>
        <p><span className="font-semibold text-gray-900">🕐 Time:</span> {new Date(data.activity?.startTime).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default ProvenanceGraph;
