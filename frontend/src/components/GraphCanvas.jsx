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
}) => {
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0, show: false, type: null });

  // Stage ref (react-konva)
  const stageRef = useRef(null);

  // Panning flags
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const justDraggedRef = useRef(false);
  const nodeDraggingRef = useRef(false);

  // Zooming
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 5;
  const [inputZoom, setInputZoom] = useState('100');
  const EDGE_STROKE = 3;
  // Tıklama hedefi (ekranda) yaklaşık 24px olsun
  const EDGE_HIT_PX = 24;

  // Yardımcı: Stage içerik koordinatlarında imleç pozisyonı
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

  const zoomIn = () => zoomBy(1.1);
  const zoomOut = () => zoomBy(1 / 1.1);

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

  // Node bulucu (Konva tarafında çoğu hit-test click ile çözülecek, ama add-node için gerekli değil)
  const getNodeAt = useCallback((x, y) => {
    return nodes.find(n => Math.hypot(n.x - x, n.y - y) <= n.size);
  }, [nodes]);

  // Edge çizgisi, node yarıçaplarını dikkate alarak start/end hesapla
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

  // Temp edge imleci güncelle
  const handleStageMouseMove = () => {
    if (!tempEdge) return;
    const p = getPointerInContent();
    if (!p) return;
    setTempEdge(prev => ({ ...prev, x: p.x, y: p.y }));
  };

  // Pan başlat (boş alana basınca)
  const handleStageMouseDown = (e) => {
    if (disabled) return;
    // add-edge sırasında pan başlatmayalım
    if (mode === 'add-edge') return;

    const stage = stageRef.current;
    if (!stage) return;

    // Sadece arka plan tıklamasında pan
    if (e.target === stage) {
      isPanningRef.current = true;
      const p = stage.getPointerPosition();
      if (p) dragStartRef.current = { x: p.x, y: p.y };
    }
  };

  const handleStageMouseUp = () => {
    isPanningRef.current = false;
    // click-sonrası node eklemeyi engellemek için kısa süreli flag
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 0);
  };

  const handleStageMouseMovePan = (e) => {
    if (!isPanningRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;

    const p = stage.getPointerPosition();
    if (!p) return;

    const dx = p.x - dragStartRef.current.x;
    const dy = p.y - dragStartRef.current.y;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      justDraggedRef.current = true;
    }

    dragStartRef.current = { x: p.x, y: p.y };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  // Arka plan click: node ekleme / add-edge tamamlama
  const handleStageClick = (e) => {
    if (disabled) return;
    if (justDraggedRef.current || nodeDraggingRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const p = getPointerInContent();
    if (!p) return;

    // add-edge modunda: boş alana tıklama -> iptal
    if (mode === 'add-edge' && tempEdge) {
      setMode(null);
      setTempEdge(null);
      return;
    }

    // Boş alana tıklandıysa yeni node
    if (e.target === stage) {
      setNodes(prev => [
        ...prev,
        {
          id: 'node-' + (prev.length + 1),
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

  // Zoom input senkronizasyonu
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

    const stage = stageRef.current;
    if (!stage) {
      setScale(newScale);
      return;
    }
    const rect = stage.container().getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const factor = newScale / scale;
    zoomBy(factor, cx, cy);
  };

  const hideMenus = () => {
    setContextMenuPos({ ...contextMenuPos, show: false });
  };

  // Aynı iki düğüm arasındaki tüm kenarları grupla (yönü göz ardı ederek)
  const parallelGroups = useMemo(() => {
    const map = new Map();
    edges.forEach((ed) => {
      const key = ed.from < ed.to ? `${ed.from}__${ed.to}` : `${ed.to}__${ed.from}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ed);
    });
    // Stabil bir sıra için id’ye göre sırala
    for (const arr of map.values()) {
      arr.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }
    return map;
  }, [edges]);

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Stage
        ref={stageRef}
        width={1000}
        height={600}
        onWheel={handleWheel}
        onMouseMove={(e) => { handleStageMouseMove(); handleStageMouseMovePan(e); }}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
        onContextMenu={(e) => { if (!disabled) e.evt.preventDefault(); hideMenus(); }}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        style={{ background: '#e5e7eb', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
      >
        <Layer>
          {/* Edges */}
          {edges.map(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;

            // Self-loop (A->A veya A-A)
            if (from.id === to.id) {
              const n = from;
              const r = n.size || 15;
              const loopR = r * 2.2; // kavis yüksekliği
              // Başlangıç ve bitiş açıları: üst tarafta simetrik (yaklaşık 220° ve 320°)
              const startA = (220 * Math.PI) / 180;
              const endA = (320 * Math.PI) / 180;

              const sx = n.x + Math.cos(startA) * r;
              const sy = n.y + Math.sin(startA) * r;
              const ex = n.x + Math.cos(endA) * r;
              const ey = n.y + Math.sin(endA) * r;

              // İki kontrol noktası düğümün üstünde
              const c1x = n.x - loopR;
              const c1y = n.y - loopR;
              const c2x = n.x + loopR;
              const c2y = n.y - loopR;

              const isSelected = selectedEdge && selectedEdge.id === edge.id;
              const hitWidth = Math.max(EDGE_HIT_PX / scale, EDGE_STROKE);

              const labelText = (edge.showWeight ?? true) && edge.weight !== undefined
                ? `(${edge.weight})`
                : `${n.label || n.id}-${n.label || n.id}`;
              const labelX = n.x;
              const labelY = n.y - loopR - 8;

              const commonProps = {
                stroke: isSelected ? '#f59e0b' : '#888',
                strokeWidth: EDGE_STROKE,
                hitStrokeWidth: hitWidth,
                listening: !disabled,
                onMouseEnter: () => { if (stageRef.current) stageRef.current.container().style.cursor = 'pointer'; },
                onMouseLeave: () => { if (stageRef.current) stageRef.current.container().style.cursor = 'default'; },
                onClick: (e) => { e.cancelBubble = true; if (disabled) return; setSelectedEdge(edge); setSelectedNode(null); },
                onTap: (e) => { e.cancelBubble = true; if (disabled) return; setSelectedEdge(edge); setSelectedNode(null); },
                onContextMenu: (e) => { e.cancelBubble = true; if (disabled) return; e.evt.preventDefault(); setSelectedEdge(edge); setSelectedNode(null); },
              };

              return (
                <Group key={edge.id}>
                  {edge.directed ? (
                    <Arrow
                      points={[sx, sy, c1x, c1y, c2x, c2y, ex, ey]}
                      tension={0.5}
                      pointerLength={Math.max(10, Math.round(EDGE_STROKE * 3), Math.round(r * 0.35))}
                      pointerWidth={Math.max(8, Math.round(EDGE_STROKE * 2))}
                      fill={isSelected ? '#f59e0b' : '#888'}
                      {...commonProps}
                    />
                  ) : (
                    <Line
                      points={[sx, sy, c1x, c1y, c2x, c2y, ex, ey]}
                      tension={0.5}
                      {...commonProps}
                    />
                  )}
                  <Text
                    x={labelX}
                    y={labelY}
                    text={labelText}
                    fontSize={12}
                    fill="#000"
                    align="center"
                    offsetX={labelText.length * 3.5}
                    listening={false}
                  />
                </Group>
              );
            }

            // Kenar uçlarını (yarıçap dikkate alınmış) al
            const [sx0, sy0, ex0, ey0] = getEdgeEndpoints(from, to);

            // Aynı düğüm çifti anahtarı (yönsüz)
            const minId = from.id < to.id ? from.id : to.id;
            const maxId = from.id < to.id ? to.id : from.id;
            const key = `${minId}__${maxId}`;

            const groupAll = parallelGroups.get(key) || [edge];
            // Yöne göre alt gruplar
            const forwardList = groupAll.filter(e => e.from === minId && e.to === maxId);
            const backwardList = groupAll.filter(e => e.from === maxId && e.to === minId);

            const isForward = edge.from === minId && edge.to === maxId;
            const dirList = isForward ? forwardList : backwardList;
            const dirIndex = Math.max(0, dirList.findIndex(e => e.id === edge.id));
            const dirTotal = dirList.length || 1;
            const otherTotal = isForward ? backwardList.length : forwardList.length;
            const dirSign = isForward ? +1 : -1;

            // Paralel çizgiler arası mesafe
            const gap = 14;

            // Yöne özel simetrik offset (karşı yönde kenar varsa ±gap/2 kaydır)
            let offsetIndex = (dirIndex - (dirTotal - 1) / 2);
            if (otherTotal > 0) offsetIndex += 0.5 * dirSign;
            const baseOffset = offsetIndex * gap;

            // KANONIK dik vektör: minId -> maxId doğrultusuna göre hesapla (yön bağımsız)
            const canonFrom = from.id === minId ? from : to;
            const canonTo = from.id === minId ? to : from;
            const cdx = canonTo.x - canonFrom.x;
            const cdy = canonTo.y - canonFrom.y;
            const clen = Math.hypot(cdx, cdy) || 1;
            const perpX = -cdy / clen;
            const perpY =  cdx / clen;

            // Uç noktaları kanonik dik yönde kaydır
            const sx = sx0 + perpX * baseOffset;
            const sy = sy0 + perpY * baseOffset;
            const ex = ex0 + perpX * baseOffset;
            const ey = ey0 + perpY * baseOffset;

            // Eğri kontrol noktası (ortayı dışa bük)
            const mx = (sx + ex) / 2;
            const my = (sy + ey) / 2;
            const controlBoost = 1.2;
            const cx = mx + perpX * baseOffset * controlBoost;
            const cy = my + perpY * baseOffset * controlBoost;

            const isSelected = selectedEdge && selectedEdge.id === edge.id;

            // Etiket: quadratic curve orta noktası ~ 0.25*P0 + 0.5*C + 0.25*P1
            const labelX = 0.25 * sx + 0.5 * cx + 0.25 * ex;
            const labelY = 0.25 * sy + 0.5 * cy + 0.25 * ey;

            // Ekran bazlı sabit tıklama alanı
            const hitWidth = Math.max(EDGE_HIT_PX / scale, EDGE_STROKE);

            const labelText = (edge.showWeight ?? true) && edge.weight !== undefined
              ? `(${edge.weight})`
              : `${from.label || from.id}-${to.label || to.id}`;

            const commonProps = {
              stroke: isSelected ? '#f59e0b' : '#888',
              strokeWidth: EDGE_STROKE,
              hitStrokeWidth: hitWidth,
              listening: !disabled,
              onMouseEnter: () => { if (stageRef.current) stageRef.current.container().style.cursor = 'pointer'; },
              onMouseLeave: () => { if (stageRef.current) stageRef.current.container().style.cursor = 'default'; },
              onClick: (e) => { e.cancelBubble = true; if (disabled) return; setSelectedEdge(edge); setSelectedNode(null); },
              onTap: (e) => { e.cancelBubble = true; if (disabled) return; setSelectedEdge(edge); setSelectedNode(null); },
              onContextMenu: (e) => { e.cancelBubble = true; if (disabled) return; e.evt.preventDefault(); setSelectedEdge(edge); setSelectedNode(null); },
            };

            return (
              <Group key={edge.id}>
                {edge.directed ? (
                  <Arrow
                    points={[sx, sy, cx, cy, ex, ey]}
                    tension={0.5}
                    pointerLength={Math.max(10, Math.round(EDGE_STROKE * 3), Math.round(Math.min(from.size, to.size) * 0.35))}
                    pointerWidth={Math.max(8, Math.round(EDGE_STROKE * 2))}
                    fill={isSelected ? '#f59e0b' : '#888'}
                    {...commonProps}
                  />
                ) : (
                  <Line
                    points={[sx, sy, cx, cy, ex, ey]}
                    tension={0.5}
                    {...commonProps}
                  />
                )}
                <Text
                  x={labelX}
                  y={labelY - 8}
                  text={labelText}
                  fontSize={12}
                  fill="#000"
                  align="center"
                  offsetX={labelText.length * 3.5}
                  listening={false}
                />
              </Group>
            );
          })}

          {/* Temp edge (add-edge modu) */}
          {tempEdge && (
            <Line
              points={[tempEdge.from.x, tempEdge.from.y, tempEdge.x, tempEdge.y]}
              stroke="#f59e0b"
              dash={[4, 4]}
              listening={false}
            />
          )}

          {/* Nodes */}
          {nodes.map(node => (
            <Group
              key={node.id}
              x={node.x}
              y={node.y}
              listening={!disabled}
              onClick={(e) => {
                e.cancelBubble = true;
                if (disabled) return;

                // add-edge tamamlama
                if (mode === 'add-edge' && tempEdge && node.id !== tempEdge.from.id) {
                  setEdges(prev => [
                    ...prev,
                    {
                      id: `edge-${prev.length + 1}`,
                      from: tempEdge.from.id,
                      to: node.id,
                      label: '',
                      weight: 1,
                      directed: false,
                      showWeight: true,
                    }
                  ]);
                  setMode(null);
                  setTempEdge(null);
                  return;
                }

                // normal seçim
                setSelectedNode(node);
                setSelectedEdge(null);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                if (disabled) return;
                // aynı click davranışı
                if (mode === 'add-edge' && tempEdge && node.id !== tempEdge.from.id) {
                  setEdges(prev => [
                    ...prev,
                    {
                      id: `edge-${prev.length + 1}`,
                      from: tempEdge.from.id,
                      to: node.id,
                      label: '',
                      weight: 1,
                      directed: false,
                      showWeight: true,
                    }
                  ]);
                  setMode(null);
                  setTempEdge(null);
                  return;
                }
                setSelectedNode(node);
                setSelectedEdge(null);
              }}
              onContextMenu={(e) => {
                e.cancelBubble = true;
                if (disabled) return;
                e.evt.preventDefault();
                setSelectedNode(node);
                setSelectedEdge(null);
                // add-edge başlat
                setTimeout(() => {
                  setMode('add-edge');
                  setTempEdge({ from: node, x: node.x, y: node.y });
                }, 0);
              }}
              draggable={!disabled}
              onDragStart={() => { nodeDraggingRef.current = true; }}
              onDragMove={(e) => {
                const nx = e.target.x();
                const ny = e.target.y();
                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x: nx, y: ny } : n));
              }}
              onDragEnd={(e) => {
                nodeDraggingRef.current = false;
                setTimeout(() => { justDraggedRef.current = false; }, 0);
              }}
            >
              <Circle
                radius={node.size}
                fill={node.color}
                stroke="#000"
                strokeWidth={1}
              />
              {/* Etiketi tam ortala: width/height = çap, offset = yarıçap */}
              <Text
                text={node.label}
                fontSize={Math.max(10, Math.round((node.size || 15) * 0.7))}
                fill="#fff"
                width={(node.size || 15) * 2}
                height={(node.size || 15) * 2}
                align="center"
                verticalAlign="middle"
                offsetX={node.size || 15}
                offsetY={node.size || 15}
                listening={false}
              />
            </Group>
          ))}
        </Layer>
      </Stage>

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