import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../../utils/auth';
import TopBar from '../../components/TopBar';
import FlashMessage from '../../components/FlashMessage';
import Typography from '@mui/material/Typography';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

import { Box, Button, Container, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { buildBST, layoutTree, collectEdges, insertBST, resetNodeIds } from './utils/buildBST';
import { buildAVL } from './utils/buildAVL';
import inorderSteps from './traversals/inorder';
import preorderSteps from './traversals/preorder';
import postorderSteps from './traversals/postorder';
import levelOrderSteps from './traversals/levelorder';
import { generateAVLInsertionSteps, generateAVLDeletionSteps } from './utils/avlSteps';
import { generateRBInsertionSteps, buildRBTree } from './utils/rbSteps';
import { useI18n } from '../../context/I18nContext';
import { getAlgoTranslator } from '../../i18n/algoI18n';

export default function TreeAlgorithms() {
	const navigate = useNavigate();
	const [values, setValues] = useState([]); // numbers inserted in order
	const [input, setInput] = useState('');
	const [mode, setMode] = useState('traversal'); // 'insert' | 'traversal'
	const [insertAlgo, setInsertAlgo] = useState('avl'); // for future: only AVL for now
	const [traversal, setTraversal] = useState('inorder');
	const [root, setRoot] = useState(null);
	const [steps, setSteps] = useState([]);
	const [stepIndex, setStepIndex] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [fastPlaying, setFastPlaying] = useState(false);
	const [manualOpen, setManualOpen] = useState(false);
	const [queue, setQueue] = useState([]); // Operation queue for sequential animations

	const timerRef = useRef(null);
	const { t, language } = useI18n();
	const ta = useMemo(() => getAlgoTranslator(language), [language]);

	// Rebuild tree when values or mode change
	useEffect(() => {
		// Only reset if we are switching MODES or clears.
		// If we just finished an animation (values changed), we assume state is consistent.
		let newRoot = null;
		if (mode === 'insert' && insertAlgo === 'avl') {
			newRoot = buildAVL(values);
		} else if (mode === 'insert' && insertAlgo === 'rb') {
			newRoot = buildRBTree(values);
		} else {
			newRoot = buildBST(values);
		}
		setRoot(newRoot);
		// Only clear steps if we are not in middle of animation logic?
		// But if 'playing' was true, it means we might have just finished?
		// Let's rely on explicit steps generation.
		if (!playing && !fastPlaying) {
			setSteps([]);
			setStepIndex(0);
		}
	}, [values, mode, insertAlgo]); // Rebuild on values, mode, or algo change

	// Check if current step has a specific root snapshot
	const currentStepRoot = (steps.length > 0 && steps[stepIndex]?.root) ? steps[stepIndex].root : root;

	const positions = useMemo(() => (currentStepRoot ? layoutTree(currentStepRoot) : new Map()), [currentStepRoot]);
	const edges = useMemo(() => (currentStepRoot ? collectEdges(currentStepRoot) : []), [currentStepRoot]);
	const idToNode = useMemo(() => {
		const map = new Map();
		const walk = (n) => { if (!n) return; map.set(n.id, n); walk(n.left); walk(n.right); };
		walk(currentStepRoot);
		return map;
	}, [currentStepRoot]);

	const generateSteps = () => {
		if (!root) return [];
		if (traversal === 'inorder') return inorderSteps(root, ta);
		if (traversal === 'preorder') return preorderSteps(root, ta);
		if (traversal === 'postorder') return postorderSteps(root, ta);
		return levelOrderSteps(root, ta);
	};
	const ensureSteps = () => {
		if (steps.length === 0 && root && mode === 'traversal') {
			const s = generateSteps();
			setSteps(s);
			setStepIndex(0);
		}
	};

	const runTraversal = () => {
		if (!root) return;
		const s = generateSteps();
		setSteps(s);
		setStepIndex(0);
		setPlaying(false);
		setFastPlaying(false);
	};

	// Normal play: 700ms
	// Playback effect
	useEffect(() => {
		if (!playing) return;
		if (steps.length === 0) { setPlaying(false); return; }

		const id = setInterval(() => {
			setStepIndex((i) => {
				if (i >= steps.length - 1) {
					setPlaying(false);
					// If we finished an AVL insertion/deletion animation, we should commit the value
					// BUT we already have the state updated via 'currentStepRoot'.
					// However, we need to update 'values' state so that the text list updates.
					// This is tricky because updating 'values' triggers rebuild.
					// We can check if the LAST step matches expectations or just leverage the fact that
					// once animation is done, we want the 'static' state to match.

					return i;
				}
				return i + 1;
			});
		}, 1000); // 1s for AVL to see rotations clearly
		return () => clearInterval(id);
	}, [playing, steps.length]);

	useEffect(() => {
		if (!fastPlaying) return;
		if (steps.length === 0) { setFastPlaying(false); return; }
		const id = setInterval(() => {
			setStepIndex((i) => {
				if (i >= steps.length - 1) {
					setFastPlaying(false);
					return i;
				}
				return i + 1;
			});
		}, 100);
		return () => clearInterval(id);
	}, [fastPlaying, steps.length]);

	// When animation finishes in Insert mode, sync values
	useEffect(() => {
		if (mode === 'insert' && steps.length > 0 && stepIndex === steps.length - 1 && !playing && !fastPlaying) {
			// Determine if we need to update 'values'.
			// We can store a 'pendingValue' state or similar.
			// OR: We update 'values' immediately but prevent rebuild?
			// Simplest: We used a 'pending' approach implicitly.
			// If we just added an animation for X, we should make sure X is in 'values'.
			// But 'values' is the source of truth.
		}
	}, [stepIndex, steps.length, playing, fastPlaying, mode]);

	const current = steps[stepIndex] || null;

	// BFS level colors and level map (used only when traversal === 'levelorder')
	const LEVEL_COLORS = ['#8fcefcff', '#f2719cff', '#69f575ff', '#fded5cff', '#8d53e4ff', '#e147f9ff', '#49def1ff', '#98e73eff'];
	const levelById = useMemo(() => {
		if (!currentStepRoot) return new Map(); // Use currentStepRoot
		const map = new Map();
		const q = [{ node: currentStepRoot, level: 0 }];
		map.set(currentStepRoot.id, 0);
		while (q.length) {
			const { node, level } = q.shift();
			if (node.left) { map.set(node.left.id, level + 1); q.push({ node: node.left, level: level + 1 }); }
			if (node.right) { map.set(node.right.id, level + 1); q.push({ node: node.right, level: level + 1 }); }
		}
		return map;
	}, [currentStepRoot]);
	const maxLevel = useMemo(() => (levelById.size ? Math.max(...levelById.values()) : 0), [levelById]);

	const addValue = () => {
		const num = Number(input.trim());
		if (Number.isNaN(num)) return;

		if (mode === 'insert' && (insertAlgo === 'avl' || insertAlgo === 'rb')) {
			setQueue((q) => [...q, num]);
		} else {
			setValues((v) => [...v, num]);
		}
		setInput('');
	};

	// Queue Processing Effect
	useEffect(() => {
		if (!playing && !fastPlaying && queue.length > 0 && !pendingOpRef.current) {
			const num = queue[0];

			// Pop from queue
			setQueue(q => q.slice(1));

			// Generate steps based on CURRENT root
			let s = [];
			if (insertAlgo === 'avl') {
				s = generateAVLInsertionSteps(root, num, ta);
			} else {
				s = generateRBInsertionSteps(root, num, ta);
			}

			setSteps(s);
			setStepIndex(0);
			setPlaying(true);
			pendingOpRef.current = { type: 'add', val: num };
		}
	}, [queue, playing, fastPlaying, insertAlgo, root, ta]); // Depend on root to ensure we use latest tree state

	// Effect to auto-commit values after animation
	useEffect(() => {
		if (!playing && !fastPlaying && steps.length > 0 && stepIndex === steps.length - 1 && mode === 'insert') {
			// Animation finished.
			// Check what operation it was.
			// We can infer from the last step's root value count vs 'values' count?
			// Or just store a ref.
		}
	}, [playing, fastPlaying, stepIndex, steps.length]);

	// Better: modify addValue to use a timeout or callback? No, React state.
	// Let's use a ref for 'numberToAdd'.
	const pendingOpRef = useRef(null); // { type: 'add'|'remove', val: number, index?: number }

	useEffect(() => {
		if (mode === 'insert' && steps.length > 0 && stepIndex === steps.length - 1 && !playing && !fastPlaying && pendingOpRef.current) {
			const op = pendingOpRef.current;
			pendingOpRef.current = null;
			if (op.type === 'add') {
				setValues(v => [...v, op.val]);
			} else if (op.type === 'remove') {
				setValues(v => v.filter((_, i) => i !== op.index));
			}
			// Clear steps? No, let them stay until next action or reset. 
			// BUT updating values will trigger useEffect -> clear steps.
			// That's actually what we want! The "final" static tree will replace the animation frame.
		}
	}, [stepIndex, playing, fastPlaying, mode, steps.length]);

	const clearValues = () => {
		setValues([]);
		setInput('');
		setSteps([]);
	};

	const removeAtIndex = (idx) => {
		const valToRemove = values[idx];
		if (mode === 'insert' && insertAlgo === 'avl') {
			const s = generateAVLDeletionSteps(root, valToRemove, ta);
			setSteps(s);
			setStepIndex(0);
			setPlaying(true);
			pendingOpRef.current = { type: 'remove', index: idx, val: valToRemove };
		} else {
			setValues((v) => v.filter((_, i) => i !== idx));
		}
	};

	const resetPlayback = () => {
		setPlaying(false);
		setFastPlaying(false);
		setStepIndex(0);
	};

	const prevStep = () => {
		ensureSteps();
		setStepIndex((i) => Math.max(0, i - 1));
	};
	const nextStep = () => {
		ensureSteps();
		setStepIndex((i) => Math.min(steps.length - 1, i + 1));
	};
	const playNormal = () => {
		ensureSteps();
		setFastPlaying(false);
		setPlaying(true);
	};
	const playFast = () => {
		ensureSteps();
		setPlaying(false);
		setFastPlaying(true);
	};

	const handleCanvas = () => {
		navigate('/graph');
	};

	const handleArray = () => {
		navigate('/array-algorithms');
	};

	const handleLogout = () => {
		clearTokens();
		navigate('/login');
	};

	// SVG sizes
	const width = Math.max(600, positions.size * 80 + 100);
	const height = Math.max(220, (Math.max(0, ...Array.from(positions.values()).map(p => p.y)) + 1) + 120);

	const visitedSet = new Set(current?.visitOrder || []);
	const pathSet = new Set(current?.pathIds || []);
	const visitedValues = (current?.visitOrder || []).map((id) => idToNode.get(id)?.value).filter((v) => v !== undefined);

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<TopBar
				title={t('array_algorithms')}
				actions={[
					{ label: t('go_to_canvas'), onClick: handleCanvas, variant: 'contained', color: 'primary', ariaLabel: t('go_to_canvas') },
					{ label: t('profile'), onClick: () => navigate('/profile'), variant: 'contained', color: 'primary', ariaLabel: t('profile') },
					{ label: t('my_graphs'), onClick: () => navigate('/graph-list'), variant: 'contained', color: 'primary', ariaLabel: t('graph-list') },
					{ label: t('create_graph'), onClick: () => navigate('/graph-creation'), variant: 'contained', color: 'primary', ariaLabel: t('create_graph') },
					{ label: t('array_algorithms'), onClick: handleArray, variant: 'contained', color: 'primary', ariaLabel: t('array_algorithms') },
					{ label: t('unhcr_info'), onClick: () => navigate('/unhcr'), variant: 'contained', color: 'primary', ariaLabel: t('unhcr_info') },
					{ label: t('logout'), onClick: handleLogout, variant: 'contained', color: 'error', ariaLabel: t('logout') }
				]}
			/>

			<Container maxWidth="lg" sx={{ py: 3 }}>
				<Paper sx={{ p: 2, mb: 2 }}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
						<TextField
							label={ta('add_number_label')}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									addValue();
								}
							}}
							sx={{ width: 220 }}
						/>
						<Button variant="contained" onClick={addValue}>{ta('add')}</Button>
						<Button variant="contained" onClick={clearValues}>{ta('clear')}</Button>
						<FormControl sx={{ minWidth: 160 }}>
							<InputLabel>{ta('operation')}</InputLabel>
							<Select label={ta('operation')} value={mode} onChange={(e) => setMode(e.target.value)}>
								<MenuItem value="insert">{ta('insert_delete')}</MenuItem>
								<MenuItem value="traversal">{ta('traversal_mode')}</MenuItem>
							</Select>
						</FormControl>

						{mode === 'insert' && (
							<Stack direction="row" spacing={1} alignItems="center">
								<FormControl sx={{ minWidth: 180 }}>
									<InputLabel>{ta('insertion_algorithm')}</InputLabel>
									<Select label={ta('insertion_algorithm')} value={insertAlgo} onChange={(e) => setInsertAlgo(e.target.value)}>
										<MenuItem value="avl">{ta('avl_tree')}</MenuItem>
										<MenuItem value="rb">Red-Black Tree</MenuItem>
									</Select>
								</FormControl>
								<Tooltip title={insertAlgo === 'avl' ? ta('avl_rules_title') : ta('rb_rules_title')}>
									<IconButton
										size="small"
										onClick={() => setManualOpen(true)}
										aria-label="Info"
									>
										<InfoOutlined />
									</IconButton>
								</Tooltip>
							</Stack>
						)}

						{mode === 'traversal' && (
							<>
								<FormControl sx={{ minWidth: 180 }}>
									<InputLabel>{ta('traversal_label')}</InputLabel>
									<Select label={ta('traversal_label')} value={traversal} onChange={(e) => setTraversal(e.target.value)}>
										<MenuItem value="inorder">Inorder (L, N, R)</MenuItem>
										<MenuItem value="preorder">Preorder (N, L, R)</MenuItem>
										<MenuItem value="postorder">Postorder (L, R, N)</MenuItem>
										<MenuItem value="levelorder">Level Order (BFS)</MenuItem>
									</Select>
								</FormControl>
								<Button variant="outlined" onClick={runTraversal} disabled={!root}>{ta('run')}</Button>
							</>
						)}
					</Stack>
				</Paper>


				<Paper sx={{ p: 2, mb: 2 }}>
					<Typography variant="subtitle2" gutterBottom>{ta('input_order')}</Typography>
					<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
						{values.map((v, idx) => (
							<Box key={idx} sx={{ display: 'grid', alignItems: 'center', gap: 0.5 }}>
								<Box sx={{
									px: 1.2,
									py: 0.5,
									borderRadius: 1,
									bgcolor: 'background.paper',
									color: 'text.primary',
									border: '1px solid',
									borderColor: 'divider'
								}}>{v}</Box>
								{mode === 'insert' && (
									<Tooltip title="Sil">
										<IconButton size="small" color="error" onClick={() => removeAtIndex(idx)} aria-label={`Sil ${v}`}>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								)}
							</Box>
						))}
					</Box>
				</Paper>


				<Paper sx={{ p: 2, mb: 4 }}>
					{mode === 'traversal' && (
						<Paper sx={{ p: 2, mb: 2 }}>
							<Typography variant="subtitle2" gutterBottom>{ta('traversal_order')}</Typography>
							<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
								{visitedValues.length === 0 && (
									<Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>{ta('no_visit_yet')}</Box>
								)}
								{visitedValues.map((val, idx) => (
									<Box key={`${val}-${idx}`} sx={{
										px: 1.2,
										py: 0.5,
										borderRadius: 1,
										bgcolor: 'background.paper',
										color: 'text.primary',
										border: '1px solid',
										borderColor: 'divider',
										display: 'flex',
										alignItems: 'center',
										gap: 1
									}}>
										<Box sx={{ fontSize: 12, color: 'text.secondary' }}>{idx + 1}.</Box>
										{traversal === 'levelorder' && (
											<Box sx={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: LEVEL_COLORS[(levelById.get((current?.visitOrder || [])[idx]) ?? 0) % LEVEL_COLORS.length], border: '1px solid #ccc' }} />
										)}
										<Box>{val}</Box>
									</Box>
								))}
							</Box>
						</Paper>
					)}
					<Box sx={{ width: '100%', overflowX: 'auto' }}>
						<svg width={width} height={height}>
							{/* Edges */}
							{edges.map(([u, v]) => {
								const p1 = positions.get(u);
								const p2 = positions.get(v);
								if (!p1 || !p2) return null;
								const active = pathSet.has(u) && pathSet.has(v);
								return (
									<line key={`${u}-${v}`} x1={p1.x + 30} y1={p1.y + 30} x2={p2.x + 30} y2={p2.y + 30}
										stroke={active ? '#ff9800' : '#bbb'} strokeWidth={active ? 3 : 2} />
								);
							})}

							{/* Nodes */}
							{Array.from(positions.entries()).map(([id, p]) => {
								const n = idToNode.get(id);
								const isPath = pathSet.has(id);
								const isVisited = visitedSet.has(id);
								const isFocus = current?.nodeId === id;
								const isRed = n?.color === 'red';

								// Per-level coloring for BFS, but only after node is visited.
								let fill;
								let stroke;
								let textColor = '#000'; // Default black text

								if (insertAlgo === 'rb') {
									if (isRed) {
										fill = '#ffcdd2'; // Light Red
										stroke = '#b71c1c'; // Dark Red Border
										textColor = '#b71c1c';
									} else {
										fill = '#455a64'; // Dark Blue-Grey (Black Node)
										stroke = '#000';
										textColor = '#fff'; // White text
									}
									if (isFocus) {
										stroke = '#ffeb3b'; // Yellow Highlight
									}
								} else if (traversal === 'levelorder') {
									const lv = levelById.get(id) ?? 0;
									if (isFocus) {
										fill = '#ffb74d';
										stroke = '#ef6c00';
									} else if (isVisited) {
										fill = LEVEL_COLORS[lv % LEVEL_COLORS.length];
										stroke = '#666';
									} else {
										fill = 'white';
										stroke = '#888';
									}
								} else {
									fill = isFocus ? '#ffb74d' : isVisited ? '#c8e6c9' : isPath ? '#fff3e0' : 'white';
									stroke = isFocus ? '#ef6c00' : isVisited ? '#2e7d32' : isPath ? '#ff9800' : '#888';
								}
								return (
									<g key={id}>
										<circle cx={p.x + 30} cy={p.y + 30} r={24} fill={fill} stroke={stroke} strokeWidth={isFocus ? 4 : 2} />
										<text x={p.x + 30} y={p.y + 34} textAnchor="middle" fontSize="14" fontFamily="monospace" fill={textColor} style={{ fontWeight: 600 }}>{n?.value}</text>
									</g>
								);
							})}
						</svg>
					</Box>
					{mode === 'traversal' && traversal === 'levelorder' && (
						<Paper sx={{ p: 2, mb: 2 }}>
							<Typography variant="subtitle2" gutterBottom>{ta('queue')}</Typography>
							<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
								{(current?.queueIds || []).length === 0 && (
									<Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>{ta('queue_empty')}</Box>
								)}
								{(current?.queueIds || []).map((id, idx) => (
									<Box key={`${id}-${idx}`} sx={{
										px: 1.2,
										py: 0.5,
										borderRadius: 1,
										bgcolor: 'background.paper',
										color: 'text.primary',
										border: '1px solid',
										borderColor: 'divider'
									}}>
										{idToNode.get(id)?.value}
									</Box>
								))}
							</Box>
						</Paper>
					)}
					{mode === 'traversal' && (
						<>
							<Typography variant="subtitle2" gutterBottom>{ta('step_label')}: {steps.length ? stepIndex + 1 : 0} / {steps.length}</Typography>
							<Typography variant="body2" sx={{ minHeight: 40, p: 1, my: 1, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace', color: 'text.secondary', border: '1px solid #e0e0e0' }}>
								{current?.msg || '—'}
							</Typography>
							<Box sx={{ p: 2, mb: 2 }}>
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" justifyContent="flex-start">
									<Button variant="outlined" onClick={prevStep} disabled={!root || stepIndex <= 0}>{ta('back')}</Button>
									<Button variant="contained" color="secondary" onClick={playFast} disabled={!root}>{ta('fast_finish')}</Button>
									{!playing ? (
										<Button variant="contained" onClick={playNormal} disabled={!root}>{ta('play')}</Button>
									) : (
										<Button variant="contained" onClick={() => setPlaying(false)} disabled={!root}>{ta('pause')}</Button>
									)}
									<Button color="error" onClick={resetPlayback} disabled={steps.length === 0}>{ta('reset')}</Button>
									<Button variant="outlined" onClick={nextStep} disabled={!root || stepIndex >= steps.length - 1}>{ta('next')}</Button>
								</Stack>
							</Box>
						</>
					)}
					{/* Show Steps in Insertion Mode too! */}
					{mode === 'insert' && steps.length > 0 && (
						<Paper sx={{ p: 2, mt: 2, bgcolor: '#fafafa' }}>
							<Typography variant="subtitle2" gutterBottom>{ta('step_label')}: {stepIndex + 1} / {steps.length}</Typography>
							<Typography variant="body2" sx={{ minHeight: 40, p: 1, my: 1, bgcolor: '#ffffff', borderRadius: 1, fontFamily: 'monospace', color: 'text.secondary', boxShadow: 1, border: '1px solid #e0e0e0' }}>
								{current?.msg || '—'}
							</Typography>
							<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
								<Button size="small" variant="outlined" onClick={prevStep} disabled={stepIndex <= 0}>{ta('back')}</Button>
								{!playing ? (
									<Button size="small" variant="contained" onClick={() => setPlaying(true)}>{ta('play')}</Button>
								) : (
									<Button size="small" variant="contained" onClick={() => setPlaying(false)}>{ta('pause')}</Button>
								)}
								<Button size="small" variant="outlined" onClick={nextStep} disabled={stepIndex >= steps.length - 1}>{ta('next')}</Button>
							</Stack>
						</Paper>
					)}
				</Paper>

				{/* Insert/Delete Manual Modal */}
				<Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth="md" fullWidth>
					<DialogTitle>{insertAlgo === 'avl' ? ta('avl_rules_title') : ta('rb_rules_title')}</DialogTitle>
					<DialogContent dividers>
						{insertAlgo === 'avl' ? (
							<>
								<Typography variant="subtitle1" sx={{ mb: 1.5 }}>{ta('avl_general_title')}</Typography>
								<List dense>
									<ListItem><ListItemText primary={ta('avl_general_1')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_general_2')} /></ListItem>
								</List>
								<Divider sx={{ my: 1.5 }} />

								<Typography variant="subtitle1" sx={{ mb: 1 }}>{ta('avl_insert_title')}</Typography>
								<List dense>
									<ListItem><ListItemText primary={ta('avl_insert_1')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_insert_2')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_insert_ll')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_insert_rr')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_insert_lr')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_insert_rl')} /></ListItem>
								</List>

								<Divider sx={{ my: 1.5 }} />
								<Typography variant="subtitle1" sx={{ mb: 1 }}>{ta('avl_delete_title')}</Typography>
								<List dense>
									<ListItem><ListItemText primary={ta('avl_delete_1')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_delete_2')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_delete_ll')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_delete_lr')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_delete_rr')} /></ListItem>
									<ListItem><ListItemText primary={ta('avl_delete_rl')} /></ListItem>
								</List>
							</>
						) : (
							<>
								<Typography variant="subtitle1" sx={{ mb: 1.5 }}>{ta('rb_general_title')}</Typography>
								<List dense>
									<ListItem><ListItemText primary={ta('rb_general_1')} /></ListItem>
									<ListItem><ListItemText primary={ta('rb_general_2')} /></ListItem>
									<ListItem><ListItemText primary={ta('rb_general_3')} /></ListItem>
									<ListItem><ListItemText primary={ta('rb_general_4')} /></ListItem>
								</List>
								<Divider sx={{ my: 1.5 }} />

								<Typography variant="subtitle1" sx={{ mb: 1 }}>{ta('rb_insert_title')}</Typography>
								<List dense>
									<ListItem><ListItemText primary={ta('rb_insert_1')} /></ListItem>
									<ListItem><ListItemText primary={ta('rb_insert_2')} /></ListItem>
									<ListItem>
										<ListItemText
											primary={ta('rb_case_1_title')}
											secondary={ta('rb_case_1_desc')}
										/>
									</ListItem>
									<ListItem>
										<ListItemText
											primary={ta('rb_case_2_title')}
											secondary={ta('rb_case_2_desc')}
										/>
									</ListItem>
									<ListItem>
										<ListItemText
											primary={ta('rb_case_3_title')}
											secondary={ta('rb_case_3_desc')}
										/>
									</ListItem>
								</List>
								<Divider sx={{ my: 1.5 }} />
								<Typography variant="subtitle1" sx={{ mb: 1 }}>{ta('rb_delete_title')}</Typography>
								<Typography variant="body2" sx={{ px: 2 }}>{ta('rb_delete_desc')}</Typography>
							</>
						)}

						<Divider sx={{ my: 1.5 }} />
						<Typography variant="body2" color="text.secondary">
							{ta('avl_modal_tip')}
						</Typography>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setManualOpen(false)}>{ta('avl_modal_close')}</Button>
					</DialogActions>
				</Dialog>
			</Container>
		</Box>
	);
}

