import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, InputAdornment, Alert } from '@mui/material';
import { Email, Numbers, Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import FlashMessage from '../../components/FlashMessage';

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [busy, setBusy] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!email || !code || !password || !confirm) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }
        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }
        if (password !== confirm) {
            setError('Şifreler eşleşmiyor.');
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
                setError(data?.message || 'Şifre sıfırlanamadı.');
                setBusy(false);
                return;
            }
            setError('');
            setSuccess('Şifreniz güncellendi! 2 saniye içinde giriş sayfasına yönlendirileceksiniz.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (e) {
            setError('Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.');
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
                            Şifreyi Sıfırla
                        </Typography>
                        <FlashMessage severity="error" message={error} sx={{ mb: 2 }} />
                        <FlashMessage severity="success" message={success} sx={{ mb: 2 }} />
                        <Box component="form" onSubmit={onSubmit}>
                            <TextField
                                fullWidth
                                autoComplete='off'
                                label="E-posta"
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
                                label="Güvenlik Kodu"
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
                                label="Yeni Şifre"
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
                                label="Yeni Şifre (Tekrar)"
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
                            <Button type="submit" fullWidth variant="contained" disabled={busy}>Şifreyi Güncelle</Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
