// Emits step objects: { action, nodeId, pathIds, visitOrder, msg }
export default function preorderSteps(root, t) {
    const steps = [];
    const path = [];
    const visit = [];
    const pushStep = (action, node) => {
        steps.push({ action, nodeId: node?.id ?? null, pathIds: [...path], visitOrder: [...visit], msg: message(action, node) });
    };
    const message = (action, node) => {
        if (action === 'done') return t?.('preorder_done') ?? 'Preorder traversal tamamlandı';
        if (!node) return t?.('empty_node') ?? 'Boş düğüm';
        switch (action) {
            case 'enter': return t?.('preorder_enter', { v: node.value }) ?? `Düğüm ${node.value} içine gir (preorder: N, L, R)`;
            case 'visit': return t?.('preorder_visit', { v: node.value }) ?? `Ziyaret: ${node.value}`;
            case 'goLeft': return t?.('preorder_go_left', { v: node.value }) ?? `Sol alt ağaç: ${node.value} → sol`;
            case 'goRight': return t?.('preorder_go_right', { v: node.value }) ?? `Sağ alt ağaç: ${node.value} → sağ`;
            default: return `${action} ${node.value}`;
        }
    };
    const dfs = (node) => {
        if (!node) return;
        path.push(node.id); pushStep('enter', node);
        visit.push(node.id); pushStep('visit', node);
        if (node.left) { pushStep('goLeft', node); dfs(node.left); }
        if (node.right) { pushStep('goRight', node); dfs(node.right); }
        path.pop();
    };
    dfs(root);
    if (visit.length > 0) {
        steps.push({ action: 'done', nodeId: null, pathIds: [], visitOrder: [...visit], msg: message('done') });
    }
    return steps;
}
