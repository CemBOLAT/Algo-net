import React from 'react';
import { Dialog, DialogContent, Button, Typography, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { useI18n } from '../../../context/I18nContext';

/** Small colored JSON token */
const T = ({ children, color }) => (
    <Box component="span" sx={{ color }}>{children}</Box>
);

const JsonExampleDialog = ({ open, onClose, onSelectFile }) => {
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
                        <DataObjectIcon color="primary" fontSize="small" />
                    </Box>
                    <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
                        {t('json_example_title')}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('json_example_desc')}
                </Typography>

                {/* Colored JSON preview */}
                <Box
                    sx={(theme) => ({
                        bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#1e293b',
                        borderRadius: 2,
                        p: 2,
                        fontFamily: 'monospace',
                        fontSize: 12.5,
                        overflowX: 'auto',
                        lineHeight: 1.75,
                    })}
                >
                    {/* { */}
                    <Box><T color="#94a3b8">{'{'}</T></Box>

                    {/* "name" */}
                    <Box sx={{ pl: 2 }}>
                        <T color="#f472b6">"name"</T>
                        <T color="#94a3b8">: </T>
                        <T color="#34d399">"my_graph"</T>
                        <T color="#94a3b8">,</T>
                    </Box>

                    {/* "nodes" */}
                    <Box sx={{ pl: 2 }}>
                        <T color="#f472b6">"nodes"</T>
                        <T color="#94a3b8">: [{'{'}</T>
                    </Box>
                    <Box sx={{ pl: 4 }}>
                        <T color="#f472b6">"nodeId"</T><T color="#94a3b8">: </T><T color="#34d399">"1"</T><T color="#94a3b8">, </T>
                        <T color="#f472b6">"label"</T><T color="#94a3b8">: </T><T color="#34d399">"A"</T><T color="#94a3b8">, </T>
                        <T color="#f472b6">"color"</T><T color="#94a3b8">: </T><T color="#34d399">"#1976d2"</T><T color="#94a3b8">,</T>
                    </Box>
                    <Box sx={{ pl: 4 }}>
                        <T color="#f472b6">"positionX"</T><T color="#94a3b8">: </T><T color="#f97316">100</T><T color="#94a3b8">, </T>
                        <T color="#f472b6">"positionY"</T><T color="#94a3b8">: </T><T color="#f97316">200</T>
                    </Box>
                    <Box sx={{ pl: 2 }}>
                        <T color="#94a3b8">{'}],'}</T>
                    </Box>

                    {/* "edges" */}
                    <Box sx={{ pl: 2 }}>
                        <T color="#f472b6">"edges"</T>
                        <T color="#94a3b8">: [{'{'}</T>
                    </Box>
                    <Box sx={{ pl: 4 }}>
                        <T color="#f472b6">"fromNode"</T><T color="#94a3b8">: </T><T color="#34d399">"1"</T><T color="#94a3b8">, </T>
                        <T color="#f472b6">"toNode"</T><T color="#94a3b8">: </T><T color="#34d399">"2"</T><T color="#94a3b8">,</T>
                    </Box>
                    <Box sx={{ pl: 4 }}>
                        <T color="#f472b6">"weight"</T><T color="#94a3b8">: </T><T color="#f97316">5</T><T color="#94a3b8">, </T>
                        <T color="#f472b6">"isDirected"</T><T color="#94a3b8">: </T><T color="#60a5fa">false</T>
                    </Box>
                    <Box sx={{ pl: 2 }}>
                        <T color="#94a3b8">{'}]'}</T>
                    </Box>

                    <Box><T color="#94a3b8">{'}'}</T></Box>
                </Box>

                {/* Legend */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f472b6' }} />
                        <Typography variant="caption" color="text.secondary">Key</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#34d399' }} />
                        <Typography variant="caption" color="text.secondary">String value</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f97316' }} />
                        <Typography variant="caption" color="text.secondary">Number</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#60a5fa' }} />
                        <Typography variant="caption" color="text.secondary">Boolean</Typography>
                    </Box>
                </Box>

                <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                    {t('json_example_note')}
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

export default JsonExampleDialog;
