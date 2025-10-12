import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';

const FilePreviewDialog = ({ open, fileName, content, onClose, onAdd }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>{fileName}</DialogTitle>
    <DialogContent dividers>
      <Box
        component="pre"
        sx={(theme) => ({
          whiteSpace: 'pre-wrap',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'transparent',
          color: theme.palette.text.primary,
          p: theme.spacing(1),
          borderRadius: 1,
          overflowX: 'auto'
        })}
      >
        {content}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Kapat</Button>
      <Button variant="contained" onClick={onAdd}>Ekle</Button>
    </DialogActions>
  </Dialog>
);

export default FilePreviewDialog;
