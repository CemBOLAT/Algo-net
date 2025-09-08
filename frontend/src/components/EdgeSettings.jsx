import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Button, Switch, FormControlLabel, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const EdgeSettings = ({ selectedEdge, setSelectedEdge, setEdges, setTempEdge, nodes }) => {
  const [weight, setWeight] = useState(selectedEdge?.weight || 1);
  const [directed, setDirected] = useState(selectedEdge?.directed || false);
  const [fromId, setFromId] = useState(selectedEdge?.from || '');
  const [toId, setToId] = useState(selectedEdge?.to || '');

  useEffect(() => {
    if (selectedEdge) {
      setWeight(selectedEdge.weight || 1);
      setDirected(selectedEdge.directed || false);
      setFromId(selectedEdge.from || '');
      setToId(selectedEdge.to || '');
    }
  }, [selectedEdge]);

  const handleEdgeUpdate = (key, value) => {
    // Update local states where applicable
    if (key === 'weight') setWeight(value);
    if (key === 'directed') setDirected(value);
    if (key === 'from') setFromId(value);
    if (key === 'to') setToId(value);

    setEdges(prevEdges =>
      prevEdges.map(edge =>
        edge.id === selectedEdge.id ? { ...edge, [key]: value } : edge
      )
    );

    // reflect change on the selectedEdge prop
    setSelectedEdge(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleDeletingEdge = () => {
    setEdges(prevEdges => prevEdges.filter(e => e.id !== selectedEdge.id));
    setSelectedEdge(null);
    setTempEdge(null);
  }

  const handleClose = () => {
    setSelectedEdge(null);
  };

  if (!selectedEdge) return null;

  return (
    <Paper id="edge-settings" sx={{ position: 'absolute', top: 16, right: 16, width: 320, p: 2 }} elevation={6}>
      <Typography variant="h6" gutterBottom>Edge Settings</Typography>

      {/* label is not important for edges in this app, hide it */}

      <FormControlLabel
        control={<Switch checked={(selectedEdge.showWeight ?? true)} onChange={(e) => handleEdgeUpdate('showWeight', e.target.checked)} />}
        label="Show weight on edge"
      />

      { (selectedEdge.showWeight ?? true) && (
        <TextField
          label="Weight"
          value={weight}
          size="small"
          type="number"
          fullWidth
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            handleEdgeUpdate('weight', isNaN(v) ? 0 : v);
          }}
          sx={{ mb: 2 }}
        />
      )}

      <FormControlLabel
        control={<Switch checked={directed} onChange={(e) => handleEdgeUpdate('directed', e.target.checked)} />}
        label="Directed"
      />

      {/* Show source/target selectors only for directed edges */}
      {directed && (
        <Box sx={{ mt: 1, mb: 2, display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="from-label">Source</InputLabel>
            <Select
              labelId="from-label"
              value={fromId}
              label="Source"
              onChange={(e) => handleEdgeUpdate('from', e.target.value)}
            >
              {nodes.map(n => (
                <MenuItem key={n.id} value={n.id}>{n.label || n.id}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="to-label">Target</InputLabel>
            <Select
              labelId="to-label"
              value={toId}
              label="Target"
              onChange={(e) => handleEdgeUpdate('to', e.target.value)}
            >
              {nodes.map(n => (
                <MenuItem key={n.id} value={n.id}>{n.label || n.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Button variant="contained" color="error" fullWidth sx={{ mb: 1 }} onClick={handleDeletingEdge}>Delete</Button>
      <Button variant="outlined" fullWidth onClick={handleClose}>Close</Button>
    </Paper>
  );
};

export default EdgeSettings;