import React, { useState, useEffect } from 'react';

const EdgeSettings = ({ selectedEdge, setSelectedEdge, setEdges }) => {
  const [label, setLabel] = useState(selectedEdge?.label || '');
  const [weight, setWeight] = useState(selectedEdge?.weight || 1);
  const [directed, setDirected] = useState(selectedEdge?.directed || false);

  useEffect(() => {
    if (selectedEdge) {
      setLabel(selectedEdge.label || '');
      setWeight(selectedEdge.weight || 1);
      setDirected(selectedEdge.directed || false);
    }
  }, [selectedEdge]);

  const handleChange = (setter, key, value) => {
    setter(value);
    setEdges(prevEdges =>
      prevEdges.map(edge =>
        edge === selectedEdge ? { ...edge, [key]: value } : edge
      )
    );
  };

  const handleClose = () => {
    setSelectedEdge(null);
  };

  if (!selectedEdge) return null;

  return (
    <div
      id="edge-settings"
      className="absolute top-4 right-4 w-64 bg-white border p-4 shadow-lg rounded"
    >
      <h2 className="text-lg font-semibold mb-2">Edge Settings</h2>
      <label className="text-sm">Label</label>
      <input
        type="text"
        id="e-label"
        className="w-full p-1 border rounded mb-2"
        value={label}
        onChange={(e) => handleChange(setLabel, 'label', e.target.value)}
      />
      <label className="text-sm">Weight</label>
      <input
        type="number"
        id="e-weight"
        className="w-full p-1 border rounded mb-2"
        value={weight}
        onChange={(e) => handleChange(setWeight, 'weight', parseFloat(e.target.value))}
      />
      <label className="text-sm">Directed: </label>
      <input
        type="checkbox"
        id="e-directed"
        className="appearance-none h-4 w-4 bg-white checked:bg-black border border-gray-400 rounded-sm"
        checked={directed}
        onChange={(e) => handleChange(setDirected, 'directed', e.target.checked)}
      />
      <div className="text-sm mb-2">Source: <span id="e-source">{selectedEdge.from.label}</span>, Target: <span id="e-target">{selectedEdge.to.label}</span></div>
      <button
        id="close-e-settings"
        className="w-full bg-black text-white py-1 rounded"
        onClick={handleClose}
      >
        Close
      </button>
    </div>
  );
};

export default EdgeSettings;