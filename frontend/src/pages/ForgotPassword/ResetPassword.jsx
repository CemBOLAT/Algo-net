import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, InputAdornment, Alert, Menu, MenuItem } from '@mui/material';
import { Email, Numbers, Lock, Language } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import FlashMessage from '../../components/FlashMessage';
import { useI18n } from '../../context/I18nContext';

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useI18n();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [busy, setBusy] = useState(false);
    const [langAnchor, setLangAnchor] = useState(null);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!email || !code || !password || !confirm) {
            setError(t('required_fields_error'));
            return;
        }
        if (password.length < 6) {
            setError(t('min_password_length'));
            return;
        }
        if (password !== confirm) {
            setError(t('password_mismatch'));
            return;
        }
        try {
            setBusy(true);
            const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword: password })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.message || t('reset_failed'));
                setBusy(false);
                return;
            }
            setError('');
            setSuccess(t('password_updated_redirect'));
            setTimeout(() => navigate('/login'), 2000);
        } catch (e) {
            setError(t('server_unreachable'));
        } finally {
            setBusy(false);
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
                            sx={{ mb: 2, fontWeight: 'bold' }}
                        >
                            {t('reset_password_title')}
                        </Typography>
                        <FlashMessage severity="error" message={error} sx={{ mb: 2 }} />
                        <FlashMessage severity="success" message={success} sx={{ mb: 2 }} />
                        <Box component="form" onSubmit={onSubmit}>
                            <TextField
                                fullWidth
                                autoComplete='off'
                                label={t('email')}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); if (error) setError(''); if (success) setSuccess(''); }}
                                disabled={busy}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                autoComplete='one-time-code'
                                label={t('security_code')}
                                value={code}
                                onChange={(e) => { setCode(e.target.value); if (error) setError(''); if (success) setSuccess(''); }}
                                disabled={busy}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Numbers />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="password"
                                autoComplete='one-time-code2'
                                label={t('new_password')}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); if (error) setError(''); if (success) setSuccess(''); }}
                                disabled={busy}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="password"
                                label={t('new_password_confirm')}
                                value={confirm}
                                onChange={(e) => { setConfirm(e.target.value); if (error) setError(''); if (success) setSuccess(''); }}
                                disabled={busy}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                sx={{ mb: 3 }}
                            />
                            <Button type="submit" fullWidth variant="contained" disabled={busy}>{t('update_password')}</Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
