import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, InputAdornment, IconButton, Stack } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import FlashMessage from '../../components/FlashMessage';
import { setTokens, clearTokens, http } from '../../utils/auth';

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { setError('Lütfen tüm alanları doldurun.'); return; }
    try {
      setIsLoading(true);

      // Authenticate to get tokens (no auth header)
      const data = await http.post('/api/auth/login', { email: formData.email, password: formData.password }, { auth: false })
        .catch(err => { throw err; });

      if (data?.accessToken && data?.refreshToken) {
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      } else {
        setError('Token alınamadı');
        setIsLoading(false);
        return;
      }

      // Ensure the token belongs to an admin
      try {
        const check = await http.get('/api/auth/is-admin', { auth: true });
        if (!check || check.isAdmin !== true) {
          clearTokens();
          setError('Yetkili admin değil');
          setIsLoading(false);
          return;
        }
      } catch {
        clearTokens();
        setError('Yetkili admin değil');
        setIsLoading(false);
        return;
      }

      // success: show message then redirect after 2s
      setSuccess('Giriş başarılı. 2 saniye sonra admin sayfasına yönlendirileceksiniz.');
      setIsLoading(true);
      setTimeout(() => { navigate('/admin'); }, 2000);
      return;
    } catch (err) {
      clearTokens();
      setError(err.data?.message || 'Sunucuya ulaşılamıyor.');
    } finally { setIsLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <ThemeToggle />
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>Admin Girişi</Typography>
            <FlashMessage severity="success" message={success} sx={{ mb: 2 }} />
            <FlashMessage severity="error" message={error} sx={{ mb: 2 }} />
            <Box component="form" onSubmit={handleSubmit}>
              <TextField fullWidth name="email" label="E-posta" value={formData.email} onChange={handleChange} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><Email/></InputAdornment> }} />
              <TextField fullWidth name="password" label="Şifre" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><Lock/></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(s => !s)}>{showPassword ? <VisibilityOff/> : <Visibility/>}</IconButton></InputAdornment> }} />
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button type="submit" variant="contained" fullWidth disabled={isLoading}>{isLoading ? 'Giriş yapılıyor…' : 'Giriş Yap'}</Button>
                <Button variant="outlined" fullWidth onClick={() => navigate('/login')}>Geri</Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminLogin;
