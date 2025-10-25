import React, { useMemo, useState } from 'react';
import { useI18n } from '../../../context/I18nContext';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Typography 
} from '@mui/material';

const QuickGraphDialog = ({ 
  open, 
  onClose, 
  quickGraphType, 
  setQuickGraphType,
  quickGraphNodeCount, 
  setQuickGraphNodeCount,
  quickGraphLayout,
  setQuickGraphLayout,
  quickGraphError,
  setQuickGraphError,
  onCreate 
}) => {
  // Local params for extra types
  const [treeChildCount, setTreeChildCount] = useState(2);
  const [starCenterCount, setStarCenterCount] = useState(1);
  const [bipartiteA, setBipartiteA] = useState(2);
  const [bipartiteB, setBipartiteB] = useState(2);
  const [gridRows, setGridRows] = useState(2);
  const [gridCols, setGridCols] = useState(2);
  const [gridWeight, setGridWeight] = useState(1);

  const { t } = useI18n();
  // formatter for placeholders like {n}, {m}, {max}
  const tf = (key, params = {}) => {
    const template = t(key);
    return String(template).replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
  };

  const handleNodeCountChange = (e) => {
    setQuickGraphNodeCount(Number(e.target.value));
    if (quickGraphError) setQuickGraphError('');
  };

  const handleTypeChange = (e) => {
    setQuickGraphType(e.target.value);
    if (quickGraphError) setQuickGraphError('');
    // Reset layout to sensible default for full; others will be auto in Graph.jsx
    if (e.target.value === 'full' && !quickGraphLayout) setQuickGraphLayout?.('circular');
  };

  const totalNodes = useMemo(() => {
    if (quickGraphType === 'bipartite') return Number(bipartiteA || 0) + Number(bipartiteB || 0);
    if (quickGraphType === 'grid') return Number(gridRows || 0) * Number(gridCols || 0);
    return Number(quickGraphNodeCount || 0);
  }, [quickGraphType, quickGraphNodeCount, bipartiteA, bipartiteB, gridRows, gridCols]);

  const edgeSummary = useMemo(() => {
    const n = totalNodes;
    if (!n || n < 1) return '';
    switch (quickGraphType) {
      case 'full':
        return tf('quickgraph_full_created', { n, m: Math.floor(n * (n - 1) / 2) });
      case 'tree':
        return tf('quickgraph_tree_created', { n, k: treeChildCount });
      case 'star':
        return tf('quickgraph_star_created', { n, c: starCenterCount });
      case 'ring':
        if (n === 1) return tf('quickgraph_ring_created', { m: t('ring_summary_one') });
        if (n === 2) return tf('quickgraph_ring_created', { m: t('ring_summary_two') });
        return tf('quickgraph_ring_created', { m: tf('ring_summary_general', { n }) });
      case 'bipartite':
        return tf('quickgraph_bipartite_created', { a: bipartiteA, b: bipartiteB, n: Number(bipartiteA)+Number(bipartiteB), m: Number(bipartiteA)*Number(bipartiteB) });
      case 'grid':
        return tf('quickgraph_grid_created', { r: gridRows, c: gridCols, n: gridRows * gridCols, m: ((gridRows - 1) * gridCols + (gridCols - 1) * gridRows), w: gridWeight });
      case 'random':
        return t('quickgraph_random_info_disabled');
      default:
        return '';
    }
  }, [quickGraphType, totalNodes, treeChildCount, starCenterCount, bipartiteA, bipartiteB, gridRows, gridCols, gridWeight, t]);

  const handleCreate = () => {
    // basic validations
    if (quickGraphType === 'bipartite') {
      if (Number(bipartiteA) < 1 || Number(bipartiteB) < 1) return setQuickGraphError?.(t('quickgraph_err_bipartite_min'));
    } else if (quickGraphType !== 'random') {
      if (Number(quickGraphNodeCount) < 1) return setQuickGraphError?.(t('quickgraph_err_nodecount'));
    }
    if (quickGraphType === 'tree' && Number(treeChildCount) < 1) return setQuickGraphError?.(t('quickgraph_err_tree_k'));
    if (quickGraphType === 'star') {
      const n = Number(quickGraphNodeCount || 1);
      const c = Number(starCenterCount || 1);
      if (c < 1 || c >= n) return setQuickGraphError?.(tf('quickgraph_err_star_centers_range', { max: Math.max(1, n - 1) }));
    }
    if (quickGraphType === 'grid') {
      if (Number(gridRows) < 1 || Number(gridCols) < 1) return setQuickGraphError?.(t('quickgraph_err_grid_dims_min'));
      if (Number(gridWeight) < 1) return setQuickGraphError?.(t('quickgraph_err_grid_weight_min'));
    }
    if (quickGraphType === 'random') return;

    // Pass only spec; generation happens in GraphCreation utils
    onCreate?.({
      quickGraphType,
      quickGraphLayout: quickGraphType === 'full' ? (quickGraphLayout || 'circular') : 'auto',
      quickGraphNodeCount:
        quickGraphType === 'bipartite'
          ? Number(bipartiteA) + Number(bipartiteB)
          : quickGraphType === 'grid'
          ? Number(gridRows) * Number(gridCols)
          : Number(quickGraphNodeCount),
      treeChildCount: quickGraphType === 'tree' ? Number(treeChildCount) : undefined,
      starCenterCount: quickGraphType === 'star' ? Number(starCenterCount) : undefined,
      bipartiteA: quickGraphType === 'bipartite' ? Number(bipartiteA) : undefined,
      bipartiteB: quickGraphType === 'bipartite' ? Number(bipartiteB) : undefined,
      gridRows: quickGraphType === 'grid' ? Number(gridRows) : undefined,
      gridCols: quickGraphType === 'grid' ? Number(gridCols) : undefined,
      gridWeight: quickGraphType === 'grid' ? Number(gridWeight) : undefined
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('quickgraph_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>{t('quickgraph_graph_type')}</InputLabel>
            <Select 
              value={quickGraphType} 
              label={t('quickgraph_graph_type')}
              onChange={handleTypeChange}
            >
              <MenuItem value="full">{t('quickgraph_type_full')}</MenuItem>
              <MenuItem value="tree">{t('quickgraph_type_tree')}</MenuItem>
              <MenuItem value="star">{t('quickgraph_type_star')}</MenuItem>
              <MenuItem value="ring">{t('quickgraph_type_ring')}</MenuItem>
              <MenuItem value="bipartite">{t('quickgraph_type_bipartite')}</MenuItem>
              <MenuItem value="grid">{t('quickgraph_type_grid')}</MenuItem>
              <MenuItem value="random">{t('quickgraph_type_random')}</MenuItem>
            </Select>
          </FormControl>

          {/* Layout: only for full; others auto in Graph.jsx */}
          {quickGraphType === 'full' && (
            <FormControl fullWidth>
              <InputLabel>{t('quickgraph_layout')}</InputLabel>
              <Select 
                value={quickGraphLayout || 'circular'} 
                label={t('quickgraph_layout')}
                onChange={(e) => setQuickGraphLayout(e.target.value)}
              >
                <MenuItem value="circular">{t('quickgraph_layout_circular')}</MenuItem>
                <MenuItem value="grid">{t('quickgraph_layout_grid')}</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* n input for non-bipartite and non-random */}
          {quickGraphType !== 'bipartite' && quickGraphType !== 'random' && quickGraphType !== 'grid' && (
            <TextField
              label={t('quickgraph_node_count')}
              type="number"
              fullWidth
              value={quickGraphNodeCount}
              onChange={handleNodeCountChange}
              inputProps={{ min: 1, max: 200 }}
              error={!!quickGraphError}
              helperText={quickGraphError || t('quickgraph_node_helper')}
            />
          )}

          {quickGraphType === 'tree' && (
            <TextField
              label={t('quickgraph_tree_k')}
              type="number"
              fullWidth
              value={treeChildCount}
              onChange={(e) => { setTreeChildCount(Number(e.target.value)); setQuickGraphError?.(''); }}
              inputProps={{ min: 1, max: 10 }}
            />
          )}

          {quickGraphType === 'star' && (
            <TextField
              label={`${t('quickgraph_star_centers')} (1..${Math.max(1, Number(quickGraphNodeCount || 1) - 1)})`}
              type="number"
              fullWidth
              value={starCenterCount}
              onChange={(e) => { setStarCenterCount(Number(e.target.value)); setQuickGraphError?.(''); }}
              inputProps={{ min: 1, max: Math.max(1, Number(quickGraphNodeCount || 1) - 1) }}
            />
          )}

          {quickGraphType === 'grid' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('quickgraph_grid_rows')}
                type="number"
                fullWidth
                value={gridRows}
                onChange={(e) => { setGridRows(Number(e.target.value)); setQuickGraphError?.(''); }}
                inputProps={{ min: 1, max: 20 }}
              />
              <TextField
                label={t('quickgraph_grid_cols')}
                type="number"
                fullWidth
                value={gridCols}
                onChange={(e) => { setGridCols(Number(e.target.value)); setQuickGraphError?.(''); }}
                inputProps={{ min: 1, max: 20 }}
              />
              <TextField
                label={t('quickgraph_grid_weight')}
                type="number"
                fullWidth
                value={gridWeight}
                onChange={(e) => { setGridWeight(Number(e.target.value)); setQuickGraphError?.(''); }}
                inputProps={{ min: 1, max: 100 }}
              />
            </Box>
          )}

          {quickGraphType === 'bipartite' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('quickgraph_bipartite_a')}
                type="number"
                fullWidth
                value={bipartiteA}
                onChange={(e) => { setBipartiteA(Number(e.target.value)); setQuickGraphError?.(''); }}
                inputProps={{ min: 1, max: 200 }}
              />
              <TextField
                label={t('quickgraph_bipartite_b')}
                type="number"
                fullWidth
                value={bipartiteB}
                onChange={(e) => { setBipartiteB(Number(e.target.value)); setQuickGraphError?.(''); }}
                inputProps={{ min: 1, max: 200 }}
              />
            </Box>
          )}

          {quickGraphType === 'random' && (
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2">{t('quickgraph_random_info_title')}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {t('quickgraph_random_info_line1')}
              </Typography>
              <Typography variant="body2">
                {t('quickgraph_random_info_line2')}
              </Typography>
              <Typography variant="body2">
                {t('quickgraph_random_info_line3')}
              </Typography>
              <Typography variant="body2">
                {t('quickgraph_random_info_line4')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {t('quickgraph_random_info_line5')}
              </Typography>
            </Box>
          )}
          
          <Typography variant="caption" color="text.secondary">
            {edgeSummary}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t('quickgraph_cancel')}
        </Button>
        <Button onClick={handleCreate} variant="contained" disabled={quickGraphType === 'random'}>
          {t('quickgraph_create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickGraphDialog;
