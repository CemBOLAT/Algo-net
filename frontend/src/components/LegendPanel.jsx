import React from 'react';
import { Paper, Box, Typography, Chip, Stack } from '@mui/material';

const LegendPanel = ({ entries = [] }) => {
  if (!entries?.length) return null;

  return (
    <Paper elevation={4} sx={{ p: 1.5, minWidth: 260, maxWidth: 360, maxHeight: 280, overflowY: 'auto' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Legend</Typography>
      <Stack spacing={1}>
        {entries.map((e, idx) => (
          <Box key={`legend-${idx}`} sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, alignItems: 'center' }}>
            <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: e.color, border: '1px solid rgba(0,0,0,0.2)' }} />
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                <Chip size="small" label={`Kapasite: ${e.capacity}`} />
                <Chip size="small" label={`Uzaklık: ${e.distance}`} />
                <Chip size="small" label={`Yarıçap: ${e.diameter}`} />
                <Chip size="small" label={`Boyut: ${e.size}`} />
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default LegendPanel;
