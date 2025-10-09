import React, { useState, useEffect } from 'react';
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem, Button, Stack, Box, TextField } from '@mui/material';
import CustomAlgoButton from "./CustomAlgo";


const Sidebar = ({ onRun, onReset, onSave, isSaving = false, graphName = 'Graph Name', setGraphName = () => {}, setNodes, nodes, edges, isLoading = false, setIsLoading = () => {}, notify = () => {} }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dfs');
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(graphName);

  useEffect(() => setLocalName(graphName), [graphName]);

  const handleAlgorithmChange = (e) => {
    setSelectedAlgorithm(e.target.value);
  };

  return (
    <Paper sx={{ width: 280, p: 2, height: '100%', boxSizing: 'border-box' }} elevation={2}>

      {!editingName ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">{graphName}</Typography>
          <Button size="small" onClick={() => { setLocalName(graphName); setEditingName(true); }}>Edit</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField size="small" value={localName} onChange={(e) => setLocalName(e.target.value)} sx={{ flex: 1 }} />
          <Button size="small" variant="contained" onClick={() => { setGraphName(localName); setEditingName(false); }}>Save</Button>
          <Button size="small" variant="outlined" onClick={() => setEditingName(false)}>Cancel</Button>
        </Box>
      )}

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="algorithm-select-label">Algorithm</InputLabel>
        <Select
          labelId="algorithm-select-label"
          id="algorithm-select"
          value={selectedAlgorithm}
          label="Algorithm"
          onChange={handleAlgorithmChange}
        >
          <MenuItem value="dfs">Depth-First Search</MenuItem>
          <MenuItem value="bfs">Breadth-First Search</MenuItem>
          <MenuItem value="dijkstra">Dijkstra's Algorithm</MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={1}>
        <Button id="run-btn" variant="contained" color="primary" fullWidth onClick={() => onRun(selectedAlgorithm)}>
          Run
        </Button>
        
        <CustomAlgoButton
          setNodes={setNodes}
          nodes={nodes}
          edges={edges}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          notify={notify}
        />
        
        <Button id="reset-btn" variant="outlined" color="inherit" fullWidth onClick={onReset}>
          Reset
        </Button>
        <Button 
          id="save-btn" 
          variant="contained" 
          color="secondary" 
          fullWidth 
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </Stack>
    </Paper>
  );
};

export default Sidebar;