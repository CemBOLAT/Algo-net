import React, { useState } from 'react';
import { Paper, Typography, Box, TextField, Button, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import FlashMessage from '../../../components/FlashMessage';
import { useI18n } from '../../../context/I18nContext';
import VertexList from './VertexList';

const VerticesPanel = ({
	vertexName, setVertexName, vertexError,
	addVertex, addBulkVertices, vertices, removeVertex, vertexListRef
}) => {
	const { t } = useI18n();
	const [bulkCount, setBulkCount] = useState('');

	return (
		<Paper className="tm-glass" sx={{ flex: 1, p: 2 }} elevation={2}>
			<Typography variant="h6" sx={{ mb: 1 }}>{t('vertices_title')}</Typography>
			<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
				<TextField
					size="small"
					label={t('new_vertex_label')}
					value={vertexName}
					onChange={(e) => { setVertexName(e.target.value); if (vertexError) {/* reset upstream */ } }}
					onKeyDown={(e) => { if (e.key === 'Enter') addVertex(); }}
				/>
				<Button className="tm-modern-btn tm-modern-primary" startIcon={<AddIcon />} onClick={addVertex}>{t('add_label')}</Button>
			</Box>

			{/* Bulk Add Section */}
			<Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>{t('bulk_add_subtitle', 'Bulk Add Vertices (e.g., 10)')}</Typography>
			<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
				<TextField
					size="small"
					label={t('bulk_count_label', 'Count')}
					type="number"
					value={bulkCount}
					inputProps={{ min: 1, max: 100 }}
					onChange={(e) => setBulkCount(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') { addBulkVertices(bulkCount); setBulkCount(''); } }}
					sx={{ width: '100px' }}
				/>
				<Button
					className="tm-modern-btn"
					sx={{ border: '1px solid rgba(16, 185, 129, 0.3)', color: 'success.main', fontWeight: 'bold' }}
					startIcon={<LibraryAddIcon />}
					onClick={() => { addBulkVertices(bulkCount); setBulkCount(''); }}
				>
					{t('bulk_add_btn', 'Create')}
				</Button>
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
