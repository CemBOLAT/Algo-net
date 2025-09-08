import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../../utils/auth';
import { AppBar, Toolbar, Typography, Button, Box, Container, TextField, IconButton, Tooltip, List, ListItem, Paper, MenuItem, Select, FormControl, InputLabel, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Pagination, Switch, FormControlLabel } from '@mui/material';
import FlashMessage from '../../components/FlashMessage';
import TopBar from '../../components/TopBar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import EditIcon from '@mui/icons-material/Edit';
import ThemeToggle from '../../components/ThemeToggle';
import './GraphCreation.css';

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
    const [edgeError, setEdgeError] = useState('');
    const [edgePage, setEdgePage] = useState(1);
    const edgesPerPage = 5;

    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [directed, setDirected] = useState(true);
    const [weighted, setWeighted] = useState(false);

    const weightedMountedRef = useRef(false);
    const weightedImportInProgressRef = useRef(false);
    useEffect(() => {
        if (!weightedMountedRef.current) { weightedMountedRef.current = true; return; }
        if (weightedImportInProgressRef.current) { weightedImportInProgressRef.current = false; return; }
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
    const [weightedImportRequested, setWeightedImportRequested] = useState(false);

    const vertexListRef = useRef(null);
    const edgeListRef = useRef(null);

    const [weightEditDialogOpen, setWeightEditDialogOpen] = useState(false);
    const [weightEditEdgeId, setWeightEditEdgeId] = useState(null);
    const [weightEditValue, setWeightEditValue] = useState('');
    const [weightEditError, setWeightEditError] = useState('');

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

        // Prepare nodes/edges and navigate to modern Graph canvas
        try {
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

            const preparedEdges = edges.map((e, i) => ({
                id: `edge-${i + 1}`,
                from: labelToId[e.from] || `node-1`,
                to: labelToId[e.to] || `node-1`,
                label: e.name || '',
                weight: e.weight !== undefined ? e.weight : (weighted ? 1 : undefined),
                directed: typeof e.directed === 'boolean' ? e.directed : directed,
            }));

            // navigate with router state
            navigate('/graph', { state: { nodes: preparedNodes, edges: preparedEdges, name: graphName } });
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

        setVertices(Array.from(verticesSet));
        setEdges(parsedEdges);

    // close modals and preview on success
    setFileModalOpen(false);
    setWeightedExampleModalOpen(false);
    setCreateError('');
    setCreateSuccess('Graph yüklendi');
    setFilePreviewOpen(false);
        try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (err) { /* ignore */ }
        setTimeout(() => setCreateSuccess(''), 3000);
    };

    return (
        <Box className="tm-root" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
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
                {/* Graph name */}
                <FlashMessage severity="error" message={createError} sx={{ mb: 2 }} />
                <FlashMessage severity="success" message={createSuccess} sx={{ mb: 2 }} />
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Graph Adı"
                        variant="outlined"
                        value={graphName}
                        onChange={(e) => setGraphName(e.target.value)}
                        sx={{ flex: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControlLabel control={<Switch checked={directed} onChange={(e) => setDirected(e.target.checked)} />} label="Yönlü (Directed)" />
                        <FormControlLabel control={<Switch checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />} label="Ağırlıklı (Weighted)" />
                    </Box>
                </Box>

                {/* Two-column layout */}
                <Box sx={{ display: 'flex', gap: 3 }}>
                    {/* Left: Vertices */}
                    <Paper className="tm-glass" sx={{ flex: 1, p: 2 }} elevation={2}>
                        <Typography variant="h6" sx={{ mb: 1 }}>Düğümler (Vertex)</Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                size="small"
                                label="Yeni Düğüm"
                                value={vertexName}
                                onChange={(e) => { setVertexName(e.target.value); if (vertexError) setVertexError(''); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') addVertex(); }}
                            />
                            <Button className="tm-modern-btn tm-modern-primary" startIcon={<AddIcon />} onClick={addVertex}>Ekle</Button>
                        </Box>
                        {<FlashMessage severity="error" message={vertexError} sx={{ mb: 2 }} />}

                        {/* Horizontal scrollable list */}
                        <Box sx={{ position: 'relative' }}>
                            <Box
                                ref={vertexListRef}
                                sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, overflowY: 'auto', p: 1, maxHeight: 360 }}
                                aria-label="vertex-list"
                            >
                                {vertices.map((v, i) => (
                                    <Paper
                                        key={`${v}-${i}`}
                                        sx={{
                                            minWidth: { xs: '48%', sm: 'calc(25% - 8px)' },
                                            flex: '0 0 calc(25% - 8px)',
                                            p: 1,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Typography noWrap>{v}</Typography>
                                        <IconButton size="small" onClick={() => removeVertex(i)} aria-label="delete-vertex">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Paper>
                                ))}
                            </Box>
                        </Box>
                    </Paper>

                    {/* Right: Edges */}
                    <Paper className="tm-glass" sx={{ flex: 1, p: 2 }} elevation={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6">Kenarlar (Edges)</Typography>

                            <Box>
                                <Tooltip title={edgeFormOpen ? 'Kapat' : 'Kenar Ekle'}>
                                    <IconButton
                                        onClick={() => setEdgeFormOpen((s) => !s)}
                                        sx={{ transform: edgeFormOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        <Collapse in={edgeFormOpen}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>From</InputLabel>
                                    <Select value={edgeFrom} label="From" onChange={(e) => setEdgeFrom(e.target.value)}>
                                        {vertices.map((v) => (
                                            <MenuItem key={`from-${v}`} value={v}>{v}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>To</InputLabel>
                                    <Select value={edgeTo} label="To" onChange={(e) => setEdgeTo(e.target.value)}>
                                        {vertices.map((v) => (
                                            <MenuItem key={`to-${v}`} value={v}>{v}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {weighted ? (
                                    <TextField size="small" label="Kenar Ağırlığı" type="number" value={edgeWeight} onChange={(e) => setEdgeWeight(e.target.value)} />
                                ) : null}
                                <Button className="tm-modern-btn tm-modern-primary" onClick={addEdge} startIcon={<AddIcon />}>Ekle</Button>
                            </Box>
                        </Collapse>

                        <Box sx={{ position: 'relative' }}>
                            {edges.length > 10 && (
                                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
                                    <IconButton onClick={() => scroll(edgeListRef, 'left')}><ArrowBackIosNewIcon /></IconButton>
                                </Box>
                            )}

                            <List ref={edgeListRef} sx={{ maxHeight: 360, overflowX: 'auto', display: 'flex', gap: 1, p: 1, flexDirection: 'column' }}>
                                {(() => {
                                    const start = (edgePage - 1) * edgesPerPage;
                                    const pageEdges = edges.slice(start, start + edgesPerPage);
                                    if (pageEdges.length === 0 && edges.length > 0) setEdgePage(1);
                                    return pageEdges.map((edge) => (
                                        <ListItem
                                            key={edge.id}
                                            onContextMenu={(e) => { e.preventDefault(); toggleEdgeDelete(edge.id); }}
                                            sx={{ minWidth: 220, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            secondaryAction={(
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography sx={{ mr: 1 }}>{edge.name ? edge.name + ` (${edge.weight})` : `${edge.from}-${edge.to}${edge.weight !== undefined ? `-(${edge.weight})` : '31'}`}</Typography>
                                                    {edge.weight !== undefined && (
                                                        <Tooltip title="Ağırlığı düzenle">
                                                            <IconButton size="small" onClick={() => openWeightEditor(edge)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Box sx={{ perspective: 600 }}>
                                                        <Box
                                                            sx={{
                                                                transformStyle: 'preserve-3d',
                                                                transition: 'transform 300ms',
                                                                transform: edge.showDelete ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                                            }}
                                                        >
                                                            {!edge.showDelete && (
                                                                <IconButton size="small" onClick={() => toggleEdgeDelete(edge.id)}>
                                                                    <RotateRightIcon fontSize="small" />
                                                                </IconButton>
                                                            )}

                                                            {edge.showDelete && (
                                                                <IconButton size="small" color="error" onClick={() => deleteEdge(edge.id)}>
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}
                                        >
                                        </ListItem>
                                    ));
                                })()}
                            </List>

                            {/* pagination */}
                            {edges.length > edgesPerPage && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                    <Pagination
                                        count={Math.ceil(edges.length / edgesPerPage)}
                                        page={edgePage}
                                        onChange={(e, p) => setEdgePage(p)}
                                        size="small"
                                        showFirstButton
                                        showLastButton
                                    />
                                </Box>
                            )}

                            {edges.length > 10 && (
                                <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
                                    <IconButton onClick={() => scroll(edgeListRef, 'right')}><ArrowForwardIosIcon /></IconButton>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* Bottom actions:   Ekle and Oluştur */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt"
                        hidden
                        onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (!f.name.endsWith('.txt')) {
                                setCreateError('Sadece .txt dosyası kabul edilir');
                                setTimeout(() => setCreateError(''), 3000);
                                return;
                            }
                            setFileName(f.name);
                            const text = await f.text();

                            if (weightedImportRequested) {
                                // reset the flag
                                setWeightedImportRequested(false);
                                // validate weighted format (must contain at least one weighted-edge line)
                                const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                                const weightedEdgeRegex = /^\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}\s*:\s*\(\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}\s*,\s*\d+\s*\)(\s*,\s*\(\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}\s*,\s*\d+\s*\))*\s*$/;
                                const hasWeightedLine = lines.some(ln => weightedEdgeRegex.test(ln));
                                if (!hasWeightedLine) {
                                    setCreateError('Seçilen dosya ağırlıklı formatta değil');
                                    setTimeout(() => setCreateError(''), 4000);
                                    // reopen weighted example modal so user sees guidance
                                    setWeightedExampleModalOpen(true);
                                    return;
                                }
                                // parse and load immediately as weighted
                                parseAndLoad(text);
                                return;
                            }

                            setFilePreviewContent(text);
                            setFilePreviewOpen(true);
                            // clear the input value so the same file can be selected again without page refresh
                            try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (err) { /* ignore */ }
                        }}
                    />

                    <Button className="tm-modern-btn" sx={{ border: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setFileModalOpen(true)}>
                        Dosya Ekle
                    </Button>

                    <Button className="tm-modern-btn tm-modern-success" onClick={() => handleCreate()}>
                        Oluştur
                    </Button>

                </Box>
                <Dialog open={fileModalOpen} onClose={() => setFileModalOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Graph Ekle - Bilgilendirme</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body1" gutterBottom>
                            Dosyanız aşağıdaki formatta olmalıdır:
                        </Typography>

                        <Box
                            component="pre"
                            sx={(theme) => ({
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
                                color: theme.palette.text.primary,
                                p: 2,
                                borderRadius: 2,
                                fontSize: 14,
                                overflowX: 'auto'
                            })}
                        >
                            {`L1:L2,L3,L4,L5\nL2:L1,L3,L4`}
                        </Box>

                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Bu format, yönlü graph’ı tanımlar:
                        </Typography>
                        <ul>
                            <li><strong>L1:L2,L3,L4,L5</strong> → L1 düğümünden L2, L3, L4 ve L5’e giden kenarlar vardır.</li>
                            <li><strong>L2:L1,L3,L4</strong> → L2 düğümünden L1, L3 ve L4’e giden kenarlar vardır.</li>
                        </ul>
                        
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Her satırda <code>Düğüm:Komşu1,Komşu2,...</code> formatı kullanılmalıdır.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFileModalOpen(false)}>İptal</Button>
                        <Button onClick={() => setWeightedExampleModalOpen(true)}>Ağırlıklı Örnek</Button>

                        <Button
                            onClick={() => {
                                setFileModalOpen(false);
                                // ensure input is cleared before programmatic click so selecting the same file fires onChange
                                try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (err) { /* ignore */ }
                                fileInputRef.current?.click();
                            }}
                            variant="contained"
                        >
                            Dosya Seç
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Weight edit dialog */}
                <Dialog open={weightEditDialogOpen} onClose={closeWeightEditor} fullWidth maxWidth="xs">
                    <DialogTitle>Kenar Ağırlığını Düzenle</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Ağırlık"
                            type="number"
                            fullWidth
                            value={weightEditValue}
                            onChange={(e) => { setWeightEditValue(e.target.value); if (weightEditError) setWeightEditError(''); }}
                            error={!!weightEditError}
                            helperText={weightEditError}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeWeightEditor}>İptal</Button>
                        <Button onClick={saveWeightEdit} variant="contained">Kaydet</Button>
                    </DialogActions>
                </Dialog>

                {/* Weighted example dialog (mirrors file modal style) */}
                <Dialog open={weightedExampleModalOpen} onClose={() => setWeightedExampleModalOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Ağırlıklı Graph Ekle - Bilgilendirme</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body1" gutterBottom>
                            Aşağıdaki örnek, kenar ağırlıklarını içeren dosya formatını gösterir:
                        </Typography>

                        <Box
                            component="pre"
                            sx={(theme) => ({
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
                                color: theme.palette.text.primary,
                                p: 2,
                                borderRadius: 2,
                                fontSize: 14,
                                overflowX: 'auto'
                            })}
                        >
                            {`L1:(L2, 3),(L3, 1),(L4, 2),(L5, 4)\nL2:(L1, 3),(L3, 5),(L4, 1)`}
                        </Box>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Bu format, yönlü graph’ı tanımlar:
                        </Typography>
                        <ul>
                            <li><strong>L1:(L2, 3),(L3, 1),(L4, 2),(L5, 4)</strong> → L1 düğümünden L2’ye ağırlık 3, L3’e ağırlık 1, L4’e ağırlık 2 ve L5’e ağırlık 4 olan kenarlar vardır.</li>
                            <li><strong>L2:(L1, 3),(L3, 5),(L4, 1)</strong> → L2 düğümünden L1’e ağırlık 3, L3’e ağırlık 5 ve L4’e ağırlık 1 olan kenarlar vardır.</li>
                        </ul>

                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Her satır <code>Düğüm:(Komşu, Ağırlık),(Komşu, Ağırlık),...</code> formatındadır.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setWeightedExampleModalOpen(false); setWeightedImportRequested(false); }}>İptal</Button>
                        <Button onClick={() => {
                            // trigger weighted file picker: set flag so onChange knows to parse as weighted
                            setWeightedImportRequested(true);
                            weightedImportInProgressRef.current = true;
                            setWeightedExampleModalOpen(false);
                            try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (err) { }
                            fileInputRef.current?.click();
                        }} variant="contained">Dosya Seç</Button>
                    </DialogActions>
                </Dialog>


                {/* File preview dialog */}
                <Dialog open={filePreviewOpen} onClose={() => setFilePreviewOpen(false)} fullWidth maxWidth="md">
                    <DialogTitle>{fileName}</DialogTitle>
                    <DialogContent dividers>
                        <Box
                            component="pre"
                            sx={(theme) => ({
                                whiteSpace: 'pre-wrap',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'transparent',
                                color: theme.palette.text.primary,
                                p: theme.spacing(1),
                                borderRadius: 1,
                                overflowX: 'auto'
                            })}
                        >
                            {filePreviewContent}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setFilePreviewOpen(false); try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (err) { } }}>Kapat</Button>
                        <Button onClick={() => { parseAndLoad(filePreviewContent); }} variant="contained">Ekle</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Box>
    );
};

export default GraphCreation;

