import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../../utils/auth';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Collapse from '@mui/material/Collapse';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ThemeToggle from '../../components/ThemeToggle';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Pagination from '@mui/material/Pagination';
import './TraditionalMethod.css';

const TraditionalMethod = () => {
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
    const [edgeName, setEdgeName] = useState('');
    const [edgePage, setEdgePage] = useState(1);
    const edgesPerPage = 5;

    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');

    // file upload preview
    const [filePreviewOpen, setFilePreviewOpen] = useState(false);
    const [filePreviewContent, setFilePreviewContent] = useState('');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);
    const [fileModalOpen, setFileModalOpen] = useState(false);

    const vertexListRef = useRef(null);
    const edgeListRef = useRef(null);

    const handleLogout = () => {
        clearTokens();
        navigate('/login', { replace: true });
    };

    const handleModern = () => {
        // go to graph - tokens kept as-is
        navigate('/graph');
    };

    const addVertex = () => {
        let name = vertexName.trim();
        if (!name) {
            setVertexError('İsim boş olamaz');
            return;
        }
        // enforce max 6 chars
        if (name.length > 6) {
            setVertexError('Düğüm adı en fazla 6 karakter olabilir');
            return;
        }
        // prevent duplicates (case-insensitive)
        if (vertices.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
            setVertexError('Aynı isimli düğüm zaten var');
            return;
        }
        setVertices((v) => [...v, name]);
        setVertexName('');
        setVertexError('');
        // scroll to end
        requestAnimationFrame(() => {
            if (vertexListRef.current) vertexListRef.current.scrollLeft = vertexListRef.current.scrollWidth;
        });
    };

    const removeVertex = (index) => {
        const removedName = vertices[index];
        setVertices((v) => v.filter((_, i) => i !== index));
        // also remove edges using this vertex
        setEdges((e) => e.filter((edge) => edge.from !== removedName && edge.to !== removedName));
    };

    const addEdge = () => {
        if (!edgeFrom || !edgeTo) return;
        const name = edgeName.trim() || `${edgeFrom}-${edgeTo}`;
        setEdges((e) => [...e, { id: Date.now(), name, from: edgeFrom, to: edgeTo, showDelete: false }]);
        setEdgeName('');
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

    const scroll = (ref, dir = 'right') => {
        if (!ref?.current) return;
        const el = ref.current;
        const amount = el.clientWidth * 0.6;
        el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
    };

    const handleCreate = () => {
        setCreateError('');
        // If edgeName provided, require from and to
        if (edgeName && (!edgeFrom || !edgeTo)) {
            setCreateError('Edge adı varsa hem From hem To seçili olmalı');
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
                weight: undefined,
                directed: true,
            }));

            // navigate with router state
            navigate('/graph', { state: { nodes: preparedNodes, edges: preparedEdges, name: graphName } });
        } catch (err) {
            setCreateError('Graph oluşturulurken hata oluştu');
            setTimeout(() => setCreateError(''), 3000);
        }
    };

    return (
        <Box className="tm-root" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            <AppBar position="static" color="inherit" elevation={1}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                            <div className="tm-header-art">
                                <div className="tm-blob" aria-hidden>
                                    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M20,30 C30,10 70,10 80,30 C90,50 70,80 50,80 C30,80 10,50 20,30Z" fill="url(#g)" opacity="0.95" />
                                        <defs>
                                            <linearGradient id="g" x1="0" x2="1">
                                                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.12" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                            </div>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>Geleneksel Yöntem</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <ThemeToggle sx={{ position: 'static', top: 'auto', right: 'auto', zIndex: 'auto', width: 40, height: 40 }} />
                            <Button variant="contained" color="primary" onClick={handleModern} aria-label="Modern Yöntem">Modern Yöntem</Button>
                            <Button variant="contained" color="error" onClick={handleLogout} aria-label="Çıkış Yap">Çıkış Yap</Button>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Graph name */}
                {createError && <Alert sx={{ mb: 2 }} severity="error">{createError}</Alert>}
                {createSuccess && <Alert sx={{ mb: 2 }} severity="success">{createSuccess}</Alert>}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Graph Adı"
                        variant="outlined"
                        value={graphName}
                        onChange={(e) => setGraphName(e.target.value)}
                        sx={{ flex: 1 }}
                    />
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
                        {vertexError && <Alert severity="error" sx={{ mb: 2 }}>{vertexError}</Alert>}

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

                                <TextField size="small" label="Kenar Adı (opsiyonel)" value={edgeName} onChange={(e) => setEdgeName(e.target.value)} />
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
                                                    <Typography sx={{ mr: 1 }}>{edge.name ? edge.name : `${edge.from}→${edge.to}`}</Typography>
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
                    <DialogTitle>Dosya Ekle - Bilgilendirme</DialogTitle>
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
                        <Button onClick={() => {
                            // validate file content
                            const lines = filePreviewContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                            if (lines.length === 0) {
                                setCreateError('Dosya boş görünüyor');
                                setTimeout(() => setCreateError(''), 3000);
                                setFilePreviewOpen(false);
                                setFileModalOpen(true);
                                return;
                            }

                            const vertexRegex = /^[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}$/;
                            // allow lines like L1:L2,L3,L4 (source:comma-separated targets)
                            const edgeRegex = /^\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}\s*:\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6}(\s*,\s*[A-Za-z0-9ĞÜŞİÖÇğüşiöç]{1,6})*\s*$/;

                            let badLine = null;
                            for (let i = 0; i < lines.length; i++) {
                                const ln = lines[i];
                                if (vertexRegex.test(ln)) continue;
                                if (edgeRegex.test(ln)) continue;
                                badLine = { index: i + 1, text: ln };
                                break;
                            }

                            if (badLine) {
                                setCreateError(`Dosya formatı hatalı. Satır ${badLine.index}: "${badLine.text}"`);
                                setTimeout(() => setCreateError(''), 3000);
                                setFilePreviewOpen(false);
                                setFileModalOpen(true);
                                return;
                            }

                            // Parse file into vertices and edges, clear existing lists then add
                            const verticesSet = new Set();
                            const parsedEdges = [];
                            let idCounter = Date.now();
                            for (const ln of lines) {
                                // ln matches edgeRegex like 'L1:L2,L3'
                                if (edgeRegex.test(ln)) {
                                    const [srcPart, targetsPart] = ln.split(':');
                                    const src = srcPart.trim();
                                    verticesSet.add(src);
                                    const targets = targetsPart.split(',').map(t => t.trim()).filter(Boolean);
                                    for (const t of targets) {
                                        verticesSet.add(t);
                                        parsedEdges.push({ id: idCounter++, name: '', from: src, to: t, showDelete: false });
                                    }
                                } else if (vertexRegex.test(ln)) {
                                    verticesSet.add(ln);
                                }
                            }

                            // Clear existing lists and set new ones
                            setVertices(Array.from(verticesSet));
                            setEdges(parsedEdges);

                            setCreateError('');
                            setCreateSuccess('Graph yüklendi');
                            setFilePreviewOpen(false);
                            // clear input so the same file can be reselected later
                            try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (err) { /* ignore */ }
                            // clear success after 3s
                            setTimeout(() => setCreateSuccess(''), 3000);
                        }} variant="contained">Ekle</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Box>
    );
};

export default TraditionalMethod;

