import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#4f46e5', contrastText: '#ffffff' },
      secondary: { main: '#06b6d4', contrastText: '#012' },
      success: { main: '#16a34a', contrastText: '#fff' },
      error: { main: '#ef4444', contrastText: '#fff' },
      background: {
        default: darkMode ? '#0f172a' : '#f7f9fc',
        paper: darkMode ? '#0b1220' : '#ffffff'
      },
      text: {
        primary: darkMode ? '#e6eef8' : '#0b1724',
        secondary: darkMode ? 'rgba(230,238,248,0.8)' : '#374151'
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 10,
            fontWeight: 600,
            padding: '8px 14px'
          },
          containedPrimary: {
            background: 'linear-gradient(90deg,#6366f1,#06b6d4)',
            color: '#fff',
            boxShadow: '0 8px 30px rgba(99,102,241,0.12)'
          },
          containedSuccess: {
            background: 'linear-gradient(90deg,#16a34a,#34d399)',
            color: '#fff',
            boxShadow: '0 8px 30px rgba(16,185,129,0.08)'
          },
          outlined: {
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)'
          }
        }
      }
    }
  });

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
