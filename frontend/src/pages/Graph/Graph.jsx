import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearTokens, getTokens, isTokenExpired } from '../../utils/auth';
import GraphCanvas from '../../components/GraphCanvas';
import Sidebar from '../../components/Sidebar';
import VertexSettings from '../../components/VertexSettings';
import EdgeSettings from '../../components/EdgeSettings';
import TopBar from '../../components/TopBar';
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

	useEffect(() => {
		const { refreshToken } = getTokens();
		if (!refreshToken || isTokenExpired(refreshToken, 0)) {
			clearTokens();
			navigate('/login', { replace: true });
		}
	}, [navigate]);

	// Initialize graph from router state when navigating from GraphCreation
	useEffect(() => {
		if (location?.state) {
			const { nodes: incomingNodes, edges: incomingEdges, name } = location.state;
			if (Array.isArray(incomingNodes) && incomingNodes.length) setNodes(incomingNodes);
			if (Array.isArray(incomingEdges) && incomingEdges.length) setEdges(incomingEdges);
			if (name) setGraphName(name);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleRunAlgorithm = (algorithm) => {
		alert(`Running ${algorithm} algorithm! (Logic not implemented)`);
	};

	const handleResetGraph = () => {
		setNodes([]);
		setEdges([]);
		setSelectedNode(null);
		setSelectedEdge(null);
		setMode(null);
		setTempEdge(null);
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
			<TopBar title="Graph Simulator"
				actions={[
					{ label: 'Graph Oluştur', onClick: () => { navigate('/graph-creation'); }, variant: 'contained', color: 'primary', ariaLabel: 'Geleneksel Yöntem' },
					{ label: 'Dizi Algoritmaları', onClick: () => { navigate('/array-algorithms'); }, variant: 'contained', color: 'primary', ariaLabel: 'Dizi Algoritmaları' },
					{ label: 'Ağaç Algoritmaları', onClick: () => { navigate('/tree-algorithms'); }, variant: 'contained', color: 'primary', ariaLabel: 'Ağaç Algoritmaları' },
					{ label: 'Çıkış Yap', onClick: () => { clearTokens(); navigate('/login'); }, variant: 'contained', color: 'error', ariaLabel: 'Çıkış Yap' }
				]}
			/>

			<Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
				<Box sx={{ borderColor: 'divider' }}>
					<Sidebar onRun={handleRunAlgorithm} onReset={handleResetGraph} graphName={graphName} setGraphName={setGraphName} />
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
