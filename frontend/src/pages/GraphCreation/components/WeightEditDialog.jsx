import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

const WeightEditDialog = ({ open, value, error, onChange, onClose, onSave }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle>Kenar Ağırlığını Düzenle</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Ağırlık"
        type="number"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>İptal</Button>
      <Button onClick={onSave} variant="contained">Kaydet</Button>
    </DialogActions>
  </Dialog>
);

export default WeightEditDialog;
