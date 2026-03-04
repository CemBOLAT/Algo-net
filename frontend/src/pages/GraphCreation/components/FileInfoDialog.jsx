import React from 'react';
import { Dialog, DialogContent, Button, Typography, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 3,
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            bgcolor: 'primary.50',
            p: 1,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IntegrationInstructionsOutlinedIcon color="primary" fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
            {t('file_info_title')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
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

      <Box sx={{
        px: 3,
        py: 2.5,
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={openWeightedExample}
            sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
          >
            {t('file_info_select_weighted')}
          </Button>
          <Button
            variant="outlined"
            onClick={openColoredExample}
            sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
          >
            {t('file_info_select_colored')}
          </Button>
          <Button
            variant="outlined"
            onClick={openJsonExample}
            sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
          >
            {t('file_info_select_json')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
          <Button
            onClick={onClose}
            sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'none', '&:hover': { bgcolor: 'action.hover' } }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              onClose();
              try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch { }
              fileInputRef.current?.click();
            }}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: '0 4px 6px -1px rgba(19, 55, 236, 0.2)'
            }}
          >
            {t('weighted_example_select_file')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default FileInfoDialog;
