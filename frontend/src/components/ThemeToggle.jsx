import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ sx = {} }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <Tooltip title={darkMode ? 'Açık Tema' : 'Koyu Tema'}>
      <IconButton
        onClick={toggleDarkMode}
        color="inherit"
        sx={{
          position: 'fixed',
          top: { xs: 12, sm: 16 },
          right: { xs: 12, sm: 16 },
          zIndex: 1000,
          backgroundColor: (theme) => theme.palette.background.paper,
          boxShadow: 2,
          width: { xs: 40, sm: 48 },
          height: { xs: 40, sm: 48 },
          '&:hover': {
            backgroundColor: (theme) => theme.palette.action.hover,
          },
          ...sx
        }}
      >
        {darkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
