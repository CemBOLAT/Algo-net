import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Button, Switch, FormControlLabel, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useI18n } from '../context/I18nContext';

const EdgeSettings = ({ selectedEdge, setSelectedEdge, setEdges, setTempEdge, nodes }) => {
  const { t } = useI18n();
  const [weight, setWeight] = useState(selectedEdge?.weight || 1);
  const [label, setLabel] = useState(selectedEdge?.label || '');
  const [directed, setDirected] = useState(selectedEdge?.directed || false);
  const [color, setColor] = useState(selectedEdge?.color || '#1985d2');
  const [fromId, setFromId] = useState(selectedEdge?.from || '');
  const [toId, setToId] = useState(selectedEdge?.to || '');

  useEffect(() => {
    if (selectedEdge) {
      setWeight(selectedEdge.weight || 1);
      setLabel(selectedEdge.label || '');
      setDirected(selectedEdge.directed || false);
      setColor(selectedEdge.color || '#1985d2');
      setFromId(selectedEdge.from || '');
      setToId(selectedEdge.to || '');
    }
  }, [selectedEdge]);

  const handleEdgeUpdate = (key, value) => {
    // Update local states where applicable
    if (key === 'weight') setWeight(value);
    if (key === 'label') setLabel(value);
    if (key === 'directed') setDirected(value);
    if (key === 'color') setColor(value);
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
      <Typography variant="h6" gutterBottom>{t('edge_settings_title')}</Typography>

      <TextField
        label={t('label_label')}
        value={label}
        size="small"
        fullWidth
        onChange={(e) => handleEdgeUpdate('label', e.target.value)}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={<Switch checked={(selectedEdge.showWeight ?? true)} onChange={(e) => handleEdgeUpdate('showWeight', e.target.checked)} />}
        label={t('show_weight_label')}
      />

      {(selectedEdge.showWeight ?? true) && (
        <TextField
          label={t('weight_label')}
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
        label={t('directed_toggle_label')}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1, justifyContent: 'space-between' }}>
        <Typography variant="body2">{t('edge_color')}</Typography>
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            handleEdgeUpdate('color', e.target.value);
          }}
          style={{ width: '32px', height: '32px', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}
          title="Edge Color"
        />
      </Box>

      {/* Show source/target selectors only for directed edges */}
      {directed && (
        <Box sx={{ mt: 1, mb: 2, display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="from-label">{t('source_label')}</InputLabel>
            <Select
              labelId="from-label"
              value={fromId}
              label={t('source_label')}
              onChange={(e) => handleEdgeUpdate('from', e.target.value)}
            >
              {nodes.map(n => (
                <MenuItem key={n.id} value={n.id}>{n.label || n.id}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="to-label">{t('target_label')}</InputLabel>
            <Select
              labelId="to-label"
              value={toId}
              label={t('target_label')}
              onChange={(e) => handleEdgeUpdate('to', e.target.value)}
            >
              {nodes.map(n => (
                <MenuItem key={n.id} value={n.id}>{n.label || n.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Button variant="contained" color="error" fullWidth sx={{ mb: 1 }} onClick={handleDeletingEdge}>{t('delete_edge')}</Button>
      <Button variant="outlined" fullWidth onClick={handleClose}>{t('close')}</Button>
    </Paper>
  );
};

export default EdgeSettings;