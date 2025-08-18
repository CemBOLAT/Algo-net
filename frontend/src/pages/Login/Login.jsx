import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  Alert,
  Stack
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
const API_BASE = import.meta?.env?.VITE_API_BASE || '';
import { setTokens } from '../../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  if (successMsg) setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    try {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

  if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || 'Giriş başarısız.');
        return;
      }
  // success: save tokens, show green message and redirect after 2s
  const data = await res.json().catch(() => ({}));
  if (data?.accessToken && data?.refreshToken) {
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  }
  setError('');
  setSuccessMsg('Giriş başarılı! 2 saniye içinde yönlendirileceksiniz.');
  setIsRedirecting(true);
  setTimeout(() => navigate('/graph'), 2000);
    } catch (err) {
      setError('Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.');
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 2, sm: 3 },
        background: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <ThemeToggle />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Card sx={{ 
          width: '100%', 
          maxWidth: 400,
          boxShadow: (theme) => theme.palette.mode === 'dark' ? 6 : 3,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          backgroundColor: (theme) => 
            theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.9)'
              : 'rgba(255, 255, 255, 0.95)'
        }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              component="h1"
              variant="h4"
              align="center"
              gutterBottom
              sx={{ mb: 3, fontWeight: 'bold' }}
            >
              Giriş Yap
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {successMsg && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMsg}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="E-posta"
                name="email"
                autoComplete="off"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                disabled={isRedirecting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Şifre"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="off"
                value={formData.password}
                onChange={handleChange}
                disabled={isRedirecting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        disabled={isRedirecting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isRedirecting}
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                {isRedirecting ? 'Yönlendiriliyor…' : 'Giriş Yap'}
              </Button>

              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/register')}
                  disabled={isRedirecting}
                  sx={{ py: 1 }}
                >
                  Kayıt Ol
                </Button>
                
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/forgot-password')}
                  disabled={isRedirecting}
                  sx={{
                    textAlign: 'center',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Şifremi Unuttum
                </Link>
              </Stack>
            </Box>
          </CardContent>
        </Card>
        </Box>
    </Box>
  );
};

export default Login;