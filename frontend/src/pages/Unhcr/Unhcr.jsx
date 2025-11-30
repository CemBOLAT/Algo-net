import React from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TopBar from '../../components/TopBar';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';
import unhcrTranslations from './unhcr.json';

// ------------------------------------------------------
// 1) DATA MODEL + DEFAULT TEXT (PDF içeriği buraya aktarıldı)
// ------------------------------------------------------

const pdfUrl = '/UNHCR.pdf';

// Tek nokta: tüm text keyleri buradan geçecek
const defaults = unhcrTranslations.tr; // Fallback to Turkish

// Ortalama kamp alanı renkli chipler – dil bağımsız
const areaStandards = [
    { id: 'standard', min: 45, max: Infinity, color: 'success' },
    { id: 'acceptable', min: 35, max: 44, color: 'info' },
    { id: 'unacceptable', min: 30, max: 34, color: 'warning' },
    { id: 'critical', min: 0, max: 29, color: 'error' }
];

// Minimum standartlar – text için i18n key kullanıyoruz
const minimumRows = [
    {
        id: 'covered',
        descKey: 'unhcr_min_covered_desc',
        standardKey: 'unhcr_min_covered_standard',
        detailKey: 'unhcr_min_covered_detail'
    },
    {
        id: 'camp_area',
        descKey: 'unhcr_min_camp_area_desc',
        standardKey: 'unhcr_min_camp_area_standard',
        detailKey: 'unhcr_min_camp_area_detail'
    },
    {
        id: 'fire',
        descKey: 'unhcr_min_fire_desc',
        standardKey: 'unhcr_min_fire_standard',
        detailKey: 'unhcr_min_fire_detail'
    },
    {
        id: 'gradient',
        descKey: 'unhcr_min_gradient_desc',
        standardKey: 'unhcr_min_gradient_standard',
        detailKey: 'unhcr_min_gradient_detail'
    }
];

// Modüler planlama birimleri
const modularRows = [
    {
        id: 'family',
        moduleKey: 'unhcr_mod_family',
        structureKey: 'unhcr_mod_family_structure',
        personsKey: 'unhcr_mod_family_persons'
    },
    {
        id: 'community',
        moduleKey: 'unhcr_mod_community',
        structureKey: 'unhcr_mod_community_structure',
        personsKey: 'unhcr_mod_community_persons'
    },
    {
        id: 'block',
        moduleKey: 'unhcr_mod_block',
        structureKey: 'unhcr_mod_block_structure',
        personsKey: 'unhcr_mod_block_persons'
    },
    {
        id: 'sector',
        moduleKey: 'unhcr_mod_sector',
        structureKey: 'unhcr_mod_sector_structure',
        personsKey: 'unhcr_mod_sector_persons'
    },
    {
        id: 'settlement',
        moduleKey: 'unhcr_mod_settlement',
        structureKey: 'unhcr_mod_settlement_structure',
        personsKey: 'unhcr_mod_settlement_persons'
    }
];

