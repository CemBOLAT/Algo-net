const API_BASE = import.meta?.env?.VITE_PYTHON_BASE || 'http://localhost:8000';

import { useRef , useState} from "react";
import {
  Button, Container , Collapse, Box, FormControl, InputLabel, Select, MenuItem, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, Avatar, Chip, Divider, Paper
} from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import { TransitionGroup } from 'react-transition-group';
import { http } from "../utils/auth"; // Adjust the import path as necessary


export default function RunGraphAlgorithms({
  setNodes,
  nodes,
  setEdges,
  edges,
  selectedAlgo,
  isLoading = false,
  setIsLoading = () => {},
  notify = () => {},
  onLegendChange = () => {},
}) {


  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');

  // Dialog state for layout planning
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false);

  // entries now have stable ids for animations and edit flow
  const [entries, setEntries] = useState([
    { id: 1, name: '', color: '#1976d2', capacity: 1, distance: 1, unitDistance: 1 }
  ]);
  const [entrySeq, setEntrySeq] = useState(2);

  // Per-row edit state and drafts (idx -> draft)
  const [editing, setEditing] = useState({});
  const [drafts, setDrafts] = useState({});

  // Utility: detect algorithm category
  const getAlgorithmCategory = (algoName) => {

    const coloringAlgos = ["ordered_coloring"];
    const searchingAlgos = ["dfs", "bfs"];
    const pathFindingAlgos = ["dijkstra"];
    const layoutAlgos = ["layout_planning"];

    if (coloringAlgos.includes(algoName)) return "coloring";
    if (searchingAlgos.includes(algoName)) return "searching";
    if (pathFindingAlgos.includes(algoName)) return "pathfinding";
    if (layoutAlgos.includes(algoName)) return "layout";
    

    return "other";
  };

  // ---- Update functions ----

  // Coloring algorithms → recolor nodes
  const updateColoring = (data) => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        color: data?.[n.id] ?? n.color,
      }))
    );
  };

  // Pathfinding algorithms → highlight selected edges
  const updatePathfinding = (data) => {
    const pathEdges = new Set(
      (data?.pathEdgese ?? []).map(([a, b]) => `${a}-${b}`)
    );

    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        color: pathEdges.has(`${e.source}-${e.target}`)
          ? "#00C853" // green highlight
          : "#9E9E9E", // dim default
        width: pathEdges.has(`${e.source}-${e.target}`) ? 3 : 1.5,
      }))
    );

    
    setNodes((prevNodes) =>
        prevNodes.map((node) =>
            data["path_nodes"].includes(node.id)
            ? { ...node, color: 'red' }   // highlight path
            : { ...node, color: "#1976d2" } // reset others
        )
    );
  };

  // Searching algorithms → highlight visited nodes and optionally show traversal path
  const updateSearching = (data) => {
    const visited = new Set(data?.visited ?? []);
    const pathEdges = new Set(
      (data?.edges ?? []).map(([a, b]) => `${a}-${b}`)
    );

    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        color: visited.has(n.id) ? "#FFB300" : "#E0E0E0",
      }))
    );

    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        color: pathEdges.has(`${e.source}-${e.target}`)
          ? "#FB8C00"
          : "#BDBDBD",
      }))
    );
  };

  // Helpers
  const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

  // Helpers for dialog
  const addEntry = () => {
    if (entries.length >= 5) return;
    const newId = entrySeq;
    const next = { id: newId, name: '', color: '#1976d2', capacity: 1, distance: 1, unitDistance: 1 };
    setEntries(prev => [...prev, next]);
    setDrafts(prev => ({ ...prev, [newId]: next }));
    setEditing(prev => ({ ...prev, [newId]: true }));
    setEntrySeq(s => s + 1);
  };

  const startEdit = (id) => {
    const current = entries.find(e => e.id === id);
    if (!current) return;
    setDrafts(prev => ({ ...prev, [id]: { ...current } }));
    setEditing(prev => ({ ...prev, [id]: true }));
  };

  const updateDraft = (id, key, val) => {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
  };

  const saveEdit = (id) => {
    const draft = drafts[id];
    if (!draft) return;

    const nameOk = String(draft.name || '').trim().length > 0;
    const capOk = isPositive(draft.capacity);
    const distOk = isPositive(draft.distance);
    const unitOk = isPositive(draft.unitDistance);
    if (!nameOk || !capOk || !distOk || !unitOk) {
      notify("error", "İsim zorunlu; Kapasite, Uzaklık ve Birim Uzaklık 0'dan büyük olmalıdır.", 2500);
      return;
    }

    setEntries(prev => prev.map(e => e.id === id ? {
      ...e,
      name: String(draft.name || '').trim(),
      color: String(draft.color || '#1976d2'),
      capacity: Number(draft.capacity),
      distance: Number(draft.distance),
      unitDistance: Number(draft.unitDistance),
    } : e));
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const cancelEdit = (id) => {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const deleteEntry = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  // ---- Main onRun handler ----
  const onRun = async () => {
    console.log("Algo  runned :", selectedAlgo);
    
    if (isLoading) return;

    const category = getAlgorithmCategory(selectedAlgo);

    // For layout planning, open dialog and defer the request
    if (category === "layout") {
      setLayoutDialogOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("selectedAlgo", selectedAlgo);
    formData.append("Vertices", JSON.stringify(nodes));
    formData.append("Edges", JSON.stringify(edges));

    // From/To required only for pathfinding/searching
    if (["pathfinding", "searching"].includes(category)) {
      if (!edgeFrom || !edgeTo) {
        notify("error", "Please select both source and target vertices.", 2000);
        return;
      }
      if (edgeFrom === edgeTo) {
        notify("error", "Source and target vertices must be different.", 2000);
        return;
      }
      formData.append("edgeFrom", edgeFrom);
      formData.append("edgeTo", edgeTo);
    }

    setIsLoading(true);
    try {
      const resp = await http.post(`/api/${category}/`, formData, {
        json: false,
        auth: true,
        apiBase: API_BASE,
      });

      const data = resp?.result;
      
      switch (category) {
        case "coloring":
          updateColoring(data);
          break;
        case "pathfinding":
          updatePathfinding(data);
          break;
        case "searching":
          updateSearching(data);
          break;
        default:
          notify("success", `Algorithm executed: ${selectedAlgo}`, 1500);
      }
    } catch (err) {
      console.error("Request failed:", err);
      const msg =
        err?.data?.message ||
        err?.message ||
        "Algorithm execution failed.";
      notify("error", msg, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm handler for layout planning dialog
  const confirmLayout = async () => {
    // Require all rows to be valid (name and positive numbers), limit to first 5
    const list = entries.slice(0, 5).map((e) => ({
      name: String(e.name || '').trim(),
      color: String(e.color || '#1985d2ff'),
      capacity: Number(e.capacity),
      distance: Number(e.distance),
      unitDistance: Number(e.unitDistance),
    }));

    if (list.some(e => e.name.length === 0)) {
      notify("error", "İsim boş olamaz.", 2000);
      return;
    }
    if (list.some(e => !(Number(e.capacity) > 0) || !(Number(e.distance) > 0) || !(Number(e.unitDistance) > 0))) {
      notify("error", "Kapasite, Uzaklık ve Birim Uzaklık 0'dan büyük olmalıdır.", 2200);
      return;
    }

    const formData = new FormData();
    formData.append("selectedAlgo", selectedAlgo);
    formData.append("Vertices", JSON.stringify(nodes));
    formData.append("Edges", JSON.stringify(edges));
    formData.append("entries", JSON.stringify(list));

    setIsLoading(true);
    try {
      const resp = await http.post(`/api/layoutplanning/`, formData, {
        json: false,
        auth: true,
        apiBase: API_BASE,
      });
      const data = resp?.result;

      if (data?.positions && typeof data.positions === "object") {
        setNodes((prev) =>
          prev.map((n) => {
            const p = data.positions[n.id];
            return p ? { ...n, x: p.x ?? n.x, y: p.y ?? n.y } : n;
          })
        );
      }
      if (data) {
        const colorMap = data.colors && typeof data.colors === 'object' ? data.colors : data;
        if (colorMap && typeof colorMap === 'object') {
          updateColoring(colorMap);
        }
      }

      // expose legend entries to graph page
      onLegendChange(list);

      notify("success", "Layout planning çalıştırıldı.", 1500);
      setLayoutDialogOpen(false);
    } catch (err) {
      console.error("Layout request failed:", err);
      const msg = err?.data?.message || err?.message || "Layout planning başarısız.";
      notify("error", msg, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Collapse in={!["ordered_coloring", "layout_planning"].includes(selectedAlgo)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>From</InputLabel>
            <Select
                value={edgeFrom}
                label="From"
                onChange={(e) => setEdgeFrom(e.target.value)}
            >
                {nodes.map((v) => (
                <MenuItem key={`from-${v.id}`} value={v.id}>{v.id}</MenuItem>
                ))}
            </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>To</InputLabel>
            <Select
                value={edgeTo}
                label="To"
                onChange={(e) => setEdgeTo(e.target.value)}
            >
                {nodes.map((v) => (
                <MenuItem key={`to-${v.id}`} value={v.id}>{v.id}</MenuItem>
                ))}
            </Select>
            </FormControl>
        </Box>

        </Collapse>

        <Button
            id="run-btn"
            variant="contained"
            color="primary"
            fullWidth
            onClick={onRun}
            disabled={isLoading}
        >
            Run
        </Button>

        {/* Layout Planning Dialog */}
        <Dialog open={layoutDialogOpen} onClose={() => setLayoutDialogOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>Layout Planning</DialogTitle>
          <DialogContent dividers>
            {/* Fixed Residential card (non-editable) */}
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 36, height: 36 }}>
                <HomeIcon sx={{ color: '#fff' }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1 }}>
                  Residential
                </Typography>
                <Typography variant="caption" color="text.secondary">Sabit, değiştirilemez</Typography>
              </Box>
              <Chip size="small" label="Mavi" sx={{ bgcolor: '#1976d2', color: '#fff' }} />
            </Paper>

            <Divider sx={{ mb: 2 }} />

            {/* Animated list of entries */}
            <TransitionGroup>
              {entries.map((entry) => {
                const isEditing = !!editing[entry.id];
                const view = isEditing ? (drafts[entry.id] || entry) : entry;

                // Validation flags for edit mode
                const nameErr = isEditing && String(view.name || '').trim().length === 0;
                const capErr = isEditing && !isPositive(view.capacity);
                const distErr = isEditing && !isPositive(view.distance);
                const unitErr = isEditing && !isPositive(view.unitDistance);

                return (
                  <Collapse key={entry.id} timeout={200}>
                    {/* Edit mode */}
                    {isEditing ? (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '1.6fr 120px 1fr 1fr 1fr auto',
                          gap: 1,
                          alignItems: 'center',
                          minWidth: 760,
                          mb: 1,
                        }}
                      >
                        <TextField
                          label="İsim"
                          size="small"
                          value={view.name}
                          onChange={(e) => updateDraft(entry.id, 'name', e.target.value)}
                          error={nameErr}
                          helperText={nameErr ? 'Zorunlu' : ''}
                          fullWidth
                        />
                        <TextField
                          label="Renk"
                          size="small"
                          type="color"
                          value={view.color}
                          onChange={(e) => updateDraft(entry.id, 'color', e.target.value)}
                          inputProps={{ style: { padding: 0, height: 40 } }}
                        />
                        <TextField
                          label="Kapasite"
                          size="small"
                          type="number"
                          value={view.capacity}
                          onChange={(e) => updateDraft(entry.id, 'capacity', e.target.value)}
                          error={capErr}
                          helperText={capErr ? "0'dan büyük olmalı" : ''}
                          inputProps={{ min: 1, step: 1 }}
                        />
                        <TextField
                          label="Uzaklık"
                          size="small"
                          type="number"
                          value={view.distance}
                          onChange={(e) => updateDraft(entry.id, 'distance', e.target.value)}
                          error={distErr}
                          helperText={distErr ? "0'dan büyük olmalı" : ''}
                          inputProps={{ min: 1, step: 1 }}
                        />
                        <TextField
                          label="Birim Uzaklık"
                          size="small"
                          type="number"
                          value={view.unitDistance}
                          onChange={(e) => updateDraft(entry.id, 'unitDistance', e.target.value)}
                          error={unitErr}
                          helperText={unitErr ? "0'dan büyük olmalı" : ''}
                          inputProps={{ min: 1, step: 1 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button variant="contained" onClick={() => saveEdit(entry.id)}>Kaydet</Button>
                          <Button variant="text" color="inherit" onClick={() => cancelEdit(entry.id)}>İptal</Button>
                        </Box>
                      </Box>
                    ) : (
                      // View mode (compact card)
                      <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: entry.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.name || '—'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip size="small" label={`Kapasite: ${entry.capacity}`} />
                              <Chip size="small" label={`Uzaklık: ${entry.distance}`} />
                              <Chip size="small" label={`Birim: ${entry.unitDistance}`} />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" onClick={() => startEdit(entry.id)}>Düzenle</Button>
                            <Button size="small" color="error" variant="outlined" onClick={() => deleteEntry(entry.id)}>Sil</Button>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </Collapse>
                );
              })}
            </TransitionGroup>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                En fazla 5 giriş
              </Typography>
              <Button variant="contained" onClick={addEntry} disabled={entries.length >= 5}>
                Girdi Ekle
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLayoutDialogOpen(false)}>Vazgeç</Button>
            <Button onClick={confirmLayout} variant="contained">Çalıştır</Button>
          </DialogActions>
        </Dialog>
    </>
    );

}
