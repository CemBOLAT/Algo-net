const API_BASE = import.meta?.env?.VITE_PYTHON_BASE || '/pythonms';

import { useRef, useState, useEffect } from "react";
import {
  Button, Container, Collapse, Box, FormControl, InputLabel, Select, MenuItem, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, Avatar, Chip, Divider, Paper
} from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import TripOriginIcon from '@mui/icons-material/TripOrigin';
import PlaceIcon from '@mui/icons-material/Place';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { TransitionGroup } from 'react-transition-group';
import { http, getTokens } from "../utils/auth";
import { useI18n } from '../context/I18nContext';

export default function RunGraphAlgorithms({
  setNodes,
  nodes,
  setEdges,
  edges,
  selectedAlgo,
  isLoading = false,
  setIsLoading = () => { },
  notify = () => { },
  onLegendChange = () => { },
  onResult = () => { },
  legendEntries = [], // ADDED
  graphName, // ADDED: receive graphName from Sidebar
  setShowEdgeWeights = () => { },
}) {
  const { t } = useI18n();


  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [rainbowK, setRainbowK] = useState('3');

  // Dialog state for layout planning
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false);

  // which standard is selected for layout planning: 'custom' or 'unhcr'
  const [standardOption, setStandardOption] = useState('custom');

  // entries now have stable ids for animations and edit flow
  const [entries, setEntries] = useState([
  ]);
  const [entrySeq, setEntrySeq] = useState(2);

  const [legendEntriesInitialSyncDone, setLegendEntriesInitialSyncDone] = useState(false);

  // Sync with legendEntries from graph when first opening or loading
  useEffect(() => {
    if (onLegendChange && Array.isArray(legendEntries) && legendEntries.length > 0 && !legendEntriesInitialSyncDone) {
      const mapped = legendEntries.map((le, i) => {
        const attrs = le.attributes || {};
        return {
          id: 1000 + i, // use offset to avoid collision
          name: le.name || '',
          color: le.color || '#1976d2',
          capacity: Number(attrs.Kapasite || attrs.capacity || le.capacity || 1),
          distance: Number(attrs.Uzaklık || attrs.distance || le.distance || 1),
          diameter: Number(attrs.Yarıçap || attrs.diameter || le.diameter || 1),
          size: Number(attrs.Boyut || attrs.size || le.size || 1),
          _source: 'graph'
        };
      });
      setEntries(mapped);
      const newDrafts = {};
      mapped.forEach(e => { newDrafts[e.id] = { ...e }; });
      setDrafts(newDrafts);
      setEntrySeq(1000 + mapped.length);
      setLegendEntriesInitialSyncDone(true);
    }
  }, [legendEntries, legendEntriesInitialSyncDone, onLegendChange]);

  // Small built-in UNHCR standard examples (kullanıcının sağladığı listeye göre).
  // capacity: person-per-unit (e.g. "1 per 20 persons" => capacity: 20), distance/diameter/size set to practical defaults.
  const UNHCR_STANDARD_PRESET = [
    { name: 'Communal Latrine', color: '#8e44ad', capacity: 4, distance: 50, diameter: 5, size: 1 }, // 1 per 20 persons
    { name: 'Shower', color: '#2980b9', capacity: 10, distance: 50, diameter: 5, size: 1 }, // 1 per 50 persons
    { name: 'Water Tap', color: '#16a085', capacity: 20, distance: 200, diameter: 30, size: 4 }, // 1 per 80 persons
    { name: 'Rubbish container', color: '#f39c12', capacity: 10, distance: 100, diameter: 5, size: 1 }, // 1 per 50 persons
    { name: 'Health centre', color: '#e74c3c', capacity: 4000, distance: 370, diameter: 57, size: 9 }, // 1 per 20,000
    { name: 'School', color: '#2ecc71', capacity: 1000, distance: 370, diameter: 57, size: 9 }, // 1 per 5,000
    { name: 'Recreation area', color: '#8ba300ff', capacity: 25, distance: 100, diameter: 30, size: 4 }, // 1 per 2,500
  ];

  // Apply UNHCR preset into entries (assign stable ids and drafts). İkinci kez seçilince tekrar eklemesin.
  const applyUnhcrEntries = () => {
    // if already UNHCR-sourced entries present, skip
    if (entries.length > 0 && entries.every(e => e._source === 'unhcr')) return;
    let nextId = entrySeq;
    const mapped = UNHCR_STANDARD_PRESET.map((e, i) => ({ id: nextId + i, ...e, _source: 'unhcr' }));
    setEntries(mapped);
    const newDrafts = {};
    mapped.forEach(e => { newDrafts[e.id] = { ...e }; });
    setDrafts(newDrafts);
    setEditing({});
    setEntrySeq(nextId + mapped.length);
  };

  // Helper to change standard option and apply/reset accordingly
  const handleStandardOption = (opt) => {
    if (opt === 'unhcr') {
      setStandardOption('unhcr');
      applyUnhcrEntries();
    } else {
      // switch to custom: clear presets immediately as requested
      setStandardOption('custom');
      setEntries([]);
      setDrafts({});
      setEditing({});
      setEntrySeq(2);
    }
  };

  // Per-row edit state and drafts (idx -> draft)
  const [editing, setEditing] = useState({});
  const [drafts, setDrafts] = useState({});

  // Utility: detect algorithm category
  const getAlgorithmCategory = (algoName) => {

    const coloringAlgos = [
      "ordered_coloring",
      "package_coloring",
      "normal_coloring",
      "b_coloring",
      "domination",
      "total_domination",
      "k_domination",
      "rainbow_domination",
      "singleton_rainbow_domination",
    ];
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
    if (selectedAlgo === 'package_coloring') {
      // New structure support: { assignments: {...}, pcn: int, legend: [...] }
      const assignments = data.assignments || data; // Fallback to old format (direct map) if assignments key missing

      // If we have a legend from backend, update it
      if (data.legend && Array.isArray(data.legend)) {
        onLegendChange(data.legend);
      }

      // Always generate color lookup for values 1..PCN
      // The legend is now 'summary only' so we cannot rely on it for value->color mapping.
      let colorLookup = {};

      // Get all unique values assigned to nodes
      const distinctValues = [...new Set(Object.values(assignments).map(String))].sort((a, b) => Number(a) - Number(b));

      distinctValues.forEach((val, idx) => {
        // Distribute hue evenly based on the number of distinct values
        const hue = Math.floor((idx * 360) / distinctValues.length);
        colorLookup[val] = `hsl(${hue}, 70%, 50%)`;
      });

      console.log('UpdateColoring debug:', {
        assignmentsKeys: Object.keys(assignments),
        hasColors: !!data.colors,
        colorsKeys: data.colors ? Object.keys(data.colors) : []
      });

      setNodes((prev) => {
        return prev.map((n) => {
          const strId = String(n.id);
          // 1. Try to find assignment (for label)
          let num = assignments[strId];
          if (num === undefined && assignments[n.id] !== undefined) {
            num = assignments[n.id];
          }

          // 2. Determine Color
          let finalColor = n.color; // Start with current color

          // Try backend explicit color first (most trusted)
          let backendColor = null;
          if (data.colors) {
            // Try strict string match first
            if (data.colors[strId]) backendColor = data.colors[strId];
            // Try raw ID match
            else if (data.colors[n.id]) backendColor = data.colors[n.id];
          }

          if (backendColor) {
            finalColor = backendColor;
          } else if (num !== undefined) {
            // Fallback to local lookup if valid assignment exists but no explicit color
            const lookup = colorLookup[String(num)];
            if (lookup) finalColor = lookup;
          }

          // Debug for specific problematic nodes if needed
          // if (strId.startsWith('5_')) console.log(`Node ${ strId }: num = ${ num }, backendColor = ${ backendColor }, final = ${ finalColor } `);

          return {
            ...n,
            color: finalColor,
            label: num ? String(num) : n.label,
          };
        });
      });

      // Hide edge labels after packing coloring result
      setEdges((prev) => prev.map((e) => ({ ...e, showWeight: false })));
    } else if (selectedAlgo === 'rainbow_domination' || selectedAlgo === 'singleton_rainbow_domination') {
      const colorMap = data?.colors || data;
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          color: colorMap?.[n.id] ?? n.color,
        }))
      );
    } else {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          color: data?.[n.id] ?? n.color,
        }))
      );
    }
  };

  // Pathfinding algorithms → highlight selected edges
  const updatePathfinding = (data) => {
    // FIX: Typos in pathEdges -> path_edges
    // Make sure we check both strings "from-to" and "to-from" if undirected, but backend returns defined directed pairs.
    // However edge format has .source and .target. Backend returns array of [from, to] ids
    const pathEdgesPairs = data?.path_edges ?? [];

    setEdges((prev) =>
      prev.map((e) => {
        // check if this edge is in pathEdgesPairs
        let isPath = false;
        for (let pair of pathEdgesPairs) {
          if ((String(e.from) === String(pair[0]) && String(e.to) === String(pair[1])) ||
            (String(e.from) === String(pair[1]) && String(e.to) === String(pair[0]))) {
            isPath = true;
            break;
          }
        }

        return {
          ...e,
          color: isPath ? "#00C853" // green highlight
            : (e.color || "#9E9E9E"), // dim default, or use existing color from graph
          width: isPath ? 3 : 1.5,
        };
      })
    );


    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const isPathNode = data["path_nodes"] && data["path_nodes"].includes(String(node.id));

        return {
          ...node,
          color: isPathNode ? 'red' : "#1976d2",
        };
      })
    );
  };

  // Searching algorithms → highlight visited nodes and optionally show traversal path
  const updateSearching = (data) => {
    console.log("Searching data:", data);
    const visitedOrder = data?.visited_order ?? [];
    const pathNodes = new Set(data?.path ?? []);

    // Reset everything initially
    setNodes((prev) => prev.map((n) => ({ ...n, color: "#1976d2" })));
    setEdges((prev) => prev.map((e) => ({ ...e, color: "#BDBDBD" })));

    let step = 0;
    const intervalId = setInterval(() => {
      if (step >= visitedOrder.length) {
        clearInterval(intervalId);
        // Ensure final path nodes stick out strongly at the end, default others back
        if (pathNodes.size > 0) {
          setNodes((prev) => prev.map((n) => ({
            ...n,
            color: pathNodes.has(n.id) ? "#D32F2F" : "#1976d2"
          })));

          // Recolor path edges firmly, default others back to grey
          const pathEdgesSeq = new Set();
          const p = data.path;
          for (let i = 0; i < p.length - 1; i++) {
            pathEdgesSeq.add(`${p[i]}-${p[i + 1]}`);
          }
          setEdges((prev) => prev.map((e) => {
            const isPathEdge = pathEdgesSeq.has(`${e.from}-${e.to}`) || (!e.directed && pathEdgesSeq.has(`${e.to}-${e.from}`));
            return {
              ...e,
              color: isPathEdge ? "#FB8C00" : "#BDBDBD",
              width: isPathEdge ? 3 : 1.5,
            };
          }));
        } else {
          // If no path is found, reset everything back to default visually
          setNodes((prev) => prev.map((n) => ({ ...n, color: "#1976d2" })));
          setEdges((prev) => prev.map((e) => ({ ...e, color: "#BDBDBD", width: 1.5 })));
        }
        return;
      }

      const activeNodeId = visitedOrder[step];
      const previousNodeId = step > 0 ? visitedOrder[step - 1] : null;

      // Color the active node
      let activeColor = '#FFA000'; // Default DFS/Search color
      if (selectedAlgo === 'bfs' && data?.colors && data.colors[activeNodeId]) {
        activeColor = data.colors[activeNodeId]; // Use backend layer color
      } else if (selectedAlgo === 'bfs') {
        // Fallback smooth gradient if backend colors missing
        const hue = Math.floor(200 - (step / visitedOrder.length) * 150);
        activeColor = `hsl(${hue}, 80%, 55%)`;
      }

      setNodes((prev) => prev.map((n) => {
        if (String(n.id) === String(activeNodeId)) {
          return { ...n, color: activeColor };
        }
        return n;
      }));

      // Highlight the edge that was just traversed (if applicable and visible back to previous)
      if (previousNodeId) {
        setEdges((prev) => prev.map((e) => {
          if ((e.from === previousNodeId && e.to === activeNodeId) ||
            (!e.directed && e.from === activeNodeId && e.to === previousNodeId)) {
            return { ...e, color: activeColor };
          }
          return e;
        }));
      }

      step++;
    }, 400); // 400ms per node for animation
  };

  // ---- Result emit helpers (for ResultsPanel) ----

  const emitSearchingResult = (data) => {
    const path = data?.path ?? [];
    const visited = data?.visited ?? [];
    onResult({
      algorithm: selectedAlgo,
      type: 'searching',
      data: {
        pathFound: path.length > 0,
        path,
        visitedCount: visited.length,
      },
    });
  };

  const emitPathfindingResult = (data) => {
    const pathNodes = data?.path_nodes ?? [];
    onResult({
      algorithm: selectedAlgo,
      type: 'pathfinding',
      data: {
        path: pathNodes,
        distance: data?.distance ?? null,
      },
    });
  };

  const emitColoringResult = (data) => {
    if (selectedAlgo === 'package_coloring') {
      const assignments = data.assignments || data;
      // Group nodes by their assignment value
      const groups = {};
      const distinctValues = [...new Set(Object.values(assignments).map(String))].sort((a, b) => Number(a) - Number(b));
      distinctValues.forEach((val, idx) => {
        const hue = Math.floor((idx * 360) / distinctValues.length);
        const color = `hsl(${hue}, 70%, 50%)`;
        const nodeIds = Object.entries(assignments)
          .filter(([, v]) => String(v) === val)
          .map(([k]) => k);
        groups[color] = nodeIds;
      });
      onResult({
        algorithm: selectedAlgo,
        type: 'coloring',
        data: {
          colorCount: null, // Removed per user request
          pcn: data.pcn ?? null,
          colorGroups: groups,
        },
      });
    } else if (selectedAlgo === 'rainbow_domination' || selectedAlgo === 'singleton_rainbow_domination') {
      const colorMap = data?.colors || {};
      const rainbowAssignments = data?.assignments || {};
      const groups = {};
      Object.entries(colorMap).forEach(([nodeId, color]) => {
        if (!groups[color]) groups[color] = [];
        groups[color].push(nodeId);
      });
      // Weight = total number of colors assigned across all vertices (k-rainbow domination number)
      const weight = Object.values(rainbowAssignments).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      );
      onResult({
        algorithm: selectedAlgo,
        type: 'coloring',
        data: {
          colorCount: Object.keys(groups).length,
          pcn: null,
          colorGroups: groups,
          rainbowAssignments,
          weight,
        },
      });
    } else {
      // Greedy / ordered coloring — data is { nodeId: '#color' }
      const groups = {};
      Object.entries(data || {}).forEach(([nodeId, color]) => {
        if (!groups[color]) groups[color] = [];
        groups[color].push(nodeId);
      });
      onResult({
        algorithm: selectedAlgo,
        type: 'coloring',
        data: {
          colorCount: Object.keys(groups).length,
          pcn: null,
          colorGroups: groups,
        },
      });
    }
  };

  // Helpers
  const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

  // Helpers for dialog
  const addEntry = () => {
    // when UNHCR standard active, allow adding beyond 5; otherwise keep 5 limit
    if (standardOption !== 'unhcr' && entries.length >= 5) return;
    const newId = entrySeq;
    const next = { id: newId, name: '', color: '#1976d2', capacity: 1, distance: 1, diameter: 1, size: 1 };
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
    const unitOk = isPositive(draft.diameter);
    const sizeOk = isPositive(draft.size);
    if (!nameOk || !capOk || !distOk || !unitOk || !sizeOk) {
      notify("error", t('name_required_msg'), 2500);
      return;
    }

    setEntries(prev => prev.map(e => e.id === id ? {
      ...e,
      name: String(draft.name || '').trim(),
      color: String(draft.color || '#1976d2'),
      capacity: Number(draft.capacity),
      distance: Number(draft.distance),
      diameter: Number(draft.diameter),
      size: Number(draft.size),
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

    if (["rainbow_domination", "singleton_rainbow_domination", "k_domination"].includes(selectedAlgo)) {
      const kValue = Number(rainbowK);
      if (!Number.isFinite(kValue) || kValue < 1) {
        notify("error", "K must be a positive integer.", 2000);
        return;
      }
      formData.append("k", String(Math.floor(kValue)));
    }

    // From/To required only for pathfinding/searching
    if (["pathfinding", "searching"].includes(category)) {
      if (!edgeFrom || !edgeTo) {
        notify("error", t('select_source_target'), 2000);
        return;
      }
      if (edgeFrom === edgeTo) {
        notify("error", t('source_target_different'), 2000);
        return;
      }
      formData.append("edgeFrom", edgeFrom);
      formData.append("edgeTo", edgeTo);
    }

    setNodes((prev) => prev.map((n) => ({ ...n, color: '#1976d2' })));
    setEdges((prev) => prev.map((e) => ({ ...e, color: '#9E9E9E', width: 1.5 })));

    setIsLoading(true);
    try {
      const resp = await http.post(selectedAlgo === "package_coloring" ? `/api/package_coloring/` : `/api/${category}/`, formData, {
        json: false,
        auth: true,
        apiBase: API_BASE,
      });

      const data = resp?.result;

      switch (category) {
        case "coloring":
          onLegendChange([]);
          setShowEdgeWeights(false);
          updateColoring(data);
          emitColoringResult(data);
          break;
        case "pathfinding":
          onLegendChange([]);
          setShowEdgeWeights(true);
          updatePathfinding(data);
          emitPathfindingResult(data);
          break;
        case "searching":
          onLegendChange([]);
          setShowEdgeWeights(false);
          updateSearching(data);
          emitSearchingResult(data);
          break;
        default:
          notify("success", `${t('algorithm_executed')}: ${selectedAlgo}`, 1500);
      }
    } catch (err) {
      console.error("Request failed:", err);
      const msg =
        err?.data?.message ||
        err?.message ||
        t('algorithm_failed');
      notify("error", msg, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm handler for layout planning dialog
  const confirmLayout = async () => {
    // Require all rows to be valid.
    // If UNHCR preset is active, send all entries; otherwise limit to first 5.
    const sourceEntries = standardOption === 'unhcr' ? entries : entries.slice(0, 5);
    const list = sourceEntries.map((e) => {
      const name = String(e.name || '').trim();
      const color = String(e.color || '#1985d2ff');
      const capacity = Number(e.capacity);
      const distance = Number(e.distance);
      const diameter = Number(e.diameter);
      const size = Number(e.size);
      return {
        name,
        color,
        capacity,
        distance,
        diameter,
        size,
        // provide attribute map so later save can read them
        attributes: {
          [t('capacity_form')]: String(capacity),
          [t('distance_form')]: String(distance),
          [t('radius_form')]: String(diameter),
          [t('size_form')]: String(size),
        },
      };
    });

    if (list.some(e => e.name.length === 0)) {
      notify("error", t('name_empty_error'), 2000);
      return;
    }
    if (list.some(e => !(Number(e.capacity) > 0) || !(Number(e.distance) > 0) || !(Number(e.diameter) > 0) || !(Number(e.size) > 0))) {
      notify("error", t('positive_values_error'), 2500);
      return;
    }

    const formData = new FormData();
    formData.append("selectedAlgo", selectedAlgo);
    formData.append("Vertices", JSON.stringify(nodes));
    formData.append("Edges", JSON.stringify(edges));
    formData.append("entries", JSON.stringify(list));

    // ADDED: async notify flow like CustomAlgo
    const notifyEnabled = localStorage.getItem('notifications_enabled') === 'true';
    if (notifyEnabled) {
      formData.append("shouldNotify", "true");
      formData.append("saveGraph", "true");
      formData.append("graphName", graphName || 'Graph');
      const email = getUserEmail();
      if (email) formData.append("userEmail", email);

      http.post(`/api/layoutplanning/`, formData, {
        json: false,
        auth: true,
        apiBase: API_BASE,
      }).catch((err) => console.error('layout planning async error:', err));

      notify('success', t('email_notification_msg'), 2500);
      setLayoutDialogOpen(false);
      return; // do not block UI
    }

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
          setNodes((prev) =>
            prev.map((n) => {
              const c = colorMap?.[n.id];
              // Only apply if it's a valid non-empty color string
              return {
                ...n,
                color: (typeof c === 'string' && c.trim().length > 0) ? c : n.color,
              };
            })
          );
        }
      }
      onLegendChange(list);
      onResult({ algorithm: selectedAlgo, type: 'layout', data: { entries: list } });
      notify("success", t('layout_executed'), 1500);
      setLayoutDialogOpen(false);
    } catch (err) {
      console.error("Layout request failed:", err);
      const msg = err?.data?.message || err?.message || t('layout_failed');
      notify("error", msg, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // ADDED: extract user email from access token (same as CustomAlgo)
  const getUserEmail = () => {
    try {
      const { accessToken } = getTokens() || {};
      const payload = JSON.parse(atob((accessToken || '').split('.')[1] || ''));
      return payload?.email || '';
    } catch { return ''; }
  };

  return (
    <>
      <Collapse in={!["ordered_coloring", "layout_planning", "package_coloring", "normal_coloring", "b_coloring", "domination", "total_domination", "k_domination", "rainbow_domination", "singleton_rainbow_domination"].includes(selectedAlgo)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mb: 2 }}>
          {/* From Node Select */}
          <Box sx={{ position: 'relative' }}>
            <TripOriginIcon sx={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '18px',
              zIndex: 1,
              pointerEvents: 'none'
            }} />
            <FormControl fullWidth size="small">
              <Select
                value={edgeFrom}
                onChange={(e) => setEdgeFrom(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  pl: '32px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#cbd5e1',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06b6d4',
                    borderWidth: '1px',
                  },
                  '& .MuiSelect-select': {
                    padding: '12px 16px',
                    paddingLeft: '8px',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      mt: 1,
                      maxHeight: 200, // Added to prevent overflow
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em style={{ color: '#94a3b8' }}>Starting Node (From)</em>
                </MenuItem>
                {nodes.map((v) => (
                  <MenuItem key={`from-${v.id}`} value={v.id}>{v.label || v.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* To Node Select */}
          <Box sx={{ position: 'relative' }}>
            <PlaceIcon sx={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#06b6d4',
              fontSize: '18px',
              zIndex: 1,
              pointerEvents: 'none'
            }} />
            <FormControl fullWidth size="small">
              <Select
                value={edgeTo}
                onChange={(e) => setEdgeTo(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  pl: '32px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#cbd5e1',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06b6d4',
                    borderWidth: '1px',
                  },
                  '& .MuiSelect-select': {
                    padding: '12px 16px',
                    paddingLeft: '8px',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      mt: 1,
                      maxHeight: 200, // Added to prevent overflow
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em style={{ color: '#94a3b8' }}>Destination Node (To)</em>
                </MenuItem>
                {nodes.map((v) => (
                  <MenuItem key={`to-${v.id}`} value={v.id}>{v.label || v.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>

      {/* K Value Input for Rainbow Domination algorithms */}
      <Collapse in={["rainbow_domination", "singleton_rainbow_domination", "k_domination"].includes(selectedAlgo)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mb: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Typography sx={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: 700,
              zIndex: 1,
              pointerEvents: 'none',
              lineHeight: 1,
            }}>K</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={rainbowK}
              onChange={(e) => setRainbowK(e.target.value)}
              placeholder="K Value"
              inputProps={{ min: 1, step: 1, style: { paddingLeft: '28px' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                  '&.Mui-focused fieldset': { borderColor: '#06b6d4', borderWidth: '1px' },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                },
              }}
            />
          </Box>
        </Box>
      </Collapse>

      <Button
        id="run-btn"
        fullWidth
        onClick={onRun}
        disabled={isLoading}
        sx={{
          padding: '16px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.2)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          '&:hover': {
            background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 25px -5px rgba(6, 182, 212, 0.3)',
          },
          '&:disabled': {
            background: '#cbd5e1',
            boxShadow: 'none',
            transform: 'none',
          },
        }}
      >
        <PlayArrowIcon sx={{ fontSize: '20px' }} />
        Run Simulation
      </Button>

      {/* Layout Planning Dialog */}
      <Dialog open={layoutDialogOpen} onClose={() => setLayoutDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{t('layout_planning_title')}</DialogTitle>
        <DialogContent dividers>
          {/* Standard seçimi: UNHCR veya Kendi Standartlarım */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl component="fieldset" variant="standard" sx={{ width: '100%' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('standard_selection')}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={standardOption === 'unhcr' ? 'contained' : 'outlined'}
                  onClick={() => handleStandardOption('unhcr')}
                >
                  {t('unhcr_standards')}
                </Button>
                <Button
                  variant={standardOption === 'custom' ? 'contained' : 'outlined'}
                  onClick={() => handleStandardOption('custom')}
                >
                  {t('my_standards')}
                </Button>
              </Box>
              {standardOption === 'unhcr' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('unhcr_loaded_msg')}
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* Fixed Residential card (non-editable) */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#ffffff', width: 36, height: 36, border: '1px solid #e0e0e0' }}>
              <HomeIcon sx={{ color: '#1976d2' }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1 }}>
                Residential
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('residential_fixed')}</Typography>
            </Box>
            <Chip size="small" label={t('white_chip')} sx={{ bgcolor: '#ffffff', color: '#333', border: '1px solid #e0e0e0' }} />
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
              const unitErr = isEditing && !isPositive(view.diameter);
              const sizeErr = isEditing && !isPositive(view.size);

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
                        label={t('name_label')}
                        size="small"
                        value={view.name}
                        onChange={(e) => updateDraft(entry.id, 'name', e.target.value)}
                        error={nameErr}
                        helperText={nameErr ? t('required_field') : ''}
                        fullWidth
                      />
                      <TextField
                        label={t('color_label_form')}
                        size="small"
                        type="color"
                        value={view.color}
                        onChange={(e) => updateDraft(entry.id, 'color', e.target.value)}
                        inputProps={{ style: { padding: 0, height: 40 } }}
                      />
                      <TextField
                        label={t('capacity_form')}
                        size="small"
                        type="number"
                        value={view.capacity}
                        onChange={(e) => updateDraft(entry.id, 'capacity', e.target.value)}
                        error={capErr}
                        helperText={capErr ? t('must_be_positive') : ''}
                        inputProps={{ min: 1, step: 1 }}
                      />
                      <TextField
                        label={t('distance_form')}
                        size="small"
                        type="number"
                        value={view.distance}
                        onChange={(e) => updateDraft(entry.id, 'distance', e.target.value)}
                        error={distErr}
                        helperText={distErr ? t('must_be_positive') : ''}
                        inputProps={{ min: 1, step: 1 }}
                      />
                      <TextField
                        label={t('radius_form')}
                        size="small"
                        type="number"
                        value={view.diameter}
                        onChange={(e) => updateDraft(entry.id, 'diameter', e.target.value)}
                        error={unitErr}
                        helperText={unitErr ? t('must_be_positive') : ''}
                        inputProps={{ min: 1, step: 1 }}
                      />
                      <TextField
                        label={t('size_form')}
                        size="small"
                        type="number"
                        value={view.size}
                        onChange={(e) => updateDraft(entry.id, 'size', e.target.value)}
                        error={sizeErr}
                        helperText={sizeErr ? t('must_be_positive') : ''}
                        inputProps={{ min: 1, step: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" onClick={() => saveEdit(entry.id)}>{t('save_entry')}</Button>
                        <Button variant="text" color="inherit" onClick={() => cancelEdit(entry.id)}>{t('cancel_entry')}</Button>
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
                            <Chip size="small" label={`${t('capacity_form')}: ${entry.capacity}`} />
                            <Chip size="small" label={`${t('distance_form')}: ${entry.distance}`} />
                            <Chip size="small" label={`${t('radius_form')}: ${entry.diameter}`} />
                            <Chip size="small" label={`${t('size_form')}: ${entry.size}`} />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" onClick={() => startEdit(entry.id)}>{t('edit_entry')}</Button>
                          <Button size="small" color="error" variant="outlined" onClick={() => deleteEntry(entry.id)}>{t('delete_entry')}</Button>
                        </Box>
                      </Box>
                    </Paper>
                  )}
                </Collapse>
              );
            })}
          </TransitionGroup>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            {standardOption !== 'unhcr' ? (
              <Typography variant="caption" color="text.secondary">
                {t('max_5_entries')}
              </Typography>
            ) : (
              <Box /> /* placeholder to keep layout */
            )}
            <Button variant="contained" onClick={addEntry} disabled={standardOption !== 'unhcr' && entries.length >= 5}>
              {t('add_entry')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLayoutDialogOpen(false)}>{t('cancel_dialog')}</Button>
          <Button onClick={confirmLayout} variant="contained">{t('run_algorithm')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );

}
