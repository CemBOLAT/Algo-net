import { createNode, resetNodeIds } from './buildBST';

const height = (n) => (n ? (n.h ?? 1) : 0);
const updateHeight = (n) => { n.h = Math.max(height(n.left), height(n.right)) + 1; return n; };
const balanceFactor = (n) => (n ? height(n.left) - height(n.right) : 0);

const rotateRight = (y) => {
  const x = y.left;
  const T2 = x.right;
  x.right = y;
  y.left = T2;
  updateHeight(y);
  updateHeight(x);
  return x;
};

const rotateLeft = (x) => {
  const y = x.right;
  const T2 = y.left;
  y.left = x;
  x.right = T2;
  updateHeight(x);
  updateHeight(y);
  return y;
};

const balance = (node) => {
  updateHeight(node);
  const bf = balanceFactor(node);
  if (bf > 1) {
    // Left heavy
    if (balanceFactor(node.left) < 0) node.left = rotateLeft(node.left);
    return rotateRight(node);
  }
  if (bf < -1) {
    // Right heavy
    if (balanceFactor(node.right) > 0) node.right = rotateRight(node.right);
    return rotateLeft(node);
  }
  return node;
};

export const insertAVL = (root, value) => {
  if (!root) {
    const n = createNode(value);
    n.h = 1;
    return n;
  }
  if (value < root.value) root.left = insertAVL(root.left, value);
  else root.right = insertAVL(root.right, value);
  return balance(root);
};

export const buildAVL = (values) => {
  resetNodeIds();
  let root = null;
  for (const v of values) {
    const num = Number(v);
    if (!Number.isNaN(num)) root = insertAVL(root, num);
  }
  return root;
};
