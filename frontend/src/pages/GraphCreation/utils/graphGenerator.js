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

// Extra layout helpers
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const generateRadialLayout = (nodeCount, centerX = 400, centerY = 300, radius = 200, centerIndex = 0) => {
  const positions = Array(nodeCount).fill(0).map(() => ({ x: centerX, y: centerY }));
  const others = nodeCount - 1;
  let idx = 0;
  for (let i = 0; i < nodeCount; i++) {
    if (i === centerIndex) continue;
    const angle = (2 * Math.PI * (idx++)) / Math.max(1, others) - Math.PI / 2;
    positions[i] = { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  }
  positions[centerIndex] = { x: centerX, y: centerY };
  return positions;
};

// Place centers in the middle horizontally (same y), leaves on an outer circle
export const generateStarLayout = (nodeCount, centerCount, width = 800, height = 600, margin = 60) => {
  const positions = Array.from({ length: nodeCount }, () => ({ x: 0, y: 0 }));
  const cx = width / 2, cy = height / 2;
  const centers = Math.max(1, Math.min(centerCount || 1, Math.max(1, nodeCount - 1)));
  const leaves = Math.max(0, nodeCount - centers);

  // Center nodes aligned horizontally at y = cy, centered around cx
  if (centers === 1) {
    positions[0] = { x: cx, y: cy };
  } else {
    // spacing limited by viewport and a max to prevent over-stretching
    const maxSpan = Math.max(200, width - 2 * margin);
    const spacing = Math.min(140, maxSpan / Math.max(1, centers - 1));
    const startX = cx - ((centers - 1) * spacing) / 2;
    for (let i = 0; i < centers; i++) {
      positions[i] = { x: startX + i * spacing, y: cy };
    }
  }

  // Leaves on a circle centered at (cx, cy), radius large enough not to overlap centers row
  const centerRowHalf = centers > 1
    ? ((centers - 1) * Math.min(140, (width - 2 * margin) / Math.max(1, centers - 1))) / 2
    : 0;
  const baseRadius = Math.min(cx, cy) - margin;
  const rOuter = Math.max(baseRadius, centerRowHalf + 100); // keep leaves clearly around centers

  // Angle offset to avoid placing a leaf exactly on the center row (y = cy)
  const angleStep = 2 * Math.PI / Math.max(1, leaves);
  const angleOffset = leaves > 2 ? (Math.PI / leaves) : 0;

  for (let i = 0; i < leaves; i++) {
    const theta = -Math.PI / 2 + angleOffset + i * angleStep;
    positions[centers + i] = {
      x: cx + rOuter * Math.cos(theta),
      y: cy + rOuter * Math.sin(theta)
    };
  }

  return positions;
};

export const generateTreeLayout = (nodeCount, k = 2, width = 800, height = 600, margin = 60) => {
  const positions = Array(nodeCount).fill({ x: 0, y: 0 });
  const levels = [];
  for (let i = 0; i < nodeCount; i++) {
    const idx = i + 1;
    let depth = 0;
    if (idx > 1) depth = Math.floor((idx - 2) / k) + 1;
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(i);
  }
  const levelCount = levels.length;
  for (let d = 0; d < levelCount; d++) {
    const y = margin + d * ((height - 2 * margin) / Math.max(1, levelCount - 1));
    const row = levels[d];
    const count = row.length;
    for (let j = 0; j < count; j++) {
      const x = count === 1 ? width / 2 : margin + j * ((width - 2 * margin) / (count - 1));
      positions[row[j]] = { x, y };
    }
  }
  return positions;
};

export const generateBipartiteLayout = (a, b, width = 800, height = 600, margin = 60) => {
  const positions = [];
  const leftX = width / 2 - (width / 4);
  const rightX = width / 2 + (width / 4);
  const ys = (cnt) => Array.from({ length: cnt }, (_, i) => margin + i * ((height - 2 * margin) / Math.max(1, cnt - 1)));
  const ysA = ys(a), ysB = ys(b);
  for (let i = 0; i < a; i++) positions.push({ x: leftX, y: ysA[i] });
  for (let j = 0; j < b; j++) positions.push({ x: rightX, y: ysB[j] });
  return positions;
};

// Label helper
const labelOf = (i) => String.fromCharCode(65 + i); // A, B, C, ...

// Create tree (k-ary) graph
export const createTreeGraph = (nodeCount, k = 2) => {
  const n = Math.max(0, Number(nodeCount || 0));
  const vertices = Array.from({ length: n }, (_, i) => labelOf(i));
  const edges = [];
  let idCounter = Date.now();
  for (let child = 2; child <= n; child++) {
    const parent = Math.floor((child - 2) / k) + 1;
    const from = labelOf(parent - 1), to = labelOf(child - 1);
    if (!edgeExists(edges, from, to, false)) {
      edges.push({ id: idCounter++, name: `${from}-${to}`, from, to, showDelete: false, directed: false });
    }
  }
  const positions = generateTreeLayout(n, k);
  return { vertices, edges, positions };
};

// Create star graph
export const createStarGraph = (nodeCount, centerCount = 1) => {
  const n = Math.max(0, Number(nodeCount || 0));
  // clamp centers to [1, n-1] to keep at least one leaf if possible
  const c = Math.max(1, Math.min(Number(centerCount || 1), Math.max(1, n - 1)));
  const vertices = Array.from({ length: n }, (_, i) => labelOf(i));
  const edges = [];
  let idCounter = Date.now();

  // centers: A.. labelOf(c-1), leaves: labelOf(c)..labelOf(n-1)
  for (let i = 0; i < c; i++) {
    for (let j = c; j < n; j++) {
      const from = labelOf(i), to = labelOf(j);
      edges.push({ id: idCounter++, name: `${from}-${to}`, from, to, showDelete: false, directed: false });
    }
  }

  const positions = generateStarLayout(n, c);
  return { vertices, edges, positions };
};

// Create ring graph
export const createRingGraph = (nodeCount) => {
  const n = Math.max(0, Number(nodeCount || 0));
  const vertices = Array.from({ length: n }, (_, i) => labelOf(i));
  const edges = [];
  let idCounter = Date.now();
  if (n === 1) {
    const v = labelOf(0);
    edges.push({ id: idCounter++, name: `${v}-${v}`, from: v, to: v, showDelete: false, directed: false });
  } else if (n === 2) {
    const a = labelOf(0), b = labelOf(1);
    edges.push({ id: idCounter++, name: `${a}-${b}`, from: a, to: b, showDelete: false, directed: false });
    edges.push({ id: idCounter++, name: `${a}-${b}`, from: a, to: b, showDelete: false, directed: false });
  } else {
    for (let i = 0; i < n; i++) {
      const from = labelOf(i), to = labelOf((i + 1) % n);
      if (!edgeExists(edges, from, to, false)) {
        edges.push({ id: idCounter++, name: `${from}-${to}`, from, to, showDelete: false, directed: false });
      }
    }
  }
  const positions = generateCircularLayout(n);
  return { vertices, edges, positions };
};

// Create complete bipartite graph K(a,b)
export const createFullBipartiteGraph = (a, b) => {
  const A = Math.max(1, Number(a || 0));
  const B = Math.max(1, Number(b || 0));
  const n = A + B;
  const vertices = Array.from({ length: n }, (_, i) => labelOf(i));
  const edges = [];
  let idCounter = Date.now();
  for (let i = 0; i < A; i++) {
    for (let j = A; j < A + B; j++) {
      const from = labelOf(i), to = labelOf(j);
      edges.push({ id: idCounter++, name: `${from}-${to}`, from, to, showDelete: false, directed: false });
    }
  }
  const positions = generateBipartiteLayout(A, B);
  return { vertices, edges, positions };
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
