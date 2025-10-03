import React from 'react';
import { Paper, Typography, Box, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlashMessage from '../../../components/FlashMessage';
import VertexList from './VertexList';

const VerticesPanel = ({
	vertexName, setVertexName, vertexError,
	addVertex, vertices, removeVertex, vertexListRef
}) => {
	return (
		<Paper className="tm-glass" sx={{ flex: 1, p: 2 }} elevation={2}>
			<Typography variant="h6" sx={{ mb: 1 }}>Düğümler (Vertex)</Typography>
			<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
				<TextField
					size="small"
					label="Yeni Düğüm"
					value={vertexName}
					onChange={(e) => { setVertexName(e.target.value); if (vertexError) {/* reset upstream */} }}
					onKeyDown={(e) => { if (e.key === 'Enter') addVertex(); }}
				/>
				<Button className="tm-modern-btn tm-modern-primary" startIcon={<AddIcon />} onClick={addVertex}>Ekle</Button>
			</Box>
			<FlashMessage severity="error" message={vertexError} sx={{ mb: 2 }} />
			<VertexList
				vertices={vertices}
				removeVertex={removeVertex}
				vertexListRef={vertexListRef}
			/>
		</Paper>
	);
};

export default VerticesPanel;
