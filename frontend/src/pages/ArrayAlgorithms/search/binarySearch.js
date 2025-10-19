// binarySearch.js
// Produces a step-by-step trace for visualization using a sorted COPY of the input
// API: binarySearchSteps(array:any[], target:any) => { steps: Step[], result: { found:boolean, index:number } }
// Step examples:
// - { type: 'snapshot', a: any[], note?: string, msg?: string }
// - { type: 'compare', l:number, r:number, m:number, value:any, a:any[], msg?: string }
// - { type: 'found', index:number, value:any, a:any[], msg?: string }

export function binarySearchSteps(array, target, t) {
    const steps = [];
    const a = array.slice().sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)); // sorted COPY
    steps.push({ type: 'snapshot', a: a.slice(), msg: t ? t('sorted_copy', { arr: a.join(', ') }) : `Sıralı kopya: [${a.join(', ')}]` });

    let l = 0, r = a.length - 1;
    while (l <= r) {
        const m = Math.floor((l + r) / 2);
        const val = a[m];
        if (val === target) {
            steps.push({ type: 'compare', l, r, m, value: val, a: a.slice(), msg: t ? t('bs_compare_equal', { l, r, m, val, target: String(target) }) : `L=${l}, R=${r}, M=${m} -> arr[M]=${val} == ${String(target)}. bulundu.` });
            steps.push({ type: 'found', index: m, value: val, a: a.slice(), msg: t ? t('bs_found', { m }) : `Bulundu: index ${m}` });
            return { steps, result: { found: true, index: m } };
        }
        if (val < target) {
            steps.push({ type: 'compare', l, r, m, value: val, a: a.slice(), msg: t ? t('bs_compare_less', { l, r, m, val, target: String(target) }) : `L=${l}, R=${r}, M=${m} -> arr[M]=${val} < ${String(target)}. sol kısmı at, L=M+1` });
            l = m + 1;
        } else {
            steps.push({ type: 'compare', l, r, m, value: val, a: a.slice(), msg: t ? t('bs_compare_greater', { l, r, m, val, target: String(target) }) : `L=${l}, R=${r}, M=${m} -> arr[M]=${val} > ${String(target)}. sağ kısmı at, R=M-1` });
            r = m - 1;
        }
    }
    steps.push({ type: 'snapshot', a: a.slice(), msg: t ? t('bs_not_found', { target: String(target) }) : `Hedef ${String(target)} bulunamadı.` });
    return { steps, result: { found: false, index: -1 } };
}
