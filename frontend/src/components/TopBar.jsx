import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    useMediaQuery,
    useTheme,
    Button,
    Tooltip,
    Menu,
    MenuItem,
    Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useI18n } from '../context/I18nContext';
import { getAlgoTranslator } from '../i18n/algoI18n';

/**
 * TopBar
 * Props:
 * - title: string
 * - actions: Array<{ label, icon?, to?, onClick?, variant?, color?, ariaLabel? }>
 * - sx: optional sx for AppBar
 */
const TopBar = ({ title = '', actions = [], sx = {} }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const [open, setOpen] = useState(false);
    const [anchorEls, setAnchorEls] = useState({});
    const { language, t } = useI18n();
    const ta = useMemo(() => getAlgoTranslator(language), [language]);

    const handleMenuClick = (event, idx) => {
        setAnchorEls({ ...anchorEls, [idx]: event.currentTarget });
    };

    const handleMenuClose = (idx) => {
        setAnchorEls({ ...anchorEls, [idx]: null });
    };

    const handleAction = (act, parentIdx = null) => {
        if (parentIdx !== null) {
            handleMenuClose(parentIdx);
        }
        if (act.onClick) return act.onClick();
        if (act.to) return navigate(act.to);
    };

    return (
        <>
            <AppBar position="static" color="inherit" elevation={1} sx={sx}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, pl: { xs: 2, sm: 3 }, pr: 2 }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ml: { xs: 0.5, sm: 5 } }}>
                                {title}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pr: 1 }}>
                            {isSmall ? (
                                <IconButton aria-label="menu" onClick={() => setOpen(true)}>
                                    <MenuIcon />
                                </IconButton>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {actions.map((act, idx) => {
                                        if (act.menuItems) {
                                            return (
                                                <React.Fragment key={`menu-frag-${idx}`}>
                                                    {act.icon ? (
                                                        <Tooltip title={act.label}>
                                                            <IconButton
                                                                color={act.color || 'inherit'}
                                                                onClick={(e) => handleMenuClick(e, idx)}
                                                                size="small"
                                                            >
                                                                {act.icon}
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <Button
                                                            color={act.color || 'inherit'}
                                                            variant={act.variant || 'text'}
                                                            onClick={(e) => handleMenuClick(e, idx)}
                                                            size="small"
                                                            sx={act.style || {}}
                                                        >
                                                            {act.label}
                                                        </Button>
                                                    )}
                                                    <Menu
                                                        anchorEl={anchorEls[idx]}
                                                        open={Boolean(anchorEls[idx])}
                                                        onClose={() => handleMenuClose(idx)}
                                                    >
                                                        {act.menuItems.map((subAct, subIdx) => (
                                                            <MenuItem
                                                                key={`sub-${idx}-${subIdx}`}
                                                                onClick={() => handleAction(subAct, idx)}
                                                                disabled={subAct.disabled}
                                                            >
                                                                {subAct.icon && <Box sx={{ mr: 1, display: 'flex' }}>{subAct.icon}</Box>}
                                                                {subAct.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Menu>
                                                </React.Fragment>
                                            );
                                        }
                                        if (act.icon) {
                                            return (
                                                <Tooltip title={act.label} key={`act-${idx}`}>
                                                    <span>
                                                        <IconButton
                                                            color={act.color === 'error' ? 'error' : 'primary'}
                                                            aria-label={act.ariaLabel || `btn-${idx}`}
                                                            disabled={act.disabled || false}
                                                            onClick={() => !act.disabled && handleAction(act)}
                                                            size="small"
                                                        >
                                                            {act.icon}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            );
                                        }
                                        return (
                                            <Button
                                                key={`btn-act-${idx}`}
                                                variant={act.variant || 'contained'}
                                                color={act.color || 'primary'}
                                                aria-label={act.ariaLabel || `btn-${idx}`}
                                                disabled={act.disabled || false}
                                                onClick={() => !act.disabled && handleAction(act)}
                                                size="small"
                                                sx={act.style || {}}
                                            >
                                                {act.label}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Drawer anchor="top" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 0 } }}>
                <Box sx={{ p: 2, pt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
                    </Box>
                    <List>
                        {actions.map((act, idx) => {
                            if (act.menuItems) {
                                return (
                                    <React.Fragment key={`drawer-menu-${idx}`}>
                                        <ListItem disablePadding>
                                            <ListItemButton>
                                                {act.icon && (
                                                    <Box sx={{ mr: 2, display: 'flex', color: act.color === 'error' ? 'error.main' : 'inherit' }}>
                                                        {act.icon}
                                                    </Box>
                                                )}
                                                <ListItemText primary={act.label} sx={{ fontWeight: 'bold' }} />
                                            </ListItemButton>
                                        </ListItem>
                                        <List component="div" disablePadding>
                                            {act.menuItems.map((subAct, subIdx) => (
                                                <ListItemButton
                                                    key={`drawer-sub-${idx}-${subIdx}`}
                                                    sx={{ pl: 4 }}
                                                    onClick={() => {
                                                        if (!subAct.disabled) {
                                                            setOpen(false);
                                                            setTimeout(() => handleAction(subAct), 120);
                                                        }
                                                    }}
                                                    disabled={subAct.disabled || false}
                                                >
                                                    {subAct.icon && (
                                                        <Box sx={{ mr: 2, display: 'flex', color: subAct.color === 'error' ? 'error.main' : 'inherit' }}>
                                                            {subAct.icon}
                                                        </Box>
                                                    )}
                                                    <ListItemText primary={subAct.label} sx={{ color: subAct.color === 'error' ? 'error.main' : 'inherit' }} />
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    </React.Fragment>
                                );
                            }
                            return (
                                <ListItem key={`drawer-act-${idx}`} disablePadding>
                                    <ListItemButton
                                        onClick={() => {
                                            if (!act.disabled) {
                                                setOpen(false);
                                                // small delay so drawer animation starts
                                                setTimeout(() => handleAction(act), 120);
                                            }
                                        }}
                                        disabled={act.disabled || false}
                                    >
                                        {act.icon && (
                                            <Box sx={{ mr: 2, display: 'flex', color: act.color === 'error' ? 'error.main' : 'inherit' }}>
                                                {act.icon}
                                            </Box>
                                        )}
                                        <ListItemText primary={act.label} sx={{ color: act.color === 'error' ? 'error.main' : 'inherit' }} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default TopBar;
