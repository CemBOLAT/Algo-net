// linearSearch.js
// Produces a step-by-step trace for visualization
// API: linearSearchSteps(array:any[], target:any) => { steps: Step[], result: { found:boolean, index:number } }
// Step union type examples:
// - { type: 'snapshot', a: any[], note?: string }
// - { type: 'compare', i: number, value: any, a: any[] }
// - { type: 'found', index: number, value: any, a: any[] }

export function linearSearchSteps(array, target) {
  const steps = [];
  const a = array.slice();
  // initial snapshot
  steps.push({ type: 'snapshot', a: a.slice(), note: 'Başlangıç', msg: `Başlangıç dizisi: [${a.join(', ')}]` });
  for (let i = 0; i < a.length; i++) {
    const equal = a[i] === target;
    steps.push({
      type: 'compare',
      i,
      value: a[i],
      a: a.slice(),
      msg: equal
        ? `arr[${i}] == ${String(target)}. bulundu.`
        : `arr[${i}] != ${String(target)}. sonraki indexe bakıyoruz.`
    });
    if (equal) {
      steps.push({ type: 'found', index: i, value: a[i], a: a.slice(), msg: `arr[${i}] == ${String(target)}. bulundu.` });
      return { steps, result: { found: true, index: i } };
    }
  }
  steps.push({ type: 'snapshot', a: a.slice(), msg: `Hedef ${String(target)} bulunamadı.` });
  return { steps, result: { found: false, index: -1 } };
}
