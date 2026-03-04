import React, { useMemo, useState } from 'react';
import { useI18n } from '../../../context/I18nContext';
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HubIcon from '@mui/icons-material/Hub';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const QuickGraphDialog = ({
  open,
  onClose,
  quickGraphType,
  setQuickGraphType,
  quickGraphNodeCount,
  setQuickGraphNodeCount,
  quickGraphLayout,
  setQuickGraphLayout,
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
  const [pathLength, setpathLength] = useState(2);
  const [graphPathLength, setgraphPathLength] = useState(2);
  const [graphSize, setgraphSize] = useState(1);

  const { t } = useI18n();
  // formatter for placeholders like {n}, {m}, {max}
  const tf = (key, params = {}) => {
    const template = t(key);
    return String(template).replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
  };

  const handleNodeCountChange = (e) => {
    setQuickGraphNodeCount(Number(e.target.value));
  };

  const handleTypeChange = (e) => {
    setQuickGraphType(e.target.value);
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
        return tf('quickgraph_bipartite_created', { a: bipartiteA, b: bipartiteB, n: Number(bipartiteA) + Number(bipartiteB), m: Number(bipartiteA) * Number(bipartiteB) });
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
      if (Number(bipartiteA) < 1 || Number(bipartiteB) < 1) return onCreate?.({ error: t('quickgraph_err_bipartite_min') }); // setQuickGraphError yerine
    }
    else if (quickGraphType !== 'random') {
      if (Number(quickGraphNodeCount) < 1) return onCreate?.({ error: t('quickgraph_err_nodecount') }); // setQuickGraphError yerine
    }
    if (quickGraphType === 'tree' && Number(treeChildCount) < 1) return onCreate?.({ error: t('quickgraph_err_tree_k') }); // setQuickGraphError yerine
    if (quickGraphType === 'star') {
      const n = Number(quickGraphNodeCount || 1);
      const c = Number(starCenterCount || 1);
      if (c < 1 || c >= n) return onCreate?.({ error: tf('quickgraph_err_star_centers_range', { max: Math.max(1, n - 1) }) }); // setQuickGraphError yerine
    }
    if (quickGraphType === 'grid') {
      if (Number(gridRows) < 1 || Number(gridCols) < 1) return onCreate?.({ error: t('quickgraph_err_grid_dims_min') }); // setQuickGraphError yerine
      if (Number(gridWeight) < 1) return onCreate?.({ error: t('quickgraph_err_grid_weight_min') }); // setQuickGraphError yerine
    }
    if (quickGraphType === 'Melih') {
      console.log("graphPathLength, pathLength, graphSize:", graphPathLength, pathLength, graphSize);
      if (Number(graphPathLength) <= 0) return onCreate?.({ error: t('quickgraph_err_Melih_Bn') }); // setQuickGraphError yerine
      if (Number(pathLength) <= 0) return onCreate?.({ error: t('quickgraph_err_Melih_Bn') }); // setQuickGraphError yerine
      if (Number(graphSize) <= 0) return onCreate?.({ error: t('quickgraph_err_Melih_Kn_positive') }); // setQuickGraphError yerine
      if (Number(graphPathLength) > Number(graphSize)) { console.log("graphPathLength,", graphPathLength, graphSize); return onCreate?.({ error: t('quickgraph_err_Melih_Bn_Kn') }) }; // setQuickGraphError yerine
      if (Number(pathLength) % Number(graphPathLength) !== 0) { console.log("bba"); return onCreate?.({ error: t('quickgraph_err_Melih_Pn_Bn') }); } // setQuickGraphError yerine
    }

    // Pass only spec; generation happens in GraphCreation utils
    onCreate?.({
      quickGraphType,
      quickGraphLayout: quickGraphType === 'full' ? (quickGraphLayout || 'circular') : 'auto',
      quickGraphNodeCount:
        quickGraphType === 'bipartite'
          ? Number(bipartiteA) + Number(bipartiteB)
          : quickGraphType === 'grid'
            ? Number(gridRows) * Number(gridCols)
            : quickGraphType === 'Melih'
              ? Number(pathLength) / Number(graphPathLength)
              : Number(quickGraphNodeCount),
      treeChildCount: quickGraphType === 'tree' ? Number(treeChildCount) : undefined,
      starCenterCount: quickGraphType === 'star' ? Number(starCenterCount) : undefined,
      bipartiteA: quickGraphType === 'bipartite' ? Number(bipartiteA) : undefined,
      bipartiteB: quickGraphType === 'bipartite' ? Number(bipartiteB) : undefined,
      gridRows: quickGraphType === 'grid' ? Number(gridRows) : undefined,
      gridCols: quickGraphType === 'grid' ? Number(gridCols) : undefined,
      gridWeight: quickGraphType === 'grid' ? Number(gridWeight) : undefined,
      pathLength: quickGraphType === 'Melih' ? Number(pathLength) : undefined,
      graphPathLength: quickGraphType === 'Melih' ? Number(graphPathLength) : undefined,
      graphSize: quickGraphType === 'Melih' ? Number(graphSize) : undefined
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 3,
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            bgcolor: 'primary.50',
            p: 1,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HubIcon color="primary" fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
            {t('quickgraph_title')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" fontWeight="600" color="text.secondary">
              {t('quickgraph_graph_type')}
            </Typography>
            <TextField
              select
              size="small"
              value={quickGraphType}
              onChange={handleTypeChange}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
            >
              <MenuItem value="full">{t('quickgraph_type_full')}</MenuItem>
              <MenuItem value="tree">{t('quickgraph_type_tree')}</MenuItem>
              <MenuItem value="star">{t('quickgraph_type_star')}</MenuItem>
              <MenuItem value="ring">{t('quickgraph_type_ring')}</MenuItem>
              <MenuItem value="bipartite">{t('quickgraph_type_bipartite')}</MenuItem>
              <MenuItem value="grid">{t('quickgraph_type_grid')}</MenuItem>
              <MenuItem value="random">{t('quickgraph_type_random')}</MenuItem>
              <MenuItem value="Melih"> {t('quickgraph_Ahmet_Melih')}</MenuItem>
            </TextField>
          </Box>

          {/* Layout: only for full; others auto in Graph.jsx */}
          {quickGraphType === 'full' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary">
                {t('quickgraph_layout')}
              </Typography>
              <TextField
                select
                size="small"
                value={quickGraphLayout || 'circular'}
                onChange={(e) => setQuickGraphLayout(e.target.value)}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
              >
                <MenuItem value="circular">{t('quickgraph_layout_circular')}</MenuItem>
                <MenuItem value="grid">{t('quickgraph_layout_grid')}</MenuItem>
              </TextField>
            </Box>
          )}

          {/* n input for non-bipartite */}
          {quickGraphType !== 'bipartite' && quickGraphType !== 'grid' && quickGraphType !== 'Melih' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary">
                {t('quickgraph_node_count')}
              </Typography>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={quickGraphNodeCount}
                onChange={handleNodeCountChange}
                inputProps={{ min: 1, max: 200 }}
                helperText={t('quickgraph_node_helper')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
              />
            </Box>
          )}

          {quickGraphType === 'tree' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary">
                {t('quickgraph_tree_k')}
              </Typography>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={treeChildCount}
                onChange={(e) => { setTreeChildCount(Number(e.target.value)); }}
                inputProps={{ min: 1, max: 10 }}
                helperText={t('quickgraph_tree_k_helper')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
              />
            </Box>
          )}

          {quickGraphType === 'star' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary">
                {`${t('quickgraph_star_centers')} (1..${Math.max(1, Number(quickGraphNodeCount || 1) - 1)})`}
              </Typography>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={starCenterCount}
                onChange={(e) => { setStarCenterCount(Number(e.target.value)); }}
                inputProps={{ min: 1, max: Math.max(1, Number(quickGraphNodeCount || 1) - 1) }}
                helperText={t('quickgraph_star_centers_helper')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
              />
            </Box>
          )}

          {quickGraphType === 'grid' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary">{t('quickgraph_grid_rows')}</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={gridRows}
                  onChange={(e) => { setGridRows(Number(e.target.value)); }}
                  inputProps={{ min: 1, max: 20 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary">{t('quickgraph_grid_cols')}</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={gridCols}
                  onChange={(e) => { setGridCols(Number(e.target.value)); }}
                  inputProps={{ min: 1, max: 20 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary">{t('quickgraph_grid_weight')}</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={gridWeight}
                  onChange={(e) => { setGridWeight(Number(e.target.value)); }}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                />
              </Box>
            </Box>
          )}

          {quickGraphType === 'Melih' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary">{t('quickgraph_Pn')}</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={pathLength}
                  onChange={(e) => { setpathLength(Number(e.target.value)); }}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary">{t('quickgraph_Bn')}</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={graphPathLength}
                  onChange={(e) => { setgraphPathLength(Number(e.target.value)); }}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary">{t('quickgraph_Kn')}</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={graphSize}
                  onChange={(e) => { setgraphSize(Number(e.target.value)); }}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                />
              </Box>
            </Box>
          )}

          {quickGraphType === 'bipartite' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary">{t('quickgraph_bipartite_a')}</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={bipartiteA}
                  onChange={(e) => { setBipartiteA(Number(e.target.value)); }}
                  inputProps={{ min: 1, max: 200 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary">{t('quickgraph_bipartite_b')}</Typography>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={bipartiteB}
                  onChange={(e) => { setBipartiteB(Number(e.target.value)); }}
                  inputProps={{ min: 1, max: 200 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                />
              </Box>
            </Box>
          )}

          {quickGraphType === 'random' && (
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="700">{t('quickgraph_random_info_title')}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('quickgraph_random_info_line1')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('quickgraph_random_info_line2')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('quickgraph_random_info_line3')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('quickgraph_random_info_line4')}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('quickgraph_random_info_line5')}</Typography>
            </Box>
          )}

          {edgeSummary && (
            <Box sx={{
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.200',
              borderRadius: 2,
              p: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5
            }}>
              <InfoOutlinedIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" fontWeight="600" color="primary.800">Preview Summary</Typography>
                <Typography variant="body2" color="text.secondary">{edgeSummary}</Typography>
              </Box>
            </Box>
          )}

        </Box>
      </DialogContent>

      {/* Footer */}
      <Box sx={{
        px: 3,
        py: 2.5,
        bgcolor: 'background.default',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={onClose}
          sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'none', '&:hover': { bgcolor: 'action.hover' } }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 'bold',
            textTransform: 'none',
            boxShadow: '0 4px 6px -1px rgba(19, 55, 236, 0.2)'
          }}
        >
          Create Graph
        </Button>
      </Box>
    </Dialog>
  );
};

export default QuickGraphDialog;
