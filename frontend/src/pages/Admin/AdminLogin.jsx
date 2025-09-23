import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, InputAdornment, IconButton, Stack } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import FlashMessage from '../../components/FlashMessage';
import { setTokens, clearTokens } from '../../utils/auth';

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

      // Authenticate to get tokens
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || 'Giriş başarısız');
        setIsLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (data?.accessToken && data?.refreshToken) {
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      } else {
        setError('Token alınamadı');
        setIsLoading(false);
        return;
      }

      // Ensure the token belongs to an admin by calling server endpoint
      try {
        const checkRes = await fetch(`${API_BASE}/api/auth/is-admin`, {
          headers: { Authorization: `Bearer ${data.accessToken}` }
        });
        if (!checkRes.ok) {
          clearTokens();
          const vdata = await checkRes.json().catch(() => ({}));
          setError(vdata?.message || 'Yetkili admin değil');
          setIsLoading(false);
          return;
        }
        const check = await checkRes.json().catch(() => ({}));
        if (!check || check.isAdmin !== true) {
          clearTokens();
          setError('Yetkili admin değil');
          setIsLoading(false);
          return;
        }
      } catch (err) {
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
      setError('Sunucuya ulaşılamıyor.');
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
