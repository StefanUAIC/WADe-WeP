import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function ProvenanceGraph({ data }) {
  const svgRef = useRef();
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState('drag');
  const nodesRef = useRef([]);
  const nodeGroupsRef = useRef([]);

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

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    const nodes = [
      { id: 'entity', label: 'Entity', sublabel: 'NewsArticle', x: 500, y: 250, type: 'entity' },
      { id: 'activity', label: 'Activity', sublabel: 'Creation', x: 300, y: 250, type: 'activity' },
      { id: 'agent', label: 'Agent', sublabel: data.agent?.name || 'Author', x: 100, y: 250, type: 'agent' }
    ];

    if (data.derived_from && data.derived_from.length > 0) {
      data.derived_from.forEach((uri, i) => {
        let displayUri = uri;
        let isInternal = uri.includes('/article/');
        
        if (isInternal) {
          const articleId = uri.split('/article/').pop();
          displayUri = `/articles/${articleId}`;
        }
        
        nodes.push({
          id: `derived-${i}`,
          label: 'Source',
          sublabel: isInternal ? 'Article' : 'External',
          x: 700,
          y: 150 + i * 100,
          type: 'derived',
          uri: displayUri,
          isInternal: isInternal
        });
      });
    }

    if (data.related_entities && data.related_entities.length > 0) {
      data.related_entities.slice(0, 3).forEach((uri, i) => {
        const isWikidata = uri.includes('wikidata.org');
        const label = uri.split('/').pop();
        
        nodes.push({
          id: `entity-${i}`,
          label: isWikidata ? 'Wikidata' : 'DBpedia',
          sublabel: label.substring(0, 12),
          x: 700,
          y: 350 + i * 80,
          type: isWikidata ? 'wikidata' : 'external',
          uri: uri
        });
      });
    }

    if (data.wikidata_entities && data.wikidata_entities.length > 0) {
      data.wikidata_entities.forEach((uri, i) => {
        if (!data.related_entities || !data.related_entities.includes(uri)) {
          nodes.push({
            id: `wikidata-${i}`,
            label: 'Wikidata',
            sublabel: uri.split('/').pop(),
            x: 850,
            y: 200 + i * 100,
            type: 'wikidata',
            uri: uri
          });
        }
      });
    }

    nodesRef.current = nodes;

    const links = [
      { source: nodes[1], target: nodes[0], label: 'generated' },
      { source: nodes[2], target: nodes[1], label: 'associated' }
    ];

    nodes.filter(n => n.type === 'derived').forEach(n => {
      links.push({ source: n, target: nodes[0], label: 'derivedFrom' });
    });

    nodes.filter(n => n.type === 'external').forEach(n => {
      links.push({ source: nodes[0], target: n, label: 'mentions' });
    });

    nodes.filter(n => n.type === 'wikidata').forEach(n => {
      links.push({ source: nodes[0], target: n, label: 'wikidata' });
    });

    nodesRef.current = nodes;

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
      const nodes = nodesRef.current;
      
      const links = [
        { source: nodes[1], target: nodes[0], label: 'generated' },
        { source: nodes[2], target: nodes[1], label: 'associated' }
      ];

      nodes.filter(n => n.type === 'derived').forEach(n => {
        links.push({ source: n, target: nodes[0], label: 'derivedFrom' });
      });

      nodes.filter(n => n.type === 'external').forEach(n => {
        links.push({ source: nodes[0], target: n, label: 'mentions' });
      });

      nodes.filter(n => n.type === 'wikidata').forEach(n => {
        links.push({ source: nodes[0], target: n, label: 'wikidata' });
      });

      linkElements.forEach((linkEl, i) => {
        if (links[i]) {
          const link = links[i];
          linkEl.line
            .attr('x1', link.source.x + 60)
            .attr('y1', link.source.y)
            .attr('x2', link.target.x - 60)
            .attr('y2', link.target.y);

          const midX = (link.source.x + link.target.x) / 2;
          const midY = (link.source.y + link.target.y) / 2;

          linkEl.rect
            .attr('x', midX - 70)
            .attr('y', midY - 25);

          linkEl.text
            .attr('x', midX)
            .attr('y', midY - 5);
        }
      });
    };

    updateLinks();

    const colors = {
      entity: '#10b981',
      activity: '#3b82f6',
      agent: '#f59e0b',
      derived: '#8b5cf6',
      external: '#ec4899',
      wikidata: '#06b6d4'
    };

    nodeGroupsRef.current = [];

    nodes.forEach(node => {
      const nodeGroup = g.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`);

      nodeGroupsRef.current.push({ nodeGroup, node });

      const dragBehavior = d3.drag()
        .on('drag', function(event) {
          node.x = event.x;
          node.y = event.y;
          d3.select(this).attr('transform', `translate(${event.x}, ${event.y})`);
          updateLinks();
        });

      nodeGroup.call(dragBehavior);

      nodeGroup.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 60)
        .attr('fill', colors[node.type])
        .attr('stroke', 'white')
        .attr('stroke-width', 4)
        .style('filter', 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))')
        .style('pointer-events', 'all')
        .on('mouseover', function() {
          d3.select(this).transition().duration(200).attr('r', 70);
        })
        .on('mouseout', function() {
          d3.select(this).transition().duration(200).attr('r', 60);
        });

      nodeGroup.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(node.label);

      const sublabelText = nodeGroup.append('text')
        .attr('x', 0)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '13px')
        .style('opacity', 0.9)
        .style('pointer-events', 'none')
        .text(node.sublabel);

      if (node.type === 'wikidata' && node.uri) {
        fetch(`${API_URL}/api/wikidata/label?uri=${encodeURIComponent(node.uri)}`)
          .then(r => r.json())
          .then(d => {
            sublabelText.text(d.label.substring(0, 15));
          })
          .catch(() => {});
      }
    });

  }, [data]);

  useEffect(() => {
    nodeGroupsRef.current.forEach(({ nodeGroup, node }) => {
      const circle = nodeGroup.select('circle');
      
      if (mode === 'drag') {
        nodeGroup.style('cursor', 'move').on('click', null);
        circle.on('click', null);
        
        const dragBehavior = d3.drag()
          .on('drag', function(event) {
            node.x = event.x;
            node.y = event.y;
            d3.select(this).attr('transform', `translate(${event.x}, ${event.y})`);
            updateLinksForNode();
          });
        nodeGroup.call(dragBehavior);
      } else {
        nodeGroup.style('cursor', node.uri ? 'pointer' : 'default').on('.drag', null);
        
        if (node.uri) {
          circle.on('click', function(event) {
            event.stopPropagation();
            if (node.isInternal) {
              window.location.href = node.uri;
            } else {
              window.open(node.uri, '_blank');
            }
          });
        } else {
          circle.on('click', null);
        }
      }
    });
  }, [mode]);

  const updateLinksForNode = () => {
    const nodes = nodesRef.current;
    
    const links = [
      { source: nodes[1], target: nodes[0], label: 'generated' },
      { source: nodes[2], target: nodes[1], label: 'associated' }
    ];

    nodes.filter(n => n.type === 'derived').forEach(n => {
      links.push({ source: n, target: nodes[0], label: 'derivedFrom' });
    });

    nodes.filter(n => n.type === 'external').forEach(n => {
      links.push({ source: nodes[0], target: n, label: 'mentions' });
    });

    nodes.filter(n => n.type === 'wikidata').forEach(n => {
      links.push({ source: nodes[0], target: n, label: 'wikidata' });
    });

    linkElements.forEach((linkEl, i) => {
      if (links[i]) {
        const link = links[i];
        linkEl.line
          .attr('x1', link.source.x + 60)
          .attr('y1', link.source.y)
          .attr('x2', link.target.x - 60)
          .attr('y2', link.target.y);

        const midX = (link.source.x + link.target.x) / 2;
        const midY = (link.source.y + link.target.y) / 2;

        linkEl.rect
          .attr('x', midX - 70)
          .attr('y', midY - 25);

        linkEl.text
          .attr('x', midX)
          .attr('y', midY - 5);
      }
    });
  };

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
