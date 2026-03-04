import React, { useEffect, useState, useCallback } from 'react';
import { Box, Paper, Typography, Stack, FormControlLabel, Switch, Divider, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FolderIcon from '@mui/icons-material/Folder';
import DataArrayIcon from '@mui/icons-material/DataArray';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TopBar from '../../components/TopBar';
import { http, getTokens, clearTokens } from '../../utils/auth';
import { useI18n } from '../../context/I18nContext';

const NOTIF_KEY = 'notifications_enabled';

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
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

  const handleCanvas = () => {
    navigate('/graph');
  }

  const handleArray = () => {
    navigate('/array-algorithms');
  }

  const handleTree = () => {
    navigate('/tree-algorithms');
  }



  return (
    <>
      <TopBar title={t('profile')}
        actions={[
          { tooltip: t('go_to_canvas'), icon: <ArrowBackIcon />, onClick: handleCanvas, color: 'inherit', ariaLabel: t('go_to_canvas') },
          {
            label: 'Graphs',
            icon: <FolderIcon />,
            menuItems: [
              { label: t('my_graphs'), onClick: () => navigate('/graph-list'), ariaLabel: t('graph-list') },
              { label: t('create_graph'), onClick: () => navigate('/graph-creation'), ariaLabel: t('create_graph') }
            ]
          },
          {
            label: 'Algorithms',
            icon: <DataArrayIcon />,
            menuItems: [
              { label: t('array_algorithms'), onClick: handleArray, ariaLabel: t('array_algorithms') },
              { label: t('tree_algorithms'), onClick: handleTree, ariaLabel: t('tree_algorithms') }
            ]
          },
          { label: t('unhcr_info'), icon: <InfoIcon />, onClick: () => navigate('/unhcr'), variant: 'contained', color: 'primary', ariaLabel: t('unhcr_info') },
          {
            label: 'User',
            icon: <PersonIcon />,
            menuItems: [
              { label: t('profile'), onClick: () => navigate('/profile'), ariaLabel: t('profile') },
              { label: t('logout'), onClick: handleLogout, color: 'error', ariaLabel: t('logout') }
            ]
          }
        ]}
      />
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
          </Stack>
        </Paper>
      </Box>
    </>
  );
};

export default Profile;
