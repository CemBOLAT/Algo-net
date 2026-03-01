import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { useI18n } from '../../../context/I18nContext';

const ColoredFormatLine = ({ vertex, targets }) => {
  return (
    <Box component="span" sx={{ display: 'block', lineHeight: 1.8 }}>
      <Box component="span" sx={{ color: '#60a5fa', fontWeight: 700 }}>{vertex}</Box>
      <Box component="span" sx={{ color: '#94a3b8' }}>:</Box>
      {targets.map((lbl, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Box component="span" sx={{ color: '#94a3b8' }}>, </Box>}
          <Box component="span" sx={{ color: '#34d399', fontWeight: 600 }}>{lbl}</Box>
        </React.Fragment>
      ))}
    </Box>
  );
};

const FileInfoDialog = ({ open, onClose, fileInputRef, openWeightedExample, openColoredExample, openJsonExample }) => {
  const { t } = useI18n();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('file_info_title')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" gutterBottom>
          {t('file_info_desc')}
        </Typography>

        {/* Colored example block */}
        <Box
          sx={(theme) => ({
            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#1e293b',
            borderRadius: 2,
            p: 2,
            fontFamily: 'monospace',
            fontSize: 14,
            overflowX: 'auto',
          })}
        >
          <ColoredFormatLine vertex="L1" targets={['L2', 'L3', 'L4', 'L5']} />
          <ColoredFormatLine vertex="L2" targets={['L1', 'L3', 'L4']} />
          <ColoredFormatLine vertex="L3" targets={['L5']} />
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#60a5fa' }} />
            <Typography variant="caption" color="text.secondary">Vertex</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#34d399' }} />
            <Typography variant="caption" color="text.secondary">Neighbor</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={openWeightedExample}>{t('file_info_select_weighted')}</Button>
        <Button onClick={openColoredExample}>{t('file_info_select_colored')}</Button>
        <Button
          variant="contained"
          onClick={() => {
            onClose();
            try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch { }
            fileInputRef.current?.click();
          }}
        >
          {t('weighted_example_select_file')}
        </Button>
        <Button variant="contained" onClick={openJsonExample}>{t('file_info_select_json')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileInfoDialog;
