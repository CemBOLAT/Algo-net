import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Slider, Button, Box } from '@mui/material';
import { useI18n } from '../context/I18nContext';

// Convert any CSS color (hsl, rgb, named, short hex) to 6-digit hex
// Input type="color" only accepts #rrggbb format
const toHex = (color) => {
  if (!color) return '#2563eb';
  if (/^#[0-9a-f]{6}$/i.test(color)) return color; // already valid
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return '#2563eb';
  }
};

const VertexSettings = ({ selectedNode, setSelectedNode, setNodes, setEdges, setTempEdge }) => {
  const { t } = useI18n();
  const [label, setLabel] = useState(selectedNode?.label || '');
  const [size, setSize] = useState(selectedNode?.size || 15);
  const [color, setColor] = useState(toHex(selectedNode?.color));

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.label);
      setSize(selectedNode.size);
      setColor(toHex(selectedNode.color));
    }
  }, [selectedNode]);

  // Prevent Enter key from activating focused buttons/controls when vertex settings are open
  useEffect(() => {
    const handleKeyDownCapture = (e) => {
      if (selectedNode && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDownCapture, true);
    return () => window.removeEventListener('keydown', handleKeyDownCapture, true);
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

  const handleDeleteVertex = () => {
    setNodes(prevNodes => prevNodes.filter(n => n.id !== selectedNode.id));
    setEdges(prevEdges => prevEdges.filter(e => e.from !== selectedNode.id && e.to !== selectedNode.id));
    setSelectedNode(null);
    setTempEdge(null);
  }

  if (!selectedNode) return null;

  return (
    <Paper id="vertex-settings" sx={{ position: 'absolute', top: 16, right: 16, width: 280, p: 2 }} elevation={6} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }}>
      <Typography variant="h6" gutterBottom>{t('vertex_settings_title')}</Typography>

      <TextField
        label={t('label_label')}
        value={label}
        size="small"
        fullWidth
        onChange={(e) => handleChange(setLabel, 'label', e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }}
        sx={{ mb: 2 }}
      />

      <Typography variant="caption">{t('size_label')}</Typography>
      <Slider
        value={size}
        min={5}
        max={40}
        onChange={(e, v) => handleChange(setSize, 'size', v)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" display="block">{t('color_label')}</Typography>
        <input
          type="color"
          id="v-color"
          style={{ width: '100%', height: 40, border: 'none', background: 'transparent' }}
          value={color}
          onChange={(e) => handleChange(setColor, 'color', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }}
        />
      </Box>

      <Button type="button" variant="contained" color="error" fullWidth sx={{ mb: 1 }} onClick={handleDeleteVertex}>{t('delete_vertex')}</Button>
      <Button type="button" variant="outlined" fullWidth onClick={handleClose}>{t('close')}</Button>
    </Paper>
  );
};

export default VertexSettings;