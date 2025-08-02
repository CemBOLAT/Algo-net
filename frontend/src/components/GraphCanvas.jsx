import React, { useRef, useEffect, useCallback, useState } from 'react';
import ContextMenu from './ContextMenu';
import EdgeContextMenu from './EdgeContextMenu';

const GraphCanvas = ({
  nodes,
  setNodes,
  edges,
  setEdges,
  selectedNode,
  setSelectedNode,
  selectedEdge,
  setSelectedEdge,
  mode,
  setMode,
  tempEdge,
  setTempEdge,
}) => {
  const canvasRef = useRef(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0, show: false, type: null });

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getNodeAt = useCallback((x, y) => {
    return nodes.find(n => Math.hypot(n.x - x, n.y - y) <= n.size);
  }, [nodes]);

  const getEdgeAt = useCallback((x, y) => {
    for (const edge of edges) {
      const from = edge.from;
      const to = edge.to;

      const dist = Math.abs((to.y - from.y) * x - (to.x - from.x) * y + to.x * from.y - to.y * from.x) /
                   Math.hypot(to.x - from.x, to.y - from.y);

      // Check if the point is within the bounding box of the edge segment
      const minX = Math.min(from.x, to.x);
      const maxX = Math.max(from.x, to.x);
      const minY = Math.min(from.y, to.y);
      const maxY = Math.max(from.y, to.y);

      const withinX = x >= minX - 5 && x <= maxX + 5;
      const withinY = y >= minY - 5 && y <= maxY + 5;

      if (dist < 8 && withinX && withinY) { // Increased sensitivity slightly for easier clicking
        return edge;
      }
    }
    return null;
  }, [edges]);


  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    edges.forEach(edge => {
      const { from, to, label, weight, directed } = edge;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);
      const offset = from.size || 15; // Use node size for offset

      const startX = from.x + offset * Math.cos(angle);
      const startY = from.y + offset * Math.sin(angle);
      const endX = to.x - offset * Math.cos(angle);
      const endY = to.y - offset * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = "#888";
      ctx.stroke();

      if (directed) {
        const arrowSize = 8; // Slightly larger arrow
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowSize * Math.cos(angle - 0.3), endY - arrowSize * Math.sin(angle - 0.3));
        ctx.lineTo(endX - arrowSize * Math.cos(angle + 0.3), endY - arrowSize * Math.sin(angle + 0.3));
        ctx.closePath();
        ctx.fillStyle = "#888";
        ctx.fill();
      }

      if (label || weight !== undefined) {
        ctx.fillStyle = "#000";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        const text = `${label ? label + ' ' : ''}${weight !== undefined ? '(' + weight + ')' : ''}`;
        ctx.fillText(text.trim(), (from.x + to.x) / 2, (from.y + to.y) / 2 - 8);
      }
    });

    if (tempEdge) {
      ctx.beginPath();
      ctx.moveTo(tempEdge.from.x, tempEdge.from.y);
      ctx.lineTo(tempEdge.x, tempEdge.y);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#f59e0b";
      ctx.stroke();
      ctx.setLineDash([]);
    }

    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = "#000"; // Add a border to nodes
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"; // Center text vertically
      ctx.fillText(node.label, node.x, node.y);
    });
  }, [nodes, edges, tempEdge]);

  useEffect(() => {
    draw();
  }, [draw]);

  const hideMenus = () => {
    setContextMenuPos({ ...contextMenuPos, show: false });
  };

  const handleClick = (e) => {
    hideMenus();
    const { x, y } = getCanvasPos(e);

    if (mode === 'add-edge' && tempEdge) {
      const targetNode = getNodeAt(x, y);
      if (targetNode && targetNode !== tempEdge.from) {
        setEdges(prev => [...prev, { from: tempEdge.from, to: targetNode, label: '', weight: 1, directed: false }]);
      }
      setMode(null);
      setTempEdge(null);
      return;
    }

    const clickedEdge = getEdgeAt(x, y);
    if (clickedEdge) {
      setSelectedEdge(clickedEdge);
      setSelectedNode(null); // Deselect node if edge is clicked
      return;
    }

    const clickedNode = getNodeAt(x, y);
    if (clickedNode) {
      setSelectedNode(clickedNode);
      setSelectedEdge(null); // Deselect edge if node is clicked
    } else {
      // Create new node
      setNodes(prev => [...prev, { x, y, label: `V${prev.length + 1}`, size: 15, color: '#2563eb' }]);
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    hideMenus();
    const { x, y } = getCanvasPos(e);
    const node = getNodeAt(x, y);
    const edge = getEdgeAt(x, y);

    if (node) {
      setSelectedNode(node);
      setSelectedEdge(null);
      setContextMenuPos({ x: e.pageX, y: e.pageY, show: true, type: 'node' });
      ////////////
    } else if (edge) {
      setSelectedEdge(edge);
      setSelectedNode(null);
      setContextMenuPos({ x: e.pageX, y: e.pageY, show: true, type: 'edge' });
    }
  };

  const handleMouseMove = (e) => {
    if (tempEdge) {
      const { x, y } = getCanvasPos(e);
      setTempEdge(prev => ({ ...prev, x, y }));
    }
  };

  const handleSelectVertex = () => {
    // This action means opening the settings, already handled by setSelectedNode
    setContextMenuPos({ ...contextMenuPos, show: false });
  };

  const handleStartAddEdge = () => {
    setMode('add-edge');
    setTempEdge({ from: selectedNode, x: selectedNode.x, y: selectedNode.y });
    
  };

  const handleDeleteVertex = () => {
    if (selectedNode) {
      setNodes(prevNodes => prevNodes.filter(n => n !== selectedNode));
      setEdges(prevEdges => prevEdges.filter(e => e.from !== selectedNode && e.to !== selectedNode));
      setSelectedNode(null);
    }
    setContextMenuPos({ ...contextMenuPos, show: false });
  };

  const handleSelectEdge = () => {
    // This action means opening the settings, already handled by setSelectedEdge
    setContextMenuPos({ ...contextMenuPos, show: false });
  };

  const handleDeleteEdge = () => {
    if (selectedEdge) {
      setEdges(prevEdges => prevEdges.filter(e => e !== selectedEdge));
      setSelectedEdge(null);
    }
    setContextMenuPos({ ...contextMenuPos, show: false });
  };

  return (
    <>
      <canvas
        id="graph-canvas"
        height="600"
        width = "1000"
        className="bg-gray-200  shadow-md rounded"
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
      ></canvas>

      {contextMenuPos.show && contextMenuPos.type === 'node' && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onSelect={handleSelectVertex}
          onAddEdge={handleStartAddEdge}
          onDelete={handleDeleteVertex}
          onClose={hideMenus}
        />
      )}

      {contextMenuPos.show && contextMenuPos.type === 'edge' && (
        <EdgeContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onSelect={handleSelectEdge}
          onDelete={handleDeleteEdge}
          onClose={hideMenus}
        />
      )}
    </>
  );
};

export default GraphCanvas;