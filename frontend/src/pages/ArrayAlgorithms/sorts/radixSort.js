// Radix Sort (LSD, non-negative ints): returns { steps, result } with buckets per pass and writeBack
export const radixSort = (array, asc = true) => {
    const a = array.slice().map(x => Math.max(0, Math.floor(Math.abs(Number(x)))));
    const steps = [];
    if (a.length === 0) return { steps, result: [] };
    const max = Math.max(...a);
    let exp = 1;
    while (Math.floor(max / exp) > 0) {
        const buckets = Array.from({ length: 10 }, () => []);
        steps.push({ type: 'pass-start', exp, a: a.slice(), msg: `Basamak (exp=${exp}) ile gruplama` });
        for (let idx = 0; idx < a.length; idx++) {
            const num = a[idx];
            const digit = Math.floor((num / exp) % 10);
            buckets[digit].push(num);
            steps.push({ type: 'bucket', exp, digit, num, idx, buckets: buckets.map(b => b.slice()), a: a.slice(), msg: `a[${idx}]=${num} → kova ${digit}` });
        }
        // write back buckets in order
        const newArr = [];
        for (let d = 0; d < 10; d++) {
            for (const num of buckets[d]) {
                const pos = newArr.length;
                newArr.push(num);
                steps.push({ type: 'writeBack', exp, digit: d, num, pos, buckets: buckets.map(b => b.slice()), a: newArr.slice(), msg: `Yaz: a[${pos}] = ${num} (kova ${d})` });
            }
        }
        a.length = 0; a.push(...newArr);
        steps.push({ type: 'pass-done', exp, a: a.slice(), msg: `Pass bitti exp=${exp}` });
        exp *= 10;
    }
    const result = asc ? a : a.slice().reverse();
    steps.push({ type: 'done', a: result.slice(), msg: 'Radix sort bitti' });
    return { steps, result };
};
