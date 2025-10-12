// Quick Sort with detailed steps: partition ranges, pivot, scans, swaps, and messages
export const quickSort = (array, asc = true) => {
    const a = array.slice();
    const steps = [];
    const sort = (l, r, depth = 0) => {
        if (l >= r) return;
        const qPivotIdx = Math.floor((l + r) / 2);
        const pivot = a[qPivotIdx];
        steps.push({ type: 'partition', l, r, qPivotIdx, pivot, a: a.slice(), msg: `Böl: [${l}..${r}], pivot a[${qPivotIdx}]=${pivot}` });
        let i = l, j = r;
        while (i <= j) {
            while (i <= r && ((asc && a[i] < pivot) || (!asc && a[i] > pivot))) {
                steps.push({ type: 'scanL', i, j, l, r, qPivotIdx, pivot, a: a.slice(), msg: `Sol taraftan ilerle: a[${i}]=${a[i]} ${asc ? '<' : '>'} pivot(${pivot})` });
                i++;
            }
            while (j >= l && ((asc && a[j] > pivot) || (!asc && a[j] < pivot))) {
                steps.push({ type: 'scanR', i, j, l, r, qPivotIdx, pivot, a: a.slice(), msg: `Sağ taraftan ilerle: a[${j}]=${a[j]} ${asc ? '>' : '<'} pivot(${pivot})` });
                j--;
            }
            if (i <= j) {
                const willSwap = i !== j;
                steps.push({ type: 'compare', i, j, l, r, qPivotIdx, pivot, a: a.slice(), msg: `Yer değiştir? i=${i}, j=${j} ${willSwap ? '→ Evet' : '→ Aynı konum'}` });
                [a[i], a[j]] = [a[j], a[i]];
                steps.push({ type: 'swap', i, j, l, r, qPivotIdx, pivot, a: a.slice(), msg: `Takas: a[${i}] ↔ a[${j}]` });
                i++; j--;
            }
        }
        steps.push({ type: 'partition-done', l, r, splitL: [l, j], splitR: [i, r], a: a.slice(), msg: `Bölündü: [${l}..${j}] ve [${i}..${r}]` });
        if (l < j) sort(l, j, depth + 1);
        if (i < r) sort(i, r, depth + 1);
    };
    sort(0, a.length - 1);
    return { steps, result: a };
};
