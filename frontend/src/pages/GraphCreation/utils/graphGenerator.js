// Check if edge already exists (for undirected graphs)
export const edgeExists = (edges, from, to, directed) => {
  if (directed) {
    return edges.some(edge => edge.from === from && edge.to === to);
  } else {
    // For undirected graphs, check both directions
    return edges.some(edge => 
      (edge.from === from && edge.to === to) || 
      (edge.from === to && edge.to === from)
    );
  }
};

// Generate circular layout
export const generateCircularLayout = (nodeCount, centerX = 400, centerY = 300, radius = 200) => {
  const positions = [];
  const angleStep = (2 * Math.PI) / nodeCount;
  
  for (let i = 0; i < nodeCount; i++) {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions.push({ x, y });
  }
  
  return positions;
};

// Generate grid layout
export const generateGridLayout = (nodeCount, startX = 100, startY = 100, spacing = 120) => {
  const positions = [];
  const cols = Math.ceil(Math.sqrt(nodeCount));
  
  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * spacing;
    const y = startY + row * spacing;
    positions.push({ x, y });
  }
  
  return positions;
};

// Create full graph
export const createFullGraph = (nodeCount, directed = false, weighted = false, layout = 'circular') => {
  // Create vertices with labels A, B, C, etc.
  const vertices = [];
  for (let i = 0; i < nodeCount; i++) {
    const label = String.fromCharCode(65 + i); // A, B, C, D...
    vertices.push(label);
  }

  // Create edges
  const edges = [];
  let idCounter = Date.now();

  for (let i = 0; i < vertices.length; i++) {
    for (let j = 0; j < vertices.length; j++) {
      if (i !== j) { // No self loops
        const from = vertices[i];
        const to = vertices[j];
        
        // For undirected graphs, avoid duplicate edges
        if (!directed && edgeExists(edges, from, to, directed)) {
          continue;
        }
        
        edges.push({
          id: idCounter++,
          name: `${from}-${to}`,
          from: from,
          to: to,
          showDelete: false,
          directed: directed,
          weight: weighted ? Math.floor(Math.random() * 9) + 1 : undefined
        });
      }
    }
  }

  // Generate positions based on layout - return separately for processing
  const positions = layout === 'circular' 
    ? generateCircularLayout(nodeCount)
    : generateGridLayout(nodeCount);

  return { vertices, edges, positions };
};
