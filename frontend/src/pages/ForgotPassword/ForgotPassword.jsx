import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Link,
  Alert,
  Stack
} from '@mui/material';
import {
  Email
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }

    if (!email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    console.log('Forgot password for:', email);
    setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. (Bu özellik henüz aktif değil)');
    setError('');
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
              sx={{ mb: 2, fontWeight: 'bold' }}
            >
              Şifremi Unuttum
            </Typography>

            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
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
                value={email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                Şifre Sıfırlama Bağlantısı Gönder
              </Button>

              <Stack spacing={2}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  sx={{
                    textAlign: 'center',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Giriş sayfasına dön
                </Link>
              </Stack>
            </Box>
          </CardContent>
        </Card>
        </Box>
    </Box>
  );
};

export default ForgotPassword;
