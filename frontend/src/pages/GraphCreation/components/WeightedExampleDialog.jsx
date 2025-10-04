import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

const WeightedExampleDialog = ({ open, onClose, onSelectFile }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Ağırlıklı Graph Ekle - Bilgilendirme</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body1" gutterBottom>
        Aşağıdaki örnek, kenar ağırlıklarını içeren dosya formatını gösterir:
      </Typography>
      <Box component="pre" sx={(theme) => ({
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
        color: theme.palette.text.primary,
        p: 2,
        borderRadius: 2,
        fontSize: 14,
        overflowX: 'auto'
      })}>
{`L1:(L2, 3),(L3, 1),(L4, 2),(L5, 4)
L2:(L1, 3),(L3, 5),(L4, 1)`}
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Bu format, yönlü graph’ı tanımlar:
      </Typography>
      <ul>
        <li><strong>L1:(L2, 3),(L3, 1),(L4, 2),(L5, 4)</strong> → L1 → L2 ağırlık 3 vb.</li>
        <li><strong>L2:(L1, 3),(L3, 5),(L4, 1)</strong></li>
      </ul>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Her satır <code>Düğüm:(Komşu, Ağırlık),(Komşu, Ağırlık),...</code> formatındadır.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>İptal</Button>
      <Button variant="contained" onClick={onSelectFile}>Dosya Seç</Button>
    </DialogActions>
  </Dialog>
);

export default WeightedExampleDialog;
