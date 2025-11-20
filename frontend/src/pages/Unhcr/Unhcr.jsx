import React from 'react';
import {
  Box, Typography, Container, Grid, Card, CardContent, Paper, Button,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TopBar from '../../components/TopBar';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';

const defaults = {
  unhcr_info: 'UNHCR',
  unhcr_title: 'UNHCR Acil Durum Kamp Planlama Standartları',
  unhcr_intro: 'Bu sayfa, UNHCR Acil Durum El Kitabının 4. baskısından alınan planlı yerleşimler için temel standartları ve en iyi uygulamaları özetlemektedir.',
  unhcr_pdf_name: 'UNHCR.pdf',
};

// 1. Ortalama Kamp Alanı Standartları (Renklendirme için)
const areaStandards = [
  { status: 'Standard', min: 45, max: Infinity, color: 'success', description: 'Kabul edilebilir minimum alan. Hane halkı bahçe alanı dahil.' },
  { status: 'Acceptable', min: 35, max: 44, color: 'info', description: 'Yol, tesis ve barınak için ayrılmış minimum 30 m² alana ek olarak bahçe alanı hedeflenir.' },
  { status: 'Unacceptable', min: 30, max: 34, color: 'warning', description: 'Bu aralıkta yoğunluk artar, hastalık riski yükselir.' },
  { status: 'Critical', min: 0, max: 29, color: 'error', description: 'Kritik yoğunluk. Derhal müdahale gereklidir.' },
];

// 2. Minimum Barınak ve Yerleşim Standartları (Tablo 1'den)
const minimumStandards = [
  { description: 'Kapalı Yaşam Alanı (Minimum)', standard: '3.5 m² / kişi', detail: 'Soğuk iklimlerde/kentsel alanlarda: 4.5 m² - 5.5 m². Minimum tavan yüksekliği: 2m.' },
  { description: 'Kamp Alanı (Hedeflenen)', standard: '45 m² / kişi', detail: 'Hizmetler (30 m²) ve Hane Bahçesi (15 m²) dahil.' },
  { description: 'Yangın Şeridi', standard: '30 m / 300 m', detail: 'Yapılar arasında minimum 2 m veya yapının yüksekliğinin 2 katı mesafe.' },
  { description: 'Kamp Yeri Eğim (İdeal)', standard: '2% - 4%', detail: 'İzin verilen aralık: 1% - 5%. İyi drenaj için kritik.' },
];

// 3. Modüler Planlama Birimleri (Tablo 2'den)
const modularUnits = [
  { module: 'Aile (Family)', structure: '1 x aile', approxPersons: '4 – 6 kişi' },
  { module: 'Topluluk (Community)', structure: '16 x aile', approxPersons: '80 kişi' },
  { module: 'Blok (Block)', structure: '16 x topluluk', approxPersons: '1.250 kişi' },
  { module: 'Sektör (Sector)', structure: '4 x blok', approxPersons: '5.000 kişi' },
  { module: 'Yerleşim (Settlement)', structure: '4 x sektör', approxPersons: '20.000 kişi' },
];

// 4. Hizmet ve Altyapı Standartları (PDF Tablo 3'ün TÜM verileri)
const serviceStandards = [
  { service: 'Ortak Tuvalet', standard: '1 / 20 kişi (Acil Durum)', distance: 'Ayrı alanlar. Uzun dönem için hane başına 1 latrine. Barınaktan maks. 50m, min. 6m.' },
  { service: 'Duş', standard: '1 / 50 kişi', distance: 'Erkekler ve kadınlar için ayrı, iyi drene edilmiş alanlar.' },
  { service: 'Su Temini', standard: '20 Litre / kişi / gün', distance: 'Su kaynağına yakınlık önemlidir.' },
  { service: 'Su Dağıtım Noktası (Stand Tap)', standard: '1 / 80 kişi', distance: 'Haneden maksimum 200m. Topluluk başına 1 adet.' },
  { service: 'Çöp Kutusu (100 Litre)', standard: '1 / 50 kişi', distance: '10 aile başına 1 adet.' },
  { service: 'Çöp Çukuru (2mx5mx2m)', standard: '1 / 500 kişi', distance: '100 aile başına 1 adet.' },
  { service: 'Sağlık Merkezi', standard: '1 / 20.000 kişi', distance: 'Yerleşim başına 1 adet. Su ve sanitasyon tesisleri içermeli.' },
  { service: 'Sevk Hastanesi (Referral Hospital)', standard: '1 / 200.000 kişi', distance: '10 yerleşim başına 1 adet.' },
  { service: 'Okul', standard: '1 / 5.000 kişi', distance: 'Sektör başına 1 adet. 3 sınıf, 50 m².' },
  { service: 'Dağıtım Merkezi', standard: '1 / 5.000 kişi', distance: 'Sektör başına 1 adet.' },
  { service: 'Pazar Yeri', standard: '1 / 20.000 kişi', distance: 'Yerleşim başına 1 adet.' },
  { service: 'Beslenme Merkezi (Feeding Centre)', standard: '1 / 20.000 kişi', distance: 'Yerleşim başına 1 adet.' },
  { service: 'Depolama Alanı (Storage)', standard: '15-20 m² / 100 kişi', distance: 'Mülteci depolama alanı.' },
  { service: 'Aydınlatma', standard: 'Uygun olduğu şekilde', distance: 'Tuvalet, yıkama alanları, kamu hizmet alanları gibi öncelikli yerler.' },
  { service: 'Kayıt Alanı', standard: 'Uygun olduğu şekilde', distance: 'Varış, tıbbi onay, dağıtım ve park alanı içerebilir.' },
  { service: 'İdare / Ofis', standard: 'Uygun olduğu şekilde', distance: 'Gerektiği kadar.' },
  { service: 'Güvenlik Noktası', standard: 'Uygun olduğu şekilde', distance: 'Gerektiği kadar.' },
];

const Unhcr = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const tt = (k) => t(k) || defaults[k];

  const handleDownload = () => {
    alert(`PDF İndirme başlatılıyor: ${defaults.unhcr_pdf_name}`);
  };

  return (
    <Box sx={{ bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      <TopBar
        title={tt('unhcr_info')}
        actions={[
            { label: t('go_to_canvas') || 'Canvas', onClick: () => navigate('/graph'), variant: 'contained', color: 'primary', ariaLabel: 'canvas' },
            { label: t('profile') || 'Profil', onClick: () => navigate('/profile'), variant: 'contained', color: 'primary', ariaLabel: 'profile' },
            { label: t('create_graph') || 'Graf Oluştur', onClick: () => navigate('/graph-creation'), variant: 'contained', color: 'primary', ariaLabel: 'create_graph' },
	          { label: t('my_graphs'), onClick: () => navigate('/graph-list'), variant: 'contained', color: 'primary', ariaLabel: t('graph-list') },
            { label: t('array_algorithms') || 'Dizi', onClick: () => navigate('/array-algorithms'), variant: 'contained', color: 'primary', ariaLabel: 'array_algorithms' },
            { label: t('tree_algorithms') || 'Ağaç', onClick: () => navigate('/tree-algorithms'), variant: 'contained', color: 'primary', ariaLabel: 'tree_algorithms' },

            { label: t('download_pdf_unhcr'), onClick: handleDownload, variant: 'contained', color: 'primary', ariaLabel: 'download_pdf_unhcr', isButton: true },
            { label: t('logout') || 'Çıkış', onClick: () => navigate('/login'), variant: 'contained', color: 'error', ariaLabel: 'logout' }
        ]}
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ color: '#0070c7', fontWeight: '900', textAlign: 'center', mb: 1 }}>{tt('unhcr_title')}</Typography>
        <Typography variant="subtitle1" paragraph sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
          {tt('unhcr_intro')}
        </Typography>
        
        <Grid container spacing={4}>
          {/* 1. Standartlar */}
          <Grid item xs={12} md={6}>
            <Card component={Paper} elevation={6} sx={{ height: '100%', borderRadius: 3, borderLeft: '5px solid #ffcc00' }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, color: '#2563eb', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', pb: 1 }}>
                  1. Temel İlkeler ve Barınak Standartları
                </Typography>

                <Box sx={{ mb: 3, bgcolor: '#e3f2fd', p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">Anahtar Noktalar:</Typography>
                  <ul style={{ listStyleType: 'disc', paddingLeft: 20 }}>
                    <li><Typography variant="body2">UNHCR, mümkün olduğunda kamplara alternatifleri tercih eder.</Typography></li>
                    <li><Typography variant="body2">Barınak, coğrafya, iklim, kültürel alışkanlıklar ve yerel malzeme erişimine göre uyarlanmalıdır.</Typography></li>
                    <li><Typography variant="body2">Acil durum barınakları (çadır, plastik örtü) uzun süreli yerleşim için yeterli değildir.</Typography></li>
                  </ul>
                </Box>

                <Typography variant="h6" sx={{ mt: 3, mb: 1, color: '#1976d2', fontWeight: '600' }}>
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#d6e6f2' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Açıklama</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Minimum Standart</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Detay</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {minimumStandards.map((item, i) => (
                        <TableRow key={i} sx={{ '&:nth-of-type(even)': { bgcolor: '#f5f5f5' } }}>
                          <TableCell component="th" scope="row" sx={{ fontSize: '0.9rem' }}>{item.description}</TableCell>
                          <TableCell sx={{ fontWeight: '600', color: '#333' }}>{item.standard}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{item.detail}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 2. Alan ve Modüller */}
          <Grid item xs={12} md={6}>
            <Card component={Paper} elevation={6} sx={{ height: '100%', borderRadius: 3, borderLeft: '5px solid #ffcc00' }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, color: '#2563eb', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', pb: 1 }}>
                  2. Kamp Alanı Alanı (m²) ve Planlama Modülleri
                </Typography>

                <Typography variant="h6" sx={{ mb: 1, color: '#1976d2', fontWeight: '600' }}>
                  Ortalama Kamp Alanı / Kişi (m²) - Durum
                </Typography>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#fffde7', borderRadius: 2, border: '1px dashed #ffcc00' }}>
                  <Grid container spacing={1}>
                    {areaStandards.map((s, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Chip
                          label={`${s.status} (${s.min} m² ${s.max === Infinity ? '+' : `- ${s.max} m²`})`}
                          color={s.color}
                          sx={{ width: '100%', fontWeight: 'bold', mb: 0.5 }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
                          {s.description}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                <Typography variant="h6" sx={{ mt: 3, mb: 1, color: '#1976d2', fontWeight: '600' }}>
                  Gösterge Modüler Planlama Birimleri
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#d6e6f2' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Modül</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Yapı</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Yaklaşık Kişi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modularUnits.map((m, i) => (
                        <TableRow key={i} sx={{ '&:nth-of-type(even)': { bgcolor: '#f5f5f5' } }}>
                          <TableCell component="th" scope="row" sx={{ fontWeight: '500' }}>{m.module}</TableCell>
                          <TableCell>{m.structure}</TableCell>
                          <TableCell sx={{ fontWeight: '600' }}>{m.approxPersons}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 3. Hizmetler - GENİŞLETİLDİ */}
          <Grid item xs={12}>
            <Card component={Paper} elevation={6} sx={{ borderRadius: 3, borderTop: '5px solid #0070c7' }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, color: '#2563eb', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', pb: 1 }}>
                  3. Hizmet ve Altyapı Yerleşim Standartları (Kapsamlı)
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#0070c7' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', width: '20%' }}>Hizmet</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', width: '20%' }}>Standart Miktar</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', width: '60%' }}>Mesafe / Ek Hususlar</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {serviceStandards.map((item, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { bgcolor: '#e8f5e9' } // Hafif Vurgu
                          }}
                        >
                          <TableCell component="th" scope="row" sx={{ color: '#1976d2', fontWeight: '600' }}>{item.service}</TableCell>
                          <TableCell sx={{ fontWeight: 'medium', color: '#333' }}>{item.standard}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{item.distance}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 4. Site Seçim Kriterleri (Genişletildi ve Düzenlendi) */}
          <Grid item xs={12}>
            <Card component={Paper} elevation={6} sx={{ borderRadius: 3, borderRight: '5px solid #ffcc00' }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, color: '#2563eb', fontWeight: 'bold', borderBottom: '2px solid #e0e0e0', pb: 1 }}>
                  4. Önemli Site Seçim Kriterleri (PDF Özet)
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper elevation={2} sx={{ p: 2, bgcolor: '#ffe0b2' }}>
                      <Typography variant="subtitle1" color="#e65100" fontWeight="bold">Topografi & Drenaj</Typography>
                      <ul style={{ listStyleType: 'circle', paddingLeft: 20, margin: 0 }}>
                          <li><Typography variant="body2">İdeal Eğim: %2-%4.</Typography></li>
                          <li><Typography variant="body2">Su Seviyesi: Taban suyu yüzeyden min. 3m aşağıda olmalı.</Typography></li>
                          <li><Typography variant="body2">Kaçınılması Gereken: Kayalık, bataklık veya geçirimsiz topraklar.</Typography></li>
                      </ul>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper elevation={2} sx={{ p: 2, bgcolor: '#b2ebf2' }}>
                      <Typography variant="subtitle1" color="#006064" fontWeight="bold">Su Kaynakları & Erişim</Typography>
                      <ul style={{ listStyleType: 'circle', paddingLeft: 20, margin: 0 }}>
                          <li><Typography variant="body2">Kaynak: Yeterli ve iyi kalitede su kaynağına yakınlık.</Typography></li>
                          <li><Typography variant="body2">Dağıtım: Her 250 kişi için en az 1 su noktası.</Typography></li>
                          <li><Typography variant="body2">Lojistik: Uzun mesafeli su taşımacılığından kaçınılmalı.</Typography></li>
                      </ul>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper elevation={2} sx={{ p: 2, bgcolor: '#ffcdd2' }}>
                      <Typography variant="subtitle1" color="#c62828" fontWeight="bold">Güvenlik & Çevre</Typography>
                      <ul style={{ listStyleType: 'circle', paddingLeft: 20, margin: 0 }}>
                          <li><Typography variant="body2">Güvenli Mesafe: Sınırlardan (50km) ve çatışma bölgelerinden uzaklık.</Typography></li>
                          <li><Typography variant="body2">Çevresel Risk: Aşırı iklim, sıtma (malaria) ve tozlu alanlardan kaçınılmalı.</Typography></li>
                          <li><Typography variant="body2">Doğal Yaşam: Bitki örtüsü (gölge, erozyon) ve yakacak odun erişimi sağlanmalı.</Typography></li>
                      </ul>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Unhcr;