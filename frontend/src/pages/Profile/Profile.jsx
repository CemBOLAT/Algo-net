import React, { useEffect, useState, useCallback } from 'react';
import { Box, Paper, Typography, Stack, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Divider, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import ThemeToggle from '../../components/ThemeToggle';
import { http, getTokens, clearTokens } from '../../utils/auth';
import { useI18n } from '../../context/I18nContext';

const NOTIF_KEY = 'notifications_enabled';

const Profile = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem(NOTIF_KEY) === 'true'
  );

  const decodeEmailFromToken = useCallback(() => {
    try {
      const { accessToken } = getTokens() || {};
      if (!accessToken) return '';
      const payload = JSON.parse(atob(accessToken.split('.')[1] || ''));
      return payload?.email || '';
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await http.get('/api/auth/me', { auth: true });
        if (mounted) setEmail(resp?.result?.email || decodeEmailFromToken());
      } catch {
        if (mounted) setEmail(decodeEmailFromToken());
      }
    })();
    return () => { mounted = false; };
  }, [decodeEmailFromToken]);

  const handleLangChange = (val) => {
    setLanguage(val);
  };

  const handleNotificationsChange = async (val) => {
    setNotificationsEnabled(val);
    localStorage.setItem(NOTIF_KEY, String(val));
    try {
      await http.post('/api/users/me/preferences', { notificationsEnabled: val }, { auth: true });
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    clearTokens();
    navigate('/login', { replace: true });
  };

  const topbarActions = [
    { label: t('go_to_canvas'), to: '/graph' },
    { label: t('logout'), onClick: handleLogout, color: 'error', variant: 'contained' },
  ];

  return (
    <>
      <TopBar title={t('profile')} actions={topbarActions} />
      <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', justifyContent: 'center' }}>
        <Paper sx={{ width: '100%', maxWidth: 920, p: { xs: 2, sm: 3 } }} elevation={2}>
          <Stack spacing={2}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}>
              <Box>
                <Typography variant="h6">{t('user')}</Typography>
                <Typography variant="body1">{t('email')}: {email || '-'}</Typography>
              </Box>
            </Box>

            <Divider />

            {/* Settings row */}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md="auto">
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="lang-label">{t('language')}</InputLabel>
                  <Select
                    labelId="lang-label"
                    value={language}
                    label={t('language')}
                    onChange={(e) => handleLangChange(e.target.value)}
                  >
                    <MenuItem value="tr">Türkçe</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md="auto">
                <ThemeToggle position="inline" sx={{ position: 'static', boxShadow: 'none', width: 44, height: 44 }} />
              </Grid>
              <Grid item xs={12} md>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationsEnabled}
                      onChange={(e) => handleNotificationsChange(e.target.checked)}
                    />
                  }
                  label={t('receive_notifications')}
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Shortcuts */}
            <Typography variant="h6">{t('shortcuts')}</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="contained" onClick={() => navigate('/graph-list')}>
                  {t('my_graphs')}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="contained" onClick={() => navigate('/graph-creation')}>
                  {t('create_graph')}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="contained" onClick={() => navigate('/tree-algorithms')}>
                  {t('tree_algorithms')}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="contained" onClick={() => navigate('/array-algorithms')}>
                  {t('array_algorithms')}
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      </Box>
    </>
  );
};

export default Profile;
