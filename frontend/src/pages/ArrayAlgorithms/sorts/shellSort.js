// Shell Sort: returns { steps, result } with detailed messages and gap/key/compare steps
export const shellSort = (array, asc = true) => {
    const a = array.slice();
    const steps = [];
    let gap = Math.floor(a.length / 2);
    while (gap > 0) {
        steps.push({ type: 'gap', gap, a: a.slice(), msg: `Gap = ${gap}` });
        for (let i = gap; i < a.length; i++) {
            const temp = a[i];
            let j = i;
            steps.push({ type: 'key', gap, i, keyVal: temp, a: a.slice(), msg: `Anahtar: a[${i}]=${temp}` });
            while (j >= gap) {
                const cond = (asc && a[j - gap] > temp) || (!asc && a[j - gap] < temp);
                steps.push({ type: 'compare', gap, i: j, j: j - gap, a: a.slice(), msg: `Karşılaştır: a[${j-gap}]=${a[j-gap]} ${asc ? '>' : '<'} key=${temp} ? ${cond ? 'Evet' : 'Hayır'}` });
                if (!cond) break;
                a[j] = a[j - gap];
                steps.push({ type: 'shift', gap, from: j - gap, to: j, a: a.slice(), msg: `Kaydır: a[${j-gap}] → a[${j}]` });
                j -= gap;
            }
            a[j] = temp;
            steps.push({ type: 'insert', gap, idx: j, value: temp, a: a.slice(), msg: `Ekle: key=${temp} → index ${j}` });
        }
        gap = Math.floor(gap / 2);
    }
    return { steps, result: a };
};
