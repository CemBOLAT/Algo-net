import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { useI18n } from '../../../context/I18nContext';

const WeightedExampleDialog = ({ open, onClose, onSelectFile }) => {
  const { t } = useI18n();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('weighted_example_title')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" gutterBottom>
          {t('weighted_example_desc')}
        </Typography>
        <Box component="pre" sx={(theme) => ({
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
          color: theme.palette.text.primary,
          p: 2,
          borderRadius: 2,
          fontSize: 14,
          overflowX: 'auto'
        })}>
{t('weighted_example_code')}
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('weighted_example_note1')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button variant="contained" onClick={onSelectFile}>{t('weighted_example_select_file')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeightedExampleDialog;
