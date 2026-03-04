import React, { useMemo } from 'react';
import { Paper, Typography, Box, TextField, Button, Autocomplete, Checkbox } from '@mui/material';
import MovingIcon from '@mui/icons-material/Moving';
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

	// Pre-build options for Autocomplete to ensure stability
	const vertexOptions = useMemo(() => vertices || [], [vertices]);

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
				<MovingIcon color="primary" fontSize="small" />
				<Typography variant="subtitle1" fontWeight="700">Edges</Typography>
			</Box>

			<Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 2 }}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
							<Typography variant="caption" fontWeight="600" color="text.secondary">Source Node</Typography>
							<Autocomplete
								size="small"
								options={vertexOptions}
								value={edgeFrom}
								onChange={(e, val) => setEdgeFrom(val || '')}
								clearIcon={null}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder="Select node"
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
									/>
								)}
							/>
						</Box>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
							<Typography variant="caption" fontWeight="600" color="text.secondary">Target Node</Typography>
							<Autocomplete
								multiple
								size="small"
								options={vertexOptions}
								disableCloseOnSelect
								value={Array.isArray(edgeTo) ? edgeTo : []}
								onChange={(e, val) => setEdgeTo(val)}
								getOptionLabel={(option) => String(option)}
								isOptionEqualToValue={(option, value) => option === value}
								renderOption={(props, option, { selected }) => (
									<li {...props} key={option}>
										<Checkbox style={{ marginRight: 8 }} checked={selected} />
										{option}
									</li>
								)}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder="Select nodes"
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
									/>
								)}
							/>
						</Box>
					</Box>

					<Box sx={{ display: 'grid', gridTemplateColumns: weighted ? '1fr auto' : 'auto', gap: 2, alignItems: 'end' }}>
						{weighted && (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
								<Typography variant="caption" fontWeight="600" color="text.secondary">Weight (Required)</Typography>
								<TextField
									size="small"
									type="number"
									placeholder="1.0"
									value={edgeWeight}
									onChange={(e) => setEdgeWeight(e.target.value)}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
								/>
							</Box>
						)}
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
							<Typography variant="caption" fontWeight="600" color="text.secondary">Color</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', overflow: 'hidden' }}>
								<input
									type="color"
									value={edgeColor || '#1985d2'}
									onChange={(e) => setEdgeColor(e.target.value)}
									style={{ width: '200%', height: '200%', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent', alignSelf: 'center', justifySelf: 'center' }}
									title="Edge Color"
								/>
							</Box>
						</Box>
					</Box>

					<Button
						fullWidth
						sx={{
							bgcolor: 'primary.50',
							color: 'primary.main',
							'&:hover': { bgcolor: 'primary.100' },
							borderRadius: 2,
							fontWeight: 'bold',
							textTransform: 'none',
							border: '1px solid',
							borderColor: 'primary.200',
							py: 1.25
						}}
						onClick={addEdge}
					>
						Connect Nodes
					</Button>
				</Box>

				<Box sx={{ mt: 1 }}>
					<Typography variant="body2" fontWeight="700" sx={{ mb: 2 }}>Connection Preview</Typography>
					<Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 3, p: 1, minHeight: 120 }}>
						<EdgeList
							edges={edges}
							edgePage={edgePage}
							setEdgePage={setEdgePage}
							edgesPerPage={edgesPerPage}
							openWeightEditor={openWeightEditor}
							toggleEdgeDelete={toggleEdgeDelete}
							deleteEdge={deleteEdge}
						/>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default EdgesPanel;
