import React, { useRef, useEffect, useCallback, useState } from 'react';

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

  // Dragging graph
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const justDraggedRef = useRef(false);

  // Zooming
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  

  const handleWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomCenterX = (mouseX - offset.x) / scale;
    const zoomCenterY = (mouseY - offset.y) / scale;

    const newScale = Math.min(Math.max(scale * wheel, 0.2), 5);

    // Adjust offset so zoom is centered on mouse
    const newOffsetX = mouseX - zoomCenterX * newScale;
    const newOffsetY = mouseY - zoomCenterY * newScale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const toCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - offset.x) / scale;
    const y = (clientY - rect.top - offset.y) / scale;
    return { x, y };
  };


  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  // Dragging graph 
  const handleMouseDown = (e) => {
    if (mode === 'add-edge') return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  // Dragging graph
  const handleMouseUp = () => {
    isDraggingRef.current = false;

    // Prevent click action right after dragging for preventing vertex adding
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 0);
  };

  const handleMouseMove = (e) => {
    if (tempEdge) {
      const { x, y } = getCanvasPos(e);
      setTempEdge(prev => ({ ...prev, x, y }));
    }

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        justDraggedRef.current = true; // Mark as drag
      }

      dragStartRef.current = { x: e.clientX, y: e.clientY };
      
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }
  };


  const getNodeAt = useCallback((x, y) => {
    
    return nodes.find(n => Math.hypot((n.x) - x, (n.y) - y) <= n.size);
  }, [nodes]);

  const getEdgeAt = useCallback((x, y) => {
    
    for (const edge of edges) {
      const from = edge.from;
      const to = edge.to;

      const fx = from.x , fy = from.y ;
      const tx = to.x , ty = to.y ;

      const dist = Math.abs((ty - fy) * x - (tx - fx) * y + tx * fy - ty * fx) / 
                  Math.hypot(tx - fx, ty - fy);

      const minX = Math.min(fx, tx);
      const maxX = Math.max(fx, tx);
      const minY = Math.min(fy, ty);
      const maxY = Math.max(fy, ty);

      if (dist < 8 && x >= minX - 5 && x <= maxX + 5 && y >= minY - 5 && y <= maxY + 5) {
        return edge;
      }
    }
    return null;
  }, [edges]);



  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const { x: ox, y: oy } = offsetRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply pan and zoom:
    ctx.save();
    ctx.translate(offset.x, offset.y); // Pan
    ctx.scale(scale, scale);            // Zoom

    edges.forEach(edge => {
      const { from, to, label, weight, directed } = edge;

      const dx = (to.x + ox) - (from.x + ox);
      const dy = (to.y + oy) - (from.y + oy);
      const angle = Math.atan2(dy, dx);
      const offset = from.size || 15; // Use node size for offset

      const startX = from.x + offset * Math.cos(angle) + ox;
      const startY = from.y + offset * Math.sin(angle) + oy;
      const endX = to.x - offset * Math.cos(angle) + ox;
      const endY = to.y - offset * Math.sin(angle) + oy;

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
        ctx.fillText(text.trim(), (from.x + to.x) / 2 + ox, (from.y + to.y) / 2 - 8 + oy);
      }
    });

    if (tempEdge) {
      ctx.beginPath();
      ctx.moveTo(tempEdge.from.x + ox, tempEdge.from.y + oy);
      ctx.lineTo(tempEdge.x + ox, tempEdge.y + oy);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#f59e0b";
      ctx.stroke();
      ctx.setLineDash([]);
    }

    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x + ox, node.y + oy, node.size, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = "#000"; // Add a border to nodes
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"; // Center text vertically
      ctx.fillText(node.label, node.x + ox, node.y + oy);
    });

    ctx.restore();
  }, [scale, offset, nodes, edges, tempEdge]);

  useEffect(() => {
    draw();
  }, [draw]);

  const hideMenus = () => {
    setContextMenuPos({ ...contextMenuPos, show: false });
  };

  const handleClick = (e) => {
    hideMenus();
    if (justDraggedRef.current) return; // skip click after drag
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
      
      setTimeout(() => {
        setMode('add-edge');
        setTempEdge({ from: node, x: node.x, y: node.y });
      }, 0);

    } else if (edge) {
      setSelectedEdge(edge);
      setSelectedNode(null);
      
    }
  };



  return (
    <>
      <canvas
        id="graph-canvas"
        height="600"
        width="1000"
        className="bg-gray-200 shadow-md rounded"
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      ></canvas>
      
    </>
  );
};

export default GraphCanvas;