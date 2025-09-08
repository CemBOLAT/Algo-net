import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Slider, Button, Box } from '@mui/material';

const VertexSettings = ({ selectedNode, setSelectedNode, setNodes, setEdges, setTempEdge }) => {
  const [label, setLabel] = useState(selectedNode?.label || '');
  const [size, setSize] = useState(selectedNode?.size || 15);
  const [color, setColor] = useState(selectedNode?.color || '#2563eb');

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.label);
      setSize(selectedNode.size);
      setColor(selectedNode.color);
    }
  }, [selectedNode]);

  const handleChange = (setter, key, value) => {
    setter(value);
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === selectedNode.id ? { ...node, [key]: value } : node
      )
    );
  };

  const handleClose = () => {
    setSelectedNode(null);
  };

  const handleDeleteVertex = () =>{
    setNodes(prevNodes => prevNodes.filter(n => n.id !== selectedNode.id));
    setEdges(prevEdges => prevEdges.filter(e => e.from !== selectedNode.id && e.to !== selectedNode.id));
    setSelectedNode(null);
    setTempEdge(null);
  }

  if (!selectedNode) return null;

  return (
    <Paper id="vertex-settings" sx={{ position: 'absolute', top: 16, right: 16, width: 280, p: 2 }} elevation={6}>
      <Typography variant="h6" gutterBottom>Vertex Settings</Typography>

      <TextField
        label="Label"
        value={label}
        size="small"
        fullWidth
        onChange={(e) => handleChange(setLabel, 'label', e.target.value)}
        sx={{ mb: 2 }}
      />

      <Typography variant="caption">Size</Typography>
      <Slider
        value={size}
        min={5}
        max={40}
        onChange={(e, v) => handleChange(setSize, 'size', v)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" display="block">Color</Typography>
        <input
          type="color"
          id="v-color"
          style={{ width: '100%', height: 40, border: 'none', background: 'transparent' }}
          value={color}
          onChange={(e) => handleChange(setColor, 'color', e.target.value)}
        />
      </Box>

      <Button variant="contained" color="error" fullWidth sx={{ mb: 1 }} onClick={handleDeleteVertex}>Delete</Button>
      <Button variant="outlined" fullWidth onClick={handleClose}>Close</Button>
    </Paper>
  );
};

export default VertexSettings;