import React from 'react';
import { Dialog, DialogContent, Button, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useI18n } from '../../../context/I18nContext';

const FilePreviewDialog = ({ open, fileName, content, onClose, onAdd }) => {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
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
            <VisibilityOutlinedIcon color="primary" fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
            {fileName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
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
          onClick={onAdd}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 'bold',
            textTransform: 'none',
            boxShadow: '0 4px 6px -1px rgba(19, 55, 236, 0.2)'
          }}
        >
          {t('add_label')}
        </Button>
      </Box>
    </Dialog>
  );
};

export default FilePreviewDialog;
