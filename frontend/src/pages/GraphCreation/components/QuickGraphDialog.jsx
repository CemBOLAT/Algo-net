import React, { useMemo, useState } from 'react';
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
        return `Tam graph: ${n} düğüm, ${Math.floor(n * (n - 1) / 2)} kenar (yönsüz)`;
      case 'tree':
        return `Ağaç: ${n} düğüm, ${Math.max(0, n - 1)} kenar, k=${treeChildCount}`;
      case 'star':
        return `Star: ${n} düğüm, ${Math.max(0, n - starCenterCount)} yaprak, merkez sayısı=${starCenterCount}`;
      case 'ring':
        if (n === 1) return 'Ring: 1 düğüm, 1 self-loop';
        if (n === 2) return 'Ring: 2 düğüm, aralarında 2 paralel kenar';
        return `Ring: ${n} düğüm, ${n} kenar (cycle)`;
      case 'bipartite':
        return `Tam iki parça: A=${bipartiteA}, B=${bipartiteB}, toplam ${Number(bipartiteA)+Number(bipartiteB)} düğüm, kenar=${Number(bipartiteA)*Number(bipartiteB)}`;
      case 'grid':
        return `Grid: ${gridRows}x${gridCols} (${gridRows * gridCols} düğüm), kenar=${((gridRows - 1) * gridCols + (gridCols - 1) * gridRows)}, kenar ağırlığı=${gridWeight}`;
      case 'random':
        return 'Random: öneriler gösterilir, oluşturma kapalı.';
      default:
        return '';
    }
  }, [quickGraphType, totalNodes, treeChildCount, starCenterCount, bipartiteA, bipartiteB, gridRows, gridCols, gridWeight]);

  const handleCreate = () => {
    // basic validations
    if (quickGraphType === 'bipartite') {
      if (Number(bipartiteA) < 1 || Number(bipartiteB) < 1) return setQuickGraphError?.('A ve B en az 1 olmalı.');
    } else if (quickGraphType !== 'random') {
      if (Number(quickGraphNodeCount) < 1) return setQuickGraphError?.('Geçerli bir düğüm sayısı girin.');
    }
    if (quickGraphType === 'tree' && Number(treeChildCount) < 1) return setQuickGraphError?.('Ağaç için k >= 1 olmalı.');
    if (quickGraphType === 'star') {
      const n = Number(quickGraphNodeCount || 1);
      const c = Number(starCenterCount || 1);
      if (c < 1 || c >= n) return setQuickGraphError?.(`Merkez sayısı 1..${Math.max(1, n - 1)} aralığında olmalı.`);
    }
    if (quickGraphType === 'grid') {
      if (Number(gridRows) < 1 || Number(gridCols) < 1) return setQuickGraphError?.('Grid için satır ve sütun sayısı en az 1 olmalı.');
      if (Number(gridWeight) < 1) return setQuickGraphError?.('Grid için kenar ağırlığı en az 1 olmalı.');
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
      <DialogTitle>Hızlı Graph Oluştur</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Graph Tipi</InputLabel>
            <Select 
              value={quickGraphType} 
              label="Graph Tipi" 
              onChange={handleTypeChange}
            >
              <MenuItem value="full">Tam Graph (Complete)</MenuItem>
              <MenuItem value="tree">Ağaç (n, k)</MenuItem>
              <MenuItem value="star">Star (n, merkez)</MenuItem>
              <MenuItem value="ring">Ring (n)</MenuItem>
              <MenuItem value="bipartite">Tam İki Parça (a, b)</MenuItem>
              <MenuItem value="grid">Grid (m, n, w)</MenuItem>
              <MenuItem value="random">Random (öneri)</MenuItem>
            </Select>
          </FormControl>

          {/* Layout: only for full; others auto in Graph.jsx */}
          {quickGraphType === 'full' && (
            <FormControl fullWidth>
              <InputLabel>Layout</InputLabel>
              <Select 
                value={quickGraphLayout || 'circular'} 
                label="Layout" 
                onChange={(e) => setQuickGraphLayout(e.target.value)}
              >
                <MenuItem value="circular">Dairesel (Circular)</MenuItem>
                <MenuItem value="grid">Izgara (Grid)</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* n input for non-bipartite and non-random */}
          {quickGraphType !== 'bipartite' && quickGraphType !== 'random' && quickGraphType !== 'grid' && (
            <TextField
              label="Düğüm Sayısı (n)"
              type="number"
              fullWidth
              value={quickGraphNodeCount}
              onChange={handleNodeCountChange}
              inputProps={{ min: 1, max: 200 }}
              error={!!quickGraphError}
              helperText={quickGraphError || "1-200 arasında bir sayı girin"}
            />
          )}

          {quickGraphType === 'tree' && (
            <TextField
              label="Çocuk Sayısı (k)"
              type="number"
              fullWidth
              value={treeChildCount}
              onChange={(e) => { setTreeChildCount(Number(e.target.value)); setQuickGraphError?.(''); }}
              inputProps={{ min: 1, max: 10 }}
            />
          )}

          {quickGraphType === 'star' && (
            <TextField
              label={`Merkez Sayısı (1..${Math.max(1, Number(quickGraphNodeCount || 1) - 1)})`}
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
                label="Satır Sayısı (m)"
                type="number"
                fullWidth
                value={gridRows}
                onChange={(e) => { setGridRows(Number(e.target.value)); setQuickGraphError?.(''); }}
                inputProps={{ min: 1, max: 20 }}
              />
              <TextField
                label="Sütun Sayısı (n)"
                type="number"
                fullWidth
                value={gridCols}
                onChange={(e) => { setGridCols(Number(e.target.value)); setQuickGraphError?.(''); }}
                inputProps={{ min: 1, max: 20 }}
              />
              <TextField
                label="Kenar Ağırlığı (w)"
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
                label="A kümesi (a)"
                type="number"
                fullWidth
                value={bipartiteA}
                onChange={(e) => { setBipartiteA(Number(e.target.value)); setQuickGraphError?.(''); }}
                inputProps={{ min: 1, max: 200 }}
              />
              <TextField
                label="B kümesi (b)"
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
              <Typography variant="subtitle2">Random graph önerileri</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                - Erdős–Rényi G(n, p): her kenar p olasılıkla eklenir (O(n^2) olası kenar; sparse için edge sampling).
              </Typography>
              <Typography variant="body2">
                - G(n, m): tam m adet kenar rastgele seçilir (kenar sayısı kontrolü için).
              </Typography>
              <Typography variant="body2">
                - Barabási–Albert: tercihli bağlanma (ölçekten bağımsız).
              </Typography>
              <Typography variant="body2">
                - Watts–Strogatz: küçük-dünya, yüksek kümeleşme.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Uygulama: tohumlu RNG, O(n + m) üretim, self-loop/çoklu-kenar opsiyonu ve yön/yük ayarları ekleyin.
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
          İptal
        </Button>
        <Button onClick={handleCreate} variant="contained" disabled={quickGraphType === 'random'}>
          Oluştur
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickGraphDialog;
