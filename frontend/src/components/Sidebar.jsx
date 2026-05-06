import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, FormControl } from '@mui/material';
import { Edit, Label, Balance, TripOrigin, Place, PlayArrow, Refresh, Save, BuildCircle, LegendToggle } from '@mui/icons-material';
import CustomAlgoButton from "./CustomAlgo";
import RunGraphAlgorithms from "./RunGraphAlgorithms";
import ResultsPanel from "./ResultsPanel";
import { useI18n } from '../context/I18nContext';

const Sidebar = ({
  onRun, onReset, onSave, isSaving = false,
  graphName = 'Graph Name', setGraphName = () => { },
  setNodes, nodes, setEdges, edges,
  isLoading = false, setIsLoading = () => { },
  notify = () => { },
  hasLegend = false, setHasLegend = () => { },
  legendEntries = [], setLegendEntries = () => { },
  showNodeLabels, setShowNodeLabels,
  showEdgeWeights, setShowEdgeWeights,
  algorithmResult = null,
  setAlgorithmResult = () => { },
  onOpenBulkTools = () => { },
  onOpenLegendEditor = () => { },
  selectedAlgorithm, setSelectedAlgorithm,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(graphName);

  const { t } = useI18n();

  useEffect(() => setLocalName(graphName), [graphName]);

  const handleAlgorithmChange = (e) => {
    setSelectedAlgorithm(e.target.value);
  };

  // Elegant sidebar styles
  const sidebarStyles = {
    container: {
      width: { xs: '100%', sm: 280, md: 320 },
      minWidth: 0,
      flexShrink: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    contentPadding: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    sectionHeader: {
      fontSize: '11px',
      fontWeight: 700,
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    projectCard: {
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #f1f5f9',
    },
    selectWrapper: {
      position: 'relative',
      width: '100%',
    },
    select: {
      width: '100%',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '12px 16px',
      paddingRight: '40px',
      fontSize: '14px',
      outline: 'none',
      cursor: 'pointer',
      appearance: 'none',
      '&:focus': {
        borderColor: '#06b6d4',
        boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.1)',
      },
    },
    toggleButton: (active) => ({
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 12px',
      borderRadius: '12px',
      border: active ? '1px solid #06b6d4' : '1px solid #e2e8f0',
      backgroundColor: active ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
      color: active ? '#06b6d4' : '#64748b',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: active ? 'rgba(6, 182, 212, 0.1)' : '#f8fafc',
      },
    }),
    iconSelect: {
      width: '100%',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      paddingLeft: '40px',
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
      },
      '&:hover': {
        backgroundColor: '#f1f5f9',
      },
      '&.Mui-focused': {
        boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.1)',
        border: '1px solid #06b6d4',
      },
    },
    bottomActions: {
      marginTop: 'auto',
      padding: '12px 16px',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: 'rgba(248, 250, 252, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    resultsZone: {
      flexShrink: 0,
      maxHeight: '260px',
      overflowY: 'auto',
      padding: '0 16px',
      borderTop: algorithmResult ? '1px solid #e2e8f0' : 'none',
    },
    runButton: {
      width: '100%',
      padding: '16px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      color: '#ffffff',
      fontWeight: 700,
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.2)',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 20px 25px -5px rgba(6, 182, 212, 0.3)',
      },
    },
    resetButton: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'transparent',
      color: '#64748b',
      fontWeight: 600,
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      '&:hover': {
        backgroundColor: '#ffffff',
      },
    },
    saveButton: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: '#1e293b',
      color: '#ffffff',
      fontWeight: 600,
      fontSize: '14px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      '&:hover': {
        opacity: 0.9,
      },
    },
  };

  return (
    <Box sx={sidebarStyles.container}>
      {/* All content in one scrollable area */}
      <Box sx={sidebarStyles.contentPadding}>

        {/* Active Project Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={sidebarStyles.sectionHeader}>Active Project</Typography>
            {!editingName && (
              <Button
                size="small"
                onClick={() => { setLocalName(graphName); setEditingName(true); }}
                sx={{
                  color: '#06b6d4',
                  fontSize: '14px',
                  fontWeight: 500,
                  textTransform: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' },
                }}
                startIcon={<Edit sx={{ fontSize: '14px' }} />}
              >
                {t('edit')}
              </Button>
            )}
          </Box>

          <Box sx={sidebarStyles.projectCard}>
            {!editingName ? (
              <>
                <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                  {graphName}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
                  {nodes.length} nodes • {edges.length} edges
                </Typography>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <TextField
                  size="small"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                    },
                  }}
                />
                <Box sx={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => { setGraphName(localName); setEditingName(false); }}
                    sx={{
                      flex: 1,
                      borderRadius: '8px',
                      backgroundColor: '#06b6d4',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#0891b2' },
                    }}
                  >
                    {t('save_btn')}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setEditingName(false)}
                    sx={{
                      flex: 1,
                      borderRadius: '8px',
                      borderColor: '#e2e8f0',
                      color: '#64748b',
                      textTransform: 'none',
                    }}
                  >
                    {t('cancel_btn')}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Problems/Algorithms Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Typography sx={sidebarStyles.sectionHeader}>{t('problems_algorithms') || 'Problems/Algorithms'}</Typography>

          <FormControl fullWidth size="small">
            <Select
              id="algo-select"
              value={selectedAlgorithm || 'dfs'}
              onChange={handleAlgorithmChange}
              sx={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#cbd5e1',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#06b6d4',
                  borderWidth: '1px',
                },
                '& .MuiSelect-select': {
                  padding: '12px 16px',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    mt: 1,
                  },
                },
              }}
            >
              <MenuItem value="dfs">{t('dfs')}</MenuItem>
              <MenuItem value="bfs">{t('bfs')}</MenuItem>
              <MenuItem value="dijkstra">{t('dijkstra')}</MenuItem>
              <MenuItem value="ordered_coloring">{t('ordered_coloring')}</MenuItem>
              <MenuItem value="normal_coloring">{t('normal_coloring')}</MenuItem>
              <MenuItem value="b_coloring">{t('b_coloring')}</MenuItem>
              <MenuItem value="domination">{t('domination')}</MenuItem>
              <MenuItem value="total_domination">{t('total_domination')}</MenuItem>
              <MenuItem value="layout_planning">{t('layout_planning')}</MenuItem>
              <MenuItem value="package_coloring">{t('package_coloring')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Graph Tools Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Typography sx={sidebarStyles.sectionHeader}>{t('graph_tools') || 'Graph Tools'}</Typography>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Button
              onClick={onOpenBulkTools}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: 'transparent',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              <BuildCircle sx={{ fontSize: '20px' }} />
              {t('bulk_tools_title') || 'Bulk Tools'}
            </Button>
            <Button
              onClick={onOpenLegendEditor}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: 'transparent',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              <LegendToggle sx={{ fontSize: '20px' }} />
              {t('add_legend') || 'Add Legend'}
            </Button>
          </Box>
        </Box>

        {/* Toggle Buttons */}
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <Button
            onClick={() => setShowNodeLabels(!showNodeLabels)}
            sx={sidebarStyles.toggleButton(showNodeLabels)}
          >
            <Label sx={{ fontSize: '20px' }} />
            Labels
          </Button>
          <Button
            onClick={() => {
              const newState = !showEdgeWeights;
              setShowEdgeWeights(newState);
              setEdges((prev) => prev.map((e) => ({ ...e, showWeight: newState })));
            }}
            sx={sidebarStyles.toggleButton(showEdgeWeights)}
          >
            <Balance sx={{ fontSize: '20px' }} />
            Weights
          </Button>
        </Box>

        {/* Run Graph Algorithms Component */}
        <RunGraphAlgorithms
          setNodes={setNodes}
          nodes={nodes}
          setEdges={setEdges}
          edges={edges}
          selectedAlgo={selectedAlgorithm}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          notify={notify}
          onLegendChange={(entries) => { setLegendEntries(entries || []); setHasLegend(!!(entries && entries.length)); }}
          onResult={(result) => setAlgorithmResult(result)}
          legendEntries={legendEntries}
          graphName={graphName}
          setShowEdgeWeights={setShowEdgeWeights}
        />

        {/* Algorithm Results Panel */}
        <ResultsPanel
          result={algorithmResult}
          onClear={() => setAlgorithmResult(null)}
          nodes={nodes}
        />

        {/* Custom Algorithm Button */}
        <CustomAlgoButton
          setNodes={setNodes}
          nodes={nodes}
          edges={edges}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          notify={notify}
          graphName={graphName}
        />
      </Box>

      {/* Bottom Action Buttons */}
      <Box sx={sidebarStyles.bottomActions}>
        <Box sx={{ display: 'flex', gap: '12px' }}>
          <Button
            id="reset-btn"
            onClick={onReset}
            sx={sidebarStyles.resetButton}
          >
            <Refresh sx={{ fontSize: '20px' }} />
            {t('reset_btn')}
          </Button>
          <Button
            id="save-btn"
            onClick={onSave}
            disabled={isSaving}
            sx={sidebarStyles.saveButton}
          >
            <Save sx={{ fontSize: '20px' }} />
            {isSaving ? t('saving_btn') : t('save_btn')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;