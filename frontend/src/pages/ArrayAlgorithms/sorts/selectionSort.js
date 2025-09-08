// Selection Sort: returns { steps, result }
export const selectionSort = (array, asc = true) => {
    const a = array.slice();
    const stepsLocal = [];
    for (let i = 0; i < a.length; i++) {
        let minIdx = i;
        // Mark initial pivot for this pass
        stepsLocal.push({ type: 'pivot', minIdx, i, a: a.slice(), msg: `Pivot (min) başlatıldı: index ${minIdx}` });
        for (let j = i + 1; j < a.length; j++) {
            const willSelect = (asc && a[j] < a[minIdx]) || (!asc && a[j] > a[minIdx]);
            stepsLocal.push({
                type: 'compare', i, j, minIdx,
                a: a.slice(), willSwap: willSelect,
                msg: `Karşılaştır: a[${j}]=${a[j]} ${asc ? '<' : '>'} a[min]=a[${minIdx}]=${a[minIdx]} ? ${willSelect ? 'Evet → yeni min' : 'Hayır'}`
            });
            if (willSelect) {
                minIdx = j;
                stepsLocal.push({ type: 'pivot', minIdx, i, a: a.slice(), msg: `Yeni min: index ${minIdx}` });
            }
        }
        if (minIdx !== i) {
            [a[i], a[minIdx]] = [a[minIdx], a[i]];
            stepsLocal.push({ type: 'swap', i, minIdx, a: a.slice(), msg: `Takas: a[${i}] ↔ a[${minIdx}]` });
        }
        stepsLocal.push({ type: 'sorted', mode: 'prefix', index: i, a: a.slice(), msg: `Sabitlendi: prefix sonu ${i}` });
    }
    return { steps: stepsLocal, result: a };
};
