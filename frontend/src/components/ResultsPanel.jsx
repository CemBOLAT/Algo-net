import React, { useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Chip, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import PaletteIcon from '@mui/icons-material/Palette';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import { useI18n } from '../context/I18nContext';

const styles = {
  container: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    overflow: 'hidden',
    animation: 'fadeSlideIn 0.3s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  body: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '2px',
  },
  value: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1e293b',
    wordBreak: 'break-word',
  },
  pathChip: {
    fontSize: '12px',
    fontWeight: 600,
    height: '26px',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '3px 0',
  },
  colorSwatch: (color) => ({
    width: 14,
    height: 14,
    borderRadius: '4px',
    backgroundColor: color,
    border: '1px solid rgba(0,0,0,0.15)',
    flexShrink: 0,
  }),
};

const algoIcons = {
  dfs: <SearchIcon sx={{ fontSize: 16 }} />,
  dijkstra: <RouteIcon sx={{ fontSize: 16 }} />,
  ordered_coloring: <PaletteIcon sx={{ fontSize: 16 }} />,
  package_coloring: <PaletteIcon sx={{ fontSize: 16 }} />,
  layout_planning: <MapIcon sx={{ fontSize: 16 }} />,
};

const ResultsPanel = ({ result, onClear, nodes = [] }) => {
  const { t } = useI18n();
  const panelRef = useRef(null);

  // Build a lookup: id -> label
  const nodeLabel = (id) => {
    const n = nodes.find(n => String(n.id) === String(id));
    return n?.label ? String(n.label) : String(id);
  };

  useEffect(() => {
    if (result && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result]);

  if (!result) return null;

  const { algorithm, type, data } = result;

  const renderSearchResult = () => (
    <>
      <Box>
        <Typography sx={styles.label}>{t('result_status')}</Typography>
        <Typography sx={{ ...styles.value, color: data.pathFound ? '#047857' : '#dc2626', fontWeight: 700 }}>
          {data.pathFound ? t('path_found') : t('no_path_found')}
        </Typography>
      </Box>
      {data.path && data.path.length > 0 && (
        <Box>
          <Typography sx={styles.label}>{t('result_path')}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', mt: '4px' }}>
            {data.path.map((nodeId, i) => (
              <React.Fragment key={nodeId}>
                <Chip label={nodeLabel(nodeId)} size="small" sx={{ ...styles.pathChip, bgcolor: '#D32F2F', color: '#fff' }} />
                {i < data.path.length - 1 && (
                  <Typography sx={{ color: '#9ca3af', fontSize: '13px', lineHeight: '26px' }}>→</Typography>
                )}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      )}
    </>
  );

  const renderPathfindingResult = () => (
    <>
      {data.distance != null && (
        <Box>
          <Typography sx={styles.label}>{t('result_distance')}</Typography>
          <Typography sx={{ ...styles.value, fontSize: '18px', fontWeight: 700, color: '#047857' }}>
            {data.distance}
          </Typography>
        </Box>
      )}
      {data.path && data.path.length > 0 && (
        <Box>
          <Typography sx={styles.label}>{t('result_shortest_path')}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', mt: '4px' }}>
            {data.path.map((nodeId, i) => (
              <React.Fragment key={nodeId}>
                <Chip label={nodeLabel(nodeId)} size="small" sx={{ ...styles.pathChip, bgcolor: '#ef4444', color: '#fff' }} />
                {i < data.path.length - 1 && (
                  <Typography sx={{ color: '#9ca3af', fontSize: '13px', lineHeight: '26px' }}>→</Typography>
                )}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      )}
    </>
  );

  const renderColoringResult = () => (
    <>
      {data.colorCount != null && (
        <Box>
          <Typography sx={styles.label}>{t('result_colors_used')}</Typography>
          <Typography sx={{ ...styles.value, fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>
            {data.colorCount}
          </Typography>
        </Box>
      )}
      {data.pcn != null && (
        <Box>
          <Typography sx={styles.label}>PCN</Typography>
          <Typography sx={{ ...styles.value, fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>
            {data.pcn}
          </Typography>
        </Box>
      )}
      {data.colorGroups && Object.keys(data.colorGroups).length > 0 && (
        <Box>
          <Typography sx={styles.label}>{t('result_color_mapping')}</Typography>
          <Divider sx={{ my: '4px' }} />
          {Object.entries(data.colorGroups).map(([color, nodeIds]) => (
            <Box key={color} sx={styles.colorRow}>
              <Box sx={styles.colorSwatch(color)} />
              <Typography sx={{ fontSize: '12px', color: '#374151' }}>
                {Array.isArray(nodeIds) ? nodeIds.map(id => nodeLabel(id)).join(', ') : nodeLabel(nodeIds)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </>
  );

  const renderLayoutResult = () => (
    <Box>
      <Typography sx={styles.label}>{t('result_layout_done')}</Typography>
      <Typography sx={styles.value}>{t('result_layout_desc')}</Typography>
    </Box>
  );

  const renderBody = () => {
    switch (type) {
      case 'searching': return renderSearchResult();
      case 'pathfinding': return renderPathfindingResult();
      case 'coloring': return renderColoringResult();
      case 'layout': return renderLayoutResult();
      default: return <Typography sx={styles.value}>{t('algorithm_executed')}</Typography>;
    }
  };

  return (
    <Box ref={panelRef} sx={styles.container}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Box sx={styles.header}>
        <Box sx={styles.headerTitle}>
          {algoIcons[algorithm] || <SearchIcon sx={{ fontSize: 16 }} />}
          {t('results_title')}
        </Box>
        <IconButton size="small" onClick={onClear} sx={{ color: '#ffffff', p: '2px' }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
      <Box sx={styles.body}>
        <Box>
          <Typography sx={styles.label}>{t('algorithm')}</Typography>
          <Typography sx={styles.value}>{t(algorithm) || algorithm}</Typography>
        </Box>
        {renderBody()}
      </Box>
    </Box>
  );
};

export default ResultsPanel;
