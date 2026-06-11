import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'; // useMemo ve useCallback eklendi
import { useNavigate, useLocation } from 'react-router-dom';
import { clearTokens, getTokens, isTokenExpired, http } from '../../utils/auth';
import GraphCanvas from '../../components/GraphCanvas';
import Sidebar from '../../components/Sidebar';
import VertexSettings from '../../components/VertexSettings';
import EdgeSettings from '../../components/EdgeSettings';
import TopBar from '../../components/TopBar';
import FlashMessage from '../../components/FlashMessage';
import LegendPanel from '../../components/LegendPanel';
import { Box, Paper, Button, TextField, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Autocomplete, Checkbox } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DataArrayIcon from '@mui/icons-material/DataArray';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
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
    // Multi-selection via right-click rubber-band (arrays of ids)
    const [selectedNodeIds, setSelectedNodeIds] = useState([]);
    const [selectedEdgeIds, setSelectedEdgeIds] = useState([]);
    // Clipboard for cut/copy/paste of a selected region
    const clipboardRef = useRef({ nodes: [], edges: [] });
    const pasteSeqRef = useRef(0);

    // Keep selectedNode in sync when algorithms update node properties (color, label, etc.)
    useEffect(() => {
        if (!selectedNode) return;
        const updated = nodes.find(n => n.id === selectedNode.id);
        if (updated && (updated.color !== selectedNode.color || updated.label !== selectedNode.label || updated.size !== selectedNode.size)) {
            setSelectedNode(updated);
        }
    }, [nodes, selectedNode]);
    const [mode, setMode] = useState(null);
    const [tempEdge, setTempEdge] = useState(null);

    // UI States (Canvas'ı ETKİLEMEMESİ gerekenler)
    const [graphName, setGraphName] = useState(t('default_graph_name'));
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [graphId, setGraphId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [hasLegend, setHasLegend] = useState(false);
    const [legendEntries, setLegendEntries] = useState([]);
    const [algorithmResult, setAlgorithmResult] = useState(null);
    const [legendDraft, setLegendDraft] = useState({
        name: '',
        color: '#1976d2',
        attributes: [{ key: '', value: '' }],
    });
    const [showLegendEditor, setShowLegendEditor] = useState(false);

    // Bulk Tools State
    const [showBulkTools, setShowBulkTools] = useState(false);
    const [bulkTab, setBulkTab] = useState(0);
    const [bulkNodeCount, setBulkNodeCount] = useState('');
    const [bulkEdgeFrom, setBulkEdgeFrom] = useState(null);
    const [bulkEdgeTo, setBulkEdgeTo] = useState([]);
    const [bulkEdgeWeight, setBulkEdgeWeight] = useState('');
    const [bulkEdgeColor, setBulkEdgeColor] = useState('#1985d2');
    const [bulkGridRows, setBulkGridRows] = useState('');
    const [bulkGridCols, setBulkGridCols] = useState('');
    const [bulkPathLength, setBulkPathLength] = useState('');
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('dfs');

    // Visibility States
    const [showNodeLabels, setShowNodeLabels] = useState(true);
    const [showEdgeWeights, setShowEdgeWeights] = useState(true);

    // Undo/Redo history state (stores previous node/edge snapshots)
    const historyRef = useRef([]);
    const redoRef = useRef([]);
    const MAX_HISTORY = 50;

    // Save current state to history before changes (clears redo stack)
    const saveToHistory = useCallback(() => {
        historyRef.current = [
            ...historyRef.current.slice(-MAX_HISTORY + 1),
            { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
        ];
        redoRef.current = []; // Clear redo stack on new action
    }, [nodes, edges]);

    // Undo function - saves current state to redo stack before restoring
    const undo = useCallback(() => {
        if (historyRef.current.length === 0) return;
        // Save current state to redo stack before undoing
        redoRef.current = [
            ...redoRef.current.slice(-MAX_HISTORY + 1),
            { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
        ];
        const prevState = historyRef.current.pop();
        if (prevState) {
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            setSelectedNode(null);
            setSelectedEdge(null);
        }
    }, [nodes, edges]);

    // Redo function - restores from redo stack
    const redo = useCallback(() => {
        if (redoRef.current.length === 0) return;
        // Save current state to undo stack before redoing
        historyRef.current = [
            ...historyRef.current.slice(-MAX_HISTORY + 1),
            { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
        ];
        const nextState = redoRef.current.pop();
        if (nextState) {
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setSelectedNode(null);
            setSelectedEdge(null);
        }
    }, [nodes, edges]);

    // --- Bulk Action Handlers ---
    const handleBulkAddNodes = () => {
        const count = parseInt(bulkNodeCount, 10);
        if (isNaN(count) || count <= 0) {
            showError(t('enter_valid_number') || 'Invalid number');
            return;
        }

        saveToHistory();
        const newNodes = [];
        let labelIndex = 1;

        for (let i = 0; i < count; i++) {
            let candidateName = `${labelIndex}`;
            while (
                nodes.some((n) => n.label === candidateName) ||
                newNodes.some((n) => n.label === candidateName)
            ) {
                labelIndex++;
                candidateName = `${labelIndex}`;
            }
            newNodes.push({
                id: Date.now() + Math.random(),
                label: candidateName,
                x: Math.random() * (window.innerWidth * 0.5) + 50,
                y: Math.random() * (window.innerHeight * 0.5) + 50,
                size: 20,
                color: '#1976d2'
            });
            labelIndex++;
        }

        setNodes((prev) => [...prev, ...newNodes]);
        showSuccess(`Added ${count} nodes`);
        setBulkNodeCount('');
        setShowBulkTools(false);
    };

    const handleBulkAddEdges = () => {
        if (!bulkEdgeFrom || !bulkEdgeTo || bulkEdgeTo.length === 0) return;
        saveToHistory();

        const newEdges = [];
        for (const target of bulkEdgeTo) {
            newEdges.push({
                id: Date.now() + Math.random(),
                name: `${bulkEdgeFrom.id}-${target.id}`,
                from: bulkEdgeFrom.id,
                to: target.id,
                weight: bulkEdgeWeight !== '' ? Number(bulkEdgeWeight) : undefined,
                showWeight: true,
                directed: false,
                color: bulkEdgeColor
            });
        }

        setEdges((prev) => [...prev, ...newEdges]);
        showSuccess(`Added ${newEdges.length} edges`);
        setBulkEdgeFrom(null);
        setBulkEdgeTo([]);
        setBulkEdgeWeight('');
        setShowBulkTools(false);
    };

    // Grid graph: rows × cols lattice, each vertex linked to its right and bottom neighbor
    const handleBulkAddGrid = () => {
        const rows = parseInt(bulkGridRows, 10);
        const cols = parseInt(bulkGridCols, 10);
        if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
            showError(t('enter_valid_number') || 'Invalid number');
            return;
        }
        saveToHistory();

        const SPACING = 80;
        const OFFSET_X = 120;
        const OFFSET_Y = 120;
        const stamp = Date.now();
        const usedLabel = (name) => nodes.some(n => n.label === name);

        const newNodes = [];
        const grid = []; // grid[r][c] = node id
        let labelIndex = 1;
        let counter = 0;
        for (let r = 0; r < rows; r++) {
            const rowIds = [];
            for (let c = 0; c < cols; c++) {
                let candidate = `${labelIndex}`;
                while (usedLabel(candidate) || newNodes.some(n => n.label === candidate)) {
                    labelIndex++;
                    candidate = `${labelIndex}`;
                }
                const id = `${stamp}_${counter++}`;
                newNodes.push({
                    id,
                    label: candidate,
                    x: OFFSET_X + c * SPACING,
                    y: OFFSET_Y + r * SPACING,
                    size: 20,
                    color: '#1976d2',
                });
                rowIds.push(id);
                labelIndex++;
            }
            grid.push(rowIds);
        }

        const newEdges = [];
        const addEdge = (from, to) => newEdges.push({
            id: `${stamp}_e${newEdges.length}`,
            from, to, label: '', weight: 1, directed: false, showWeight: true, color: '#9E9E9E',
        });
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (c + 1 < cols) addEdge(grid[r][c], grid[r][c + 1]); // right neighbor
                if (r + 1 < rows) addEdge(grid[r][c], grid[r + 1][c]); // bottom neighbor
            }
        }

        setNodes(prev => [...prev, ...newNodes]);
        setEdges(prev => [...prev, ...newEdges]);
        showSuccess(`Added ${rows}×${cols} grid (${newNodes.length} nodes, ${newEdges.length} edges)`);
        setBulkGridRows('');
        setBulkGridCols('');
        setShowBulkTools(false);
    };

    // Path graph: N vertices in a line, connected sequentially v1—v2—…—vN
    const handleBulkAddPath = () => {
        const len = parseInt(bulkPathLength, 10);
        if (isNaN(len) || len <= 0) {
            showError(t('enter_valid_number') || 'Invalid number');
            return;
        }
        saveToHistory();

        const SPACING = 80;
        const OFFSET_X = 120;
        const OFFSET_Y = 200;
        const stamp = Date.now();
        const usedLabel = (name) => nodes.some(n => n.label === name);

        const newNodes = [];
        const ids = [];
        let labelIndex = 1;
        for (let i = 0; i < len; i++) {
            let candidate = `${labelIndex}`;
            while (usedLabel(candidate) || newNodes.some(n => n.label === candidate)) {
                labelIndex++;
                candidate = `${labelIndex}`;
            }
            const id = `${stamp}_${i}`;
            newNodes.push({
                id,
                label: candidate,
                x: OFFSET_X + i * SPACING,
                y: OFFSET_Y,
                size: 20,
                color: '#1976d2',
            });
            ids.push(id);
            labelIndex++;
        }

        const newEdges = [];
        for (let i = 0; i + 1 < len; i++) {
            newEdges.push({
                id: `${stamp}_e${i}`,
                from: ids[i], to: ids[i + 1], label: '', weight: 1, directed: false, showWeight: true, color: '#9E9E9E',
            });
        }

        setNodes(prev => [...prev, ...newNodes]);
        setEdges(prev => [...prev, ...newEdges]);
        showSuccess(`Added path of ${len} nodes`);
        setBulkPathLength('');
        setShowBulkTools(false);
    };

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

    // Bootstrap local storage — priority: algoNetQuickGraph (hand-off) > algoNetCanvasState (session restore)
    useEffect(() => {
        // 1. Quick-graph hand-off key (always consumed immediately)
        try {
            const raw = localStorage.getItem('algoNetQuickGraph');
            if (raw) {
                const saved = JSON.parse(raw);
                if (Array.isArray(saved?.nodes) && saved.nodes.length) {
                    setNodes(saved.nodes);
                    if (Array.isArray(saved?.edges)) setEdges(saved.edges);
                    if (saved?.name) setGraphName(saved.name);
                }
                localStorage.removeItem('algoNetQuickGraph');
                return; // Hand-off wins; skip session restore
            }
        } catch { }

        // 2. Session restore — only when there is no incoming router state and no ?id= param
        const hasRouterState = !!(location?.state?.nodes?.length);
        const hasUrlId = !!new URLSearchParams(location.search).get('id');
        if (hasRouterState || hasUrlId) return;

        try {
            const raw = localStorage.getItem('algoNetCanvasState');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (Array.isArray(saved?.nodes) && saved.nodes.length) {
                setNodes(saved.nodes);
                if (Array.isArray(saved?.edges)) setEdges(saved.edges);
                if (saved?.name) setGraphName(saved.name);
                if (saved?.graphId) setGraphId(saved.graphId);
            }
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load from router state
    useEffect(() => {
        if (!location?.state) return;
        const { nodes: incomingNodes, edges: incomingEdges, name } = location.state || {};
        if (Array.isArray(incomingNodes) && incomingNodes.length) setNodes(incomingNodes);
        if (Array.isArray(incomingEdges) && incomingEdges.length) {
            setEdges(incomingEdges);
            const isWeighted = incomingEdges.some(e => e.weight !== undefined && e.weight !== null);
            setShowEdgeWeights(isWeighted);
        }
        if (name) setGraphName(name);
    }, [location.state]);

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
                    label: edge.label || '',
                    directed: edge.isDirected ?? false,
                    showWeight: edge.showWeight !== undefined ? edge.showWeight : true,
                    color: edge.color || '#BDBDBD'
                };
            }) || [];

            setNodes(loadedNodes);
            setEdges(loadedEdges);

            // Auto-detect or load visibility options
            if (graph.showEdgeWeights !== undefined) {
                setShowEdgeWeights(graph.showEdgeWeights);
            } else {
                const isWeighted = loadedEdges.some(e => e.weight !== undefined && e.weight !== null);
                setShowEdgeWeights(isWeighted);
            }
            if (graph.showNodeLabels !== undefined) {
                setShowNodeLabels(graph.showNodeLabels);
            }

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
            showSuccess(t('graph_loaded_success'));
        } catch (error) {
            if (error.status === 404) {
                showError(t('graph_not_found'));
                navigate('/graph-list');
            } else if (error.status === 403) {
                showError(t('graph_access_denied'));
                navigate('/graph-list');
            } else {
                showError(t('graph_load_error'));
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

    // Persist canvas state to localStorage on every meaningful change (debounced 400 ms)
    useEffect(() => {
        if (nodes.length === 0 && edges.length === 0) return; // Don't persist empty canvas
        const timer = setTimeout(() => {
            try {
                localStorage.setItem('algoNetCanvasState', JSON.stringify({
                    nodes,
                    edges,
                    name: graphName,
                    graphId,
                }));
            } catch { }
        }, 400);
        return () => clearTimeout(timer);
    }, [nodes, edges, graphName, graphId]);

    // --- Event Handlers (Memoized) ---

    const handleResetGraph = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setLegendEntries([]);
        setHasLegend(false);
        setAlgorithmResult(null);
        setSelectedEdge(null);
        setMode(null);
        setTempEdge(null);
        // Clear persisted canvas so the blank state is not restored on next visit
        try { localStorage.removeItem('algoNetCanvasState'); } catch { }
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
        if (!name) { showError(t('enter_legend_title')); return; }
        const attrs = {};
        (legendDraft.attributes || []).forEach(({ key, value }) => {
            const k = (key ?? '').trim();
            if (!k) return;
            attrs[k] = String(value ?? '');
        });
        setLegendEntries(prev => [...prev, { name, color, attributes: attrs }]);
        setHasLegend(true);
        setLegendDraft({ name: '', color: '#1976d2', attributes: [{ key: '', value: '' }] });
        showSuccess(t('legend_entry_added'));
    };

    const handleSaveGraph = useCallback(async () => {
        if (isSaving) return;

        // State'e erişmek için ref kullanılabilir veya dependency array'e eklenir.
        // Burada nodes ve edges değiştikçe fonksiyon yeniden oluşacak ama bu kabul edilebilir.
        if (!graphName || graphName.trim() === '') { showError(t('enter_graph_name_error')); return; }
        if (!nodes || nodes.length === 0) { showError(t('enter_node_error')); return; }

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
                label: edge.label || '',
                isDirected: edge.directed ?? false,
                showWeight: edge.showWeight !== undefined ? edge.showWeight : true,
                color: edge.color || '#BDBDBD'
            }));

            const requestBody = {
                name: graphName.trim(),
                showNodeLabels,
                showEdgeWeights,
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
            showSuccess(graphId ? t('graph_updated_success') : t('graph_saved_success'));
        } catch (error) {
            const msg = error.data?.message || t('graph_load_error'); // Default generic error if msg missing
            showError(t('save_error', { msg }));
        } finally {
            setIsSaving(false);
            setIsLoading(false);
        }
    }, [isSaving, graphName, nodes, edges, hasLegend, legendEntries, graphId, showError, showSuccess]);

    // Keyboard handler
    useEffect(() => {
        const onKey = (e) => {
            // Ctrl+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
                return;
            }
            // Ctrl+Y for redo (also Ctrl+Shift+Z / Cmd+Shift+Z on Mac)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) {
                e.preventDefault();
                redo();
                return;
            }
            // Copy / Cut / Paste of the rubber-band selection
            if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'C', 'X', 'V'].includes(e.key)) {
                const el = e.target;
                const tag = el?.tagName;
                const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable;
                if (isTyping) return; // let the browser handle text copy/paste in fields

                const key = e.key.toLowerCase();

                if (key === 'c' || key === 'x') {
                    if (selectedNodeIds.length === 0) return;
                    const nodeIdSet = new Set(selectedNodeIds);
                    // Snapshot selected nodes and edges whose both endpoints are selected
                    const copiedNodes = nodes.filter(n => nodeIdSet.has(n.id)).map(n => ({ ...n }));
                    const copiedEdges = edges
                        .filter(ed => nodeIdSet.has(ed.from) && nodeIdSet.has(ed.to))
                        .map(ed => ({ ...ed }));
                    clipboardRef.current = { nodes: copiedNodes, edges: copiedEdges };

                    if (key === 'x') {
                        e.preventDefault();
                        saveToHistory();
                        const edgeIdSet = new Set(selectedEdgeIds);
                        setNodes(prev => prev.filter(n => !nodeIdSet.has(n.id)));
                        setEdges(prev => prev.filter(ed =>
                            !edgeIdSet.has(ed.id) && !nodeIdSet.has(ed.from) && !nodeIdSet.has(ed.to)
                        ));
                        setSelectedNodeIds([]);
                        setSelectedEdgeIds([]);
                        setSelectedNode(null);
                        setSelectedEdge(null);
                    }
                    return;
                }

                if (key === 'v') {
                    const clip = clipboardRef.current;
                    if (!clip || clip.nodes.length === 0) return;
                    e.preventDefault();
                    saveToHistory();
                    const OFFSET = 40;
                    const stamp = `${Date.now()}_${pasteSeqRef.current++}`;
                    const idMap = {};
                    const newNodes = clip.nodes.map((n, i) => {
                        const newId = `${stamp}_${i}`;
                        idMap[n.id] = newId;
                        return { ...n, id: newId, x: (n.x ?? 0) + OFFSET, y: (n.y ?? 0) + OFFSET };
                    });
                    const newEdges = clip.edges.map((ed, i) => ({
                        ...ed,
                        id: `${stamp}_e${i}`,
                        from: idMap[ed.from],
                        to: idMap[ed.to],
                    }));
                    setNodes(prev => [...prev, ...newNodes]);
                    setEdges(prev => [...prev, ...newEdges]);
                    // Select the freshly pasted region
                    setSelectedNodeIds(newNodes.map(n => n.id));
                    setSelectedEdgeIds(newEdges.map(ed => ed.id));
                    setSelectedNode(null);
                    setSelectedEdge(null);
                    return;
                }
            }
            if (e.key === 'Enter' || e.key === 'Delete' || e.key === 'Backspace') {
                // Don't delete graph elements while typing in an input/textarea/contenteditable field
                const el = e.target;
                const tag = el?.tagName;
                const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable;
                if (isTyping) return;

                // Rubber-band multi-selection takes priority
                if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
                    e.preventDefault();
                    saveToHistory();
                    const nodeIdSet = new Set(selectedNodeIds);
                    const edgeIdSet = new Set(selectedEdgeIds);
                    setNodes(prev => prev.filter(n => !nodeIdSet.has(n.id)));
                    setEdges(prev => prev.filter(ed =>
                        !edgeIdSet.has(ed.id) && !nodeIdSet.has(ed.from) && !nodeIdSet.has(ed.to)
                    ));
                    setSelectedNodeIds([]);
                    setSelectedEdgeIds([]);
                    setSelectedNode(null);
                    setSelectedEdge(null);
                    return;
                }

                if (selectedNode) {
                    e.preventDefault();
                    saveToHistory();
                    setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
                    setEdges(prev => prev.filter(ed => ed.from !== selectedNode.id && ed.to !== selectedNode.id));
                    setSelectedNode(null);
                } else if (selectedEdge) {
                    e.preventDefault();
                    saveToHistory();
                    setEdges(prev => prev.filter(ed => ed.id !== selectedEdge.id));
                    setSelectedEdge(null);
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [nodes, edges, selectedNode, selectedEdge, selectedNodeIds, selectedEdgeIds, undo, redo, saveToHistory]); // setters are stable

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
            selectedNodeIds={selectedNodeIds}
            setSelectedNodeIds={setSelectedNodeIds}
            selectedEdgeIds={selectedEdgeIds}
            setSelectedEdgeIds={setSelectedEdgeIds}
            mode={mode}
            setMode={setMode}
            tempEdge={tempEdge}
            setTempEdge={setTempEdge}
            disabled={isSaving}
            showNodeLabels={showNodeLabels}
            showEdgeWeights={showEdgeWeights}
            saveToHistory={saveToHistory}
        />
    ), [nodes, edges, selectedNode, selectedEdge, selectedNodeIds, selectedEdgeIds, mode, tempEdge, isSaving, showNodeLabels, showEdgeWeights, saveToHistory]);


    return (
        <Box sx={{ bgcolor: 'background.default', color: 'text.primary', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                    {isSaving ? t('saving') : t('loading')}
                </Box>
            )}

            <TopBar title=""
                actions={[
                    {
                        label: 'Graphs',
                        icon: <FolderIcon />,
                        menuItems: [
                            { label: t('my_graphs'), onClick: () => navigate('/graph-list'), ariaLabel: t('graph-list') },
                            { label: t('create_graph'), onClick: () => navigate('/graph-creation'), ariaLabel: t('create_graph') }
                        ]
                    },
                    {
                        label: 'Algorithms',
                        icon: <DataArrayIcon />,
                        menuItems: [
                            { label: t('array_algorithms'), onClick: () => navigate('/array-algorithms'), ariaLabel: t('array_algorithms') },
                            { label: t('tree_algorithms'), onClick: () => navigate('/tree-algorithms'), ariaLabel: t('tree_algorithms') }
                        ]
                    },
                    { label: t('unhcr_info'), icon: <InfoIcon />, onClick: () => navigate('/unhcr'), variant: 'contained', color: 'primary', ariaLabel: t('unhcr_info') },
                    {
                        label: 'User',
                        icon: <PersonIcon />,
                        menuItems: [
                            { label: t('profile'), onClick: () => navigate('/profile'), ariaLabel: t('profile') },
                            { label: t('logout'), onClick: handleLogout, color: 'error', ariaLabel: t('logout') }
                        ]
                    }
                ]}
            />

            <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
                <Box sx={{ flexShrink: 0, minWidth: 0, height: '100%', overflow: 'hidden', borderColor: 'divider' }}>
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
                        showNodeLabels={showNodeLabels}
                        setShowNodeLabels={setShowNodeLabels}
                        showEdgeWeights={showEdgeWeights}
                        setShowEdgeWeights={setShowEdgeWeights}
                        algorithmResult={algorithmResult}
                        setAlgorithmResult={setAlgorithmResult}
                        onOpenBulkTools={() => setShowBulkTools(true)}
                        onOpenLegendEditor={() => setShowLegendEditor(v => !v)}
                        selectedAlgorithm={selectedAlgorithm}
                        setSelectedAlgorithm={setSelectedAlgorithm}
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
                                    showSuccess(t('legend_entry_deleted'));
                                }}
                            />
                        </Box>
                    )}

                    {/* Legend Editor Popup */}
                    {showLegendEditor && (
                        <Box sx={{ position: 'absolute', right: 16, top: 200, width: 360, maxWidth: '90vw', zIndex: 10 }}>
                            <Paper elevation={3} sx={{ p: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('add_legend_title')}</Typography>
                                <Stack spacing={1}>
                                    <TextField
                                        size="small"
                                        label={t('title')}
                                        value={legendDraft.name}
                                        onChange={e => setLegendDraft(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                    <TextField
                                        size="small"
                                        label={t('color_hex')}
                                        value={legendDraft.color}
                                        onChange={e => setLegendDraft(prev => ({ ...prev, color: e.target.value }))}
                                    />
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{t('properties')}</Typography>
                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                            {legendDraft.attributes.map((row, idx) => (
                                                <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 0.5 }}>
                                                    <TextField
                                                        size="small" placeholder={t('key')} value={row.key}
                                                        onChange={e => updateDraftAttr(idx, 'key', e.target.value)}
                                                    />
                                                    <TextField
                                                        size="small" placeholder={t('value')} value={row.value}
                                                        onChange={e => updateDraftAttr(idx, 'value', e.target.value)}
                                                    />
                                                    <Button color="error" variant="outlined" size="small" onClick={() => removeDraftAttrRow(idx)}>{t('delete')}</Button>
                                                </Box>
                                            ))}
                                            <Button variant="text" size="small" onClick={addDraftAttrRow}>{t('add_property')}</Button>
                                        </Stack>
                                    </Box>
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="contained" size="small" onClick={addLegendEntryFromDraft}>{t('add')}</Button>
                                        <Button variant="outlined" size="small" onClick={() => setShowLegendEditor(false)}>{t('close')}</Button>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Box>
                    )}

                    {/* Bulk Tools Dialog */}
                    <Dialog open={showBulkTools} onClose={() => setShowBulkTools(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>{t('bulk_tools_title')}</DialogTitle>
                        <DialogContent dividers>
                            <Tabs value={bulkTab} onChange={(e, v) => setBulkTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
                                <Tab label={t('add_vertices_tab')} />
                                <Tab label={t('add_edges_tab')} />
                                <Tab label={t('grid_tab')} />
                                <Tab label={t('path_tab')} />
                            </Tabs>

                            {bulkTab === 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bulk_nodes_desc')}
                                    </Typography>
                                    <TextField
                                        label={t('num_nodes_label')}
                                        type="number"
                                        size="small"
                                        value={bulkNodeCount}
                                        onChange={(e) => setBulkNodeCount(e.target.value)}
                                        inputProps={{ min: 1, max: 100 }}
                                    />
                                    <Button variant="contained" onClick={handleBulkAddNodes}>{t('add_nodes_btn')}</Button>
                                </Box>
                            )}

                            {bulkTab === 1 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bulk_edges_desc')}
                                    </Typography>
                                    <Autocomplete
                                        size="small"
                                        options={nodes}
                                        getOptionLabel={(n) => n.label || String(n.id)}
                                        value={bulkEdgeFrom}
                                        onChange={(e, val) => setBulkEdgeFrom(val)}
                                        renderInput={(params) => <TextField {...params} label={t('from_source_label')} />}
                                    />
                                    <Autocomplete
                                        multiple
                                        size="small"
                                        options={nodes}
                                        disableCloseOnSelect
                                        getOptionLabel={(n) => n.label || String(n.id)}
                                        value={bulkEdgeTo}
                                        onChange={(e, val) => setBulkEdgeTo(val)}
                                        renderOption={(props, option, { selected }) => {
                                            const { key, ...otherProps } = props;
                                            return (
                                                <li key={key} {...otherProps}>
                                                    <Checkbox style={{ marginRight: 8 }} checked={selected} />
                                                    {option.label || String(option.id)}
                                                </li>
                                            );
                                        }}
                                        renderInput={(params) => <TextField {...params} label={t('to_targets_label')} />}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <TextField
                                            size="small" label={t('weight_optional_label')} type="number"
                                            value={bulkEdgeWeight} onChange={(e) => setBulkEdgeWeight(e.target.value)}
                                            sx={{ flex: 1 }}
                                        />
                                        <input
                                            type="color"
                                            value={bulkEdgeColor}
                                            onChange={(e) => setBulkEdgeColor(e.target.value)}
                                            style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                                            title={t('edge_color') || 'Edge Color'}
                                        />
                                    </Box>
                                    <Button variant="contained" onClick={handleBulkAddEdges}>{t('add_edges_btn')}</Button>
                                </Box>
                            )}

                            {bulkTab === 2 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bulk_grid_desc')}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <TextField
                                            label={t('grid_rows_label')}
                                            type="number"
                                            size="small"
                                            value={bulkGridRows}
                                            onChange={(e) => setBulkGridRows(e.target.value)}
                                            inputProps={{ min: 1, max: 50 }}
                                            sx={{ flex: 1 }}
                                        />
                                        <Typography variant="body1" color="text.secondary">×</Typography>
                                        <TextField
                                            label={t('grid_cols_label')}
                                            type="number"
                                            size="small"
                                            value={bulkGridCols}
                                            onChange={(e) => setBulkGridCols(e.target.value)}
                                            inputProps={{ min: 1, max: 50 }}
                                            sx={{ flex: 1 }}
                                        />
                                    </Box>
                                    <Button variant="contained" onClick={handleBulkAddGrid}>{t('add_grid_btn')}</Button>
                                </Box>
                            )}

                            {bulkTab === 3 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('bulk_path_desc')}
                                    </Typography>
                                    <TextField
                                        label={t('path_length_label')}
                                        type="number"
                                        size="small"
                                        value={bulkPathLength}
                                        onChange={(e) => setBulkPathLength(e.target.value)}
                                        inputProps={{ min: 1, max: 200 }}
                                    />
                                    <Button variant="contained" onClick={handleBulkAddPath}>{t('add_path_btn')}</Button>
                                </Box>
                            )}
                        </DialogContent>
                    </Dialog>

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