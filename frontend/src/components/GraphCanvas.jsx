import React, { useRef, useEffect, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

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

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState(null);



  // Dragging graph
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const justDraggedRef = useRef(false);

  // Zooming
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const MIN_SCALE = 0.25; // 25%
  const MAX_SCALE = 5;    // 500%
  const [inputZoom, setInputZoom] = useState('100');
  const EDGE_STROKE = 3; // default edge thickness
  

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

  const newScale = Math.min(Math.max(scale * wheel, MIN_SCALE), MAX_SCALE);

    // Adjust offset so zoom is centered on mouse
    const newOffsetX = mouseX - zoomCenterX * newScale;
    const newOffsetY = mouseY - zoomCenterY * newScale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const zoomBy = (factor, centerX, centerY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // centerX/centerY are in client coords; default to canvas center
    const cx = centerX ?? (rect.left + rect.width / 2);
    const cy = centerY ?? (rect.top + rect.height / 2);

    const mouseX = cx - rect.left;
    const mouseY = cy - rect.top;

    const zoomCenterX = (mouseX - offset.x) / scale;
    const zoomCenterY = (mouseY - offset.y) / scale;

    const newScale = Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE);

    const newOffsetX = mouseX - zoomCenterX * newScale;
    const newOffsetY = mouseY - zoomCenterY * newScale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const zoomIn = () => zoomBy(1.1);
  const zoomOut = () => zoomBy(1 / 1.1);

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

    const pos = getCanvasPos(e);
    const clickedNode = nodes.find(node =>
      Math.hypot(node.x - pos.x, node.y - pos.y) < node.size + 5
    );

    if (clickedNode) {
      console.log("Dragging node:", clickedNode);
      setDraggingNode(clickedNode.id);
      setDragOffset({
        x: pos.x - clickedNode.x,
        y: pos.y - clickedNode.y,
      });
      return;
    } else {
      isDraggingRef.current = true;  // Pan the whole canvas
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Dragging graph
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setDraggingNode(null);
    setDragOffset({ x: 0, y: 0 });

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

  // ...existing code...

    if (draggingNode !== null) {
      const pos = getCanvasPos(e);
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === draggingNode
            ? {
                ...node,
                x: pos.x - dragOffset.x,
                y: pos.y - dragOffset.y,
              }
            : node
        )
      );
    } else if (isDraggingRef.current) {
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
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (!fromNode || !toNode) continue;

      // compute actual edge start/end points based on node radii so hit testing matches rendering
      const fx = fromNode.x, fy = fromNode.y;
      const tx = toNode.x, ty = toNode.y;
      const dx = tx - fx;
      const dy = ty - fy;
      const len = Math.hypot(dx, dy) || 1;

      const fromOffset = fromNode.size || 15;
      const toOffset = toNode.size || 15;

      const startX = fx + (fromOffset * (dx / len));
      const startY = fy + (fromOffset * (dy / len));
      const endX = tx - (toOffset * (dx / len));
      const endY = ty - (toOffset * (dy / len));

      // distance from point to segment
      const dist = Math.abs((endY - startY) * x - (endX - startX) * y + endX * startY - endY * startX) /
                  Math.hypot(endX - startX, endY - startY);

      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);

      if (dist < 8 && x >= minX - 5 && x <= maxX + 5 && y >= minY - 5 && y <= maxY + 5) {
        return edge;
      }
    }
    return null;
  }, [edges, nodes]); // <--- important to include nodes here



  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply pan and zoom:
    ctx.save();
    ctx.translate(offset.x, offset.y); // Pan
    ctx.scale(scale, scale);            // Zoom

    edges.forEach(edge => {
      const { from: fromId, to: toId, label, weight, directed } = edge;

      const from = nodes.find(node => node.id === fromId);
      const to = nodes.find(node => node.id === toId);

      if (!from || !to) return; // Skip if nodes are not found

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);
      const len = Math.hypot(dx, dy) || 1;

      const fromOffset = from.size || 15;
      const toOffset = to.size || 15;

      const startX = from.x + (fromOffset * (dx / len));
      const startY = from.y + (fromOffset * (dy / len));
      const endX = to.x - (toOffset * (dx / len));
      const endY = to.y - (toOffset * (dy / len));

      // Draw line (thicker)
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    const isSelectedEdge = selectedEdge && selectedEdge.id === edge.id;
    ctx.strokeStyle = '#888';
      ctx.lineWidth = EDGE_STROKE;
      ctx.stroke();
      ctx.lineWidth = 1; // reset

      // Draw arrow if directed — larger and high-contrast
      if (directed) {
        // arrow size scales with edge stroke and node size for clarity
        const arrowSize = Math.max(10, Math.round(EDGE_STROKE * 3), Math.round(Math.min(toOffset, fromOffset) * 0.35));
        const arrowAngle = 0.35;
    const arrowColor = '#888';

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowSize * Math.cos(angle - arrowAngle), endY - arrowSize * Math.sin(angle - arrowAngle));
        ctx.lineTo(endX - arrowSize * Math.cos(angle + arrowAngle), endY - arrowSize * Math.sin(angle + arrowAngle));
        ctx.closePath();
        // fill with same color as stroke and add a subtle dark outline
        ctx.fillStyle = arrowColor;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#333';
        ctx.stroke();
        ctx.lineWidth = 1; // reset
      }

      // Draw label and/or weight at midpoint between actual start/end
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      if ((edge.showWeight ?? true) && weight !== undefined) {
        ctx.fillStyle = "#000";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        const text = `(${weight})`;
        ctx.fillText(text, midX, midY - 8);
      } else {
        // show from-to when weight display is disabled
        const fromLabel = from.label || from.id;
        const toLabel = to.label || to.id;
        ctx.fillStyle = "#000";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        const text = `${fromLabel}-${toLabel}`;
        ctx.fillText(text, midX, midY - 8);
      }
    });


    if (tempEdge) {
      ctx.beginPath();
      ctx.moveTo(tempEdge.from.x , tempEdge.from.y );
      ctx.lineTo(tempEdge.x , tempEdge.y );
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#f59e0b";
      ctx.stroke();
      ctx.setLineDash([]);
    }

    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x , node.y , node.size, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = "#000"; // Add a border to nodes
      ctx.lineWidth = 1;
      ctx.stroke();
  // Set font size proportional to node size so label scales with the vertex
  const fontSize = Math.max(10, Math.round((node.size || 15) * 0.7));
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle"; // Center text vertically
  ctx.fillText(node.label, node.x , node.y );
    });

    ctx.restore();
  }, [scale, offset, nodes, edges, tempEdge]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ...existing code...

  // Keep the zoom input in sync with actual scale
  useEffect(() => {
    setInputZoom(String(Math.round(scale * 100)));
  }, [scale]);

  const applyZoomFromInput = (valStr) => {
    const parsed = parseFloat(valStr);
    if (isNaN(parsed)) {
      setInputZoom(String(Math.round(scale * 100)));
      return;
    }

    const clampedPercent = Math.max(MIN_SCALE * 100, Math.min(MAX_SCALE * 100, parsed));
    const newScale = clampedPercent / 100;

    const canvas = canvasRef.current;
    if (!canvas) {
      setScale(newScale);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const factor = newScale / scale;
    // Use zoomBy to preserve centering logic and clamping
    zoomBy(factor, cx, cy);
  };

  const hideMenus = () => {
    setContextMenuPos({ ...contextMenuPos, show: false });
  };

  const handleClick = (e) => {
    hideMenus();
    if (justDraggedRef.current) return; // skip click after drag
    const { x, y } = getCanvasPos(e);

    // if (mode === 'add-edge' && tempEdge) {
    //   const targetNode = getNodeAt(x, y);
    //   if (targetNode && targetNode !== tempEdge.from) {
    //     setEdges(prev => [...prev, { from: tempEdge.from, to: targetNode, label: '', weight: 1, directed: false }]);
    //   }
    //   setMode(null);
    //   setTempEdge(null);
    //   return;
    // }

    if (mode === 'add-edge' && tempEdge) {
      const targetNode = getNodeAt(x, y);
      if (targetNode && targetNode.id !== tempEdge.from.id) { // Fix here: use node IDs
  setEdges(prev => [...prev, { id: `edge-${prev.length + 1}`, from: tempEdge.from.id, to: targetNode.id, label: '', weight: 1, directed: false, showWeight: true }]);
      }
      setMode(null);
      setTempEdge(null);
      return;

    }

    const clickedNode = getNodeAt(x, y);
    const clickedEdge = getEdgeAt(x, y);

    console.log(clickedEdge);
    console.log("Hellooo");

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setSelectedEdge(null); // Deselect edge if node is clicked
      return;
    } else if (clickedEdge) {
      setSelectedEdge(clickedEdge);
      setSelectedNode(null); // Deselect node if edge is clicked
      return;
    } else {
      // Create new node
      setNodes(prev => [
        ...prev,
        {
          id: 'node-' + (prev.length + 1), // or use a custom ID generator
          x,
          y,
          label: `V${prev.length + 1}`,
          size: 15,
          color: '#2563eb'
        }
      ]);

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
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
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
        style={{ cursor: draggingNode !== null ? 'grabbing' : 'default' }}
      ></canvas>
      {/* Zoom controls */}
      <Box sx={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.5, borderRadius: 1 }}>
          <Tooltip title="Zoom in">
            <IconButton size="small" onClick={zoomIn} aria-label="zoom-in">
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom out">
            <IconButton size="small" onClick={zoomOut} aria-label="zoom-out">
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>

        <Paper elevation={6} sx={{ bgcolor: 'rgba(0,0,0,0.75)', color: '#fff', px: 1.25, py: 0.5, borderRadius: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            value={inputZoom}
            onChange={(e) => setInputZoom(e.target.value)}
            onBlur={(e) => applyZoomFromInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyZoomFromInput(e.target.value); }}
            size="small"
            variant="standard"
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
              sx: { color: '#fff', '& .MuiInput-input': { color: '#fff' } }
            }}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            sx={{ width: 64 }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default GraphCanvas;