// Hizmet ve altyapı (now using translation keys)
const serviceStandards = [
    { id: 'latrine', serviceKey: 'unhcr_service_latrine', standardKey: 'unhcr_service_latrine_standard', distanceKey: 'unhcr_service_latrine_distance' },
    { id: 'shower', serviceKey: 'unhcr_service_shower', standardKey: 'unhcr_service_shower_standard', distanceKey: 'unhcr_service_shower_distance' },
    { id: 'water', serviceKey: 'unhcr_service_water', standardKey: 'unhcr_service_water_standard', distanceKey: 'unhcr_service_water_distance' },
    { id: 'standtap', serviceKey: 'unhcr_service_standtap', standardKey: 'unhcr_service_standtap_standard', distanceKey: 'unhcr_service_standtap_distance' },
    { id: 'waterdist', serviceKey: 'unhcr_service_waterdist', standardKey: 'unhcr_service_waterdist_standard', distanceKey: 'unhcr_service_waterdist_distance' },
    { id: 'bin', serviceKey: 'unhcr_service_bin', standardKey: 'unhcr_service_bin_standard', distanceKey: 'unhcr_service_bin_distance' },
    { id: 'pit', serviceKey: 'unhcr_service_pit', standardKey: 'unhcr_service_pit_standard', distanceKey: 'unhcr_service_pit_distance' },
    { id: 'health', serviceKey: 'unhcr_service_health', standardKey: 'unhcr_service_health_standard', distanceKey: 'unhcr_service_health_distance' },
    { id: 'hospital', serviceKey: 'unhcr_service_hospital', standardKey: 'unhcr_service_hospital_standard', distanceKey: 'unhcr_service_hospital_distance' },
    { id: 'school', serviceKey: 'unhcr_service_school', standardKey: 'unhcr_service_school_standard', distanceKey: 'unhcr_service_school_distance' },
    { id: 'dist_centre', serviceKey: 'unhcr_service_dist_centre', standardKey: 'unhcr_service_dist_centre_standard', distanceKey: 'unhcr_service_dist_centre_distance' },
    { id: 'market', serviceKey: 'unhcr_service_market', standardKey: 'unhcr_service_market_standard', distanceKey: 'unhcr_service_market_distance' },
    { id: 'feeding', serviceKey: 'unhcr_service_feeding', standardKey: 'unhcr_service_feeding_standard', distanceKey: 'unhcr_service_feeding_distance' },
    { id: 'storage', serviceKey: 'unhcr_service_storage', standardKey: 'unhcr_service_storage_standard', distanceKey: 'unhcr_service_storage_distance' },
    { id: 'lighting', serviceKey: 'unhcr_service_lighting', standardKey: 'unhcr_service_lighting_standard', distanceKey: 'unhcr_service_lighting_distance' },
    { id: 'registration', serviceKey: 'unhcr_service_registration', standardKey: 'unhcr_service_registration_standard', distanceKey: 'unhcr_service_registration_distance' },
    { id: 'admin', serviceKey: 'unhcr_service_admin', standardKey: 'unhcr_service_admin_standard', distanceKey: 'unhcr_service_admin_distance' },
    { id: 'security_post', serviceKey: 'unhcr_service_security_post', standardKey: 'unhcr_service_security_post_standard', distanceKey: 'unhcr_service_security_post_distance' },
    { id: 'security_fence', serviceKey: 'unhcr_service_security_fence', standardKey: 'unhcr_service_security_fence_standard', distanceKey: 'unhcr_service_security_fence_distance' }
];

// Site seçim kriterleri – başlık + açıklama
const siteSelectionBlocks = [
    {
        titleKey: 'unhcr_site_topography_title',
        bodyKey: 'unhcr_site_topography_body',
        color: '#ffe0b2'
    },
    {
        titleKey: 'unhcr_site_water_title',
        bodyKey: 'unhcr_site_water_body',
        color: '#b2ebf2'
    },
    {
        titleKey: 'unhcr_site_land_title',
        bodyKey: 'unhcr_site_land_body',
        color: '#e1bee7'
    },
    {
        titleKey: 'unhcr_site_access_title',
        bodyKey: 'unhcr_site_access_body',
        color: '#c8e6c9'
    },
    {
        titleKey: 'unhcr_site_security_title',
        bodyKey: 'unhcr_site_security_body',
        color: '#ffcdd2'
    },
    {
        titleKey: 'unhcr_site_environment_title',
        bodyKey: 'unhcr_site_environment_body',
        color: '#fff9c4'
    }
];

