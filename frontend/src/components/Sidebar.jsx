import React, { useState } from 'react';

const Sidebar = ({ onRun, onReset }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dfs');

  const handleAlgorithmChange = (e) => {
    setSelectedAlgorithm(e.target.value);
  };

  return (
    <aside className="w-64 bg-white p-4 shadow">
      <h2 className="text-lg font-semibold mb-4">Algorithms</h2>
      <select
        id="algorithm-select"
        className="w-full p-2 border rounded mb-4"
        value={selectedAlgorithm}
        onChange={handleAlgorithmChange}
      >
        <option value="dfs">Depth-First Search</option>
        <option value="bfs">Breadth-First Search</option>
        <option value="dijkstra">Dijkstra's Algorithm</option>
      </select>
      <button
        id="run-btn"
        className="w-full bg-black text-white py-2 rounded mb-2 hover:bg-blue-700"
        onClick={() => onRun(selectedAlgorithm)}
      >
        Runnnn
      </button>
      <button
        id="reset-btn"
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-300"
        onClick={onReset}
      >
        Reset
      </button>
    </aside>
  );
};

export default Sidebar;