// Emits step objects: { action, nodeId, pathIds, visitOrder, msg }
export default function inorderSteps(root, t) {
    const steps = [];
    const path = [];
    const visit = [];
    const pushStep = (action, node) => {
        steps.push({ action, nodeId: node?.id ?? null, pathIds: [...path], visitOrder: [...visit], msg: message(action, node) });
    };
    const message = (action, node) => {
        if (action === 'done') return t?.('inorder_done') ?? 'Inorder traversal tamamlandı';
        if (!node) return t?.('empty_node') ?? 'Boş düğüm';
        switch (action) {
            case 'enter': return t?.('inorder_enter', { v: node.value }) ?? `Düğüm ${node.value} içine gir (inorder: L, N, R)`;
            case 'goLeft': return t?.('inorder_go_left', { v: node.value }) ?? `Sol alt ağaç: ${node.value} → sol`;
            case 'nullLeft': return t?.('inorder_null_left', { v: node.value }) ?? `Sol boş: ${node.value} için sol çocuk yok, düğümü ziyaret et ve üst düğüme dön`;
            case 'visit': return t?.('inorder_visit', { v: node.value }) ?? `Ziyaret: ${node.value}`;
            case 'goRight': return t?.('inorder_go_right', { v: node.value }) ?? `Sağ alt ağaç: ${node.value} → sağ`;
            case 'nullRight': return t?.('inorder_null_right', { v: node.value }) ?? `Sağ boş: ${node.value} için sağ çocuk yok, üst düğüme geç`;
            case 'done': return t?.('inorder_done') ?? `Inorder traversal tamamlandı`;
            default: return `${action} ${node.value}`;
        }
    };
    const dfs = (node) => {
        if (!node) return;
        path.push(node.id); pushStep('enter', node);
        if (node.left) { pushStep('goLeft', node); dfs(node.left); }
        else { pushStep('nullLeft', node); }
        visit.push(node.id); pushStep('visit', node);
        if (node.right) { pushStep('goRight', node); dfs(node.right); }
        else { pushStep('nullRight', node); }
        path.pop();
    };
    dfs(root);
    // Final step: ensure all nodes are marked visited and no active path remains
    if (visit.length > 0) {
        steps.push({ 
            action: 'done',
            nodeId: null,
            pathIds: [],
            visitOrder: [...visit],
            msg: message('done')
        });
    }
    return steps;
}
