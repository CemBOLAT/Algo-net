import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Table, TableHead, TableBody, TableRow, TableCell, Switch, IconButton, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TopBar from '../../components/TopBar';
import FlashMessage from '../../components/FlashMessage';
import { http, clearTokens } from '../../utils/auth';

const PAGE_SIZE = 10;

const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await http.get(`/api/users?page=${page}&size=${PAGE_SIZE}`, { auth: true });
        if (mounted) {
          setUsers(data.users || []);
          setTotal(Number.isFinite(data.total) ? data.total : (data.users || []).length);
        }
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          clearTokens();
          navigate('/admin-login', { replace: true });
          return;
        }
        if (mounted) setError(err.data?.message || 'Kullanıcılar alınamadı');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [page, navigate]);

  const handleLogout = () => {
    clearTokens();
    navigate('/admin-login');
  };

  const setProcessing = (id, val) => {
    setProcessingIds(prev => {
      const s = new Set(prev);
      if (val) s.add(id); else s.delete(id);
      return s;
    });
  };

  const toggleDisabled = async (id, current) => {
    try {
      setError('');
      setProcessing(id, true);
      const d = await http.put(`/api/set/${id}/disable`, { disabled: !current }, { auth: true });
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, disabled: d.disabled ?? !current } : u)));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearTokens();
        navigate('/admin-login', { replace: true });
        return;
      }
      setError(err.data?.message || 'İşlem başarısız');
    } finally { setProcessing(id, false); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      setError('');
      setProcessing(id, true);
      await http.delete(`/api/delete-user/${id}`);
      const remaining = total - 1;
      const maxPage = Math.max(0, Math.ceil(remaining / PAGE_SIZE) - 1);
      setPage(p => Math.min(p, maxPage));
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearTokens();
        navigate('/admin-login', { replace: true });
        return;
      }
      setError(err.data?.message || 'Silme işlemi başarısız');
    } finally { setProcessing(id, false); }
  };

  const pagesCount = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));

  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
        <TopBar
            title="Yönetici Paneli"
            actions={[
                { label: 'Çıkış Yap', onClick: handleLogout, variant: 'contained', color: 'error', ariaLabel: 'Çıkış Yap' }
            ]}
            sx={{ mb: 2 }}
        />
      <Card>
        <CardContent>
          <FlashMessage severity="error" message={error} sx={{ mb: 2 }} />
          <Typography sx={{ mb: 1 }}>Kullanıcılar (sayfa {page + 1} / {pagesCount})</Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>İsim</TableCell>
                <TableCell>E-posta</TableCell>
                <TableCell>Engelli</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{(u.firstName || '') + ' ' + (u.lastName || '')}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Switch checked={!!u.disabled} onChange={() => toggleDisabled(u.id, !!u.disabled)} disabled={processingIds.has(u.id)} />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => deleteUser(u.id)} disabled={processingIds.has(u.id)} color="error"><DeleteIcon/></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 2 }}>
            <Button disabled={page <= 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))}>Önceki</Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button disabled={page >= pagesCount - 1 || loading} onClick={() => setPage(p => Math.min(pagesCount - 1, p + 1))}>Sonraki</Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Admin;