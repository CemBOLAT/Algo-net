import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Box,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Fab,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { clearTokens, http } from '../../utils/auth';
import FlashMessage from '../../components/FlashMessage';
const API_BASE = import.meta?.env?.VITE_API_BASE || '';

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

  useEffect(() => {
    fetchGraphs();
  }, []);

  const fetchGraphs = async () => {
    try {
      const data = await http.get('/api/graphs/user', { auth: true });
      setGraphs(data);
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
      setGraphs(graphs.filter(g => g.id !== graphToDelete));
    } catch (err) {
      setError('Graph silinirken hata oluştu');
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
  }

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
      setGraphs(graphs.filter(g => !selectedGraphs.includes(g.id)));
      setSelectedGraphs([]);
      setFeedbackSeverity('success');
      setFeedbackMessage(data?.message || 'Graphlar başarıyla silindi');
      setFeedbackOpen(true);
    } catch (err) {
      setFeedbackSeverity('error');
      setFeedbackMessage(err.data?.message || 'Toplu silme işlemi başarısız');
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
        <TopBar
            title="Tüm Graphlar"
            actions={[
                { label: 'Kanvas', onClick: handleCanvas, variant: 'contained', color: 'primary', ariaLabel: 'Kanvas' },
                { label: 'Çıkış Yap', onClick: handleLogout, variant: 'contained', color: 'error', ariaLabel: 'Çıkış Yap' }
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
            Henüz hiç graph bulunamadı. İlk graphı oluşturun!
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
              label="Tümünü Seç"
            />
            {selectedGraphs.length > 0 && (
              <>
                <Typography variant="body2" color="primary">
                  {selectedGraphs.length} graph seçildi
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
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
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
                      Node sayısı: {graph.nodes?.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      Edge sayısı: {graph.edges?.length || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Oluşturulma: {graph.createdAt ? new Date(graph.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Güncellenme: {graph.updatedAt ? new Date(graph.updatedAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleEdit(graph.id)}>
                      Görüntüle/Düzenle
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(graph.id)}>
                      Sil
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
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
          Graphları Sil
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {selectedGraphs.length} adet graphı silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelBulkDelete} color="primary">
            İptal
          </Button>
          <Button onClick={confirmBulkDelete} color="error" variant="contained" autoFocus>
            Sil
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
          Graph'ı Sil
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="single-delete-dialog-description">
            Bu graphı silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelSingleDelete} color="primary">
            İptal
          </Button>
          <Button onClick={confirmSingleDelete} color="error" variant="contained" autoFocus>
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackOpen}
        onClose={handleFeedbackClose}
        aria-labelledby="feedback-dialog-title"
      >
        <DialogTitle id="feedback-dialog-title">İşlem Sonucu</DialogTitle>
        <DialogContent>
          <Alert severity={feedbackSeverity} sx={{ mt: 1 }}>
            {feedbackMessage}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeedbackClose} autoFocus>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GraphList;