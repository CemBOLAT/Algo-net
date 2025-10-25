import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearTokens, getTokens, isTokenExpired, http } from '../../utils/auth';
import GraphCanvas from '../../components/GraphCanvas';
import Sidebar from '../../components/Sidebar';
import VertexSettings from '../../components/VertexSettings';
import EdgeSettings from '../../components/EdgeSettings';
import TopBar from '../../components/TopBar';
import FlashMessage from '../../components/FlashMessage';
import LegendPanel from '../../components/LegendPanel';
import { Box, Container, Grid, Paper } from '@mui/material';


const Graph = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [nodes, setNodes] = useState([]);
	const [edges, setEdges] = useState([]);
	const [graphName, setGraphName] = useState('Graph Name');
	const [selectedNode, setSelectedNode] = useState(null);
	const [selectedEdge, setSelectedEdge] = useState(null);
	const [mode, setMode] = useState(null); // 'add-edge'
		const [tempEdge, setTempEdge] = useState(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [graphId, setGraphId] = useState(null);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [hasLegend, setHasLegend] = useState(false);
	const [legendEntries, setLegendEntries] = useState([]);

	// Helper function to show error messages
	const showError = (message) => {
		setErrorMessage(message);
		setTimeout(() => {
			setErrorMessage('');
		}, 3000); // Show error for 3 seconds
	};

	// Helper function to show success messages
	const showSuccess = (message) => {
		setSuccessMessage(message);
		setTimeout(() => {
			setSuccessMessage('');
		}, 2000); // Show success for 2 seconds
	};

	// Generic notifier (use for custom durations)
	const notify = (type, message, durationMs = 2000) => {
		if (type === 'success') {
			setSuccessMessage(message);
			setTimeout(() => setSuccessMessage(''), durationMs);
		} else {
			setErrorMessage(message);
			setTimeout(() => setErrorMessage(''), durationMs);
		}
	};

	useEffect(() => {
		const { refreshToken } = getTokens();
		if (!refreshToken || isTokenExpired(refreshToken, 0)) {
			clearTokens();
			navigate('/login', { replace: true });
		}
	}, [navigate]);

	// Bootstrap from localStorage first (quick graphs generated in utils)
	useEffect(() => {
		try {
			const raw = localStorage.getItem('algoNetQuickGraph');
			if (!raw) return;
			const saved = JSON.parse(raw);
			console.log('Loaded nodes from saved', saved);
			if (Array.isArray(saved?.nodes) && saved.nodes.length) {
				setNodes(saved.nodes);
				if (Array.isArray(saved?.edges)) setEdges(saved.edges);
				if (saved?.name) setGraphName(saved.name);
			}
			localStorage.removeItem('algoNetQuickGraph');
		} catch {
			// ignore parse errors
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Initialize graph from router state if nodes/edges provided
	useEffect(() => {
		if (!location?.state) return;
		const { nodes: incomingNodes, edges: incomingEdges, name } = location.state || {};
		if (Array.isArray(incomingNodes) && incomingNodes.length) setNodes(incomingNodes);
		if (Array.isArray(incomingEdges) && incomingEdges.length) setEdges(incomingEdges);
		if (name) setGraphName(name);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Load graph from database if ID provided in URL
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const id = urlParams.get('id');
		
		if (id) {
			loadGraph(id);
		}
	}, [location.search]);

	const loadGraph = async (id) => {
		setIsLoading(true);
		try {
			const graph = await http.get(`/api/graphs/${id}`, { auth: true });

			// Load graph data
			setGraphId(graph.id);
			setGraphName(graph.name);
			
			// Convert nodes from backend format
			const loadedNodes = graph.nodes?.map(node => ({
				id: node.nodeId,
				label: node.label,
				x: node.positionX || Math.random() * 800,
				y: node.positionY || Math.random() * 600,
				size: node.size || 20,
				color: node.color || '#1976d2'
			})) || [];
			
			// Convert edges from backend format
			const loadedEdges = graph.edges?.map(edge => {
				const hasWeight = edge.weight !== null && edge.weight !== undefined;
				return {
					id: edge.edgeId,
					from: edge.fromNode,
					to: edge.toNode,
					weight: hasWeight ? edge.weight : undefined,
					directed: edge.isDirected ?? false,
					showWeight: edge.showWeight !== undefined ? edge.showWeight : hasWeight
				};
			}) || [];
			
			setNodes(loadedNodes);
			setEdges(loadedEdges);
			
			// Legend (if backend returns)
			if (graph.hasLegend && Array.isArray(graph.legendEntries)) {
				setHasLegend(true);
				// normalize keys
				setLegendEntries(graph.legendEntries.map(le => ({
					name: le.name,
					color: le.color,
					capacity: le.capacity,
					distance: le.distance,
					diameter: le.diameter,
				})));
			} else {
				setHasLegend(false);
				setLegendEntries([]);
			}

			showSuccess('Graph başarıyla yüklendi!');
		} catch (error) {
			if (error.status === 404) {
				showError('Graph bulunamadı');
				navigate('/graph-list');
			} else if (error.status === 403) {
				showError('Bu graph\'a erişim yetkiniz yok');
				navigate('/graph-list');
			} else {
				showError('Graph yüklenirken hata oluştu');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResetGraph = () => {
		setNodes([]);
		setEdges([]);
		setSelectedNode(null);
		setLegendEntries([]);
		setHasLegend(false);
		setSelectedEdge(null);
		setMode(null);
		setTempEdge(null);
	};

	const handleSaveGraph = async () => {
		if (isSaving) return; // Prevent multiple saves
		
		// Validation: Check if graph has a name
		if (!graphName || graphName.trim() === '' || graphName.trim() === 'Graph Name') {
			showError('Lütfen graph için bir isim girin.');
			return;
		}

		// Validation: Check if graph has at least one node
		if (!nodes || nodes.length === 0) {
			showError('Lütfen en az bir düğüm (vertex) ekleyin.');
			return;
		}
		
		setIsSaving(true);
		try {
			// Prepare nodes data for backend
			const nodesData = nodes.map(node => ({
				nodeId: node.id,
				label: node.label || node.id,
				size: node.size || 15,
				color: node.color || '#2563eb',
				positionX: node.x,
				positionY: node.y
			}));

			// Prepare edges data for backend
			const edgesData = edges.map(edge => ({
				edgeId: edge.id,
				fromNode: edge.from,
				toNode: edge.to,
				weight: edge.weight !== undefined ? edge.weight : null,
				isDirected: edge.directed ?? false,
				showWeight: edge.showWeight !== undefined ? edge.showWeight : (edge.weight !== undefined)
			}));

			const requestBody = {
				name: graphName.trim(),
				nodes: nodesData,
				edges: edgesData,
				// include legend if present
				hasLegend: hasLegend && legendEntries.length > 0,
				legendEntries: (hasLegend ? legendEntries : []),
			};

			console.log("Prepared graph data for saving:", JSON.stringify(requestBody));

			// Use PUT for update, POST for new
			const method = graphId ? 'PUT' : 'POST';
			const url = graphId ? `/api/graphs/${graphId}` : '/api/graphs/save';
			
			console.log(`Saving graph via ${method} to ${url}`);

			const data = graphId
				? await http.put(`/api/graphs/${graphId}`, requestBody, { auth: true })
				: await http.post('/api/graphs/save', requestBody, { auth: true });

			if (!graphId) {
				setGraphId(data.graphId);
				// Update URL to include the new graph ID
				window.history.replaceState({}, '', `/graph?id=${data.graphId}`);
			}
			showSuccess(`Graph başarıyla ${graphId ? 'güncellendi' : 'kaydedildi'}!`);
		} catch (error) {
			const msg = error.data?.message || 'Graph kaydedilirken bir hata oluştu.';
			showError(`Kaydetme hatası: ${msg}`);
		} finally {
			setIsSaving(false);
		}
	};

	// Delete selected node/edge when Enter is pressed
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === 'Enter') {
				if (selectedNode) {
					setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
					setEdges(prev => prev.filter(ed => ed.from !== selectedNode.id && ed.to !== selectedNode.id));
					setSelectedNode(null);
				} else if (selectedEdge) {
					setEdges(prev => prev.filter(ed => ed.id !== selectedEdge.id));
					setSelectedEdge(null);
				}
			}
		};

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [selectedNode, selectedEdge, setEdges, setNodes]);

	const updateSearching = (data) => {
		console.log("Searchsdang data:", data);
		const visited = new Set(data?.visited ?? []);
		const visitedEdges = new Set((data?.edges ?? []).map(([a, b]) => `${a}-${b}`));

		setNodes((prev) =>
			prev.map((n) => ({
				...n,
				color: visited.has(n.id) ? "#FFB300" : "#E0E0E0",
			}))
		);

		setEdges((prev) =>
			prev.map((e) => ({
				...e,
				// Graph edges use from/to
				color: visitedEdges.has(`${e.from}-${e.to}`) ? "#FB8C00" : "#BDBDBD",
			}))
		);
	};

	return (
		<Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
			{/* Success Message */}
			{successMessage && (
				<Box sx={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: 'auto', minWidth: '300px' }}>
					<FlashMessage severity="success" message={successMessage} />
				</Box>
			)}
			
			{/* Error Message */}
			{errorMessage && (
				<Box sx={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: 'auto', minWidth: '300px' }}>
					<FlashMessage severity="error" message={errorMessage} />
				</Box>
			)}
			
			{/* Loading overlay */}
			{isLoading && (
				<Box 
					sx={{ 
						position: 'fixed', 
						top: 0, 
						left: 0, 
						right: 0, 
						bottom: 0, 
						bgcolor: 'rgba(0, 0, 0, 0.3)', 
						zIndex: 9998,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: 'white',
						fontSize: '1.2rem'
					}}
				>
					Yükleniyor...
				</Box>
			)}

			{/* Overlay during saving to prevent interactions */}
			{isSaving && (
				<Box 
					sx={{ 
						position: 'fixed', 
						top: 0, 
						left: 0, 
						right: 0, 
						bottom: 0, 
						bgcolor: 'rgba(0, 0, 0, 0.3)', 
						zIndex: 9998,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: 'white',
						fontSize: '1.2rem'
					}}
				>
					{graphId ? 'Güncelleniyor...' : 'Kaydediliyor...'}
				</Box>
			)}

			<TopBar title="Graph Simulator"
				actions={[
					{ label: 'Profile', onClick: () => { if (!isSaving) navigate('/profile'); }, variant: 'contained', color: 'primary', ariaLabel: 'Profile', disabled: isSaving },
					{ label: 'Çıkış Yap', onClick: () => { if (!isSaving) { clearTokens(); navigate('/login'); } }, variant: 'contained', color: 'error', ariaLabel: 'Çıkış Yap', disabled: isSaving }
				]}
			/>

			<Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
				<Box sx={{ borderColor: 'divider' }}>
					<Sidebar 
						onReset={handleResetGraph} 
						onSave={handleSaveGraph}
						isSaving={isSaving}
						graphName={graphName} 
						setGraphName={setGraphName} 
						setNodes={setNodes}
						nodes={nodes}
						setEdges={setEdges}
						edges={edges}
						// pass loading controls to sidebar
						isLoading={isLoading}
						setIsLoading={setIsLoading}
						// pass notifier to show 2s error on custom button failure
						notify={notify}
						// legend pass-through
						hasLegend={hasLegend}
						setHasLegend={setHasLegend}
						legendEntries={legendEntries}
						setLegendEntries={setLegendEntries}
					/>
				</Box>

				<Box component="main" sx={{ flex: 1, position: 'relative', p: 2 }}>
					<GraphCanvas
						nodes={nodes}
						setNodes={setNodes}
						edges={edges}
						setEdges={setEdges}
						selectedNode={selectedNode}
						setSelectedNode={setSelectedNode}
						selectedEdge={selectedEdge}
						setSelectedEdge={setSelectedEdge}
						mode={mode}
						setMode={setMode}
						tempEdge={tempEdge}
						setTempEdge={setTempEdge}
						disabled={isSaving}
					/>

					{/* Legend overlay */}
					{hasLegend && legendEntries.length > 0 && (
						<Box sx={{ position: 'absolute', right: 16, top: 80 }}>
							<LegendPanel entries={legendEntries} />
						</Box>
					)}

					{selectedNode && (
						<VertexSettings
							selectedNode={selectedNode}
							setSelectedNode={setSelectedNode}
							setNodes={setNodes}
							setEdges={setEdges}
							setTempEdge={setTempEdge}
						/>
					)}

					{selectedEdge && (
						<EdgeSettings
							selectedEdge={selectedEdge}
							setSelectedEdge={setSelectedEdge}
							setEdges={setEdges}
							setTempEdge={setTempEdge}
							nodes={nodes}
						/>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default Graph;