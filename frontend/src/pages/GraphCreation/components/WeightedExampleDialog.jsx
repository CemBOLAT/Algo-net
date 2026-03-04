import React from 'react';
import { Dialog, DialogContent, Button, Typography, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import { useI18n } from '../../../context/I18nContext';

/**
 * Renders a colorized weighted format line.
 * e.g.  L1:(L2, 3),(L3, 1)
 */
const WeightedFormatLine = ({ vertex, targets }) => {
  return (
    <Box component="span" sx={{ display: 'block', lineHeight: 1.8 }}>
      {/* Vertex name — blue */}
      <Box component="span" sx={{ color: '#60a5fa', fontWeight: 700 }}>{vertex}</Box>
      {/* Colon separator */}
      <Box component="span" sx={{ color: '#94a3b8' }}>:</Box>
      {targets.map((t, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Box component="span" sx={{ color: '#94a3b8' }}>, </Box>}
          <Box component="span" sx={{ color: '#94a3b8' }}>(</Box>
          {/* Neighbor — green */}
          <Box component="span" sx={{ color: '#34d399', fontWeight: 600 }}>{t.label}</Box>
          <Box component="span" sx={{ color: '#94a3b8' }}>, </Box>
          {/* Weight — orange */}
          <Box component="span" sx={{ color: '#f97316', fontWeight: 600 }}>{t.weight}</Box>
          <Box component="span" sx={{ color: '#94a3b8' }}>)</Box>
        </React.Fragment>
      ))}
    </Box>
  );
};

const WeightedExampleDialog = ({ open, onClose, onSelectFile }) => {
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
            <CodeIcon color="primary" fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
            {t('weighted_example_title')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('weighted_example_desc')}
        </Typography>

        {/* Colored weighted example block */}
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
          <WeightedFormatLine vertex="L1" targets={[{ label: 'L2', weight: 3 }, { label: 'L3', weight: 1 }, { label: 'L4', weight: 2 }, { label: 'L5', weight: 4 }]} />
          <WeightedFormatLine vertex="L2" targets={[{ label: 'L1', weight: 3 }, { label: 'L3', weight: 5 }, { label: 'L4', weight: 1 }]} />
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f97316' }} />
            <Typography variant="caption" color="text.secondary">Weight</Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('weighted_example_note1')}
        </Typography>
      </DialogContent>

      {/* Footer */}
      <Box sx={{
        px: 3,
        py: 2.5,
        bgcolor: 'background.default',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={onClose}
          sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'none', '&:hover': { bgcolor: 'action.hover' } }}
        >
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={onSelectFile}
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
    </Dialog>
  );
};

export default WeightedExampleDialog;
