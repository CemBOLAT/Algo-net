import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../../utils/auth';
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

// New small components
import GraphNameOptions from './components/GraphNameOptions';
import VerticesPanel from './components/VerticesPanel';
import EdgesPanel from './components/EdgesPanel';
import BottomActions from './components/BottomActions';

const GraphCreation = () => {
    const navigate = useNavigate();
    const [graphName, setGraphName] = useState('');

    // vertices and edges
    const [vertices, setVertices] = useState([]);
    const [vertexName, setVertexName] = useState('');
    const [vertexError, setVertexError] = useState('');

    const [edges, setEdges] = useState([]);
    const [edgeFormOpen, setEdgeFormOpen] = useState(false);
    const [edgeFrom, setEdgeFrom] = useState('');
    const [edgeTo, setEdgeTo] = useState('');
    const [edgeWeight, setEdgeWeight] = useState('');
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
        setCreateSuccess(weighted ? 'Ağırlıklı moda geçildi — kenarlar sıfırlandı, lütfen tekrar ekleyin.' : 'Ağırlıklı mod kapandı — kenarlar sıfırlandı.');
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
    const [quickGraphError, setQuickGraphError] = useState('');

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
            setVertexError('İsim boş olamaz');
            return;
        }
        if (name.length > 6) {
            setVertexError('Düğüm adı en fazla 6 karakter olabilir');
            return;
        }
        if (vertices.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
            setVertexError('Aynı isimli düğüm zaten var');
            return;
        }
        setVertices((v) => [...v, name]);
        setVertexName('');
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
        if (!edgeFrom || !edgeTo) return;
        
        // Check for duplicate edges in undirected graphs
        if (edgeExists(edges, edgeFrom, edgeTo, directed)) {
            setCreateError('Bu kenar zaten var');
            setTimeout(() => setCreateError(''), 2500);
            return;
        }
        
        if (weighted) {
            if (edgeWeight === '' || edgeWeight === null || Number.isNaN(Number(edgeWeight))) {
                setCreateError('Ağırlıklı graph için kenar ağırlığı gereklidir');
                setTimeout(() => setCreateError(''), 2500);
                return;
            }
        }
        const name = `${edgeFrom}-${edgeTo}`;
        setEdges((e) => [...e, { id: Date.now(), name, from: edgeFrom, to: edgeTo, showDelete: false, directed: directed, weight: weighted ? Number(edgeWeight) : undefined }]);
        setEdgeWeight('');
        setEdgeFrom('');
        setEdgeTo('');
        setEdgeFormOpen(false);
        requestAnimationFrame(() => {
            if (edgeListRef.current) edgeListRef.current.scrollLeft = edgeListRef.current.scrollWidth;
        });
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
            setWeightEditError('Geçerli bir sayı girin');
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
            setCreateError('Ağırlıklı graph için kenar ağırlığı gereklidir');
            setTimeout(() => setCreateError(''), 3000);
            return;
        }
        if (graphName.trim() === '') {
            setCreateError('Graph adı boş olamaz');
            setTimeout(() => setCreateError(''), 3000);
            return;
        }
        if (vertexListRef.current && vertexListRef.current.children.length === 0) {
            setCreateError('En az bir düğüm eklemelisiniz');
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
                    id: `node-${idx + 1}`,
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
                from: labelToId[e.from] || `node-1`,
                to: labelToId[e.to] || `node-1`,
                label: e.name || '',
                weight: e.weight !== undefined ? e.weight : undefined,
                directed: typeof e.directed === 'boolean' ? e.directed : directed,
                showWeight: e.weight !== undefined
            }));

            navigate('/graph', { state: { nodes: preparedNodes, edges: preparedEdges, name: graphName.trim() } });
        
        } catch (err) {
            setCreateError('Graph oluşturulurken hata oluştu');
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
            setCreateError('Dosya boş görünüyor');
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
            setCreateError(`Dosya formatı hatalı. Satır ${badLine.index}: "${badLine.text}"`);
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
    setCreateSuccess('Graph yüklendi');
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
        setEdgePage(1);
        setCreateSuccess('Graph sıfırlandı');
        setTimeout(() => setCreateSuccess(''), 2000);
    };

    const handleQuickGraphCreate = (spec) => {
        // spec payload from QuickGraphDialog
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
                default:
                    setQuickGraphError('Desteklenmeyen graph tipi');
                    return;
            }

            console.log('Quick graph generated:', result);

            const { vertices: newVertices, edges: newEdges, positions } = result || { vertices: [], edges: [], positions: [] };
            // Fill form lists (optional UX parity)
            setVertices(newVertices);
            setEdges(newEdges);
            setQuickGraphModalOpen(false);
            setQuickGraphError('');

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
                    directed: !!e.directed,
                    showWeight: hasWeight
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
            }

            // Persist (fallback) and navigate with state so Graph.jsx definitely gets x/y
            try {
                localStorage.setItem('algoNetQuickGraph', JSON.stringify({
                    nodes: nodesForCanvas,
                    edges: edgesForCanvas,
                    name
                }));
            } catch {}

            // NEW: navigate with state (immediate, not depending on localStorage)
            navigate('/graph', { state: { nodes: nodesForCanvas, edges: edgesForCanvas, name } });

            // Success message per type
            const nodeCount = newVertices.length;
            const edgeCount = newEdges.length;
            let msg = '';
            if (type === 'full') {
                msg = `Tam graph oluşturuldu (${nodeCount} düğüm, ${edgeCount} kenar)`;
            } else if (type === 'tree') {
                msg = `Ağaç oluşturuldu (n=${nodeCount}, k=${spec.treeChildCount})`;
            } else if (type === 'star') {
                msg = `Star oluşturuldu (n=${nodeCount}, merkez sayısı=${spec.starCenterCount})`;
            } else if (type === 'ring') {
                if (nodeCount === 1) msg = 'Ring oluşturuldu (1 düğüm, 1 self-loop)';
                else if (nodeCount === 2) msg = 'Ring oluşturuldu (2 düğüm, aralarında 2 paralel kenar)';
                else msg = `Ring oluşturuldu (n=${nodeCount}, kenar=${edgeCount})`;
            } else if (type === 'bipartite') {
                msg = `Tam bipartite oluşturuldu (A=${spec.bipartiteA}, B=${spec.bipartiteB}, toplam=${nodeCount}, kenar=${edgeCount})`;
            }
            setCreateSuccess(msg);
            setTimeout(() => setCreateSuccess(''), 3000);
        } catch (e) {
            setQuickGraphError('Hızlı graph oluşturulurken hata oluştu');
            setTimeout(() => setQuickGraphError(''), 3000);
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
            setCreateError('Dosya okunamadı');
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
            <TopBar
                title="Graph Oluştur"
                actions={[
                    { label: 'Kanvas', onClick: handleCanvas, variant: 'contained', color: 'primary', ariaLabel: 'Kanvas' },
                    { label: 'Dizi Algoritmaları', onClick: handleArray, variant: 'contained', color: 'primary', ariaLabel: 'Dizi Algoritmaları' },
                    { label: 'Ağaç Algoritmaları', onClick: handleTree, variant: 'contained', color: 'primary', ariaLabel: 'Ağaç Algoritmaları' },
                    { label: 'Çıkış Yap', onClick: handleLogout, variant: 'contained', color: 'error', ariaLabel: 'Çıkış Yap' }
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
                        try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
                        fileInputRef.current?.click();
                    }}
                />
                <FilePreviewDialog
                    open={filePreviewOpen}
                    fileName={fileName}
                    content={filePreviewContent}
                    onClose={() => {
                        setFilePreviewOpen(false);
                        try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
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
                        setQuickGraphError('');
                    }}
                    quickGraphType={quickGraphType}
                    setQuickGraphType={setQuickGraphType}
                    quickGraphNodeCount={quickGraphNodeCount}
                    setQuickGraphNodeCount={setQuickGraphNodeCount}
                    quickGraphLayout={quickGraphLayout}
                    setQuickGraphLayout={setQuickGraphLayout}
                    quickGraphError={quickGraphError}
                    setQuickGraphError={setQuickGraphError}
                    onCreate={handleQuickGraphCreate}
                />
            </Container>
        </Box>
    );
};

export default GraphCreation;