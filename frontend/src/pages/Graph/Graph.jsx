import React, { useEffect, useState, useCallback, useMemo } from 'react'; // useMemo ve useCallback eklendi
import { useNavigate, useLocation } from 'react-router-dom';
import { clearTokens, getTokens, isTokenExpired, http } from '../../utils/auth';
import GraphCanvas from '../../components/GraphCanvas';
import Sidebar from '../../components/Sidebar';
import VertexSettings from '../../components/VertexSettings';
import EdgeSettings from '../../components/EdgeSettings';
import TopBar from '../../components/TopBar';
import FlashMessage from '../../components/FlashMessage';
import LegendPanel from '../../components/LegendPanel';
import { Box, Paper, Button, TextField, Stack, Typography } from '@mui/material';
import { useI18n } from '../../context/I18nContext';

const Graph = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useI18n();
    
    // Graph Data States (Canvas'ı etkileyenler)
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [mode, setMode] = useState(null);
    const [tempEdge, setTempEdge] = useState(null);

    // UI States (Canvas'ı ETKİLEMEMESİ gerekenler)
    const [graphName, setGraphName] = useState('Graph Adı');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [graphId, setGraphId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [hasLegend, setHasLegend] = useState(false);
    const [legendEntries, setLegendEntries] = useState([]);
    const [legendDraft, setLegendDraft] = useState({
        name: '',
        color: '#1976d2',
        attributes: [{ key: '', value: '' }],
    });
    const [showLegendEditor, setShowLegendEditor] = useState(false);

    // --- Helper Functions (useCallback ile sarmalandı) ---

    const showError = useCallback((message) => {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 3000);
    }, []);

    const showSuccess = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 2000);
    }, []);

    const notify = useCallback((type, message, durationMs = 2000) => {
        if (type === 'success') {
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(''), durationMs);
        } else {
            setErrorMessage(message);
            setTimeout(() => setErrorMessage(''), durationMs);
        }
    }, []);

    // --- Effects ---

    useEffect(() => {
        const { refreshToken } = getTokens();
        if (!refreshToken || isTokenExpired(refreshToken, 0)) {
            clearTokens();
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // Bootstrap local storage
    useEffect(() => {
        try {
            const raw = localStorage.getItem('algoNetQuickGraph');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (Array.isArray(saved?.nodes) && saved.nodes.length) {
                setNodes(saved.nodes);
                if (Array.isArray(saved?.edges)) setEdges(saved.edges);
                if (saved?.name) setGraphName(saved.name);
            }
            localStorage.removeItem('algoNetQuickGraph');
        } catch { }
    }, []);

    // Load from router state
    useEffect(() => {
        if (!location?.state) return;
        const { nodes: incomingNodes, edges: incomingEdges, name } = location.state || {};
        if (Array.isArray(incomingNodes) && incomingNodes.length) setNodes(incomingNodes);
        if (Array.isArray(incomingEdges) && incomingEdges.length) setEdges(incomingEdges);
        if (name) setGraphName(name);
    }, []); // Dependency array boş bırakıldı, sadece mount'ta çalışsın

    // Load from API
    const loadGraph = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const graph = await http.get(`/api/graphs/${id}`, { auth: true });
            setGraphId(graph.id);
            setGraphName(graph.name);
            
            const loadedNodes = graph.nodes?.map(node => ({
                id: node.nodeId,
                label: node.label,
                x: node.positionX || Math.random() * 800,
                y: node.positionY || Math.random() * 600,
                size: node.size || 20,
                color: node.color || '#1976d2'
            })) || [];
            
            const loadedEdges = graph.edges?.map(edge => {
                const hasWeight = edge.weight !== null && edge.weight !== undefined;
                return {
                    id: edge.edgeId,
                    from: edge.fromNode,
                    to: edge.toNode,
                    weight: hasWeight ? edge.weight : undefined,
                    directed: edge.isDirected ?? false,
                    showWeight: edge.showWeight !== undefined ? edge.showWeight : hasWeight
                };
            }) || [];
            
            setNodes(loadedNodes);
            setEdges(loadedEdges);
            
            if (graph.hasLegend && Array.isArray(graph.legendEntries)) {
                setHasLegend(true);
                setLegendEntries(graph.legendEntries.map((le) => {
                     const attrs = le.attributes && typeof le.attributes === 'object'
                        ? le.attributes
                        : (() => {
                                const a = {};
                                if (le.capacity !== undefined) a['Kapasite'] = String(le.capacity);
                                if (le.distance !== undefined) a['Uzaklık'] = String(le.distance);
                                const d = le.diameter ?? le.unitDistance;
                                if (d !== undefined) a['Yarıçap'] = String(d);
                                if (le.size !== undefined) a['Boyut'] = String(le.size);
                                return a;
                          })();
                    return { name: le.name, color: le.color, attributes: attrs };
                }));
            } else {
                setHasLegend(false);
                setLegendEntries([]);
            }
            showSuccess('Graph başarıyla yüklendi!');
        } catch (error) {
            if (error.status === 404) {
                showError('Graph bulunamadı');
                navigate('/graph-list');
            } else if (error.status === 403) {
                showError('Bu graph\'a erişim yetkiniz yok');
                navigate('/graph-list');
            } else {
                showError('Graph yüklenirken hata oluştu');
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate, showError, showSuccess]); // Dependencies

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const id = urlParams.get('id');
        if (id) loadGraph(id);
    }, [location.search, loadGraph]);

    // --- Event Handlers (Memoized) ---

    const handleResetGraph = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setLegendEntries([]);
        setHasLegend(false);
        setSelectedEdge(null);
        setMode(null);
        setTempEdge(null);
    }, []);

    const updateDraftAttr = (idx, field, val) => {
        setLegendDraft(prev => ({
            ...prev,
            attributes: prev.attributes.map((r, i) => i === idx ? { ...r, [field]: val } : r)
        }));
    };

    const addDraftAttrRow = () => {
        setLegendDraft(prev => ({ ...prev, attributes: [...prev.attributes, { key: '', value: '' }] }));
    };
    
    const removeDraftAttrRow = (idx) => {
        setLegendDraft(prev => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== idx) }));
    };
    
    const addLegendEntryFromDraft = () => {
        // ... (Logic same as before)
        const name = legendDraft.name?.trim();
        const color = legendDraft.color || '#1976d2';
        if (!name) { showError('Lütfen legend başlığı girin.'); return; }
        const attrs = {};
        (legendDraft.attributes || []).forEach(({ key, value }) => {
            const k = (key ?? '').trim();
            if (!k) return;
            attrs[k] = String(value ?? '');
        });
        setLegendEntries(prev => [...prev, { name, color, attributes: attrs }]);
        setHasLegend(true);
        setLegendDraft({ name: '', color: '#1976d2', attributes: [{ key: '', value: '' }] });
        showSuccess('Legend girdisi eklendi');
    };

    const handleSaveGraph = useCallback(async () => {
        if (isSaving) return;
        
        // State'e erişmek için ref kullanılabilir veya dependency array'e eklenir.
        // Burada nodes ve edges değiştikçe fonksiyon yeniden oluşacak ama bu kabul edilebilir.
        if (!graphName || graphName.trim() === '') { showError('Lütfen graph için bir isim girin.'); return; }
        if (!nodes || nodes.length === 0) { showError('Lütfen en az bir düğüm ekleyin.'); return; }
        
        setIsLoading(true); // isSaving yerine loading overlay kullanalım veya ikisini yönetelim
        setIsSaving(true);

        try {
            const nodesData = nodes.map(node => ({
                nodeId: node.id,
                label: node.label || node.id,
                size: node.size || 15,
                color: node.color || '#2563eb',
                positionX: node.x,
                positionY: node.y
            }));

            const edgesData = edges.map(edge => ({
                edgeId: edge.id,
                fromNode: edge.from,
                toNode: edge.to,
                weight: edge.weight !== undefined ? edge.weight : null,
                isDirected: edge.directed ?? false,
                showWeight: edge.showWeight !== undefined ? edge.showWeight : (edge.weight !== undefined)
            }));

            const requestBody = {
                name: graphName.trim(),
                nodes: nodesData,
                edges: edgesData,
                hasLegend: hasLegend && legendEntries.length > 0,
                legendEntries: (hasLegend ? legendEntries.map(e => {
                    const attrs = e.attributes || {};
                    const cap = attrs.Kapasite !== undefined ? Number(attrs.Kapasite) : (e.capacity !== undefined ? Number(e.capacity) : 0);
                    const dist = attrs.Uzaklık !== undefined ? Number(attrs.Uzaklık) : (e.distance !== undefined ? Number(e.distance) : 0);
                    const diam = attrs.Yarıçap !== undefined ? Number(attrs.Yarıçap) : (e.diameter !== undefined ? Number(e.diameter) : 0);
                    const sz = attrs.Boyut !== undefined ? Number(attrs.Boyut) : (e.size !== undefined ? Number(e.size) : 0);
                    return {
                        name: e.name || 'Legend',
                        color: e.color || '#1976d2',
                        attributes: attrs,
                        capacity: cap, distance: dist, diameter: diam, size: sz,
                    };
                }) : []),
            };

            const method = graphId ? 'PUT' : 'POST';
            const data = graphId
                ? await http.put(`/api/graphs/${graphId}`, requestBody, { auth: true })
                : await http.post('/api/graphs/save', requestBody, { auth: true });

            if (!graphId) {
                setGraphId(data.graphId);
                window.history.replaceState({}, '', `/graph?id=${data.graphId}`);
            }
            showSuccess(`Graph başarıyla ${graphId ? 'güncellendi' : 'kaydedildi'}!`);
        } catch (error) {
            const msg = error.data?.message || 'Graph kaydedilirken hata oluştu.';
            showError(`Kaydetme hatası: ${msg}`);
        } finally {
            setIsSaving(false);
            setIsLoading(false);
        }
    }, [isSaving, graphName, nodes, edges, hasLegend, legendEntries, graphId, showError, showSuccess]);

    // Keyboard handler
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Enter') {
                if (selectedNode) {
                    setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
                    setEdges(prev => prev.filter(ed => ed.from !== selectedNode.id && ed.to !== selectedNode.id));
                    setSelectedNode(null);
                } else if (selectedEdge) {
                    setEdges(prev => prev.filter(ed => ed.id !== selectedEdge.id));
                    setSelectedEdge(null);
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedNode, selectedEdge]); // setters are stable

    const handleLogout = () => { clearTokens(); navigate('/login'); };

    // --- PERFORMANCE OPTIMIZATION: Memoize GraphCanvas ---
    // Bu kısım çok önemli. Sadece graph datası değiştiğinde render edilecek.
    // UI state'leri (graphName, legendDraft, messages vb.) değiştiğinde Canvas donmayacak.
    
    const MemoizedGraphCanvas = useMemo(() => (
        <GraphCanvas
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            selectedEdge={selectedEdge}
            setSelectedEdge={setSelectedEdge}
            mode={mode}
            setMode={setMode}
            tempEdge={tempEdge}
            setTempEdge={setTempEdge}
            disabled={isSaving}
        />
    ), [nodes, edges, selectedNode, selectedEdge, mode, tempEdge, isSaving]);


    return (
        <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
            {/* Messages & Overlays */}
            {successMessage && (
                <Box sx={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
                    <FlashMessage severity="success" message={successMessage} />
                </Box>
            )}
            {errorMessage && (
                <Box sx={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
                    <FlashMessage severity="error" message={errorMessage} />
                </Box>
            )}
            {(isLoading || isSaving) && (
                <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.3)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {isSaving ? 'Kaydediliyor...' : 'Yükleniyor...'}
                </Box>
            )}

            <TopBar title={t('graph_simulator')}
                actions={[
                    { label: t('profile'), onClick: () => navigate('/profile'), variant: 'contained', color: 'primary' },
                    { label: t('my_graphs'), onClick: () => navigate('/graph-list'), variant: 'contained', color: 'primary' },
                    { label: t('create_graph'), onClick: () => navigate('/graph-creation'), variant: 'contained', color: 'primary' },
                    { label: t('array_algorithms'), onClick: () => navigate('/array-algorithms'), variant: 'contained', color: 'primary' },
                    { label: t('tree_algorithms'), onClick: () => navigate('/tree-algorithms'), variant: 'contained', color: 'primary' },
                    { label: t('unhcr_info'), onClick: () => navigate('/unhcr'), variant: 'contained', color: 'primary' },
                    { label: 'Legend Ekle', onClick: () => setShowLegendEditor(v => !v), variant: 'contained', color: 'primary', isButton: true },
                    { label: t('logout'), onClick: handleLogout, variant: 'contained', color: 'error' }
                ]}
            />

            <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
                <Box sx={{ borderColor: 'divider' }}>
                    <Sidebar 
                        onReset={handleResetGraph} 
                        onSave={handleSaveGraph}
                        isSaving={isSaving}
                        graphName={graphName} 
                        setGraphName={setGraphName} 
                        setNodes={setNodes}
                        nodes={nodes}
                        setEdges={setEdges}
                        edges={edges}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        notify={notify}
                        hasLegend={hasLegend}
                        setHasLegend={setHasLegend}
                        legendEntries={legendEntries}
                        setLegendEntries={setLegendEntries}
                    />
                </Box>

                <Box component="main" sx={{ flex: 1, position: 'relative', p: 2 }}>
                    
                    {/* OPTIMIZED CANVAS RENDER */}
                    {MemoizedGraphCanvas}

                    {/* Legend Overlay */}
                    {hasLegend && legendEntries.length > 0 && (
                        <Box sx={{ position: 'absolute', right: 16, top: 80 }}>
                            <LegendPanel
                                entries={legendEntries}
                                onDelete={(idx) => {
                                    setLegendEntries(prev => {
                                        const next = prev.filter((_, i) => i !== idx);
                                        if (next.length === 0) setHasLegend(false);
                                        return next;
                                    });
                                    showSuccess('Legend girdisi silindi');
                                }}
                            />
                        </Box>
                    )}

                    {/* Legend Editor Popup */}
                    {showLegendEditor && (
                        <Box sx={{ position: 'absolute', right: 16, top: 200, width: 360, maxWidth: '90vw', zIndex: 10 }}>
                            <Paper elevation={3} sx={{ p: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Legend Ekle</Typography>
                                <Stack spacing={1}>
                                    <TextField
                                        size="small"
                                        label="Başlık"
                                        value={legendDraft.name}
                                        onChange={e => setLegendDraft(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                    <TextField
                                        size="small"
                                        label="Renk (#hex)"
                                        value={legendDraft.color}
                                        onChange={e => setLegendDraft(prev => ({ ...prev, color: e.target.value }))}
                                    />
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Özellikler</Typography>
                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                            {legendDraft.attributes.map((row, idx) => (
                                                <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 0.5 }}>
                                                    <TextField
                                                        size="small" placeholder="Anahtar" value={row.key}
                                                        onChange={e => updateDraftAttr(idx, 'key', e.target.value)}
                                                    />
                                                    <TextField
                                                        size="small" placeholder="Değer" value={row.value}
                                                        onChange={e => updateDraftAttr(idx, 'value', e.target.value)}
                                                    />
                                                    <Button color="error" variant="outlined" size="small" onClick={() => removeDraftAttrRow(idx)}>Sil</Button>
                                                </Box>
                                            ))}
                                            <Button variant="text" size="small" onClick={addDraftAttrRow}>Özellik Ekle</Button>
                                        </Stack>
                                    </Box>
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="contained" size="small" onClick={addLegendEntryFromDraft}>Ekle</Button>
                                        <Button variant="outlined" size="small" onClick={() => setShowLegendEditor(false)}>Kapat</Button>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Box>
                    )}

                    {selectedNode && (
                        <VertexSettings
                            selectedNode={selectedNode}
                            setSelectedNode={setSelectedNode}
                            setNodes={setNodes}
                            setEdges={setEdges}
                            setTempEdge={setTempEdge}
                        />
                    )}

                    {selectedEdge && (
                        <EdgeSettings
                            selectedEdge={selectedEdge}
                            setSelectedEdge={setSelectedEdge}
                            setEdges={setEdges}
                            setTempEdge={setTempEdge}
                            nodes={nodes}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default Graph;