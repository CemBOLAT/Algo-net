import React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const VertexList = ({ vertices, removeVertex, vertexListRef }) => {
    return (
        <Box sx={{ position: 'relative' }}>
            <Box
                ref={vertexListRef}
                sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, overflowY: 'auto', p: 1, maxHeight: 360 }}
                aria-label="vertex-list"
            >
                {vertices.map((v, i) => (
                    <Paper
                        key={`${v}-${i}`}
                        sx={{
                            minWidth: { xs: '48%', sm: 'calc(25% - 8px)' },
                            flex: '0 0 calc(25% - 8px)',
                            p: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Typography noWrap>{v}</Typography>
                        <IconButton size="small" onClick={() => removeVertex(i)} aria-label="delete-vertex">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
};

export default VertexList;
