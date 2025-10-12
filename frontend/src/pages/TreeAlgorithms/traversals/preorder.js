// Emits step objects: { action, nodeId, pathIds, visitOrder, msg }
export default function preorderSteps(root) {
    const steps = [];
    const path = [];
    const visit = [];
    const pushStep = (action, node) => {
        steps.push({ action, nodeId: node?.id ?? null, pathIds: [...path], visitOrder: [...visit], msg: message(action, node) });
    };
    const message = (action, node) => {
        if (action === 'done') return 'Preorder traversal tamamlandı';
        if (!node) return "Boş düğüm";
        switch (action) {
            case 'enter': return `Düğüm ${node.value} içine gir (preorder: N, L, R)`;
            case 'visit': return `Ziyaret: ${node.value}`;
            case 'goLeft': return `Sol alt ağaç: ${node.value} → sol`;
            case 'goRight': return `Sağ alt ağaç: ${node.value} → sağ`;
            case 'backtrack': return `Geri dön: ${node.value}`;
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
