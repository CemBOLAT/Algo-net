import React, { useState } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import VertexSettings from './components/VertexSettings';
import EdgeSettings from './components/EdgeSettings';

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [mode, setMode] = useState(null); // 'add-edge'
  const [tempEdge, setTempEdge] = useState(null);

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
        <h1 className="text-2xl color-red-600 font-bold">Graph Simulator load</h1>
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
              setNodes={setNodes} // Pass setNodes to trigger re-render on node property change
            />
          )}

          {/* Edge Settings */}
          {selectedEdge && (
            <EdgeSettings
              selectedEdge={selectedEdge}
              setSelectedEdge={setSelectedEdge}
              setEdges={setEdges} // Pass setEdges to trigger re-render on edge property change
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;