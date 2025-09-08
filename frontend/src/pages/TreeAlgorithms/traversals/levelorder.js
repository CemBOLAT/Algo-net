// Level Order (BFS) traversal steps.
// Emits step objects: { action, nodeId, pathIds, visitOrder, queueIds, level, msg }
export default function levelOrderSteps(root) {
    if (!root) return [];
    const steps = [];
    const visit = [];
    // Pre-compute levels for all nodes so we can inform users in messages
    const levelById = new Map();
    (function computeLevels(r) {
        if (!r) return;
        const q = [{ node: r, level: 0 }];
        levelById.set(r.id, 0);
        while (q.length) {
            const { node, level } = q.shift();
            if (node.left) { levelById.set(node.left.id, level + 1); q.push({ node: node.left, level: level + 1 }); }
            if (node.right) { levelById.set(node.right.id, level + 1); q.push({ node: node.right, level: level + 1 }); }
        }
    })(root);

    // Use queue of nodes, but levels are looked up from levelById
    const queue = [root];

    const message = (action, node, extra) => {
        if (action === 'start') return 'Level Order (BFS) başlat: kökü (seviye 0) kuyruğa al';
        if (action === 'dequeue') return `Kuyruktan çıkar: ${node.value} (seviye ${levelById.get(node.id)})`;
        if (action === 'visit') return `Ziyaret: ${node.value} (seviye ${levelById.get(node.id)})`;
        if (action === 'enqueue') return `Kuyruğa ekle: ${extra?.child?.value} (seviye ${levelById.get(extra?.child?.id)})`;
        if (action === 'done') return 'Level Order traversal tamamlandı';
        return `${action} ${node?.value ?? ''}`;
    };

    const push = (action, node, extra) => {
        steps.push({
            action,
            nodeId: node?.id ?? null,
            pathIds: [],
            visitOrder: [...visit],
            queueIds: queue.map(n => n.id),
            level: node?.id != null ? levelById.get(node.id) : null,
            msg: message(action, node, extra)
        });
    };

    push('start', root);
    while (queue.length) {
        const node = queue.shift();
        push('dequeue', node);
        visit.push(node.id);
        push('visit', node);
        if (node.left) { queue.push(node.left); push('enqueue', node, { child: node.left }); }
        if (node.right) { queue.push(node.right); push('enqueue', node, { child: node.right }); }
    }
    push('done', null);
    return steps;
}
