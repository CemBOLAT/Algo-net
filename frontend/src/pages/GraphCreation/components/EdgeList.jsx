import React from 'react';
import { List, ListItem, Typography, Box, IconButton, Tooltip, Pagination } from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useI18n } from '../../../context/I18nContext';

const EdgeList = ({
    edges,
    edgePage,
    setEdgePage,
    edgesPerPage,
    openWeightEditor,
    toggleEdgeDelete,
    deleteEdge
}) => {
    const { t } = useI18n();
    const totalPages = Math.ceil(edges.length / edgesPerPage) || 1;
    const start = (edgePage - 1) * edgesPerPage;
    const pageEdges = edges.slice(start, start + edgesPerPage);
    if (pageEdges.length === 0 && edges.length > 0 && edgePage !== 1) {
        setEdgePage(1);
    }

    return (
        <Box>
            <List sx={{ maxHeight: 360, overflowX: 'hidden', display: 'flex', gap: 1, p: 1, flexDirection: 'column' }}>
                {pageEdges.map(edge => {
                    const label = edge.weight !== undefined
                        ? `${edge.from}-${edge.to} (${edge.weight})`
                        : `${edge.from}-${edge.to}`;
                    return (
                        <ListItem
                            key={edge.id}
                            onContextMenu={(e) => { e.preventDefault(); toggleEdgeDelete(edge.id); }}
                            sx={{ minWidth: 220, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            secondaryAction={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ mr: 1 }}>{label}</Typography>
                                    {edge.weight !== undefined && (
                                        <Tooltip title={t('edit_weight_tooltip')}>
                                            <IconButton size="small" onClick={() => openWeightEditor(edge)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Box sx={{ perspective: 600 }}>
                                        <Box
                                            sx={{
                                                transformStyle: 'preserve-3d',
                                                transition: 'transform 300ms',
                                                transform: edge.showDelete ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                            }}
                                        >
                                            {!edge.showDelete && (
                                                <IconButton size="small" onClick={() => toggleEdgeDelete(edge.id)}>
                                                    <RotateRightIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            {edge.showDelete && (
                                                <IconButton size="small" color="error" onClick={() => deleteEdge(edge.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            }
                        >
                        </ListItem>
                    );
                })}
            </List>

            {edges.length > edgesPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Pagination
                        count={totalPages}
                        page={edgePage}
                        onChange={(e, p) => setEdgePage(p)}
                        size="small"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Box>
    );
};

export default EdgeList;
