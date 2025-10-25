// linearSearch.js
// Produces a step-by-step trace for visualization
// API: linearSearchSteps(array:any[], target:any) => { steps: Step[], result: { found:boolean, index:number } }
// Step union type examples:
// - { type: 'snapshot', a: any[], note?: string }
// - { type: 'compare', i: number, value: any, a: any[] }
// - { type: 'found', index: number, value: any, a: any[] }

export function linearSearchSteps(array, target, t) {
    const steps = [];
    const a = array.slice();
    steps.push({ type: 'snapshot', a: a.slice(), note: 'init', msg: t ? t('arr_initial', { arr: a.join(', ') }) : `Başlangıç dizisi: [${a.join(', ')}]` });
    for (let i = 0; i < a.length; i++) {
        const equal = a[i] === target;
        steps.push({
            type: 'compare',
            i,
            value: a[i],
            a: a.slice(),
            msg: t
                ? (equal ? t('ls_compare_equal', { i, target: String(target) }) : t('ls_compare_not_equal', { i, target: String(target) }))
                : (equal ? `arr[${i}] == ${String(target)}. bulundu.` : `arr[${i}] != ${String(target)}. sonraki indexe bakıyoruz.`)
        });
        if (equal) {
            steps.push({ type: 'found', index: i, value: a[i], a: a.slice(), msg: t ? t('ls_found', { i, target: String(target) }) : `arr[${i}] == ${String(target)}. bulundu.` });
            return { steps, result: { found: true, index: i } };
        }
    }
    steps.push({ type: 'snapshot', a: a.slice(), msg: t ? t('ls_not_found', { target: String(target) }) : `Hedef ${String(target)} bulunamadı.` });
    return { steps, result: { found: false, index: -1 } };
}
