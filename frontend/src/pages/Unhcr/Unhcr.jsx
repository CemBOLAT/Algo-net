import React from 'react';
import { Box, Typography } from '@mui/material';

const Unhcr = () => (
  <Box p={4}>
    <Typography variant="h4" gutterBottom>UNHCR Bilgi Sayfası</Typography>
    <Typography variant="body1">
      Bu sayfa şimdilik statik içerik barındırıyor. Buraya UNHCR ile ilgili açıklamalar,
      bağlantılar veya görseller eklenecek. İleride dinamik veri entegrasyonu yapılabilir.
    </Typography>
  </Box>
);

export default Unhcr;