// PDF sonundaki referanslar – URL’leri istersen gerçekleriyle değiştirebilirsin
const referenceLinks = [
    {
        key: 'unhcr_link_emergency_handbook',
        href: pdfUrl + '#page=1' // PDF içi sayfa linki (çoğu viewer destekler)
    },
    {
        key: 'unhcr_link_shelter_projects',
        href: 'https://emergency.unhcr.org' // TODO: İstersen tam URL ile değiştir
    },
    {
        key: 'unhcr_link_camp_mgmt_toolkit',
        href: 'https://emergency.unhcr.org'
    },
    {
        key: 'unhcr_link_global_strategy',
        href: 'https://emergency.unhcr.org'
    },
    {
        key: 'unhcr_link_policy_alt_camps',
        href: 'https://emergency.unhcr.org'
    },
    {
        key: 'unhcr_link_sphere',
        href: 'https://spherestandards.org'
    }
];

// ------------------------------------------------------
// 2) COMPONENT
// ------------------------------------------------------

const handleArray = () => {
    navigate('/array-algorithms');
};

const handleTree = () => {
    navigate('/tree-algorithms');
};

const Unhcr = () => {
    const { t, language } = useI18n();
    const navigate = useNavigate();

    // Get translations for current language, fallback to Turkish
    const translations = unhcrTranslations[language] || unhcrTranslations.tr;

    const tt = (key) => translations[key] || t(key) || key;

    return (
        <Box sx={{ bgcolor: '#f4f7f9', minHeight: '100vh' }}>
            {/* NAVBAR */}
            <TopBar
                title={tt('unhcr_info')}
                actions={[
                    { label: t('go_to_canvas') || 'Canvas', onClick: () => navigate('/graph'), variant: 'contained', color: 'primary' },
                    { label: t('profile') || 'Profil', onClick: () => navigate('/profile'), variant: 'contained', color: 'primary' },
                    { label: t('create_graph') || 'Graf Oluştur', onClick: () => navigate('/graph-creation'), variant: 'contained', color: 'primary' },
                    { label: t('my_graphs') || 'Graflerim', onClick: () => navigate('/graph-list'), variant: 'contained', color: 'primary' },
                    { label: t('array_algorithms'), onClick: handleArray, variant: 'contained', color: 'primary', ariaLabel: t('array_algorithms') },
                    { label: t('tree_algorithms'), onClick: handleTree, variant: 'contained', color: 'primary', ariaLabel: t('tree_algorithms') },

                    {
                        label: tt('download_pdf_unhcr') || 'PDF Görüntüle',
                        onClick: () => window.open(pdfUrl, '_blank'),
                        variant: 'contained',
                        color: 'primary',
                        isButton: true
                    },

                    { label: t('logout') || 'Çıkış', onClick: () => navigate('/login'), variant: 'contained', color: 'error' }
                ]}
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Başlık */}
                <Typography
                    variant="h3"
                    gutterBottom
                    sx={{ color: '#0070c7', fontWeight: 900, textAlign: 'center', mb: 1 }}
                >
                    {tt('unhcr_title')}
                </Typography>
                <Typography
                    variant="subtitle1"
                    paragraph
                    sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}
                >
                    {tt('unhcr_intro')}
                </Typography>

                {/* 1. Genel Bakış (Markdown → Typography) */}
                <Card component={Paper} elevation={4} sx={{ mb: 4, borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#2563eb' }}>
                            {tt('unhcr_section_overview')}
                        </Typography>
                        <Typography variant="body2" paragraph>{tt('unhcr_overview_p1')}</Typography>
                        <Typography variant="body2" paragraph>{tt('unhcr_overview_p2')}</Typography>
                        <Typography variant="body2" paragraph>{tt('unhcr_overview_p3')}</Typography>
                        <Typography variant="body2" paragraph>{tt('unhcr_overview_p4')}</Typography>
                    </CardContent>
                </Card>

                <Grid container spacing={4}>
                    {/* Sol: Minimum Standartlar */}
                    <Grid item xs={12} md={6}>
                        <Card component={Paper} elevation={6} sx={{ borderRadius: 3, borderLeft: '5px solid #ffcc00', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#2563eb' }}>
                                    {tt('unhcr_section_emergency_standards')}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                                    {tt('unhcr_section_minimum_table')}
                                </Typography>

                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#d6e6f2' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                    {tt('description') || 'Açıklama'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                    {tt('standard') || 'Minimum Standart'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                    {tt('details') || 'Detay'}
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {minimumRows.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>{tt(row.descKey)}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>{tt(row.standardKey)}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                                        {tt(row.detailKey)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Sağ: Ortalama alan + Modüler birimler */}
                    <Grid item xs={12} md={6}>
                        <Card component={Paper} elevation={6} sx={{ borderRadius: 3, borderLeft: '5px solid #ffcc00', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#2563eb' }}>
                                    {tt('unhcr_section_area_standards')}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {tt('unhcr_area_standard_desc')}
                                </Typography>

                                <Box sx={{ mb: 3, p: 2, bgcolor: '#fffde7', borderRadius: 2, border: '1px dashed #ffcc00' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        {tt('unhcr_area_standard_title')}
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {areaStandards.map((s) => (
                                            <Grid item xs={12} sm={6} key={s.id}>
                                                <Chip
                                                    color={s.color}
                                                    sx={{ width: '100%', mb: 0.5, fontWeight: 'bold' }}
                                                    label={tt(`unhcr_area_standard_label_${s.id}`)}
                                                />
                                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                    {tt(`unhcr_area_standard_desc_${s.id}`)}
                                                </Typography>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>

                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#2563eb' }}>
                                    {tt('unhcr_section_modular_units')}
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#d6e6f2' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                    {tt('module') || 'Modül'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                    {tt('structure') || 'Yapı'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                    {tt('approx_persons') || 'Yaklaşık kişi'}
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {modularRows.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>{tt(row.moduleKey)}</TableCell>
                                                    <TableCell>{tt(row.structureKey)}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>{tt(row.personsKey)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* 3. Hizmet ve altyapı standartları */}
                <Card
                    component={Paper}
                    elevation={6}
                    sx={{ borderRadius: 3, borderTop: '5px solid #0070c7', mt: 4 }}
                >
                    <CardContent>
                        <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: '#2563eb' }}>
                            {tt('unhcr_section_services')}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {tt('unhcr_services_desc')}
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#0070c7' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                                            {tt('service') || 'Hizmet'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                                            {tt('standard') || 'Standart'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                                            {tt('distance_notes') || 'Mesafe / Ek Notlar'}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {serviceStandards.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            sx={{
                                                '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                                                '&:hover': { bgcolor: '#e8f5e9' }
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>{tt(item.serviceKey)}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{tt(item.standardKey)}</TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem' }}>{tt(item.distanceKey)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                {/* 4. Site seçim kriterleri */}
                <Card
                    component={Paper}
                    elevation={6}
                    sx={{ borderRadius: 3, borderRight: '5px solid #ffcc00', mt: 4 }}
                >
                    <CardContent>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#2563eb' }}>
                            {tt('unhcr_section_site_selection')}
                        </Typography>
                        <Grid container spacing={2}>
                            {siteSelectionBlocks.map((b, idx) => (
                                <Grid item xs={12} md={6} key={idx}>
                                    <Paper elevation={2} sx={{ p: 2, bgcolor: b.color, height: '100%' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {tt(b.titleKey)}
                                        </Typography>
                                        <Typography variant="body2">{tt(b.bodyKey)}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>

                {/* 5. Referans linkleri (PDF içi / harici) */}
                <Card
                    component={Paper}
                    elevation={4}
                    sx={{ borderRadius: 3, mt: 4, mb: 6 }}
                >
                    <CardContent>
                        <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: '#2563eb' }}>
                            {tt('unhcr_section_links')}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {tt('unhcr_links_intro')}
                        </Typography>

                        <List dense>
                            {referenceLinks.map((ref) => (
                                <React.Fragment key={ref.key}>
                                    <ListItem
                                        component="a"
                                        href={ref.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <ListItemText primary={tt(ref.key)} />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>

                        <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                            {tt('unhcr_link_contact')}
                        </Typography>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Unhcr;