import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

const FileInfoDialog = ({ open, onClose, fileInputRef, openWeightedExample }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Graph Ekle - Bilgilendirme</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body1" gutterBottom>
        Dosyanız aşağıdaki formatta olmalıdır:
      </Typography>
      <Box component="pre" sx={(theme) => ({
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
        color: theme.palette.text.primary,
        p: 2,
        borderRadius: 2,
        fontSize: 14,
        overflowX: 'auto'
      })}>
{`L1:L2,L3,L4,L5
L2:L1,L3,L4`}
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Bu format, yönlü graph’ı tanımlar:
      </Typography>
      <ul>
        <li><strong>L1:L2,L3,L4,L5</strong> → L1 düğümünden L2, L3, L4 ve L5’e giden kenarlar vardır.</li>
        <li><strong>L2:L1,L3,L4</strong> → L2 düğümünden L1, L3 ve L4’e giden kenarlar vardır.</li>
      </ul>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Her satırda <code>Düğüm:Komşu1,Komşu2,...</code> formatı kullanılmalıdır.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>İptal</Button>
      <Button onClick={openWeightedExample}>Ağırlıklı Örnek</Button>
      <Button
        variant="contained"
        onClick={() => {
          onClose();
          try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
          fileInputRef.current?.click();
        }}
      >
        Dosya Seç
      </Button>
    </DialogActions>
  </Dialog>
);

export default FileInfoDialog;
