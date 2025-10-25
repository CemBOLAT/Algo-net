import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, Button, Box,
  CircularProgress, Checkbox, FormControlLabel, Fab, IconButton, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
          { label: t('go_to_canvas'), onClick: handleCanvas, variant: 'contained', color: 'primary', ariaLabel: t('go_to_canvas') },
          { label: t('profile'), onClick: () => navigate('/profile'), variant: 'contained', color: 'primary', ariaLabel: t('profile') },
          { label: t('create_graph'), onClick: () => navigate('/graph-creation'), variant: 'contained', color: 'primary', ariaLabel: t('create_graph') },
          { label: t('array_algorithms'), onClick: handleArray, variant: 'contained', color: 'primary', ariaLabel: t('array_algorithms') },
          { label: t('tree_algorithms'), onClick: handleTree, variant: 'contained', color: 'primary', ariaLabel: t('tree_algorithms') },
          { label: t('logout'), onClick: handleLogout, variant: 'contained', color: 'error', ariaLabel: t('logout') }
        ]}
      />
      {error && (
        <FlashMessage severity="error" sx={{ mb: 2 }}>
          {error}
        </FlashMessage>
      )}
      <Container>
        {graphs.length === 0 ? (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="textSecondary">
              {t('no_graphs_message')}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedGraphs.length === graphs.length}
                    indeterminate={selectedGraphs.length > 0 && selectedGraphs.length < graphs.length}
                    onChange={handleSelectAll}
                  />
                }
                label={t('select_all')}
              />
              {selectedGraphs.length > 0 && (
                <>
                  <Typography variant="body2" color="primary">
                    {selectedGraphs.length} {t('graph_selected_suffix')}
                  </Typography>
                  <IconButton
                    color="error"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              )}
            </Box>

            {/* pagination controls */}
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {total === 0 ? '0' : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} / {total}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  aria-label={t('previous_page')}
                  onClick={() => setPageAndSearch(page - 1)}
                  disabled={page === 1 || loading}
                >
                  {t('prev')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ ml: 1 }}
                  aria-label={t('next_page')}
                  onClick={() => setPageAndSearch(page + 1)}
                  disabled={page * pageSize >= total || loading}
                >
                  {t('next')}
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              {graphs.map((graph) => (
                <Grid item xs={12} sm={6} md={4} key={graph.id}>
                  <Card sx={{ position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                      <Checkbox
                        checked={selectedGraphs.includes(graph.id)}
                        onChange={() => handleSelectGraph(graph.id)}
                        size="small"
                      />
                    </Box>
                    <CardContent sx={{ pt: 5 }}>
                      <Typography variant="h6" component="h2">
                        {graph.name}
                      </Typography>
                      <Typography variant="body2">
                        {t('node_count')} {graph.nodes?.length || 0}
                      </Typography>
                      <Typography variant="body2">
                        {t('edge_count')} {graph.edges?.length || 0}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {t('created_at')} {graph.createdAt ? new Date(graph.createdAt).toLocaleDateString(locale) : t('unknown')}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {t('updated_at')} {graph.updatedAt ? new Date(graph.updatedAt).toLocaleDateString(locale) : t('unknown')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => handleEdit(graph.id)}>
                        {t('view_edit')}
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDelete(graph.id)}>
                        {t('delete')}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* bottom pagination controls */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                aria-label={t('previous_page')}
                onClick={() => setPageAndSearch(page - 1)}
                disabled={page === 1 || loading}
              >
                {t('prev')}
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ ml: 1 }}
                aria-label={t('next_page')}
                onClick={() => setPageAndSearch(page + 1)}
                disabled={page * pageSize >= total || loading}
              >
                {t('next')}
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