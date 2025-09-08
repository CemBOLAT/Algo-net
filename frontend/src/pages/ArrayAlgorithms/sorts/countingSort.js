// Counting Sort (integers): returns { steps, result } with full count array and writeBack steps
export const countingSort = (array, asc = true) => {
    const a = array.slice();
    const steps = [];
    if (a.length === 0) return { steps, result: [] };
    const min = Math.min(...a);
    const max = Math.max(...a);
    const range = max - min + 1;
    const count = new Array(range).fill(0);
    steps.push({ type: 'initCount', min, max, count: count.slice(), a: a.slice(), msg: `Sayaç başlatıldı: aralık [${min}..${max}]` });
    for (let srcIndex = 0; srcIndex < a.length; srcIndex++) {
        const val = a[srcIndex];
        count[val - min]++;
        steps.push({ type: 'tally', val, idx: val - min, srcIndex, min, max, count: count.slice(), a: a.slice(), msg: `Say: a[${srcIndex}]=${val} → count[${val - min}] = ${count[val - min]}` });
    }
    // Build result in order
    const res = [];
    for (let i = 0; i < count.length; i++) {
        while (count[i]-- > 0) {
            const value = i + min;
            const pos = res.length;
            res.push(value);
            steps.push({ type: 'writeBack', value, pos, min, max, count: count.slice(), a: res.slice(), msg: `Yaz: res[${pos}] = ${value}` });
        }
    }
    const result = asc ? res : res.slice().reverse();
    steps.push({ type: 'done', a: result.slice(), msg: 'Counting sort bitti' });
    return { steps, result };
};
