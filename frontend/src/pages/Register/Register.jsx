const API_BASE = import.meta?.env?.VITE_API_BASE || '';
import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, InputAdornment, IconButton, Link, Stack, Menu, MenuItem } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Person, Language } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import FlashMessage from '../../components/FlashMessage';
import { useI18n } from '../../context/I18nContext';

const Register = () => {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useI18n();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [langAnchor, setLangAnchor] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError(t('required_fields_error'));
            return;
        }

        if (!formData.email.includes('@')) {
            setError(t('invalid_email_error'));
            return;
        }

        if (formData.password.length < 6) {
            setError(t('min_password_length'));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('password_mismatch'));
            return;
        }

        // require at least first name and last name (two tokens)
        const parts = formData.name.trim().split(/\s+/);
        if (parts.length < 2) {
            setError(t('enter_first_last_name'));
            return;
        }

        // split name: allow two-word last names. If 3+ tokens, last two tokens become lastName.
        let firstName = '';
        let lastName = '';
        if (parts.length === 2) {
            firstName = parts[0];
            lastName = parts[1];
        } else {
            // 3 or more tokens -> assume last two tokens form a compound last name
            lastName = parts.slice(-2).join(' ');
            firstName = parts.slice(0, -2).join(' ');
        }

        try {

            const res = await fetch(`${API_BASE}/api/create-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    firstName,
                    lastName
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.message || t('registration_error_generic'));
                return;
            }

            setSuccessMsg(t('register_success'));
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(t('server_unreachable'));
        }
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
                            {t('register_title')}
                        </Typography>

                        <FlashMessage severity="error" message={error} sx={{ mb: 2 }} />
                        <FlashMessage severity="success" message={successMsg} sx={{ mb: 2 }} />

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="name"
                                label={t('full_name')}
                                name="name"
                                autoComplete="off"
                                autoFocus
                                value={formData.name}
                                onChange={handleChange}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person />
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
                                id="email"
                                label={t('email')}
                                name="email"
                                autoComplete="off"
                                value={formData.email}
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
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
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
                                name="confirmPassword"
                                label={t('confirm_password')}
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                autoComplete="off"
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                                sx={{
                                    mt: 2,
                                    mb: 3,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                {t('register_button')}
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
                                    {t('have_account_login')}
                                </Link>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default Register;
