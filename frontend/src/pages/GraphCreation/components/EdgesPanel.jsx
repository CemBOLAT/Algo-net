import React from 'react';
import { Paper, Typography, Box, Tooltip, IconButton, Collapse, FormControl, TextField, Button, Autocomplete, Checkbox } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EdgeList from './EdgeList';
import { useI18n } from '../../../context/I18nContext';

const EdgesPanel = ({
	vertices,
	edges, edgePage, setEdgePage, edgesPerPage,
	weighted, edgeFormOpen, setEdgeFormOpen,
	edgeFrom, setEdgeFrom, edgeTo, setEdgeTo, edgeWeight, setEdgeWeight,
	edgeColor, setEdgeColor,
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
					<Autocomplete
						size="small"
						options={vertices}
						value={edgeFrom}
						onChange={(e, val) => setEdgeFrom(val || '')}
						sx={{ minWidth: 140 }}
						renderInput={(params) => <TextField {...params} label={t('from_label')} />}
					/>

					<Autocomplete
						multiple
						size="small"
						options={vertices}
						disableCloseOnSelect
						value={Array.isArray(edgeTo) ? edgeTo : []}
						onChange={(e, val) => setEdgeTo(val)}
						getOptionLabel={(option) => option}
						sx={{ minWidth: 200, maxWidth: 350 }}
						renderOption={(props, option, { selected }) => {
							const { key, ...otherProps } = props;
							return (
								<li key={key} {...otherProps}>
									<Checkbox style={{ marginRight: 8 }} checked={selected} />
									{option}
								</li>
							);
						}}
						renderInput={(params) => (
							<TextField {...params} label={t('to_label')} placeholder="Add target..." />
						)}
					/>

					{weighted ? (
						<TextField size="small" label={t('edge_weight_label')} type="number" value={edgeWeight} onChange={(e) => setEdgeWeight(e.target.value)} />
					) : null}
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<input
							type="color"
							value={edgeColor || '#1985d2'}
							onChange={(e) => setEdgeColor(e.target.value)}
							style={{ width: '32px', height: '32px', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}
							title="Edge Color"
						/>
					</Box>
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
