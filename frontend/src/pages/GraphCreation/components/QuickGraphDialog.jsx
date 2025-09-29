import React from 'react';
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
  
  const handleNodeCountChange = (e) => {
    setQuickGraphNodeCount(Number(e.target.value));
    if (quickGraphError) setQuickGraphError('');
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
              onChange={(e) => setQuickGraphType(e.target.value)}
            >
              <MenuItem value="full">Tam Graph (Complete Graph)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Layout</InputLabel>
            <Select 
              value={quickGraphLayout} 
              label="Layout" 
              onChange={(e) => setQuickGraphLayout(e.target.value)}
            >
              <MenuItem value="circular">Dairesel (Circular)</MenuItem>
              <MenuItem value="grid">Izgara (Grid)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Düğüm Sayısı"
            type="number"
            fullWidth
            value={quickGraphNodeCount}
            onChange={handleNodeCountChange}
            inputProps={{ min: 2, max: 20 }}
            error={!!quickGraphError}
            helperText={quickGraphError || "2-20 arasında bir sayı girin"}
          />
          
          <Typography variant="caption" color="textSecondary">
            {quickGraphType === 'full' && (
              `Tam graph: ${quickGraphNodeCount} düğüm, ${
                Math.floor(quickGraphNodeCount * (quickGraphNodeCount - 1) / 2)
              } kenar (yönsüz)`
            )}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          İptal
        </Button>
        <Button onClick={onCreate} variant="contained">
          Oluştur
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickGraphDialog;
