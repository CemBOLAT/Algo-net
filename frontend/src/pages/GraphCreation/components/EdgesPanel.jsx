import React from 'react';
import { Paper, Typography, Box, Tooltip, IconButton, Collapse, FormControl, InputLabel, Select, MenuItem, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EdgeList from './EdgeList';
import { useI18n } from '../../../context/I18nContext';

const EdgesPanel = ({
	vertices,
	edges, edgePage, setEdgePage, edgesPerPage,
	weighted, edgeFormOpen, setEdgeFormOpen,
	edgeFrom, setEdgeFrom, edgeTo, setEdgeTo, edgeWeight, setEdgeWeight,
	addEdge, openWeightEditor, toggleEdgeDelete, deleteEdge
}) => {
	const { t } = useI18n();
	return (
		<Paper className="tm-glass" sx={{ flex: 1, p: 2 }} elevation={2}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
				<Typography variant="h6">{t('edges_title')}</Typography>
				<Box>
					<Tooltip title={edgeFormOpen ? 'Kapat' : 'Kenar Ekle'}>
						<IconButton
							onClick={() => setEdgeFormOpen((s) => !s)}
							sx={{ transform: edgeFormOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
						>
							<AddIcon />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			<Collapse in={edgeFormOpen}>
				<Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
					<FormControl size="small" sx={{ minWidth: 140 }}>
						<InputLabel>{t('from_label')}</InputLabel>
						<Select value={edgeFrom} label="From" onChange={(e) => setEdgeFrom(e.target.value)}>
							{vertices.map((v) => (
								<MenuItem key={`from-${v}`} value={v}>{v}</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl size="small" sx={{ minWidth: 140 }}>
						<InputLabel>{t('to_label')}</InputLabel>
						<Select value={edgeTo} label="To" onChange={(e) => setEdgeTo(e.target.value)}>
							{vertices.map((v) => (
								<MenuItem key={`to-${v}`} value={v}>{v}</MenuItem>
							))}
						</Select>
					</FormControl>

					{weighted ? (
						<TextField size="small" label={t('edge_weight_label')} type="number" value={edgeWeight} onChange={(e) => setEdgeWeight(e.target.value)} />
					) : null}
					<Button className="tm-modern-btn tm-modern-primary" onClick={addEdge} startIcon={<AddIcon />}>{t('add_label')}</Button>
				</Box>
			</Collapse>

			<EdgeList
				edges={edges}
				edgePage={edgePage}
				setEdgePage={setEdgePage}
				edgesPerPage={edgesPerPage}
				openWeightEditor={openWeightEditor}
				toggleEdgeDelete={toggleEdgeDelete}
				deleteEdge={deleteEdge}
			/>
		</Paper>
	);
};

export default EdgesPanel;
