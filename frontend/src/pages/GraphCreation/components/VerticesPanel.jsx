import React from 'react';
import { Paper, Typography, Box, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlashMessage from '../../../components/FlashMessage';
import { useI18n } from '../../../context/I18nContext';
import VertexList from './VertexList';

const VerticesPanel = ({
	vertexName, setVertexName, vertexError,
	addVertex, vertices, removeVertex, vertexListRef
}) => {
	const { t } = useI18n();
	return (
		<Paper className="tm-glass" sx={{ flex: 1, p: 2 }} elevation={2}>
			<Typography variant="h6" sx={{ mb: 1 }}>{t('vertices_title')}</Typography>
			<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
				<TextField
					size="small"
					label={t('new_vertex_label')}
					value={vertexName}
					onChange={(e) => { setVertexName(e.target.value); if (vertexError) {/* reset upstream */} }}
					onKeyDown={(e) => { if (e.key === 'Enter') addVertex(); }}
				/>
				<Button className="tm-modern-btn tm-modern-primary" startIcon={<AddIcon />} onClick={addVertex}>{t('add_label')}</Button>
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
