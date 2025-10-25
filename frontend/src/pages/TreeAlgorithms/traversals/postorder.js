// Emits step objects: { action, nodeId, pathIds, visitOrder, msg }
export default function postorderSteps(root, t) {
    const steps = [];
    const path = [];
    const visit = [];
    const pushStep = (action, node) => {
        steps.push({ action, nodeId: node?.id ?? null, pathIds: [...path], visitOrder: [...visit], msg: message(action, node) });
    };
    const message = (action, node) => {
        if (action === 'done') return t?.('postorder_done') ?? 'Postorder traversal tamamlandı';
        if (!node) return t?.('empty_node') ?? 'Boş düğüm';
        switch (action) {
            case 'enter': return t?.('postorder_enter', { v: node.value }) ?? `Düğüm ${node.value} içine gir (postorder: L, R, N)`;
            case 'goLeft': return t?.('postorder_go_left', { v: node.value }) ?? `Sol alt ağaç: ${node.value} → sol`;
            case 'nullLeft': return t?.('postorder_null_left', { v: node.value }) ?? `Sol boş: ${node.value} için sol çocuk yok, sağ tarafa bak`;
            case 'goRight': return t?.('postorder_go_right', { v: node.value }) ?? `Sağ alt ağaç: ${node.value} → sağ`;
            case 'nullRight': return t?.('postorder_null_right', { v: node.value }) ?? `Sağ boş: ${node.value} için sağ çocuk yok, düğümü ziyaret et`;
            case 'visit': return t?.('postorder_visit', { v: node.value }) ?? `Ziyaret: ${node.value}, üst düğüme geç`;
            default: return `${action} ${node.value}`;
        }
    };
    const dfs = (node) => {
        if (!node) return;
        path.push(node.id); pushStep('enter', node);
        if (node.left) { pushStep('goLeft', node); dfs(node.left); }
        else { pushStep('nullLeft', node); }
        if (node.right) { pushStep('goRight', node); dfs(node.right); }
        else { pushStep('nullRight', node); }
        visit.push(node.id); pushStep('visit', node);
        path.pop();
    };
    dfs(root);
    if (visit.length > 0) {
        steps.push({ action: 'done', nodeId: null, pathIds: [], visitOrder: [...visit], msg: message('done') });
    }
    return steps;
}
