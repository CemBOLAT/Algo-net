
const clone = (obj) => JSON.parse(JSON.stringify(obj));

const height = (n) => (n ? (n.h ?? 1) : 0);
const updateHeight = (n) => { n.h = Math.max(height(n.left), height(n.right)) + 1; return n; };
const balanceFactor = (n) => (n ? height(n.left) - height(n.right) : 0);

const rotateRight = (y, msgFn, steps, rootRef) => {
    const x = y.left;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    updateHeight(y);
    updateHeight(x);
    return x;
};

const rotateLeft = (x, msgFn, steps, rootRef) => {
    const y = x.right;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    updateHeight(x);
    updateHeight(y);
    return y;
};

// Helper to push step
const pushStep = (steps, root, msg, nodeId = null) => {
    steps.push({
        root: clone(root),
        msg,
        nodeId,
        visitOrder: [], // Optional, for consistency with traversals
        pathIds: []
    });
};

/*
 * Generates steps for AVL Insertion.
 * Note: To correctly animate, we need to capture the state of the *entire tree* at each significant step.
 * Since we are doing recursive functional updates, we need a way to 'place' the modified subtree back into the full root for the snapshot.
 *
 * Easier approach for visualization: Mutate a clone of the tree and snapshot it.
 * But our buildAVL uses functional style somewhat.
 *
 * Let's use a recursive function that returns the new node, but also snapshots the GLOBAL root.
 * To do this, we can pass a 'path from root' or similar, but since we want to show the WHOLE tree,
 * we might need to mutate the 'current root being built' in place if we want snapshots to reflect it easily,
 * OR typically visualization requires a mutable structure we can snapshot.
 *
 * Let's stick to the functional style but rebuild the tree 'upwards' and snapshot the result? 
 * That's hard because we need the PARENT to point to the new child before snapshotting.
 *
 * Alternative: Pass the 'global root' object and mutate it in place (and its children).
 * Then snapshot.
 */

export const generateAVLInsertionSteps = (startRoot, value, ta) => {
    const steps = [];
    // We work on a clone to not mess up the actual state until done
    let rootClone = startRoot ? clone(startRoot) : null;

    // We need to support 'visualizing' the traversal down.
    // Since standard recursion hides the 'parent' connection until return,
    // we will implement a recursive function that mutations 'node' in place.
    // And if 'node' changes (like rotation), we return it so parent can update its reference.

    const insertHelp = (node, val) => {
        if (!node) {
            const newNode = { id: `node_${val}_${Date.now()}`, value: val, h: 1, left: null, right: null };
            // Special case: if tree was empty, this is the new root.
            // We can't snapshot 'rootClone' here easily if we don't know where we are.
            // But we can check if rootClone is null.
            return newNode;
        }

        pushStep(steps, rootClone, ta('inorder_visit', { v: node.value }), node.id);

        if (val < node.value) {
            node.left = insertHelp(node.left, val);
        } else {
            node.right = insertHelp(node.right, val);
        }

        // Update height
        node.h = 1 + Math.max(height(node.left), height(node.right));

        // Check balance
        const bf = balanceFactor(node);

        // Snapshots for balance check?? Might be too detailed. 
        // Let's snapshot after rotation.

        if (bf > 1) {
            // LL
            if (val < node.left.value) {
                pushStep(steps, rootClone, ta('avl_insert_ll'), node.id);
                const newNode = rotateRight(node);
                return newNode;
            }
            // LR
            else {
                pushStep(steps, rootClone, ta('avl_insert_lr'), node.id);
                node.left = rotateLeft(node.left);
                const newNode = rotateRight(node);
                return newNode;
            }
        }

        if (bf < -1) {
            // RR
            if (val > node.right.value) {
                pushStep(steps, rootClone, ta('avl_insert_rr'), node.id);
                const newNode = rotateLeft(node);
                return newNode;
            }
            // RL
            else {
                pushStep(steps, rootClone, ta('avl_insert_rl'), node.id);
                node.right = rotateRight(node.right);
                const newNode = rotateLeft(node);
                return newNode;
            }
        }

        return node;
    };

    // Wrapper to handle root replacement
    if (!rootClone) {
        rootClone = { id: `node_${value}_${Date.now()}`, value: value, h: 1, left: null, right: null };
        pushStep(steps, rootClone, ta('inorder_visit', { v: value }), rootClone.id);
    } else {
        rootClone = insertHelp(rootClone, value);
        // Final snapshot
        pushStep(steps, rootClone, ta('avl_general_2'), null);
    }

    return steps;
};


export const generateAVLDeletionSteps = (startRoot, value, ta) => {
    const steps = [];
    let rootClone = startRoot ? clone(startRoot) : null;
    if (!rootClone) return []; // Empty

    const minValueNode = (node) => {
        let current = node;
        while (current.left !== null) current = current.left;
        return current;
    };

    const deleteHelp = (node, val) => {
        if (!node) return node;

        pushStep(steps, rootClone, ta('inorder_visit', { v: node.value }), node.id);

        if (val < node.value) {
            node.left = deleteHelp(node.left, val);
        } else if (val > node.value) {
            node.right = deleteHelp(node.right, val);
        } else {
            // Found node to delete
            if ((node.left === null) || (node.right === null)) {
                let temp = node.left ? node.left : node.right;
                if (!temp) {
                    // No child case
                    temp = node;
                    node = null;
                } else {
                    // One child case
                    // Copy contents
                    // In JS object ref, better to replace the node object entirely if possible,
                    // or copy props. Let's return temp.
                    node = temp;
                }
            } else {
                // Two children
                const temp = minValueNode(node.right);
                node.value = temp.value; // Copy value
                // Delete successor
                node.right = deleteHelp(node.right, temp.value);
            }
        }

        if (!node) return node;

        node.h = 1 + Math.max(height(node.left), height(node.right));
        const bf = balanceFactor(node);

        if (bf > 1) {
            // LL
            if (balanceFactor(node.left) >= 0) {
                pushStep(steps, rootClone, ta('avl_delete_ll'), node.id);
                return rotateRight(node);
            }
            // LR
            else {
                pushStep(steps, rootClone, ta('avl_delete_lr'), node.id);
                node.left = rotateLeft(node.left);
                return rotateRight(node);
            }
        }
        if (bf < -1) {
            // RR
            if (balanceFactor(node.right) <= 0) {
                pushStep(steps, rootClone, ta('avl_delete_rr'), node.id);
                return rotateLeft(node);
            }
            // RL
            else {
                pushStep(steps, rootClone, ta('avl_delete_rl'), node.id);
                node.right = rotateRight(node.right);
                return rotateLeft(node);
            }
        }
        return node;
    };

    rootClone = deleteHelp(rootClone, value);
    pushStep(steps, rootClone, ta('avl_general_2'), null);

    return steps;
};
