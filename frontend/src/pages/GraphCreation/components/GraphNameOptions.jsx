import React from 'react';
import { Box, TextField, Switch, FormControlLabel } from '@mui/material';
import { useI18n } from '../../../context/I18nContext';

const GraphNameOptions = ({ graphName, setGraphName, directed, setDirected, weighted, setWeighted }) => {
	const { t } = useI18n();
	return (
		<Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
			<TextField
				label={t('graph_name_label')}
				variant="outlined"
				value={graphName}
				onChange={(e) => setGraphName(e.target.value)}
				sx={{ flex: 1 }}
			/>
			<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
				<FormControlLabel control={<Switch checked={directed} onChange={(e) => setDirected(e.target.checked)} />} label={t('directed_label')} />
				<FormControlLabel control={<Switch checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />} label={t('weighted_label')} />
			</Box>
		</Box>
	);
};

export default GraphNameOptions;
