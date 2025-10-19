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

	const timerRef = useRef(null);
	const { t, language } = useI18n();
	const ta = useMemo(() => getAlgoTranslator(language), [language]);

	// Rebuild tree when values or mode change
	useEffect(() => {
		let newRoot = null;
		if (mode === 'insert') {
			// Currently only AVL is supported
			newRoot = buildAVL(values);
		} else {
			newRoot = buildBST(values);
		}
		setRoot(newRoot);
		setSteps([]);
		setStepIndex(0);
		setPlaying(false);
		setFastPlaying(false);
	}, [values, mode]);

	const positions = useMemo(() => (root ? layoutTree(root) : new Map()), [root]);
	const edges = useMemo(() => (root ? collectEdges(root) : []), [root]);
	const idToNode = useMemo(() => {
		const map = new Map();
		const walk = (n) => { if (!n) return; map.set(n.id, n); walk(n.left); walk(n.right); };
		walk(root);
		return map;
	}, [root]);

	const generateSteps = () => {
		if (!root) return [];
		if (traversal === 'inorder') return inorderSteps(root, ta);
		if (traversal === 'preorder') return preorderSteps(root, ta);
		if (traversal === 'postorder') return postorderSteps(root, ta);
		return levelOrderSteps(root, ta);
	};
	const ensureSteps = () => {
		if (steps.length === 0 && root) {
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
	useEffect(() => {
		if (!playing) return;
		if (steps.length === 0) { setPlaying(false); return; }
		const id = setInterval(() => {
			setStepIndex((i) => {
				if (i >= Math.max(0, steps.length - 1)) { setPlaying(false); return i; }
				return Math.min(i + 1, steps.length - 1);
			});
		}, 700);
		return () => clearInterval(id);
	}, [playing, steps.length]);

	// Fast play: 70ms
	useEffect(() => {
		if (!fastPlaying) return;
		if (steps.length === 0) { setFastPlaying(false); return; }
		const id = setInterval(() => {
			setStepIndex((i) => {
				if (i >= Math.max(0, steps.length - 1)) { setFastPlaying(false); return i; }
				return Math.min(i + 1, steps.length - 1);
			});
		}, 70);
		return () => clearInterval(id);
	}, [fastPlaying, steps.length]);

	const current = steps[stepIndex] || null;

	// BFS level colors and level map (used only when traversal === 'levelorder')
	const LEVEL_COLORS = ['#8fcefcff', '#f2719cff', '#69f575ff', '#fded5cff', '#8d53e4ff', '#e147f9ff', '#49def1ff', '#98e73eff'];
	const levelById = useMemo(() => {
		if (!root) return new Map();
		const map = new Map();
		const q = [{ node: root, level: 0 }];
		map.set(root.id, 0);
		while (q.length) {
			const { node, level } = q.shift();
			if (node.left) { map.set(node.left.id, level + 1); q.push({ node: node.left, level: level + 1 }); }
			if (node.right) { map.set(node.right.id, level + 1); q.push({ node: node.right, level: level + 1 }); }
		}
		return map;
	}, [root]);
	const maxLevel = useMemo(() => (levelById.size ? Math.max(...levelById.values()) : 0), [levelById]);

	const addValue = () => {
		const num = Number(input.trim());
		if (Number.isNaN(num)) return;
		setValues((v) => [...v, num]);
		setInput('');
	};

	const clearValues = () => {
		setValues([]);
		setInput('');
	};

	const removeAtIndex = (idx) => {
		setValues((v) => v.filter((_, i) => i !== idx));
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
                title={t('tree_algorithms')}
                actions={[
                    { label: t('go_to_canvas'), onClick: handleCanvas, variant: 'contained', color: 'primary', ariaLabel: t('go_to_canvas') },
                    { label: t('array_algorithms'), onClick: handleArray, variant: 'contained', color: 'primary', ariaLabel: t('array_algorithms') },
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
							onKeyDown={(e) => { if (e.key === 'Enter') addValue(); }}
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
									</Select>
								</FormControl>
								<Tooltip title="AVL">
                                    <IconButton
                                        size="small"
                                        onClick={() => setManualOpen(true)}
                                        aria-label="AVL rehberi"
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
								// Per-level coloring for BFS, but only after node is visited.
								let fill;
								let stroke;
								if (traversal === 'levelorder') {
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
                                        <circle cx={p.x + 30} cy={p.y + 30} r={24} fill={fill} stroke={stroke} strokeWidth={2} />
                                        <text x={p.x + 30} y={p.y + 34} textAnchor="middle" fontSize="14" fontFamily="monospace">{n?.value}</text>
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
							<Box sx={{ p: 2, mb: 2 }}>
								<Typography variant="subtitle2" gutterBottom>{ta('step_label')}: {steps.length ? stepIndex + 1 : 0} / {steps.length}</Typography>
								<Typography variant="body2" sx={{ minHeight: 24 }}>{current?.msg || '—'}</Typography>
							</Box>
							<Box sx={{ p: 2, mb: 2 }}>
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" justifyContent="flex-start">
									<Button variant="outlined" onClick={prevStep} disabled={!root}>{ta('back')}</Button>
									<Button variant="contained" color="secondary" onClick={playFast} disabled={!root}>{ta('fast_finish')}</Button>
									<Button variant="contained" onClick={playNormal} disabled={!root}>{ta('play')}</Button>
									<Button color="error" onClick={resetPlayback} disabled={steps.length === 0}>{ta('reset')}</Button>
									<Button variant="outlined" onClick={nextStep} disabled={!root}>{ta('next')}</Button>
								</Stack>
							</Box>
						</>
					)}
                </Paper>

					{/* AVL Insert/Delete Manual Modal */}
					<Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth="md" fullWidth>
						<DialogTitle>AVL Ağaçlarında Ekleme ve Silme Kuralları</DialogTitle>
						<DialogContent dividers>
							<Typography variant="subtitle1" sx={{ mb: 1.5 }}>Genel</Typography>
							<List dense>
								<ListItem>
									<ListItemText
										primary="AVL, her düğüm için denge faktörünü (bf = yükseklik(sol) − yükseklik(sağ)) −1, 0, +1 aralığında tutar."
									/>
								</ListItem>
								<ListItem>
									<ListItemText primary="Ekleme ve silme sonrası, köke kadar yükseklikler güncellenir ve gerekirse rotasyon yapılır." />
								</ListItem>
							</List>
							<Divider sx={{ my: 1.5 }} />

							<Typography variant="subtitle1" sx={{ mb: 1 }}>Ekleme (Insert)</Typography>
							<List dense>
								<ListItem>
									<ListItemText primary="1) Önce BST kuralı ile yerleştir: küçük sola, büyük/eşit sağa." />
								</ListItem>
								<ListItem>
									<ListItemText primary="2) Geri dönerken yükseklikleri güncelle, |bf| > 1 olursa dengele." />
								</ListItem>
								<ListItem>
									<ListItemText
										primary="Vaka LL (sol-sol): Sol alt ağaçta sola ağır – Sağ Rotasyon (Right Rotate)."
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="Vaka RR (sağ-sağ): Sağ alt ağaçta sağa ağır – Sol Rotasyon (Left Rotate)."
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="Vaka LR (sol-sağ): Önce Sol Alt Ağaca Sol Rotasyon, sonra düğüme Sağ Rotasyon."
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="Vaka RL (sağ-sol): Önce Sağ Alt Ağaca Sağ Rotasyon, sonra düğüme Sol Rotasyon."
									/>
								</ListItem>
							</List>

							<Divider sx={{ my: 1.5 }} />
							<Typography variant="subtitle1" sx={{ mb: 1 }}>Silme (Delete)</Typography>
							<List dense>
								<ListItem>
									<ListItemText primary="1) BST silme uygula: (a) yaprak: direkt kaldır; (b) tek çocuk: çocukla değiştir; (c) iki çocuk: ardıl (inorder successor) ile değer değiştir, ardından ardılı sil." />
								</ListItem>
								<ListItem>
									<ListItemText primary="2) Geri dönerken yükseklikleri güncelle ve aşağıdaki vakalara göre dengele:" />
								</ListItem>
								<ListItem>
									<ListItemText primary="LL: bf > 1 ve bf(sol) ≥ 0 → Sağ Rotasyon" />
								</ListItem>
								<ListItem>
									<ListItemText primary="LR: bf > 1 ve bf(sol) < 0 → Sol Rotasyon (sol çocuğa), sonra Sağ Rotasyon" />
								</ListItem>
								<ListItem>
									<ListItemText primary="RR: bf < −1 ve bf(sağ) ≤ 0 → Sol Rotasyon" />
								</ListItem>
								<ListItem>
									<ListItemText primary="RL: bf < −1 ve bf(sağ) > 0 → Sağ Rotasyon (sağ çocuğa), sonra Sol Rotasyon" />
								</ListItem>
							</List>

							<Divider sx={{ my: 1.5 }} />
							<Typography variant="body2" color="text.secondary">
								İpucu: Yukarıdaki "Giriş sırası" alanındaki Sil düğmesiyle eleman çıkarıp sonucu gözlemleyebilirsiniz. Ekle/Sil sonrası ağaç otomatik dengelenir.
							</Typography>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setManualOpen(false)}>Kapat</Button>
						</DialogActions>
					</Dialog>
			</Container>
		</Box>
	);
}

