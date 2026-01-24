const safeClone = (node) => {
    if (!node) return null;
    return {
        ...node,
        left: safeClone(node.left),
        right: safeClone(node.right),
        parent: undefined // Exclude parent from snapshot
    };
};

const pushStep = (steps, root, msg, nodeId = null) => {
    steps.push({
        root: safeClone(root),
        msg,
        nodeId,
        visitOrder: [],
        pathIds: []
    });
};

// Red-Black Constants
const RED = 'red';
const BLACK = 'black';

const createNode = (val) => ({
    id: `node_rb_${val}_${Date.now()}_${Math.random()}`,
    value: val,
    color: RED, // New nodes are always red
    left: null,
    right: null
});

// Search helper (standard BST)
const findNode = (root, val) => {
    if (!root) return null;
    if (root.value === val) return root;
    if (val < root.value) return findNode(root.left, val);
    return findNode(root.right, val);
};

// --- Insertion logic ---

// Standard BST insert that returns the NEW node (z) and updates tree structure
// We need parent pointers for RB fixup usually, but we can do recursive fixup or use a parent map.
// Recursive approach or 'top-down' RB trees? Bottom-up is standard.
// For visualization, we need step-by-step.
// Let's use a parent-pointer approach for easier logic implementation in JS.

const addParents = (node, parent = null) => {
    if (!node) return;
    node.parent = parent;
    addParents(node.left, node);
    addParents(node.right, node);
};

const getGrandparent = (node) => {
    if (node && node.parent) return node.parent.parent;
    return null;
};

const getUncle = (node) => {
    const g = getGrandparent(node);
    if (!g) return null;
    if (node.parent === g.left) return g.right;
    return g.left;
};

const rotateLeft = (node) => {
    const r = node.right;
    const p = node.parent;

    if (!r) return node; // Should not happen

    node.right = r.left;
    if (r.left) r.left.parent = node;

    r.left = node;
    node.parent = r;
    r.parent = p;

    if (p) {
        if (p.left === node) p.left = r;
        else p.right = r;
    }

    return r;
};

const rotateRight = (node) => {
    const l = node.left;
    const p = node.parent;

    if (!l) return node;

    node.left = l.right;
    if (l.right) l.right.parent = node;

    l.right = node;
    node.parent = l;
    l.parent = p;

    if (p) {
        if (p.left === node) p.left = l;
        else p.right = l;
    }

    return l;
};

// Helper to find root from any node
const findRoot = (node) => {
    let curr = node;
    while (curr.parent) curr = curr.parent;
    return curr;
};

// Snapshot helper
const snap = (steps, nodeInTree, msg, ta) => {
    const r = findRoot(nodeInTree);
    // pushStep now safely clones, so we can pass the root directly
    pushStep(steps, r, msg, nodeInTree ? nodeInTree.id : null);
};

