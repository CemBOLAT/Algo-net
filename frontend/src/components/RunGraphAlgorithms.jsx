const API_BASE = import.meta?.env?.VITE_PYTHON_BASE || 'http://localhost:8000';

import { useRef , useState} from "react";
import { Button, Container , Collapse, Box, FormControl, InputLabel, Select, MenuItem, TextField} from "@mui/material";
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
}) {


  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');

  // Utility: detect algorithm category
  const getAlgorithmCategory = (algoName) => {

    const coloringAlgos = ["ordered_coloring"];
    const searchingAlgos = ["dfs", "bfs"];
    const pathFindingAlgos = ["dijkstra"];

    if (coloringAlgos.includes(algoName)) return "coloring";
    if (searchingAlgos.includes(algoName)) return "searching";
    if (pathFindingAlgos.includes(algoName)) return "pathfinding";
    

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

  // ---- Main onRun handler ----
  const onRun = async () => {
    console.log("Algo  runned :", selectedAlgo);
    
    if (isLoading) return;

    const category = getAlgorithmCategory(selectedAlgo);

    

    const formData = new FormData();
    formData.append("selectedAlgo", selectedAlgo);
    formData.append("Vertices", JSON.stringify(nodes));
    formData.append("Edges", JSON.stringify(edges));

    console.log(category)
    if (category !== "coloring") {
        if (!edgeFrom || !edgeTo) {
        notify("error", "Please select both source and target vertices.", 2000);
        return;
        }

        if (edgeFrom === edgeTo) {
        notify("error", "Source and target vertices must be different.", 2000);
        return;
        }

        formData.append("edgeFrom", edgeFrom)
        formData.append("edgeTo", edgeTo)
    }


    setIsLoading(true);

    

    try {
      const resp = await http.post(`/api/${category}/`, formData, {
        json: false,
        auth: true,
        apiBase: API_BASE,
      });

      const data = resp?.result;
      
      console.log(data)
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
          notify("warning", `Unsupported algorithm type: ${selectedAlgo}`, 2000);
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

  return (
        
        
  <>
        <Collapse in={!["ordered_coloring"].includes(selectedAlgo)}>
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
    </>
    );

}
