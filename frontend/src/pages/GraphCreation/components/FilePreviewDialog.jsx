import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { useI18n } from '../../../context/I18nContext';

const FilePreviewDialog = ({ open, fileName, content, onClose, onAdd }) => {
  const { t } = useI18n();
  return (
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
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button variant="contained" onClick={onAdd}>{t('add_label')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilePreviewDialog;
