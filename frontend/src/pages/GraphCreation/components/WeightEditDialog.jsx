import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { useI18n } from '../../../context/I18nContext';

const WeightEditDialog = ({ open, value, error, onChange, onClose, onSave }) => {
  const { t } = useI18n();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('edit_weight_title')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t('weight_label')}
          type="number"
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={onSave} variant="contained">{t('save')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeightEditDialog;
