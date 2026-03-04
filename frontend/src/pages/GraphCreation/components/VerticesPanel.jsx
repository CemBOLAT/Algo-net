import React, { useState } from 'react';
import { Paper, Typography, Box, TextField, Button, Divider } from '@mui/material';
import AdjustIcon from '@mui/icons-material/Adjust';
import AddIcon from '@mui/icons-material/Add';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
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
		<Paper elevation={0} sx={{
			display: 'flex',
			flexDirection: 'column',
			borderRadius: 3,
			border: '1px solid',
			borderColor: 'divider',
			bgcolor: 'background.paper',
			overflow: 'hidden'
		}}>
			<Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
				<AdjustIcon color="primary" fontSize="small" />
				<Typography variant="subtitle1" fontWeight="700">Vertices</Typography>
			</Box>

			<Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
				{/* Single Add */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
					<Typography variant="body2" fontWeight="500" color="text.secondary">Add Individual Vertex</Typography>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<TextField
							size="small"
							placeholder="Label (e.g. Node A)"
							value={vertexName}
							onChange={(e) => { setVertexName(e.target.value); if (vertexError) {/* reset upstream */ } }}
							onKeyDown={(e) => { if (e.key === 'Enter') addVertex(); }}
							fullWidth
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
						/>
						<Button variant="contained" color="primary" onClick={addVertex} sx={{ minWidth: 'auto', px: 3, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}>
							<AddIcon fontSize="small" sx={{ mr: 0.5 }} /> Add
						</Button>
					</Box>
				</Box>

				{/* Bulk Add Section */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
					<Box>
						<Typography variant="body2" fontWeight="700">Bulk Add Vertices</Typography>
						<Typography variant="caption" color="text.secondary">Instantly create multiple nodes</Typography>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
						<TextField
							size="small"
							type="number"
							value={bulkCount}
							placeholder="10"
							inputProps={{ min: 1, max: 100 }}
							onChange={(e) => setBulkCount(e.target.value)}
							onKeyDown={(e) => { if (e.key === 'Enter') { addBulkVertices(bulkCount); setBulkCount(''); } }}
							sx={{ width: '100px', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
						/>
						<Button
							variant="contained"
							sx={{ flex: 1, bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'text.secondary' }, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
							onClick={() => { addBulkVertices(bulkCount); setBulkCount(''); }}
						>
							Create Batch
						</Button>
					</Box>
				</Box>

				<FlashMessage severity="error" message={vertexError} sx={{ mb: 0 }} />

				{/* List Placeholder OR VertexList */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Nodes</Typography>
						<Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{vertices.length} Nodes Total</Typography>
					</Box>

					{vertices.length === 0 ? (
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
							<Inventory2OutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
							<Typography variant="body2" color="text.secondary">No nodes created yet</Typography>
						</Box>
					) : (
						<Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 3, p: 1 }}>
							<VertexList
								vertices={vertices}
								removeVertex={removeVertex}
								vertexListRef={vertexListRef}
							/>
						</Box>
					)}
				</Box>
			</Box>
		</Paper>
	);
};

export default VerticesPanel;
