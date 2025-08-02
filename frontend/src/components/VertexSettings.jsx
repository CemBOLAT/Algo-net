import React, { useState, useEffect } from 'react';

const VertexSettings = ({ selectedNode, setSelectedNode, setNodes }) => {
  
  const [label, setLabel] = useState(selectedNode?.label || '');
  const [size, setSize] = useState(selectedNode?.size || 15);
  const [color, setColor] = useState(selectedNode?.color || '#2563eb');
   
  
  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.label);
      setSize(selectedNode.size);
      setColor(selectedNode.color);
    }
  }, [selectedNode]);

  
  const handleChange = (setter, key, value) => {
    setter(value);
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node === selectedNode ? { ...node, [key]: value } : node
      )
    );
  };

  const handleClose = () => {
    setSelectedNode(null);
  };

  if (!selectedNode) return null;

  return (
    <div
      id="vertex-settings"
      className="absolute top-4 right-4 w-64 bg-white border p-4 shadow-lg rounded"
    >
      <h2 className="text-lg font-semibold mb-2">Vertex Settings</h2>
      <label className="text-sm">Label</label>
      <input
        type="text"
        id="v-label"
        className="w-full p-1 border rounded mb-2"
        value={label}
        onChange={(e) => handleChange(setLabel, 'label', e.target.value)}
      />
      <label className="text-sm">Size</label>
      <input
        type="range"
        id="v-size"
        min="5"
        max="40"
        className="w-full mb-2"
        value={size}
        onChange={(e) => handleChange(setSize, 'size', parseInt(e.target.value))}
      />
      <label className="text-sm">Color</label>
      <input
        type="color"
        id="v-color"
        className="w-full h-10 mb-2"
        value={color}
        onChange={(e) => handleChange(setColor, 'color', e.target.value)}
      />
      <button
        id="close-v-settings"
        className="w-full bg-black text-white py-1 rounded"
        onClick={handleClose}
      >
        Close
      </button>
    </div>
  );
};

export default VertexSettings;