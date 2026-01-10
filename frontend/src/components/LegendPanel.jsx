import React from 'react';
import { Paper, Box, Typography, Chip, Stack, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const LegendPanel = ({ entries = [], onDelete }) => {
  if (!entries?.length) return null;

  const toPairs = (e) => {
    // Prefer dynamic attributes if provided
    if (e?.attributes && typeof e.attributes === 'object') {
      return Object.entries(e.attributes);
    }
    // Backward compatibility: fold known fields into displayable pairs
    const pairs = [];
    if ('capacity' in e) pairs.push(['Kapasite', String(e.capacity)]);
    if ('distance' in e) pairs.push(['Uzaklık', String(e.distance)]);
    // diameter may come as unitDistance from backend mapping
    const d = e.diameter ?? e.unitDistance;
    if (d !== undefined) pairs.push(['Yarıçap', String(d)]);
    if ('size' in e) pairs.push(['Boyut', String(e.size)]);
    return pairs;
  };

  return (
    <Paper elevation={4} sx={{ p: 1.5, minWidth: 260, maxWidth: 360, maxHeight: 280, overflowY: 'auto' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Legend</Typography>
      <Stack spacing={1}>
        {entries.map((e, idx) => (
          <Box
            key={`legend-${idx}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: onDelete ? 'auto 1fr auto' : 'auto 1fr',
              gap: 1,
              alignItems: 'center'
            }}
          >
            <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: e.color, border: '1px solid rgba(0,0,0,0.2)' }} />
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                {toPairs(e).map(([k, v], i) => (
                  <Chip key={`${k}-${i}`} size="small" label={`${k}: ${v}`} />
                ))}
              </Box>
            </Box>
            {onDelete && (
              <IconButton
                aria-label="legend-delete"
                size="small"
                onClick={() => onDelete(idx)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default LegendPanel;
