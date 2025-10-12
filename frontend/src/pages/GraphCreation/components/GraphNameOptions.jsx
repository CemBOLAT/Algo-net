import React from 'react';
import { Box, TextField, Switch, FormControlLabel } from '@mui/material';

const GraphNameOptions = ({ graphName, setGraphName, directed, setDirected, weighted, setWeighted }) => {
	return (
		<Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
			<TextField
				label="Graph Adı"
				variant="outlined"
				value={graphName}
				onChange={(e) => setGraphName(e.target.value)}
				sx={{ flex: 1 }}
			/>
			<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
				<FormControlLabel control={<Switch checked={directed} onChange={(e) => setDirected(e.target.checked)} />} label="Yönlü (Directed)" />
				<FormControlLabel control={<Switch checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />} label="Ağırlıklı (Weighted)" />
			</Box>
		</Box>
	);
};

export default GraphNameOptions;
