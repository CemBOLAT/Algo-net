import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ sx = {}, position = 'fixed' }) => {
	const { darkMode, toggleDarkMode } = useTheme();

	const fixedSx = {
		position: position,
		top: (position === 'fixed' ? { xs: 12, sm: 16 } : 'auto'),
		right: (position === 'fixed' ? { xs: 12, sm: 16 } : 'auto'),
		zIndex: 1000,
		backgroundColor: (theme) => (darkMode ? 'rgba(0, 119, 127, 0.39)' : 'rgba(158, 155, 155, 0.44)'),
		boxShadow: 2,
		width: { xs: 40, sm: 48 },
		height: { xs: 40, sm: 48 },
		'&:hover': {
			backgroundColor: (theme) => theme.palette.action.hover,
		},
	};

	return (
		<Tooltip title={darkMode ? 'Açık Tema' : 'Koyu Tema'}>
			<IconButton onClick={toggleDarkMode} color="inherit" sx={{ ...fixedSx, ...sx }}>
				{darkMode ? <LightMode /> : <DarkMode />}
			</IconButton>
		</Tooltip>
	);
};

export default ThemeToggle;
