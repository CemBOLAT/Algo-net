let nextId = 1;

export const resetNodeIds = () => { nextId = 1; };

export const createNode = (value) => ({ id: nextId++, value, left: null, right: null });

export const insertBST = (root, value) => {
  if (!root) return createNode(value);
  if (value < root.value) root.left = insertBST(root.left, value);
  else root.right = insertBST(root.right, value);
  return root;
};

export const buildBST = (values) => {
  resetNodeIds();
  let root = null;
  for (const v of values) {
    const num = Number(v);
    if (!Number.isNaN(num)) root = insertBST(root, num);
  }
  return root;
};

export const layoutTree = (root, hGap = 80, vGap = 90) => {
  const pos = new Map();
  let x = 0;
  const dfs = (node, depth) => {
    if (!node) return;
    dfs(node.left, depth + 1);
    pos.set(node.id, { x: x * hGap, y: depth * vGap });
    x++;
    dfs(node.right, depth + 1);
  };
  dfs(root, 0);
  // Normalize to start at positive x
  let minX = 0;
  for (const { x: px } of pos.values()) minX = Math.min(minX, px);
  if (minX < 0) {
    for (const k of pos.keys()) { const p = pos.get(k); pos.set(k, { x: p.x - minX, y: p.y }); }
  }
  return pos;
};

export const collectEdges = (root) => {
  const edges = [];
  const walk = (node) => {
    if (!node) return;
    if (node.left) edges.push([node.id, node.left.id]);
    if (node.right) edges.push([node.id, node.right.id]);
    walk(node.left); walk(node.right);
  };
  walk(root);
  return edges;
};
