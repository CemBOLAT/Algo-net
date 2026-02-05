import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { Stage, Layer, Circle, Line, Arrow, Text, Group } from 'react-konva';
import { useI18n } from '../context/I18nContext';

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
  disabled = false,
  showNodeLabels = true,
  showEdgeWeights = true,
  saveToHistory = () => { },
}) => {
  // --- LAYOUT FIX: Parent Container Boyutlandırma ---
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    // İlk yüklemede boyutu al
    updateSize();

    // Pencere değişirse yeniden hesapla
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // --- (Buradan sonrası önceki performans koduyla aynı) ---

  const stageRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const justDraggedRef = useRef(false);
  const nodeDraggingRef = useRef(false);

  // Zooming
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;
  const [inputZoom, setInputZoom] = useState('100');

  const EDGE_STROKE = 2;
  // Zoom seviyesi 0.6'nın altındaysa yazıları gizle
  const showLabels = scale > 0.6 && showNodeLabels;
  const showWeights = scale > 0.6 && showEdgeWeights;

  // ... (Helper fonksiyonlar aynen kalıyor) ...
  const getPointerInContent = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const p = stage.getPointerPosition();
    if (!p) return null;
    return {
      x: (p.x - offset.x) / scale,
      y: (p.y - offset.y) / scale,
    };
  }, [offset, scale]);

  const zoomBy = (factor, centerX, centerY) => {
    const stage = stageRef.current;
    if (!stage) return;
    const containerRect = stage.container().getBoundingClientRect();
    const cx = centerX ?? (containerRect.left + containerRect.width / 2);
    const cy = centerY ?? (containerRect.top + containerRect.height / 2);

    const pointer = { x: cx - containerRect.left, y: cy - containerRect.top };
    const zoomCenter = {
      x: (pointer.x - offset.x) / scale,
      y: (pointer.y - offset.y) / scale,
    };

    const newScale = Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE);
    const newOffsetX = pointer.x - zoomCenter.x * newScale;
    const newOffsetY = pointer.y - zoomCenter.y * newScale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const zoomIn = () => zoomBy(1.2);
  const zoomOut = () => zoomBy(1 / 1.2);

  const handleWheel = (e) => {
    if (disabled) return;
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const zoomIntensity = 0.1;
    const direction = e.evt.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const zoomCenter = {
      x: (pointer.x - offset.x) / scale,
      y: (pointer.y - offset.y) / scale,
    };
    const newScale = Math.min(Math.max(scale * direction, MIN_SCALE), MAX_SCALE);
    const newOffset = {
      x: pointer.x - zoomCenter.x * newScale,
      y: pointer.y - zoomCenter.y * newScale,
    };
    setScale(newScale);
    setOffset(newOffset);
  };

  const getEdgeEndpoints = useCallback((from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const sx = from.x + (from.size * dx / len);
    const sy = from.y + (from.size * dy / len);
    const ex = to.x - (to.size * dx / len);
    const ey = to.y - (to.size * dy / len);
    return [sx, sy, ex, ey];
  }, []);

  const handleStageMouseMove = () => {
    if (!tempEdge) return;
    const p = getPointerInContent();
    if (!p) return;
    setTempEdge(prev => ({ ...prev, x: p.x, y: p.y }));
  };

  const handleStageMouseDown = (e) => {
    if (disabled) return;
    if (mode === 'add-edge') return;
    const stage = stageRef.current;
    if (!stage) return;
    if (e.target === stage) {
      isPanningRef.current = true;
      const p = stage.getPointerPosition();
      if (p) dragStartRef.current = { x: p.x, y: p.y };
    }
  };

  const handleStageMouseUp = () => {
    isPanningRef.current = false;
    setTimeout(() => { justDraggedRef.current = false; }, 0);
  };

  const handleStageMouseMovePan = (e) => {
    if (!isPanningRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const p = stage.getPointerPosition();
    if (!p) return;
    const dx = p.x - dragStartRef.current.x;
    const dy = p.y - dragStartRef.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) justDraggedRef.current = true;
    dragStartRef.current = { x: p.x, y: p.y };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleStageClick = (e) => {
    if (disabled) return;
    if (justDraggedRef.current || nodeDraggingRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const p = getPointerInContent();
    if (!p) return;

    if (mode === 'add-edge' && tempEdge) {
      setMode(null);
      setTempEdge(null);
      return;
    }

    if (e.target === stage) {
      saveToHistory(); // Save state before adding node for undo
      setNodes(prev => [
        ...prev,
        {
          id: `${prev.length + 1}_${Date.now()}`,
          x: p.x,
          y: p.y,
          label: `V${prev.length + 1}`,
          size: 15,
          color: '#2563eb',
        }
      ]);
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  };

  useEffect(() => {
    setInputZoom(String(Math.round(scale * 100)));
  }, [scale]);

  const applyZoomFromInput = (valStr) => {
    const parsed = parseFloat(valStr);
    if (isNaN(parsed)) { setInputZoom(String(Math.round(scale * 100))); return; }
    const clampedPercent = Math.max(MIN_SCALE * 100, Math.min(MAX_SCALE * 100, parsed));
    const newScale = clampedPercent / 100;
    const stage = stageRef.current;
    if (!stage) { setScale(newScale); return; }
    const rect = stage.container().getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const factor = newScale / scale;
    zoomBy(factor, cx, cy);
  };

  const parallelGroups = useMemo(() => {
    const map = new Map();
    edges.forEach((ed) => {
      const key = ed.from < ed.to ? `${ed.from}__${ed.to}` : `${ed.to}__${ed.from}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ed);
    });
    for (const arr of map.values()) {
      arr.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }
    return map;
  }, [edges]);

  // --- i18n ---
  const { t } = useI18n();

  // --- RETURN BLOĞU GÜNCELLENDİ ---
  // Box: containerRef'i tutar ve parent'ın boyutunu alır (%100 width/height)
  // Stage: containerRef'ten gelen boyutları (dimensions.width/height) kullanır.
  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden', // Taşan kısımları gizle
        bgcolor: '#e5e7eb',
        borderRadius: 2
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}   // Dinamik genişlik
        height={dimensions.height} // Dinamik yükseklik
        onWheel={handleWheel}
        onMouseMove={(e) => { handleStageMouseMove(); handleStageMouseMovePan(e); }}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
        onContextMenu={(e) => { if (!disabled) e.evt.preventDefault(); }}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
      >
        <Layer perfectDrawEnabled={false}>
          {/* EDGES */}
          {edges.map(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;

            if (from.id === to.id) {
              // Self Loop Logic
              const n = from;
              const r = n.size || 15;
              const loopR = r * 2.5;
              const startA = (220 * Math.PI) / 180;
              const endA = (320 * Math.PI) / 180;
              const sx = n.x + Math.cos(startA) * r;
              const sy = n.y + Math.sin(startA) * r;
              const ex = n.x + Math.cos(endA) * r;
              const ey = n.y + Math.sin(endA) * r;
              const c1x = n.x - loopR; const c1y = n.y - loopR;
              const c2x = n.x + loopR; const c2y = n.y - loopR;
              const isSelected = selectedEdge && selectedEdge.id === edge.id;
              const labelText = (edge.showWeight ?? true) && edge.weight !== undefined ? `(${edge.weight})` : `${n.label}`;

              return (
                <Group key={edge.id}>
                  <Line
                    points={[sx, sy, c1x, c1y, c2x, c2y, ex, ey]} tension={0.5}
                    stroke={isSelected ? '#f59e0b' : '#999'} strokeWidth={EDGE_STROKE}
                    hitStrokeWidth={10} listening={!disabled}
                    onClick={(e) => { e.cancelBubble = true; if (!disabled) { setSelectedEdge(edge); setSelectedNode(null); } }}
                  />
                  {edge.directed && <Arrow points={[sx, sy, c1x, c1y, c2x, c2y, ex, ey]} tension={0.5} pointerLength={8} pointerWidth={6} fill={isSelected ? '#f59e0b' : '#999'} stroke={isSelected ? '#f59e0b' : '#999'} strokeWidth={EDGE_STROKE} listening={false} />}
                  {showWeights && <Text x={n.x} y={n.y - loopR - 10} text={labelText} fontSize={11} fill="#333" align="center" offsetX={labelText.length * 3} listening={false} />}
                </Group>
              );
            }

            // Normal Edge Logic
            const [sx0, sy0, ex0, ey0] = getEdgeEndpoints(from, to);
            const minId = from.id < to.id ? from.id : to.id;
            const maxId = from.id < to.id ? to.id : from.id;
            const key = `${minId}__${maxId}`;
            const groupAll = parallelGroups.get(key) || [edge];

            if (groupAll.length === 1) {
              const isSelected = selectedEdge && selectedEdge.id === edge.id;
              const labelText = (edge.showWeight ?? true) && edge.weight !== undefined ? `${edge.weight}` : '';
              const mx = (sx0 + ex0) / 2; const my = (sy0 + ey0) / 2;
              return (
                <Group key={edge.id}>
                  <Line points={[sx0, sy0, ex0, ey0]} stroke={isSelected ? '#f59e0b' : '#999'} strokeWidth={EDGE_STROKE} hitStrokeWidth={10} listening={!disabled} onClick={(e) => { e.cancelBubble = true; if (!disabled) { setSelectedEdge(edge); setSelectedNode(null); } }} />
                  {edge.directed && <Arrow points={[sx0, sy0, ex0, ey0]} pointerLength={10} pointerWidth={8} fill={isSelected ? '#f59e0b' : '#999'} stroke={isSelected ? '#f59e0b' : '#999'} strokeWidth={EDGE_STROKE} listening={false} />}
                  {showWeights && labelText && <Text x={mx} y={my - 10} text={labelText} fontSize={11} fill="#333" align="center" offsetX={labelText.length * 3} listening={false} />}
                </Group>
              )
            }

            // Parallel/Bezier Logic
            const forwardList = groupAll.filter(e => e.from === minId && e.to === maxId);
            const backwardList = groupAll.filter(e => e.from === maxId && e.to === minId);
            const isForward = edge.from === minId && edge.to === maxId;
            const dirList = isForward ? forwardList : backwardList;
            const dirIndex = Math.max(0, dirList.findIndex(e => e.id === edge.id));
            const dirTotal = dirList.length || 1;
            const otherTotal = isForward ? backwardList.length : forwardList.length;
            const dirSign = isForward ? +1 : -1;
            const gap = 16;
            let offsetIndex = (dirIndex - (dirTotal - 1) / 2);
            if (otherTotal > 0) offsetIndex += 0.5 * dirSign;
            const baseOffset = offsetIndex * gap;

            const cdx = to.x - from.x; const cdy = to.y - from.y;
            const clen = Math.hypot(cdx, cdy) || 1;
            const perpX = -cdy / clen; const perpY = cdx / clen;
            const sx = sx0 + perpX * baseOffset; const sy = sy0 + perpY * baseOffset;
            const ex = ex0 + perpX * baseOffset; const ey = ey0 + perpY * baseOffset;
            const mx = (sx + ex) / 2; const my = (sy + ey) / 2;
            const cx = mx + perpX * baseOffset * 0.5; const cy = my + perpY * baseOffset * 0.5;
            const isSelected = selectedEdge && selectedEdge.id === edge.id;
            const labelX = 0.25 * sx + 0.5 * cx + 0.25 * ex;
            const labelY = 0.25 * sy + 0.5 * cy + 0.25 * ey;
            const labelText = (edge.showWeight ?? true) && edge.weight !== undefined ? `${edge.weight}` : '';

            return (
              <Group key={edge.id}>
                {edge.directed ? (
                  <Arrow points={[sx, sy, cx, cy, ex, ey]} tension={0.5} pointerLength={8} pointerWidth={6} fill={isSelected ? '#f59e0b' : '#999'} stroke={isSelected ? '#f59e0b' : '#999'} strokeWidth={EDGE_STROKE} hitStrokeWidth={10} listening={!disabled} onClick={(e) => { e.cancelBubble = true; if (!disabled) { setSelectedEdge(edge); setSelectedNode(null); } }} />
                ) : (
                  <Line points={[sx, sy, cx, cy, ex, ey]} tension={0.5} stroke={isSelected ? '#f59e0b' : '#999'} strokeWidth={EDGE_STROKE} hitStrokeWidth={10} listening={!disabled} onClick={(e) => { e.cancelBubble = true; if (!disabled) { setSelectedEdge(edge); setSelectedNode(null); } }} />
                )}
                {showWeights && labelText && <Text x={labelX} y={labelY - 8} text={labelText} fontSize={11} fill="#333" align="center" offsetX={labelText.length * 3} listening={false} />}
              </Group>
            );
          })}

          {/* Temp edge */}
          {tempEdge && <Line points={[tempEdge.from.x, tempEdge.from.y, tempEdge.x, tempEdge.y]} stroke="#f59e0b" dash={[4, 4]} listening={false} />}

          {/* Nodes */}
          {nodes.map(node => (
            <Group
              key={node.id}
              x={node.x} y={node.y}
              draggable={!disabled}
              onDragStart={() => { nodeDraggingRef.current = true; }}
              onDragEnd={(e) => {
                nodeDraggingRef.current = false;
                setTimeout(() => { justDraggedRef.current = false; }, 0);
                const nx = e.target.x(); const ny = e.target.y();
                saveToHistory(); // Save state before modifying for undo
                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x: nx, y: ny } : n));
              }}
              onClick={(e) => {
                e.cancelBubble = true; if (disabled) return;
                if (mode === 'add-edge' && tempEdge && node.id !== tempEdge.from.id) {
                  saveToHistory(); // Save state before adding edge for undo
                  setEdges(prev => [...prev, { id: `${prev.length + 1}_${Date.now()}`, from: tempEdge.from.id, to: node.id, label: '', weight: 1, directed: false, showWeight: true }]);
                  setMode(null); setTempEdge(null); return;
                }
                setSelectedNode(node); setSelectedEdge(null);
              }}
              onContextMenu={(e) => {
                e.cancelBubble = true; if (disabled) return; e.evt.preventDefault();
                setSelectedNode(node); setSelectedEdge(null);
                setTimeout(() => { setMode('add-edge'); setTempEdge({ from: node, x: node.x, y: node.y }); }, 0);
              }}
            >
              <Circle radius={node.size} fill={node.color} stroke={selectedNode && selectedNode.id === node.id ? "#000" : null} strokeWidth={selectedNode && selectedNode.id === node.id ? 2 : 0} />
              {showLabels && <Text text={node.label} fontSize={12} fill="#fff" width={node.size * 2} height={node.size * 2} align="center" verticalAlign="middle" offsetX={node.size} offsetY={node.size} listening={false} />}
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* Zoom controls */}
      <Box sx={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.5, borderRadius: 1 }}>
          <Tooltip title={t('zoom_in')}><IconButton size="small" onClick={zoomIn}><ZoomInIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t('zoom_out')}><IconButton size="small" onClick={zoomOut}><ZoomOutIcon fontSize="small" /></IconButton></Tooltip>
        </Paper>
        <Paper elevation={6} sx={{ bgcolor: 'rgba(0,0,0,0.75)', color: '#fff', px: 1.25, py: 0.5, borderRadius: 1 }}>
          <TextField
            value={inputZoom} onChange={(e) => setInputZoom(e.target.value)} onBlur={(e) => applyZoomFromInput(e.target.value)}
            size="small" variant="standard"
            InputProps={{ endAdornment: <InputAdornment position="end" sx={{ '& p': { color: 'white' } }}>%</InputAdornment>, sx: { color: '#fff', '& .MuiInput-input': { color: '#fff' } } }}
            sx={{ width: 64 }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default React.memo(GraphCanvas);