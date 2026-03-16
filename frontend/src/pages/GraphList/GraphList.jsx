import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, CardActions, Button, Box,
  CircularProgress, Checkbox, FormControlLabel, Fab, IconButton, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle, Alert,
  Paper, Divider, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FolderIcon from '@mui/icons-material/Folder';
import DataArrayIcon from '@mui/icons-material/DataArray';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { clearTokens, http } from '../../utils/auth';
import FlashMessage from '../../components/FlashMessage';
import { useI18n } from '../../context/I18nContext';

const GraphList = () => {
  const [graphs, setGraphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGraphs, setSelectedGraphs] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [singleDeleteDialogOpen, setSingleDeleteDialogOpen] = useState(false);
  const [graphToDelete, setGraphToDelete] = useState(null);
  // feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSeverity, setFeedbackSeverity] = useState('success');
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  // pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // keep selection clean when page/size changes
  useEffect(() => {
    setSelectedGraphs([]);
  }, [page, pageSize]);

  // read pagination from URL and initialize defaults if missing
  useEffect(() => {
    const parseIntOrDefault = (val, def) => {
      const n = parseInt(val, 10);
      return Number.isFinite(n) && n > 0 ? n : def;
    };
    const spPage = parseIntOrDefault(searchParams.get('page'), 1);
    const spSize = parseIntOrDefault(searchParams.get('size'), 10);

    if (spPage !== page) setPage(spPage);
    if (spSize !== pageSize) setPageSize(spSize);

    if (!searchParams.get('page') || !searchParams.get('size')) {
      const sp = new URLSearchParams(searchParams);
      if (!searchParams.get('page')) sp.set('page', String(spPage));
      if (!searchParams.get('size')) sp.set('size', String(spSize));
      setSearchParams(sp, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setPageAndSearch = (nextPage) => {
    const normalized = Math.max(1, nextPage);
    setPage(normalized);
    const sp = new URLSearchParams(searchParams);
    sp.set('page', String(normalized));
    sp.set('size', String(pageSize));
    setSearchParams(sp); // push new entry so back/forward works
  };

  useEffect(() => {
    fetchGraphs(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const fetchGraphs = async (p = page, s = pageSize) => {
    setLoading(true);
    try {
      const start = (p - 1) * s + 1; // 1-based inclusive
      const end = p * s;
      const data = await http.get(`/api/graphs/user?range=${start}-${end}`, { auth: true });
      if (data && typeof data === 'object' && Array.isArray(data.items)) {
        setGraphs(data.items);
        setTotal(typeof data.total === 'number' ? data.total : data.items.length);
      } else if (Array.isArray(data)) {
        // fallback if server returns full array (no pagination)
        setGraphs(data.slice(start - 1, end));
        setTotal(data.length);
      } else {
        setGraphs([]);
        setTotal(0);
      }
      setError(null);
    } catch (err) {
      setError(`Failed to fetch graphs: ${err.status || ''} ${err.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (graphId) => {
    setGraphToDelete(graphId);
    setSingleDeleteDialogOpen(true);
  };

  const confirmSingleDelete = async () => {
    setSingleDeleteDialogOpen(false);
    try {
      await http.delete(`/api/graphs/${graphToDelete}`);
      // adjust total and page if needed, then refetch
      const newTotal = Math.max(0, total - 1);
      const newLastPage = Math.max(1, Math.ceil(newTotal / pageSize));
      setTotal(newTotal);
      if (page > newLastPage) {
        setPageAndSearch(newLastPage); // useEffect will refetch
      } else {
        await fetchGraphs(page, pageSize);
      }
    } catch (err) {
      setError(t('graph_delete_error'));
    } finally {
      setGraphToDelete(null);
    }
  };

  const cancelSingleDelete = () => {
    setSingleDeleteDialogOpen(false);
    setGraphToDelete(null);
  };

  const handleEdit = (graphId) => {
    navigate(`/graph?id=${graphId}`);
  };

  const handleLogout = (graphId) => {
    clearTokens();
    navigate('/login', { replace: true });
  };

  const handleCanvas = () => {
    navigate('/graph');
  };

  const handleArray = () => {
    navigate('/array-algorithms');
  };

  const handleTree = () => {
    navigate('/tree-algorithms');
  };

  // locale for dates based on current language
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  const handleSelectGraph = (graphId) => {
    setSelectedGraphs(prev =>
      prev.includes(graphId)
        ? prev.filter(id => id !== graphId)
        : [...prev, graphId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGraphs.length === graphs.length) {
      setSelectedGraphs([]);
    } else {
      setSelectedGraphs(graphs.map(g => g.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGraphs.length === 0) return;

    setDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setDeleteDialogOpen(false);
    setIsDeleting(true);
    try {
      const data = await http.delete('/api/graphs/bulk', { body: selectedGraphs });
      setSelectedGraphs([]);
      setFeedbackSeverity('success');
      setFeedbackMessage(data?.message || t('graphs_deleted_success'));
      setFeedbackOpen(true);

      const deletedCount = data?.deletedCount || selectedGraphs.length;
      const newTotal = Math.max(0, total - deletedCount);
      const newLastPage = Math.max(1, Math.ceil(newTotal / pageSize));
      setTotal(newTotal);
      if (page > newLastPage) {
        setPageAndSearch(newLastPage); // triggers refetch
      } else {
        await fetchGraphs(page, pageSize);
      }
    } catch (err) {
      setFeedbackSeverity('error');
      setFeedbackMessage(err.data?.message || t('bulk_delete_failed'));
      setFeedbackOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelBulkDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleFeedbackClose = () => setFeedbackOpen(false);

  // Download a single graph as JSON
  const handleDownload = async (graph) => {
    try {
      // If needed, fetch full detail:
      // const detail = await http.get(`/api/graphs/${graph.id}`, { auth: true });
      const payload = graph; // use listed data; replace with `detail` if using API above
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });

      const base = (graph.name?.trim() || 'graph').replace(/[^\w\-]+/g, '_').slice(0, 50);
      const filename = `${base}_${graph.id}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setFeedbackSeverity('error');
      setFeedbackMessage(t('download_failed') || 'Download failed');
      setFeedbackOpen(true);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <TopBar title={t('all_graphs')}
        actions={[
          { tooltip: t('go_to_canvas'), icon: <ArrowBackIcon />, onClick: handleCanvas, color: 'inherit', ariaLabel: t('go_to_canvas') },
          {
            label: 'Graphs',
            icon: <FolderIcon />,
            menuItems: [
              { label: t('my_graphs'), onClick: () => navigate('/graph-list'), ariaLabel: t('profile') },
              { label: t('create_graph'), onClick: () => navigate('/graph-creation'), ariaLabel: t('create_graph') }
            ]
          },
          {
            label: 'Algorithms',
            icon: <DataArrayIcon />,
            menuItems: [
              { label: t('array_algorithms'), onClick: handleArray, ariaLabel: t('array_algorithms') },
              { label: t('tree_algorithms'), onClick: handleTree, ariaLabel: t('tree_algorithms') }
            ]
          },
          { label: t('unhcr_info'), icon: <InfoIcon />, onClick: () => navigate('/unhcr'), variant: 'contained', color: 'primary', ariaLabel: t('unhcr_info') },
          {
            label: 'User',
            icon: <PersonIcon />,
            menuItems: [
              { label: t('profile'), onClick: () => navigate('/profile'), ariaLabel: t('profile') },
              { label: t('logout'), onClick: handleLogout, color: 'error', ariaLabel: t('logout') }
            ]
          }
        ]}
      />
      {error && (
        <FlashMessage severity="error" sx={{ mb: 2 }}>
          {error}
        </FlashMessage>
      )}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
        {graphs.length === 0 ? (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="textSecondary">
              {t('no_graphs_message')}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Page Header */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', mb: 4, gap: 2 }}>
              <Box>
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.02em' }}>
                  {t('all_graphs')}
                </Typography>
              </Box>
            </Box>

            {/* Bulk Actions & Pagination Top */}
            <Paper elevation={0} sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedGraphs.length === graphs.length}
                      indeterminate={selectedGraphs.length > 0 && selectedGraphs.length < graphs.length}
                      onChange={handleSelectAll}
                      size="small"
                      sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }}
                    />
                  }
                  label={<Typography variant="body2" fontWeight="500">Select All</Typography>}
                  sx={{ m: 0 }}
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: 'center' }} />

                <Typography variant="body2" color="text.secondary">
                  {selectedGraphs.length} {t('graph_selected_suffix') || 'graphs selected'}
                </Typography>

                {selectedGraphs.length > 0 && (
                  <Button
                    color="error"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    size="small"
                    startIcon={<DeleteIcon />}
                    sx={{ ml: 1, textTransform: 'none', fontWeight: 600 }}
                  >
                    {t('delete')}
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setPageAndSearch(page - 1)}
                  disabled={page === 1 || loading}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 24, textAlign: 'center' }}>{page}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>/</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24, textAlign: 'center' }}>{Math.ceil(total / pageSize) || 1}</Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setPageAndSearch(page + 1)}
                  disabled={page * pageSize >= total || loading}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>

            {/* Graphs Grid */}
            <Grid container spacing={3}>
              {graphs.map((graph) => (
                <Grid item xs={12} sm={6} lg={4} key={graph.id}>
                  <Card elevation={0} sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 4,
                      borderColor: 'primary.main'
                    }
                  }}>
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                      <Checkbox
                        checked={selectedGraphs.includes(graph.id)}
                        onChange={() => handleSelectGraph(graph.id)}
                        size="small"
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 3, pr: 4 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                          {graph.name}
                        </Typography>
                        {/* Optional Tag pill could go here if graph types were supported */}
                        {/* <Box component="span" sx={{ ml: 1, px: 1, py: 0.25, bgcolor: 'action.hover', color: 'text.secondary', borderRadius: 1, fontSize: '0.625rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Network</Box> */}
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="overline" display="block" sx={{ fontSize: '0.6875rem', fontWeight: 'bold', color: 'text.disabled', lineHeight: 1, mb: 0.5 }}>Nodes</Typography>
                          <Typography variant="body2" fontWeight="500">{graph.nodes?.length || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="overline" display="block" sx={{ fontSize: '0.6875rem', fontWeight: 'bold', color: 'text.disabled', lineHeight: 1, mb: 0.5 }}>Edges</Typography>
                          <Typography variant="body2" fontWeight="500">{graph.edges?.length || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="overline" display="block" sx={{ fontSize: '0.6875rem', fontWeight: 'bold', color: 'text.disabled', lineHeight: 1, mb: 0.5 }}>Created</Typography>
                          <Typography variant="body2" fontWeight="500">{graph.createdAt ? new Date(graph.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : t('unknown')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="overline" display="block" sx={{ fontSize: '0.6875rem', fontWeight: 'bold', color: 'text.disabled', lineHeight: 1, mb: 0.5 }}>Updated</Typography>
                          <Typography variant="body2" fontWeight="500">{graph.updatedAt ? new Date(graph.updatedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : t('unknown')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="overline" display="block" sx={{ fontSize: '0.6875rem', fontWeight: 'bold', color: 'text.disabled', lineHeight: 1, mb: 0.5 }}>Labels</Typography>
                          <Typography variant="body2" fontWeight="500">{graph.showNodeLabels !== false ? "Visible" : "Hidden"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="overline" display="block" sx={{ fontSize: '0.6875rem', fontWeight: 'bold', color: 'text.disabled', lineHeight: 1, mb: 0.5 }}>Weights</Typography>
                          <Typography variant="body2" fontWeight="500">{graph.showEdgeWeights !== false ? "Visible" : "Hidden"}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>

                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'transparent' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          disableElevation
                          onClick={() => handleEdit(graph.id)}
                          startIcon={<VisibilityIcon fontSize="small" />}
                          sx={{ bgcolor: 'primary.50', color: 'primary.main', '&:hover': { bgcolor: 'primary.100' }, minWidth: 'auto', px: 2, py: 0.5, textTransform: 'none', fontWeight: 'bold' }}
                        >
                          View
                        </Button>
                        <Tooltip title={t('download')}>
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(graph)}
                            sx={{ border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Tooltip title={t('delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(graph.id)}
                          sx={{ '&:hover': { bgcolor: 'error.lighter' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination Bottom */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                onClick={() => setPageAndSearch(page - 1)}
                disabled={page === 1 || loading}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'divider' }}
              >
                Previous
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Button variant="contained" disableElevation sx={{ minWidth: 40, width: 40, height: 40, p: 0, fontWeight: 'bold' }}>{page}</Button>
              </Box>
              <Button
                variant="outlined"
                color="inherit"
                endIcon={<ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />}
                onClick={() => setPageAndSearch(page + 1)}
                disabled={page * pageSize >= total || loading}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'divider' }}
              >
                Next
              </Button>
            </Box>
          </>
        )}
      </Container>

      {selectedGraphs.length > 0 && (
        <Fab
          color="error"
          aria-label="bulk-delete"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleBulkDelete}
          disabled={isDeleting}
        >
          <DeleteIcon />
        </Fab>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelBulkDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {t('delete_graphs_title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {selectedGraphs.length} {t('graphs_delete_confirm_suffix')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelBulkDelete} color="primary">
            {t('cancel')}
          </Button>
          <Button onClick={confirmBulkDelete} color="error" variant="contained" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog
        open={singleDeleteDialogOpen}
        onClose={cancelSingleDelete}
        aria-labelledby="single-delete-dialog-title"
        aria-describedby="single-delete-dialog-description"
      >
        <DialogTitle id="single-delete-dialog-title">
          {t('delete_graph_title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="single-delete-dialog-description">
            {t('delete_graph_confirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelSingleDelete} color="primary">
            {t('cancel')}
          </Button>
          <Button onClick={confirmSingleDelete} color="error" variant="contained" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackOpen}
        onClose={handleFeedbackClose}
        aria-labelledby="feedback-dialog-title"
      >
        <DialogTitle id="feedback-dialog-title">{t('operation_result')}</DialogTitle>
        <DialogContent>
          <Alert severity={feedbackSeverity} sx={{ mt: 1 }}>
            {feedbackMessage}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeedbackClose} autoFocus>{t('close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GraphList;