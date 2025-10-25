import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { useI18n } from '../../../context/I18nContext';

const FileInfoDialog = ({ open, onClose, fileInputRef, openWeightedExample }) => {
  const { t } = useI18n();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('file_info_title')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" gutterBottom>
          {t('file_info_desc')}
        </Typography>
        <Box component="pre" sx={(theme) => ({
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
          color: theme.palette.text.primary,
          p: 2,
          borderRadius: 2,
          fontSize: 14,
          overflowX: 'auto'
        })}>
{t('file_info_code')}
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('file_info_desc')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={openWeightedExample}>{t('file_info_select_weighted')}</Button>
        <Button
          variant="contained"
          onClick={() => {
            onClose();
            try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
            fileInputRef.current?.click();
          }}
        >
          {t('weighted_example_select_file')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileInfoDialog;
