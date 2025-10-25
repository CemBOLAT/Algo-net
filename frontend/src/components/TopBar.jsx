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
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useI18n } from '../context/I18nContext';
import { getAlgoTranslator } from '../i18n/algoI18n';

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
    const [selected, setSelected] = useState('');
    const { language, t } = useI18n();
    const ta = useMemo(() => getAlgoTranslator(language), [language]);

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
                        {isSmall ? (
                            <IconButton aria-label="menu" onClick={() => setOpen(true)}>
                                <MenuIcon />
                            </IconButton>
                        ) : (
                            // değişiklik: butonlar yerine Select kullanılıyor
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel id="topbar-actions-label">{t('topbar.options', { defaultValue: 'Options' })}</InputLabel>
                                <Select
                                    labelId="topbar-actions-label"
                                    value={selected}
                                    label={t('topbar.options', { defaultValue: 'Options' })}
                                    displayEmpty
                                    onChange={(e) => {
                                        const idx = e.target.value;
                                        setSelected(''); // hemen sıfırla, placeholder gösterilsin
                                        if (idx === '') return;
                                        const act = actions[idx];
                                        if (act && !act.disabled) handleAction(act);
                                    }}
                                    renderValue={(v) => (v === '' ? t('topbar.options', { defaultValue: 'Options' }) : actions[v]?.label)}
                                    inputProps={{ 'aria-label': t('topbar.actions_aria', { defaultValue: 'topbar-actions' }) }}
                                >
                                    <MenuItem value="">{t('topbar.select_placeholder', { defaultValue: '--' })}</MenuItem>
                                    {actions.map((act, idx) => (
                                        <MenuItem key={`select-act-${idx}`} value={idx} disabled={act.disabled || false}>
                                            {act.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
                        {actions.map((act, idx) => (
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
