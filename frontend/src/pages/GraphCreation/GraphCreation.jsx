import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens, http } from '../../utils/auth';
import { Button, Box, Container } from '@mui/material';
import FlashMessage from '../../components/FlashMessage';
import TopBar from '../../components/TopBar';
import AddIcon from '@mui/icons-material/Add';
import { createFullGraph, edgeExists, createTreeGraph, createStarGraph, createRingGraph, createFullBipartiteGraph } from './utils/graphGenerator';
import './GraphCreation.css';
import WeightEditDialog from './components/WeightEditDialog';
import FileInfoDialog from './components/FileInfoDialog';
import WeightedExampleDialog from './components/WeightedExampleDialog';
import FilePreviewDialog from './components/FilePreviewDialog';
import QuickGraphDialog from './components/QuickGraphDialog';
import { useI18n } from '../../context/I18nContext';

// New small components
import GraphNameOptions from './components/GraphNameOptions';
import VerticesPanel from './components/VerticesPanel';
import EdgesPanel from './components/EdgesPanel';
import BottomActions from './components/BottomActions';

const GraphCreation = () => {
    const navigate = useNavigate();
    const { t } = useI18n();
    // Simple formatter for placeholders like {n}, {m}, etc.
    const tf = (key, params = {}) => {
        const template = t(key);
        return template.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
    };

    const [graphName, setGraphName] = useState('');

    // vertices and edges
    const [vertices, setVertices] = useState([]);
    const [vertexName, setVertexName] = useState('');
    const [vertexError, setVertexError] = useState('');

    const [edges, setEdges] = useState([]);
    const [edgeFormOpen, setEdgeFormOpen] = useState(false);
    const [edgeFrom, setEdgeFrom] = useState('');
    const [edgeTo, setEdgeTo] = useState([]);
    const [edgeWeight, setEdgeWeight] = useState('');
    const [edgeColor, setEdgeColor] = useState('#1985d2'); // default blue ish
    const [edgePage, setEdgePage] = useState(1);
    const edgesPerPage = 5;

    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [directed, setDirected] = useState(true);
    const [weighted, setWeighted] = useState(false);

    const weightedMountedRef = useRef(false);
    const weightedImportInProgressRef = useRef(false);
    const skipWeightedResetRef = useRef(false);
    useEffect(() => {
        if (!weightedMountedRef.current) { weightedMountedRef.current = true; return; }
        if (weightedImportInProgressRef.current) { weightedImportInProgressRef.current = false; return; }
        if (skipWeightedResetRef.current) { skipWeightedResetRef.current = false; return; } // suppress reset (quick graph)
        // Reset edges and form inputs when weighted flag toggles
        setEdges([]);
        setEdgePage(1);
        setEdgeFrom('');
        setEdgeTo('');
        setEdgeWeight('');
        setEdgeColor('#1985d2');
        setCreateSuccess(weighted ? t('weighted_mode_on') : t('weighted_mode_off'));
        setTimeout(() => setCreateSuccess(''), 2000);
    }, [weighted]);

    // file upload preview
    const [filePreviewOpen, setFilePreviewOpen] = useState(false);
    const [filePreviewContent, setFilePreviewContent] = useState('');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);
    const [fileModalOpen, setFileModalOpen] = useState(false);
    const [weightedExampleModalOpen, setWeightedExampleModalOpen] = useState(false);

    const vertexListRef = useRef(null);
    const edgeListRef = useRef(null);

    const [weightEditDialogOpen, setWeightEditDialogOpen] = useState(false);
    const [weightEditEdgeId, setWeightEditEdgeId] = useState(null);
    const [weightEditValue, setWeightEditValue] = useState('');
    const [weightEditError, setWeightEditError] = useState('');

    // Quick graph creation states
    const [quickGraphModalOpen, setQuickGraphModalOpen] = useState(false);
    const [quickGraphType, setQuickGraphType] = useState('full');
    const [quickGraphNodeCount, setQuickGraphNodeCount] = useState(5);
    const [quickGraphLayout, setQuickGraphLayout] = useState('circular');

    const handleLogout = () => {
        clearTokens();
        navigate('/login', { replace: true });
    };

    const handleCanvas = () => {
        // go to graph - tokens kept as-is
        navigate('/graph');
    };

    const handleArray = () => {
        // go to array algorithms - tokens kept as-is
        navigate('/array-algorithms');
    };

    const handleTree = () => {
        // go to tree algorithms - tokens kept as-is
        navigate('/tree-algorithms');
    };

    const addVertex = () => {
        let name = vertexName.trim();
        if (!name) {
            setVertexError(t('vertex_name_required'));
            return;
        }
        if (name.length > 6) {
            setVertexError(t('vertex_name_max'));
            return;
        }
        if (vertices.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
            setVertexError(t('vertex_name_duplicate'));
            return;
        }
        setVertices((v) => [...v, name]);
        setVertexName('');
        setVertexError('');
        requestAnimationFrame(() => {
            if (vertexListRef.current) vertexListRef.current.scrollLeft = vertexListRef.current.scrollWidth;
        });
    };

    const addBulkVertices = (count) => {
        const numCount = Number(count);
        if (isNaN(numCount) || numCount <= 0 || numCount > 100) {
            setVertexError(t('invalid_bulk_count'));
            return;
        }

        const newVertices = [];
        let labelIndex = 1;
        // Generate valid, sequential names
        for (let i = 0; i < numCount; i++) {
            let candidateName = `${labelIndex}`;
            while (
                vertices.some((existing) => existing.toLowerCase() === candidateName.toLowerCase()) ||
                newVertices.some((existing) => existing.toLowerCase() === candidateName.toLowerCase())
            ) {
                labelIndex++;
                candidateName = `${labelIndex}`;
            }
            newVertices.push(candidateName);
            labelIndex++;
        }

        setVertices((v) => [...v, ...newVertices]);
        setVertexError('');
        requestAnimationFrame(() => {
            if (vertexListRef.current) vertexListRef.current.scrollLeft = vertexListRef.current.scrollWidth;
        });
    };

    const removeVertex = (index) => {
        const removedName = vertices[index];
        setVertices((v) => v.filter((_, i) => i !== index));
        setEdges((e) => e.filter((edge) => edge.from !== removedName && edge.to !== removedName));
    };

    const addEdge = () => {
        if (!edgeFrom || !edgeTo || edgeTo.length === 0) return;

        const newEdges = [];
        let hasError = false;

        for (const target of edgeTo) {
            // Check for duplicate edges in undirected graphs
            if (edgeExists(edges, edgeFrom, target, directed)) {
                setCreateError(t('edge_exists_error') + `: ${edgeFrom}-${target}`);
                setTimeout(() => setCreateError(''), 2500);
                hasError = true;
                continue;
            }
            if (weighted) {
                if (edgeWeight === '' || edgeWeight === null || Number.isNaN(Number(edgeWeight))) {
                    setCreateError(t('weight_required_error'));
                    setTimeout(() => setCreateError(''), 2500);
                    hasError = true;
                    continue;
                }
            }
            const name = `${edgeFrom}-${target}`;
            newEdges.push({
                id: Date.now() + Math.random(),
                name,
                from: edgeFrom,
                to: target,
                showDelete: false,
                directed: directed,
                weight: weighted ? Number(edgeWeight) : undefined,
                color: edgeColor
            });
        }

        if (newEdges.length > 0) {
            setEdges((e) => [...e, ...newEdges]);
            setEdgeWeight('');
            setEdgeFrom('');
            setEdgeTo([]);
            setEdgeColor('#1985d2');
            setEdgeFormOpen(false);
            requestAnimationFrame(() => {
                if (edgeListRef.current) edgeListRef.current.scrollLeft = edgeListRef.current.scrollWidth;
            });
        }
    };

    const toggleEdgeDelete = (id) => {
        setEdges((e) => e.map((edge) => (edge.id === id ? { ...edge, showDelete: !edge.showDelete } : edge)));
    };

    const deleteEdge = (id) => {
        setEdges((e) => e.filter((edge) => edge.id !== id));
    };

    const openWeightEditor = (edge) => {
        setWeightEditEdgeId(edge.id);
        setWeightEditValue(edge.weight !== undefined ? String(edge.weight) : '');
        setWeightEditError('');
        setWeightEditDialogOpen(true);
    };

    const closeWeightEditor = () => {
        setWeightEditDialogOpen(false);
        setWeightEditEdgeId(null);
        setWeightEditValue('');
        setWeightEditError('');
    };

    const saveWeightEdit = () => {
        if (weightEditValue === '' || Number.isNaN(Number(weightEditValue))) {
            setWeightEditError(t('enter_valid_number'));
            return;
        }
        const w = Number(weightEditValue);
        setEdges((e) => e.map(edge => edge.id === weightEditEdgeId ? { ...edge, weight: w } : edge));
        closeWeightEditor();
    };

    const scroll = (ref, dir = 'right') => {
        if (!ref?.current) return;
        const el = ref.current;
        const amount = el.clientWidth * 0.6;
        el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
    };

    // Edge de-dup helpers (normalize by endpoints; undirected => order-independent)
    const makeEdgeKey = (from, to, dir) => {
        const a = String(from).trim();
        const b = String(to).trim();
        if (dir === false) {
            return a < b ? `${a}::${b}` : `${b}::${a}`;
        }
        return `${a}->${b}`;
    };
    const dedupeEdges = (list, defaultDirected) => {
        const m = new Map();
        for (const e of list) {
            const dir = typeof e.directed === 'boolean' ? e.directed : defaultDirected;
            const key = makeEdgeKey(e.from, e.to, dir);
            if (!m.has(key)) {
                m.set(key, { ...e, directed: dir });
            } else {
                // prefer last weight/info if duplicate encountered
                const prev = m.get(key);
                m.set(key, { ...prev, ...e, directed: dir, weight: e.weight ?? prev.weight });
            }
        }
        return Array.from(m.values());
    };

    const handleCreate = () => {
        setCreateError('');
        // If weighted graph, ensure any partial edge inputs won't create invalid edges (weight required on add)
        if (weighted && edgeFormOpen && (edgeWeight === '' || edgeWeight === null)) {
            setCreateError(t('weight_required_error'));
            setTimeout(() => setCreateError(''), 3000);
            return;
        }
        if (graphName.trim() === '') {
            setCreateError(t('graph_name_empty'));
            setTimeout(() => setCreateError(''), 3000);
            return;
        }
        if (vertexListRef.current && vertexListRef.current.children.length === 0) {
            setCreateError(t('min_vertices_required'));
            setTimeout(() => setCreateError(''), 3000);
            return;
        }

        // Prepare nodes/edges (no navigation)
        try {
            // dedupe edges before preparing payload
            const uniqueEdges = dedupeEdges(edges, directed);

            // create node objects with simple grid layout
            const preparedNodes = vertices.map((label, idx) => {
                const cols = 6;
                const spacing = 80;
                const x = 100 + (idx % cols) * spacing;
                const y = 100 + Math.floor(idx / cols) * spacing;
                return {
                    id: `${idx + 1}`,
                    x,
                    y,
                    label,
                    size: 15,
                    color: '#2563eb'
                };
            });

            // build edges mapping vertex label -> node id
            const labelToId = {};
            preparedNodes.forEach(n => { labelToId[n.label] = n.id; });

            const preparedEdges = uniqueEdges.map((e, i) => ({
                id: `edge-${i + 1}`,
                from: labelToId[e.from] || `1`,
                to: labelToId[e.to] || `1`,
                label: e.name || '',
                weight: e.weight !== undefined ? e.weight : undefined,
                directed: typeof e.directed === 'boolean' ? e.directed : directed,
                showWeight: true
            }));

            navigate('/graph', { state: { nodes: preparedNodes, edges: preparedEdges, name: graphName.trim() } });

        } catch (err) {
            setCreateError(t('graph_create_error'));
            setTimeout(() => setCreateError(''), 3000);
        }
    };

    // parse content (simple or weighted) and load into vertices/edges
    const parseAndLoad = (content) => {
        const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
            // close any modals and show error
            setFileModalOpen(false);
            setWeightedExampleModalOpen(false);
            setCreateError(t('file_empty'));
            setTimeout(() => setCreateError(''), 3000);
            return;
        }

        const vertexRegex = /^[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}$/;
        const edgeRegex = /^\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}\s*:\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}(\s*,\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6})*\s*$/;
        const weightedEdgeRegex = /^\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}\s*:\s*\(\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}\s*,\s*\d+\s*\)(\s*,\s*\(\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}\s*,\s*\d+\s*\))*\s*$/;

        let badLine = null;
        for (let i = 0; i < lines.length; i++) {
            const ln = lines[i];
            if (vertexRegex.test(ln)) continue;
            if (edgeRegex.test(ln)) continue;
            if (weightedEdgeRegex.test(ln)) continue;
            badLine = { index: i + 1, text: ln };
            break;
        }

        if (badLine) {
            // close modals and show error
            setFileModalOpen(false);
            setWeightedExampleModalOpen(false);
            setCreateError(t('file_format_error'));
            setTimeout(() => setCreateError(''), 3000);
            return;
        }

        const verticesSet = new Set();
        const parsedEdges = [];
        let idCounter = Date.now();
        for (const ln of lines) {
            if (weightedEdgeRegex.test(ln)) {
                const [srcPart, targetsPart] = ln.split(':');
                const src = srcPart.trim();
                verticesSet.add(src);
                const pairRegex = /\(\s*([A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6})\s*,\s*(\d+)\s*\)/g;
                let m;
                while ((m = pairRegex.exec(targetsPart)) !== null) {
                    const t = m[1];
                    const w = Number(m[2]);
                    verticesSet.add(t);
                    parsedEdges.push({ id: idCounter++, name: '', from: src, to: t, showDelete: false, directed: directed, weight: w });
                }
            } else if (edgeRegex.test(ln)) {
                const [srcPart, targetsPart] = ln.split(':');
                const src = srcPart.trim();
                verticesSet.add(src);
                const targets = targetsPart.split(',').map(t => t.trim()).filter(Boolean);
                for (const t of targets) {
                    verticesSet.add(t);
                    parsedEdges.push({ id: idCounter++, name: '', from: src, to: t, showDelete: false, directed: directed, weight: undefined });
                }
            } else if (vertexRegex.test(ln)) {
                verticesSet.add(ln);
            }
        }

        const hasWeights = parsedEdges.some(pe => pe.weight !== undefined);
        if (hasWeights && !weighted) {
            // indicate an import is in progress so the weighted toggle effect doesn't clear these edges
            weightedImportInProgressRef.current = true;
            setWeighted(true);
        }

        // dedupe parsed edges before setting state
        const uniqueParsedEdges = dedupeEdges(parsedEdges, directed);

        setVertices(Array.from(verticesSet));
        setEdges(uniqueParsedEdges);

        // close modals and preview on success
        setFileModalOpen(false);
        setWeightedExampleModalOpen(false);
        setCreateError('');
        setCreateSuccess(t('graph_loaded'));
        setFilePreviewOpen(false);
        try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (err) { /* ignore */ }
        setTimeout(() => setCreateSuccess(''), 3000);
    };

    const handleReset = () => {
        setVertices([]);
        setEdges([]);
        setVertexName('');
        setEdgeFrom('');
        setEdgeTo('');
        setEdgeWeight('');
        setEdgeColor('#1985d2');
        setEdgePage(1);
        setCreateSuccess(t('graph_reset'));
        setTimeout(() => setCreateSuccess(''), 2000);
    };

    const handleQuickGraphCreate = async (spec) => {
        // spec payload from QuickGraphDialog
        if (spec.error) {
            setCreateError(spec.error);
            setQuickGraphModalOpen(false); // Diyaloğu kapat
            setTimeout(() => setCreateError(''), 3000);
            return;
        }
        if (weighted) {
            skipWeightedResetRef.current = true; // prevent effect reset
            setWeighted(false);
        }
        setDirected(false);

        let result = null;
        const type = spec?.quickGraphType;

        try {
            switch (type) {
                case 'full':
                    result = createFullGraph(
                        Number(spec.quickGraphNodeCount || 0),
                        false,
                        false,
                        spec.quickGraphLayout || 'circular'
                    );
                    break;
                case 'tree':
                    result = createTreeGraph(
                        Number(spec.quickGraphNodeCount || 0),
                        Number(spec.treeChildCount || 2)
                    );
                    break;
                case 'star':
                    result = createStarGraph(
                        Number(spec.quickGraphNodeCount || 0),
                        Number(spec.starCenterCount || 1)
                    );
                    break;
                case 'ring':
                    result = createRingGraph(
                        Number(spec.quickGraphNodeCount || 0)
                    );
                    break;
                case 'bipartite':
                    result = createFullBipartiteGraph(
                        Number(spec.bipartiteA || 0),
                        Number(spec.bipartiteB || 0)
                    );
                    break;
                case 'grid': {
                    const rows = Math.max(1, Number(spec.gridRows || 0));
                    const cols = Math.max(1, Number(spec.gridCols || 0));
                    const w = spec.gridWeight !== undefined ? Number(spec.gridWeight) : undefined;

                    const vertices = [];
                    const positions = [];
                    const edges = [];

                    const spacing = 80;
                    const offsetX = 100;
                    const offsetY = 100;
                    const idxAt = (r, c) => r * cols + c;

                    // create vertices and positions
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            const idx = idxAt(r, c);
                            const label = `v${idx + 1}`;
                            vertices.push(label);
                            positions.push({
                                x: offsetX + c * spacing,
                                y: offsetY + r * spacing
                            });
                        }
                    }

                    // connect right and bottom neighbors (undirected)
                    let eid = 1;
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            const fromIdx = idxAt(r, c);
                            const from = vertices[fromIdx];
                            if (c + 1 < cols) {
                                edges.push({ id: eid++, from, to: vertices[idxAt(r, c + 1)], directed: false, weight: w });
                            }
                            if (r + 1 < rows) {
                                edges.push({ id: eid++, from, to: vertices[idxAt(r + 1, c)], directed: false, weight: w });
                            }
                        }
                    }

                    result = { vertices, edges, positions };
                    break;
                }
                case 'Melih': {

                    const Pn = Number(spec.pathLength)
                    const Bn = Number(spec.graphPathLength)
                    const Kn = Number(spec.graphSize)
                    console.log("Bankaii")
                    const nOfKCompleteGraphs = Pn / Bn;

                    const vertices = [];
                    const edges = [];
                    const positions = [];

                    let vertexOffset = 0;
                    let edgeId = 0;

                    // --- Dynamic scaling ---
                    // Inner radius grows gently with the size of Kₙ
                    const innerRadius = 40 + Kn * 10;
                    // Outer radius scales with both number of graphs and inner radius
                    const outerRadius = innerRadius * (2.2 + nOfKCompleteGraphs / 2);

                    for (let i = 0; i < nOfKCompleteGraphs; i++) {
                        // Center of this subgraph on a large circle
                        const angle = (2 * Math.PI * i) / nOfKCompleteGraphs;
                        const centerX = outerRadius * Math.cos(angle);
                        const centerY = outerRadius * Math.sin(angle);

                        // --- Create K_{K_n} complete graph ---
                        const subVertices = Array.from({ length: Kn }, (_, j) => `v${vertexOffset + j}`);
                        const subEdges = [];

                        for (let a = 0; a < Kn; a++) {
                            for (let b = a + 1; b < Kn; b++) {
                                subEdges.push({
                                    id: edgeId++,
                                    name: `e_${subVertices[a]}_${subVertices[b]}`,
                                    from: subVertices[a],
                                    to: subVertices[b],
                                    showDelete: false,
                                    directed: false,
                                    weight: 1,
                                });
                            }
                        }

                        // --- Circular positions for this subgraph ---
                        const subPositions = subVertices.map((_, j) => {
                            const theta = (2 * Math.PI * j) / Kn;
                            return {
                                x: centerX + innerRadius * Math.cos(theta),
                                y: centerY + innerRadius * Math.sin(theta),
                            };
                        });

                        // --- Connect this K_n to the previous one ---
                        if (i > 0) {
                            const prevStart = vertexOffset - (Kn - Bn + 1);
                            const prevVertex = `v${prevStart}`;
                            const currentVertex = `v${vertexOffset}`;
                            subEdges.push({
                                id: edgeId++,
                                name: `bridge_${i - 1}_${i}`,
                                from: prevVertex,
                                to: currentVertex,
                                showDelete: false,
                                directed: false,
                                weight: 1
                            });
                        }

                        vertices.push(...subVertices);
                        edges.push(...subEdges);
                        positions.push(...subPositions);

                        vertexOffset += Kn;
                    }

                    // --- Shift all positions to positive coordinates ---
                    const minX = Math.min(...positions.map(p => p.x));
                    const minY = Math.min(...positions.map(p => p.y));
                    const shiftX = minX < 0 ? -minX + 50 : 0;
                    const shiftY = minY < 0 ? -minY + 50 : 0;
                    const shiftedPositions = positions.map(p => ({
                        x: p.x + shiftX,
                        y: p.y + shiftY,
                    }));

                    result = { vertices, edges, positions: shiftedPositions };
                }

                    break;
                case 'random':
                    // Make request to PythonMS
                    try {
                        const API_BASE = import.meta?.env?.VITE_PYTHON_BASE || '/pythonms';
                        // Pass graph specs down to backend
                        const response = await http.post('/api/generate/', {
                            graphType: 'erdos_renyi', // hardcoded to erdos_renyi for simple random
                            numNodes: Number(spec.quickGraphNodeCount || 5),
                            prob: 0.3
                        }, { apiBase: API_BASE, auth: true });
                        result = { vertices: [], edges: [], positions: [] };
                        if (response && response.nodes) {
                            result.vertices = response.nodes.map(n => n.id);
                            result.positions = response.nodes.map(n => ({ x: n.x, y: n.y }));
                        }
                        if (response && response.edges) {
                            result.edges = response.edges.map(e => ({
                                id: e.id,
                                name: `e_${e.from}_${e.to}`,
                                from: e.from,
                                to: e.to,
                                showDelete: false,
                                directed: false,
                                weight: e.weight,
                                color: e.color
                            }));
                        }
                    } catch (err) {
                        setCreateError(t('quickgraph_err_random_failed'));
                        setTimeout(() => setCreateError(''), 3000);
                        return;
                    }
                    break;
                default:
                    return;
            }

            console.log('Quick graph generated:', result);

            const { vertices: newVertices, edges: newEdges, positions } = result || { vertices: [], edges: [], positions: [] };
            // Fill form lists (optional UX parity)
            setVertices(newVertices);
            setEdges(newEdges);
            setQuickGraphModalOpen(false);

            // Build canvas nodes/edges with x,y from util positions
            const nodesForCanvas = newVertices.map((label, idx) => ({
                id: label,
                label,
                x: positions[idx]?.x ?? 0,
                y: positions[idx]?.y ?? 0,
                size: 20,
                color: '#1976d2'
            }));

            const edgesForCanvas = newEdges.map((e) => {
                const hasWeight = e.weight !== undefined && e.weight !== null;
                return {
                    id: String(e.id),
                    from: e.from,
                    to: e.to,
                    weight: hasWeight ? e.weight : undefined,
                    color: e.color || '#1985d2',
                    directed: !!e.directed,
                    showWeight: true
                };
            });

            // Suggested name BEFORE localStorage
            let name = 'Graph';
            if (type === 'full') {
                name = `Complete Graph (n=${newVertices.length})`;
            } else if (type === 'tree') {
                name = `Tree (n=${newVertices.length}, k=${spec.treeChildCount})`;
            } else if (type === 'star') {
                name = `Star (n=${newVertices.length}, c=${spec.starCenterCount})`;
            } else if (type === 'ring') {
                name = `Ring (n=${newVertices.length})`;
            } else if (type === 'bipartite') {
                name = `K(${spec.bipartiteA}, ${spec.bipartiteB})`;
            } else if (type === 'grid') {
                name = `Grid (${Number(spec.gridRows)}x${Number(spec.gridCols)}, w=${Number(spec.gridWeight)})`;
            }

            // Persist (fallback) and navigate with state so Graph.jsx definitely gets x/y
            try {
                localStorage.setItem('algoNetQuickGraph', JSON.stringify({
                    nodes: nodesForCanvas,
                    edges: edgesForCanvas,
                    name
                }));
            } catch { }

            // NEW: navigate with state (immediate, not depending on localStorage)
            navigate('/graph', { state: { nodes: nodesForCanvas, edges: edgesForCanvas, name } });

            const nodeCount = newVertices.length;
            const edgeCount = newEdges.length;
            let msg = '';
            if (type === 'full') {
                msg = tf('quickgraph_full_created', { n: nodeCount, m: edgeCount });
            } else if (type === 'tree') {
                msg = tf('quickgraph_tree_created', { n: nodeCount, k: spec.treeChildCount });
            } else if (type === 'star') {
                msg = tf('quickgraph_star_created', { n: nodeCount, c: spec.starCenterCount });
            } else if (type === 'ring') {
                msg = tf('quickgraph_ring_created', { m: edgeCount });
            } else if (type === 'bipartite') {
                msg = tf('quickgraph_bipartite_created', { a: spec.bipartiteA, b: spec.bipartiteB, n: nodeCount, m: edgeCount });
            } else if (type === 'grid') {
                msg = tf('quickgraph_grid_created', { r: Number(spec.gridRows), c: Number(spec.gridCols), n: nodeCount, m: edgeCount, w: spec.gridWeight });
            } else if (type === 'random') {
                msg = t('quickgraph_random_created');
            } else if (type === 'Melih') {
                msg = t('Melih Graph has been created.')
            }
            setCreateSuccess(msg);
            setTimeout(() => setCreateSuccess(''), 3000);
        } catch (e) {
            // setQuickGraphError(t('quickgraph_error')); // Bu satır setCreateError ile değiştirilecek
            setCreateError(t('quickgraph_error'));
            setQuickGraphModalOpen(false); // Diyaloğu kapat
            setTimeout(() => setCreateError(''), 3000);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result || '';
            setFileName(file.name);
            setFilePreviewContent(String(text));
            setFilePreviewOpen(true);
        };
        reader.onerror = () => {
            setCreateError(t('file_read_error'));
            setTimeout(() => setCreateError(''), 3000);
        };
        reader.readAsText(file);
    };

    return (
        <Box className="tm-root" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* hidden file input */}
            <input
                type="file"
                accept=".txt"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />


            <TopBar title={t('create_graph')}
                actions={[
                    { label: t('go_to_canvas'), onClick: handleCanvas, variant: 'contained', color: 'primary', ariaLabel: t('go_to_canvas') },
                    { label: t('profile'), onClick: () => navigate('/profile'), variant: 'contained', color: 'primary', ariaLabel: t('profile') },
                    { label: t('my_graphs'), onClick: () => navigate('/graph-list'), variant: 'contained', color: 'primary', ariaLabel: t('graph-list') },
                    { label: t('array_algorithms'), onClick: handleArray, variant: 'contained', color: 'primary', ariaLabel: t('array_algorithms') },
                    { label: t('tree_algorithms'), onClick: handleTree, variant: 'contained', color: 'primary', ariaLabel: t('tree_algorithms') },
                    { label: t('unhcr_info'), onClick: () => navigate('/unhcr'), variant: 'contained', color: 'primary', ariaLabel: t('unhcr_info') },
                    { label: t('logout'), onClick: handleLogout, variant: 'contained', color: 'error', ariaLabel: t('logout') }
                ]}
            />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <FlashMessage severity="error" message={createError} sx={{ mb: 2 }} />
                <FlashMessage severity="success" message={createSuccess} sx={{ mb: 2 }} />

                <GraphNameOptions
                    graphName={graphName}
                    setGraphName={setGraphName}
                    directed={directed}
                    setDirected={setDirected}
                    weighted={weighted}
                    setWeighted={setWeighted}
                />

                <Box sx={{ display: 'flex', gap: 3 }}>
                    <VerticesPanel
                        vertexName={vertexName}
                        setVertexName={(v) => { setVertexName(v); if (vertexError) setVertexError(''); }}
                        vertexError={vertexError}
                        addVertex={addVertex}
                        addBulkVertices={addBulkVertices}
                        vertices={vertices}
                        removeVertex={removeVertex}
                        vertexListRef={vertexListRef}
                    />

                    <EdgesPanel
                        vertices={vertices}
                        edges={edges}
                        edgePage={edgePage}
                        setEdgePage={setEdgePage}
                        edgesPerPage={edgesPerPage}
                        weighted={weighted}
                        edgeFormOpen={edgeFormOpen}
                        setEdgeFormOpen={setEdgeFormOpen}
                        edgeFrom={edgeFrom}
                        setEdgeFrom={setEdgeFrom}
                        edgeTo={edgeTo}
                        setEdgeTo={setEdgeTo}
                        edgeWeight={edgeWeight}
                        setEdgeWeight={setEdgeWeight}
                        edgeColor={edgeColor}
                        setEdgeColor={setEdgeColor}
                        addEdge={addEdge}
                        openWeightEditor={openWeightEditor}
                        toggleEdgeDelete={toggleEdgeDelete}
                        deleteEdge={deleteEdge}
                    />
                </Box>

                <BottomActions
                    onOpenQuickGraph={() => setQuickGraphModalOpen(true)}
                    onReset={handleReset}
                    onOpenFile={() => setFileModalOpen(true)}
                    onCreate={handleCreate}
                />

                {/* ...existing dialogs unchanged... */}
                <FileInfoDialog
                    open={fileModalOpen}
                    onClose={() => setFileModalOpen(false)}
                    fileInputRef={fileInputRef}
                    openWeightedExample={() => setWeightedExampleModalOpen(true)}
                />
                <WeightedExampleDialog
                    open={weightedExampleModalOpen}
                    onClose={() => { setWeightedExampleModalOpen(false); }}
                    onSelectFile={() => {
                        weightedImportInProgressRef.current = true;
                        setWeightedExampleModalOpen(false);
                        try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch { }
                        fileInputRef.current?.click();
                    }}
                />
                <FilePreviewDialog
                    open={filePreviewOpen}
                    fileName={fileName}
                    content={filePreviewContent}
                    onClose={() => {
                        setFilePreviewOpen(false);
                        try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch { }
                    }}
                    onAdd={() => parseAndLoad(filePreviewContent)}
                />
                <WeightEditDialog
                    open={weightEditDialogOpen}
                    value={weightEditValue}
                    error={weightEditError}
                    onChange={(v) => { setWeightEditValue(v); if (weightEditError) setWeightEditError(''); }}
                    onClose={closeWeightEditor}
                    onSave={saveWeightEdit}
                />
                <QuickGraphDialog
                    open={quickGraphModalOpen}
                    onClose={() => {
                        setQuickGraphModalOpen(false);
                    }}
                    quickGraphType={quickGraphType}
                    setQuickGraphType={setQuickGraphType}
                    quickGraphNodeCount={quickGraphNodeCount}
                    setQuickGraphNodeCount={setQuickGraphNodeCount}
                    quickGraphLayout={quickGraphLayout}
                    setQuickGraphLayout={setQuickGraphLayout}
                    onCreate={handleQuickGraphCreate}
                />
            </Container>
        </Box>
    );
};

export default GraphCreation;