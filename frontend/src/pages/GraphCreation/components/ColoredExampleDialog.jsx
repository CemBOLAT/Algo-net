import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { useI18n } from '../../../context/I18nContext';

/**
 * Renders one colorized line of the colored vertex format.
 *
 * Formats supported:
 *   VERTEX: NEIGHBOR, NEIGHBOR : "color"   — vertex + edges + color
 *   VERTEX: "color"                         — vertex only + color
 */
const ColoredLine = ({ vertex, neighbors = [], color }) => {
    return (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 2 }}>
            {/* Vertex — blue */}
            <Box component="span" sx={{ color: '#60a5fa', fontWeight: 700 }}>{vertex}</Box>
            <Box component="span" sx={{ color: '#94a3b8' }}>:</Box>

            {/* Neighbors — green */}
            {neighbors.length > 0 && (
                <>
                    {neighbors.map((n, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <Box component="span" sx={{ color: '#94a3b8' }}>,</Box>}
                            <Box component="span" sx={{ color: '#34d399', fontWeight: 600, ml: i === 0 ? 0.5 : 0 }}>{n}</Box>
                        </React.Fragment>
                    ))}
                    <Box component="span" sx={{ color: '#94a3b8', mx: 0.5 }}>:</Box>
                </>
            )}

            {/* Color string — shown with a live swatch */}
            <Box component="span" sx={{ color: '#e2e8f0' }}>"</Box>
            <Box component="span" sx={{ color: '#f472b6', fontWeight: 600 }}>{color}</Box>
            <Box component="span" sx={{ color: '#e2e8f0' }}>"</Box>

            {/* Color swatch */}
            <Box
                component="span"
                sx={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: '1px solid rgba(255,255,255,0.3)',
                    ml: 0.75,
                    verticalAlign: 'middle',
                    flexShrink: 0,
                }}
            />
        </Box>
    );
};

const ColoredExampleDialog = ({ open, onClose, onSelectFile }) => {
    const { t } = useI18n();

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t('colored_example_title')}</DialogTitle>
            <DialogContent dividers>
                <Typography variant="body1" gutterBottom>
                    {t('colored_example_desc')}
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
                    <ColoredLine vertex="L1" neighbors={['L2', 'L4']} color="purple" />
                    <ColoredLine vertex="L2" neighbors={['L1', 'L4']} color="blue" />
                    <ColoredLine vertex="L3" neighbors={[]} color="pink" />
                    <ColoredLine vertex="L4" neighbors={['L1']} color="#ff6b35" />
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
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f472b6' }} />
                        <Typography variant="caption" color="text.secondary">Vertex Color</Typography>
                    </Box>
                </Box>

                <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                    {t('colored_example_note')}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancel')}</Button>
                <Button variant="contained" onClick={onSelectFile}>{t('weighted_example_select_file')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ColoredExampleDialog;
