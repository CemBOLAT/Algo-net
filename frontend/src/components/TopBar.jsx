import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    IconButton,
    Button,
    Typography,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    useMediaQuery,
    useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ThemeToggle from './ThemeToggle';

/**
 * TopBar
 * Props:
 * - title: string
 * - actions: Array<{ label, to?, onClick?, variant?, color?, ariaLabel? }>
 * - sx: optional sx for AppBar
 */
const TopBar = ({ title = '', actions = [], sx = {} }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const [open, setOpen] = useState(false);

    const handleAction = (act) => {
        if (act.onClick) return act.onClick();
        if (act.to) return navigate(act.to);
    };

    return (
        <>
            <AppBar position="static" color="inherit" elevation={1} sx={sx}>
                <Toolbar disableGutters>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, pl: { xs: 2, sm: 3 }, pr: 2 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ml: { xs: 0.5, sm: 5 } }}>
                            {title}
                        </Typography>
                    </Box>  

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pr: 1 }}>
                        <ThemeToggle position="inline" sx={{ width: 40, height: 40 }} />
                        {isSmall ? (
                            <IconButton aria-label="menu" onClick={() => setOpen(true)}>
                                <MenuIcon />
                            </IconButton>
                        ) : (
                            actions.map((act, idx) => (
                                <Button
                                    key={`topbar-act-${idx}`}
                                    variant={act.variant || 'contained'}
                                    color={act.color || 'primary'}
                                    onClick={() => handleAction(act)}
                                    aria-label={act.ariaLabel || act.label}
                                >
                                    {act.label}
                                </Button>
                            ))
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer anchor="top" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 0 } }}>
                <Box sx={{ p: 2, pt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
                    </Box>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { setOpen(false); /* ThemeToggle handles its own state */ }} sx={{ justifyContent: 'flex-start' }}>
                                <ThemeToggle position="inline" />
                            </ListItemButton>
                        </ListItem>
                        {actions.map((act, idx) => (
                            <ListItem key={`drawer-act-${idx}`} disablePadding>
                                <ListItemButton
                                    onClick={() => {
                                        setOpen(false);
                                        // small delay so drawer animation starts
                                        setTimeout(() => handleAction(act), 120);
                                    }}
                                >
                                    <ListItemText primary={act.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default TopBar;
