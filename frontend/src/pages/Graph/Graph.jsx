import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearTokens, getTokens, isTokenExpired } from '../../utils/auth';
import GraphCanvas from '../../components/GraphCanvas';
import Sidebar from '../../components/Sidebar';
import VertexSettings from '../../components/VertexSettings';
import EdgeSettings from '../../components/EdgeSettings';
import TopBar from '../../components/TopBar';
import FlashMessage from '../../components/FlashMessage';
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

	useEffect(() => {
		const { refreshToken } = getTokens();
		if (!refreshToken || isTokenExpired(refreshToken, 0)) {
			clearTokens();
			navigate('/login', { replace: true });
		}
	}, [navigate]);


	// Initialize graph from router state when navigating from GraphCreation
	useEffect(() => {
		const { nodes: incomingNodes, edges: incomingEdges, name } = location.state;
		if (Array.isArray(incomingNodes) && incomingNodes.length) setNodes(incomingNodes);

		if (Array.isArray(incomingEdges) && incomingEdges.length) setEdges(incomingEdges);
		if (name) setGraphName(name);
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
			const { accessToken } = getTokens();
			if (!accessToken || isTokenExpired(accessToken)) {
				clearTokens();
				navigate('/login', { replace: true });
				return;
			}

			const response = await fetch(`/api/graphs/${id}`, {
				headers: {
					'Authorization': `Bearer ${accessToken}`
				}
			});

			if (response.ok) {
				const graph = await response.json();
				
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
				const loadedEdges = graph.edges?.map(edge => ({
					id: edge.edgeId,
					from: edge.fromNode,
					to: edge.toNode,
					weight: edge.weight || 1.0,
					directed: edge.isDirected || false,
					showWeight: edge.showWeight !== undefined ? edge.showWeight : true
				})) || [];
				
				setNodes(loadedNodes);
				setEdges(loadedEdges);
				
				showSuccess('Graph başarıyla yüklendi!');
			} else if (response.status === 404) {
				showError('Graph bulunamadı');
				navigate('/graph-list');
			} else if (response.status === 403) {
				showError('Bu graph\'a erişim yetkiniz yok');
				navigate('/graph-list');
			} else {
				const errorText = await response.text();
				showError('Graph yüklenirken hata oluştu: ' + errorText);
			}
		} catch (error) {
			console.error('Load graph error:', error);
			showError('Graph yüklenirken bir hata oluştu');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRunAlgorithm = (algorithm) => {
		showSuccess(`${algorithm} algoritması çalıştırıldı! (Mantık henüz uygulanmadı)`);
	};

	const handleResetGraph = () => {
		setNodes([]);
		setEdges([]);
		setSelectedNode(null);
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
			const { accessToken } = getTokens();
			if (!accessToken || isTokenExpired(accessToken)) {
				clearTokens();
				navigate('/login', { replace: true });
				return;
			}

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
				weight: edge.weight || 1.0,
				isDirected: edge.directed || false,
				showWeight: edge.showWeight !== undefined ? edge.showWeight : true
			}));

			const requestBody = {
				name: graphName.trim(),
				nodes: nodesData,
				edges: edgesData
			};

			// Use PUT for update, POST for new
			const method = graphId ? 'PUT' : 'POST';
			const url = graphId ? `/api/graphs/${graphId}` : '/api/graphs/save';
			
			console.log(`Saving graph via ${method} to ${url}`);

			const response = await fetch(url, {
				method: method,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken}`
				},
				body: JSON.stringify(requestBody)
			});

			if (response.ok) {
				const data = await response.json();
				if (!graphId) {
					setGraphId(data.graphId);
					// Update URL to include the new graph ID
					window.history.replaceState({}, '', `/graph?id=${data.graphId}`);
				}
				showSuccess(`Graph başarıyla ${graphId ? 'güncellendi' : 'kaydedildi'}!`);
			} else {
				const errorText = await response.text();
				console.error('Save error response:', response.status, response.statusText);
				console.error('Save error body:', errorText);
				
				let errorMessage = 'Bilinmeyen hata';
				try {
					const errorData = JSON.parse(errorText);
					errorMessage = errorData.message || errorMessage;
				} catch (e) {
					errorMessage = errorText || errorMessage;
				}
				
				showError(`Kaydetme hatası: ${errorMessage}`);
			}
		} catch (error) {
			console.error('Save graph error:', error);
			showError('Graph kaydedilirken bir hata oluştu.');
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
					{ label: 'Graphlarım', onClick: () => { if (!isSaving) navigate('/graph-list'); }, variant: 'contained', color: 'primary', ariaLabel: 'Graphlarım', disabled: isSaving },
					{ label: 'Graph Oluştur', onClick: () => { if (!isSaving) navigate('/graph-creation'); }, variant: 'contained', color: 'primary', ariaLabel: 'Geleneksel Yöntem', disabled: isSaving },
					{ label: 'Dizi Algoritmaları', onClick: () => { if (!isSaving) navigate('/array-algorithms'); }, variant: 'contained', color: 'primary', ariaLabel: 'Dizi Algoritmaları', disabled: isSaving },
					{ label: 'Ağaç Algoritmaları', onClick: () => { if (!isSaving) navigate('/tree-algorithms'); }, variant: 'contained', color: 'primary', ariaLabel: 'Ağaç Algoritmaları', disabled: isSaving },
					{ label: 'Çıkış Yap', onClick: () => { if (!isSaving) { clearTokens(); navigate('/login'); } }, variant: 'contained', color: 'error', ariaLabel: 'Çıkış Yap', disabled: isSaving }
				]}
			/>

			<Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
				<Box sx={{ borderColor: 'divider' }}>
					<Sidebar 
						onRun={handleRunAlgorithm} 
						onReset={handleResetGraph} 
						onSave={handleSaveGraph}
						isSaving={isSaving}
						graphName={graphName} 
						setGraphName={setGraphName} 
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
