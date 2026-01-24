import React, { useState, useEffect } from 'react';
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem, Button, Stack, Box, TextField, IconButton, Tooltip } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CustomAlgoButton from "./CustomAlgo";
import RunGraphAlgorithms from "./RunGraphAlgorithms";
import { useI18n } from '../context/I18nContext';


const Sidebar = ({
  onRun, onReset, onSave, isSaving = false,
  graphName = 'Graph Name', setGraphName = () => { },
  setNodes, nodes, setEdges, edges,
  isLoading = false, setIsLoading = () => { },
  notify = () => { },
  hasLegend = false, setHasLegend = () => { },
  legendEntries = [], setLegendEntries = () => { },
  showNodeLabels, setShowNodeLabels,
  showEdgeWeights, setShowEdgeWeights
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dfs');
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(graphName);

  const { t } = useI18n();

  useEffect(() => setLocalName(graphName), [graphName]);

  const handleAlgorithmChange = (e) => {
    setSelectedAlgorithm(e.target.value);
  };

  return (
    <Paper sx={{ width: 280, p: 2, height: '100%', boxSizing: 'border-box' }} elevation={2}>

      {!editingName ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">{graphName}</Typography>
          <Button size="small" onClick={() => { setLocalName(graphName); setEditingName(true); }}>{t('edit')}</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField size="small" value={localName} onChange={(e) => setLocalName(e.target.value)} sx={{ flex: 1 }} />
          <Button size="small" variant="contained" onClick={() => { setGraphName(localName); setEditingName(false); }}>{t('save_btn')}</Button>
          <Button size="small" variant="outlined" onClick={() => setEditingName(false)}>{t('cancel_btn')}</Button>
        </Box>
      )}

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="algorithm-select-label">{t('algorithm')}</InputLabel>
        <Select
          labelId="algorithm-select-label"
          id="algorithm-select"
          value={selectedAlgorithm}
          label={t('algorithm')}
          onChange={handleAlgorithmChange}
        >
          <MenuItem value="dfs">{t('dfs')}</MenuItem>
          <MenuItem value="dijkstra">{t('dijkstra')}</MenuItem>
          <MenuItem value="ordered_coloring">{t('ordered_coloring')}</MenuItem>
          <MenuItem value="layout_planning">{t('layout_planning')}</MenuItem>
          <MenuItem value="package_coloring">{t('package_coloring')}</MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={1}>
        {/* Visibility Toggles */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={showNodeLabels ? "Hide Node Labels" : "Show Node Labels"}>
            <Button
              variant={showNodeLabels ? "contained" : "outlined"}
              color="info"
              size="small"
              onClick={() => setShowNodeLabels(!showNodeLabels)}
              startIcon={showNodeLabels ? <Visibility /> : <VisibilityOff />}
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              {t('Labels')}
              {/* Fallback if translation missing: Labels */}
            </Button>
          </Tooltip>
          <Tooltip title={showEdgeWeights ? "Hide Edge Weights" : "Show Edge Weights"}>
            <Button
              variant={showEdgeWeights ? "contained" : "outlined"}
              color="info"
              size="small"
              onClick={() => setShowEdgeWeights(!showEdgeWeights)}
              startIcon={showEdgeWeights ? <Visibility /> : <VisibilityOff />}
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              {t('Weights')}
              {/* Fallback: Weights */}
            </Button>
          </Tooltip>
        </Box>

        <RunGraphAlgorithms
          setNodes={setNodes}
          nodes={nodes}
          setEdges={setEdges}
          edges={edges}
          selectedAlgo={selectedAlgorithm}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          notify={notify}
          onLegendChange={(entries) => { setLegendEntries(entries || []); setHasLegend(!!(entries && entries.length)); }}
          graphName={graphName}
        />

        <CustomAlgoButton
          setNodes={setNodes}
          nodes={nodes}
          edges={edges}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          notify={notify}
          graphName={graphName}
        />

        <Button id="reset-btn" variant="outlined" color="inherit" fullWidth onClick={onReset}>
          {t('reset_btn')}
        </Button>
        <Button
          id="save-btn"
          variant="contained"
          color="secondary"
          fullWidth
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? t('saving_btn') : t('save_btn')}
        </Button>
      </Stack>
    </Paper>
  );
};

export default Sidebar;