import React, { useState } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import VertexSettings from './components/VertexSettings';
import EdgeSettings from './components/EdgeSettings';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { CustomThemeProvider } from './context/ThemeContext';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';


function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [mode, setMode] = useState(null); // 'add-edge'
  const [tempEdge, setTempEdge] = useState(null);
  const [startScreen, setStartScreen] = useState("graph");

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

  if (startScreen == "login") 
    return (
      <CustomThemeProvider>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Login />} />
          </Routes>
        </Router>
      </CustomThemeProvider>    
    )
    else 
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
                setEdges={setEdges}
                setTempEdge={setTempEdge}
              />
            )}

            {/* Edge Settings */}
            {selectedEdge && (
              <EdgeSettings
                selectedEdge={selectedEdge}
                setSelectedEdge={setSelectedEdge}
                setEdges={setEdges} // Pass setEdges to trigger re-render on edge property change
                setTempEdge={setTempEdge}
              />
            )}
          </main>
        </div>
      </div>
    )
    
  
}

export default App;