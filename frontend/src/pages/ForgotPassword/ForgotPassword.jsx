import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, InputAdornment, Link, Alert, Stack, Menu, MenuItem } from '@mui/material';
import { Email, Language } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import FlashMessage from '../../components/FlashMessage';
import { useI18n } from '../../context/I18nContext';
const API_BASE = import.meta?.env?.VITE_API_BASE || '';

const ForgotPassword = () => {
	const navigate = useNavigate();
	const { t, language, setLanguage } = useI18n();
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [langAnchor, setLangAnchor] = useState(null);

	const handleChange = (e) => {
		setEmail(e.target.value);
		if (error) setError('');
		if (success) setSuccess('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!email) {
			setError(t('enter_email_error'));
			return;
		}

		if (!email.includes('@')) {
			setError(t('invalid_email_error'));
			return;
		}

		try {
			setIsSending(true);
			const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			if (!res.ok) {
			 const data = await res.json().catch(() => ({}));
				setError(data?.message || 'İşlem başarısız.');
				setIsSending(false);
				return;
			}
			setError('');
			setSuccess(t('code_sent'));
		} catch (err) {
			setError(t('server_unreachable'));
		} finally {
			setIsSending(false);
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
							{t('forgot_password_title')}
						</Typography>

						<Typography
							variant="body2"
							align="center"
							color="text.secondary"
							sx={{ mb: 3 }}
						>
							{t('forgot_password_desc')}
						</Typography>

						<FlashMessage severity="error" message={error} sx={{ mb: 2 }} />
						<FlashMessage severity="success" message={success} sx={{ mb: 2 }} />

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
								value={email}
								onChange={handleChange}
								disabled={isSending}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<Email />
											</InputAdornment>
										)
									}
								}}
								sx={{ mb: 3 }}
							/>

							<Button
								type="submit"
								fullWidth
								variant="contained"
								disabled={isSending}
								sx={{
									mt: 2,
									mb: 3,
									py: 1.5,
									fontSize: '1.1rem',
									fontWeight: 'bold'
								}}
							>
								{isSending ? t('sending') : t('send_security_code')}
							</Button>

							{success && (
								<Button
									fullWidth
									variant="outlined"
									onClick={() => navigate('/reset-password', { state: { email } })}
									sx={{ py: 1, mb: 2 }}
								>
									{t('enter_code_and_continue')}
								</Button>
							)}

							<Stack spacing={2}>
								<Link
									component="button"
									variant="body2"
									onClick={() => navigate('/login')}
									sx={{
										textAlign: 'center',
										textDecoration: 'none',
										'&:hover': { textDecoration: 'underline' }
									}}
								>
									{t('back_to_login')}
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
