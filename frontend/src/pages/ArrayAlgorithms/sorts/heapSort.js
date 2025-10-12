// Heap Sort with detailed steps: indicate parent, left/right child, choose and swap, extraction tails
export const heapSort = (array, asc = true) => {
    const a = array.slice();
    const steps = [];
    const heapify = (n, i) => {
        const l = 2 * i + 1; const r = 2 * i + 2;
        steps.push({ type: 'heapify', n, i, l, r, a: a.slice(), msg: `Heapify: i=${i}, sol=${l < n ? l : '-'}, sağ=${r < n ? r : '-'}` });
        let largest = i;
        if (l < n) {
            const betterL = (asc && a[l] > a[largest]) || (!asc && a[l] < a[largest]);
            steps.push({ type: 'compareL', n, i, l, r, a: a.slice(), msg: `Sol çocuk: a[${l}] ${asc ? '>' : '<'} a[${largest}] ? ${betterL ? 'Evet' : 'Hayır'}` });
            if (betterL) largest = l;
        }
        if (r < n) {
            const betterR = (asc && a[r] > a[largest]) || (!asc && a[r] < a[largest]);
            steps.push({ type: 'compareR', n, i, l, r, a: a.slice(), msg: `Sağ çocuk: a[${r}] ${asc ? '>' : '<'} a[${largest}] ? ${betterR ? 'Evet' : 'Hayır'}` });
            if (betterR) largest = r;
        }
        steps.push({ type: 'choose', n, i, l, r, largest, a: a.slice(), msg: `Seçilen düğüm: index ${largest}` });
        if (largest !== i) {
            [a[i], a[largest]] = [a[largest], a[i]];
            steps.push({ type: 'swap', i, j: largest, n, a: a.slice(), msg: `Takas: a[${i}] ↔ a[${largest}]` });
            heapify(n, largest);
        }
    };
    // Build max/min heap
    steps.push({ type: 'build-start', a: a.slice(), msg: 'Heap oluşturuluyor' });
    for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a.length, i);
    steps.push({ type: 'build-done', a: a.slice(), msg: 'Heap hazır' });
    // Extract elements one by one
    for (let end = a.length - 1; end > 0; end--) {
        steps.push({ type: 'extract-start', n: end + 1, a: a.slice(), msg: `Kökü sona taşı: 0 ↔ ${end}` });
        [a[0], a[end]] = [a[end], a[0]];
        steps.push({ type: 'swap', i: 0, j: end, n: end + 1, a: a.slice(), msg: `Takas: a[0] ↔ a[${end}]` });
        steps.push({ type: 'sorted', mode: 'tail', index: end, a: a.slice(), msg: `Sabitlendi: son indeks ${end}` });
        heapify(end, 0);
    }
    return { steps, result: a };
};
