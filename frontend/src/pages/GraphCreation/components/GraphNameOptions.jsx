import React from 'react';
import { Box, TextField, Switch, FormControlLabel, Paper, Typography } from '@mui/material';
import { useI18n } from '../../../context/I18nContext';

const GraphNameOptions = ({ graphName, setGraphName, directed, setDirected, weighted, setWeighted }) => {
	const { t } = useI18n();
	return (
		<Paper elevation={0} sx={{
			p: 3,
			mb: 3,
			borderRadius: 3,
			border: '1px solid',
			borderColor: 'divider',
			bgcolor: 'background.paper'
		}}>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'end' }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					<Typography variant="body2" fontWeight="600" color="text.primary">
						{t('graph_name_label')}
					</Typography>
					<TextField
						size="medium"
						placeholder="e.g. Social Network Topology"
						variant="outlined"
						value={graphName}
						onChange={(e) => setGraphName(e.target.value)}
						fullWidth
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 2,
								bgcolor: 'background.default'
							}
						}}
					/>
				</Box>

				<Box sx={{ display: 'flex', gap: 4, pb: 1 }}>
					<FormControlLabel
						control={<Switch checked={directed} onChange={(e) => setDirected(e.target.checked)} color="primary" />}
						label={<Typography variant="body2" fontWeight="500">{t('directed_label')}</Typography>}
					/>
					<FormControlLabel
						control={<Switch checked={weighted} onChange={(e) => setWeighted(e.target.checked)} color="primary" />}
						label={<Typography variant="body2" fontWeight="500">{t('weighted_label')}</Typography>}
					/>
				</Box>
			</Box>
		</Paper>
	);
};

export default GraphNameOptions;
