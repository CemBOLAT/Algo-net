import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, InputAdornment, IconButton, Link, Stack, Menu, MenuItem } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Language } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import FlashMessage from '../../components/FlashMessage';
import { useI18n } from '../../context/I18nContext';

const API_BASE = import.meta?.env?.VITE_API_BASE || '';
import { setTokens, ensureAccessToken } from '../../utils/auth';

const Login = () => {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useI18n();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [langAnchor, setLangAnchor] = useState(null);

    // If user already has a valid (or refreshable) access token, go to /graph
    useEffect(() => {
        const controller = new AbortController(); // Create a new AbortController which can be used to cancel the request

        (async () => {
            try {
                const token = await ensureAccessToken(controller.signal);
                if (token) {
                    navigate('/graph', { replace: true });
                }
            } catch (_) {
                // no valid token; stay on login
            }
        })();

        return () => controller.abort(); // Cleanup function to abort the fetch request if the component unmounts
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.email || !formData.password) {
            setError(t('required_fields_error'));
            return;
        }

        if (!formData.email.includes('@')) {
            setError(t('invalid_email_error'));
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
                setError(data?.message || t('login_failed'));
                return;
            }
            // success: save tokens, show green message and redirect after 2s
            const data = await res.json().catch(() => ({}));
            if (data?.accessToken && data?.refreshToken) {
                setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
            }
            setError('');
            setSuccessMsg(t('login_success_redirect'));
            setIsRedirecting(true);
            setTimeout(() => navigate('/graph'), 2000);
        } catch (err) {
            setError(t('server_unreachable'));
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
            {/* Theme + Language (side-by-side, not nested) */}
            <Box sx={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 1, zIndex: 1200 }}>
                <ThemeToggle position="inline" sx={{ position: 'static', boxShadow: 'none', width: 44, height: 44 }} />
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<Language />}
                    onClick={(e) => setLangAnchor(e.currentTarget)}
                    aria-haspopup="true"
                    aria-expanded={Boolean(langAnchor) ? 'true' : undefined}
                    sx={{ px: 1.25, fontWeight: 600 }}
                >
                    {language.toUpperCase()}
                </Button>
                <Menu
                    anchorEl={langAnchor}
                    open={Boolean(langAnchor)}
                    onClose={() => setLangAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem onClick={() => { setLanguage('tr'); setLangAnchor(null); }}>Türkçe</MenuItem>
                    <MenuItem onClick={() => { setLanguage('en'); setLangAnchor(null); }}>English</MenuItem>
                    {/* Add more languages here later */}
                </Menu>
            </Box>

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
                            {t('login_title')}
                        </Typography>

                        <FlashMessage severity="error" message={error} sx={{ mb: 2 }} />
                        <FlashMessage severity="success" message={successMsg} sx={{ mb: 2 }} />

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label={t('email')}
                                name="email"
                                autoComplete="off"
                                autoFocus
                                value={formData.email}
                                disabled={isRedirecting}
                                onChange={handleChange}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label={t('password')}
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="off"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isRedirecting}
                                slotProps={{
                                    input: {
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
                                    },
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
                                {isRedirecting ? t('redirecting') : t('login_button')}
                            </Button>

                            <Stack spacing={2}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => navigate('/register')}
                                    disabled={isRedirecting}
                                    sx={{ py: 1 }}
                                >
                                    {t('register_button')}
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
                                    {t('forgot_password')}
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