export const generateRBInsertionSteps = (startRoot, value, ta) => {
    const steps = [];

    // 1. Prepare tree with parent pointers
    // We clone startRoot first, then add parents.
    // Actually, startRoot comes from state, it should be clean.
    // But let's use safeClone to be sure we have a fresh copy without any hidden props.
    let root = startRoot ? safeClone(startRoot) : null;

    if (!root) {
        root = createNode(value);
        root.color = BLACK; // Root property
        pushStep(steps, root, ta('rb_insert_root'), root.id); // "Inserted root (Black)"
        return steps;
    }

    addParents(root);

    // 2. BST Insert
    let curr = root;
    let parent = null;

    while (curr) {
        parent = curr;
        if (value < curr.value) {
            // snap(steps, curr, ta('inorder_visit', {v: curr.value}), ta);
            curr = curr.left;
        } else {
            // snap(steps, curr, ta('inorder_visit', {v: curr.value}), ta);
            curr = curr.right;
        }
    }

    // Insert new node
    const z = createNode(value);
    z.parent = parent;
    if (value < parent.value) parent.left = z;
    else parent.right = z;

    snap(steps, z, ta('rb_insert_node', { v: value }), ta); // "Inserted red node"

    // 3. Fixup
    let node = z;
    while (node !== root && node.parent.color === RED) {
        const p = node.parent;
        const g = getGrandparent(node);

        // Parent is left child of Grandparent
        if (p === g.left) {
            const u = g.right; // Uncle

            if (u && u.color === RED) {
                // Case 1: Uncle is Red -> Recolor
                snap(steps, node, ta('rb_case_1'), ta);
                p.color = BLACK;
                u.color = BLACK;
                g.color = RED;
                node = g;
                snap(steps, node, ta('rb_recolor_done'), ta);
            } else {
                // Case 2: Uncle is Black (or nil)
                if (node === p.right) {
                    // Case 2 Left-Right -> Rotate Left
                    node = p;
                    snap(steps, node, ta('rb_case_2'), ta);
                    rotateLeft(node);
                    // After rotate, parent map updated.
                    // 'node' is now the child of the new top.
                }
                // Case 3 Left-Left -> Rotate Right & Recolor
                snap(steps, node, ta('rb_case_3'), ta);
                node.parent.color = BLACK;
                g.color = RED;
                rotateRight(g);
                snap(steps, node, ta('rb_rotate_done'), ta);
            }
        }
        // Parent is right child of Grandparent
        else {
            const u = g.left;

            if (u && u.color === RED) {
                // Case 1
                snap(steps, node, ta('rb_case_1'), ta);
                p.color = BLACK;
                u.color = BLACK;
                g.color = RED;
                node = g;
                snap(steps, node, ta('rb_recolor_done'), ta);
            } else {
                if (node === p.left) {
                    // Case 2 Right-Left -> Rotate Right
                    node = p;
                    snap(steps, node, ta('rb_case_2'), ta);
                    rotateRight(node);
                }
                // Case 3 Right-Right -> Rotate Left & Recolor
                snap(steps, node, ta('rb_case_3'), ta);
                node.parent.color = BLACK;
                g.color = RED;
                rotateLeft(g);
                snap(steps, node, ta('rb_rotate_done'), ta);
            }
        }
    }

    // Ensure root is black
    const finalRoot = findRoot(node);
    if (finalRoot.color === RED) {
        finalRoot.color = BLACK;
        snap(steps, finalRoot, ta('rb_fix_root'), ta);
    } else {
        snap(steps, finalRoot, ta('rb_insert_done'), ta);
    }

    return steps;
};

// Helper so we don't need 'ta' for silent insertion
const noOpTa = () => '';

// Core insertion logic that DOES NOT record steps (silent)
// Returns the new root
export const insertRBNode = (root, value) => {
    // 1. Prepare
    // If root doesn't exist, create it (Black)
    if (!root) {
        const newRoot = createNode(value);
        newRoot.color = BLACK;
        return newRoot;
    }

    // We assume 'root' is already a valid tree object

    // 2. BST Insert
    let curr = root;
    let parent = null;

    while (curr) {
        parent = curr;
        if (value < curr.value) {
            curr = curr.left;
        } else {
            curr = curr.right;
        }
    }

    // Insert new node
    const z = createNode(value);
    z.parent = parent;
    if (value < parent.value) parent.left = z;
    else parent.right = z;

    // 3. Fixup
    let node = z;
    let tempRoot = root; // Root might change due to rotations

    // Helper to update root reference if rotation changes top
    const updateRoot = (n) => {
        tempRoot = findRoot(n);
    };

    while (node !== tempRoot && node.parent && node.parent.color === RED) {
        const p = node.parent;
        const g = getGrandparent(node);

        // Parent is left child of Grandparent
        if (g && p === g.left) {
            const u = g.right; // Uncle

            if (u && u.color === RED) {
                // Case 1
                p.color = BLACK;
                u.color = BLACK;
                g.color = RED;
                node = g;
            } else {
                // Case 2
                if (node === p.right) {
                    node = p;
                    rotateLeft(node);
                    // after rotate, parent pointers updated
                }
                // Case 3
                if (node.parent) node.parent.color = BLACK;
                if (g) {
                    g.color = RED;
                    rotateRight(g);
                }
            }
        }
        // Parent is right child of Grandparent
        else if (g) {
            const u = g.left;

            if (u && u.color === RED) {
                // Case 1
                p.color = BLACK;
                u.color = BLACK;
                g.color = RED;
                node = g;
            } else {
                if (node === p.left) {
                    node = p;
                    rotateRight(node);
                }
                // Case 3
                if (node.parent) node.parent.color = BLACK;
                if (g) {
                    g.color = RED;
                    rotateLeft(g);
                }
            }
        }
        updateRoot(node);
    }

    // Ensure root is black
    updateRoot(node);
    if (tempRoot) tempRoot.color = BLACK;

    return tempRoot;
};

// Rebuild RB tree from values
export const buildRBTree = (values) => {
    let root = null;
    for (const v of values) {
        root = insertRBNode(root, v);
    }
    return root;
};
