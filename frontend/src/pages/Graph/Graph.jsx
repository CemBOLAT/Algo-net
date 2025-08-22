import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearTokens, getTokens, isTokenExpired } from '../../utils/auth';
import GraphCanvas from '../../components/GraphCanvas';
import Sidebar from '../../components/Sidebar';
import VertexSettings from '../../components/VertexSettings';
import EdgeSettings from '../../components/EdgeSettings';

const Graph = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
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

  // Initialize graph from router state when navigating from TraditionalMethod
  useEffect(() => {
    if (location?.state) {
      const { nodes: incomingNodes, edges: incomingEdges } = location.state;
      if (Array.isArray(incomingNodes) && incomingNodes.length) setNodes(incomingNodes);
      if (Array.isArray(incomingEdges) && incomingEdges.length) setEdges(incomingEdges);
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

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen min-w-screen">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl color-red-600 font-bold">Graph Simulator</h1>
        <button
          onClick={() => { navigate('/traditional-method'); }}
          className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Geleneksel Yöntem"
        >
          Geleneksel Yöntem
        </button>

        <button
          onClick={() => { navigate('/array-algorithms'); }}
          className="rounded-md bg-gradient-to-r from-indigo-600 to-teal-400 text-white px-4 py-2 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          aria-label="Dizi Algoritmaları"
          style={{ marginLeft: 8 }}
        >
          Dizi Algoritmaları
        </button>
        <button
          onClick={() => { clearTokens(); navigate('/login'); }}
          className="rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          aria-label="Çıkış Yap"
        >
          Çıkış Yap
        </button>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <Sidebar onRun={handleRunAlgorithm} onReset={handleResetGraph} />

        {/* Main canvas area */}
        <main className="flex-1 relative p-4">
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

          {/* Vertex Settings */}
          {selectedNode && (
            <VertexSettings
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              setNodes={setNodes} // re-render on node property change
              setEdges={setEdges}
              setTempEdge={setTempEdge}
            />
          )}

          {/* Edge Settings */}
          {selectedEdge && (
            <EdgeSettings
              selectedEdge={selectedEdge}
              setSelectedEdge={setSelectedEdge}
              setEdges={setEdges} // re-render on edge property change
              setTempEdge={setTempEdge}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Graph;
