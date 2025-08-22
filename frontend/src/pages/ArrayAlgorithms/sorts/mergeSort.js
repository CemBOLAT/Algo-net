// Merge Sort (iterative) with detailed steps and ranges: returns { steps, result }
export const mergeSort = (array, asc = true) => {
  const a = array.slice();
  const n = a.length;
  const steps = [];
  if (n <= 1) return { steps, result: a };

  for (let width = 1; width < n; width *= 2) {
    for (let l = 0; l < n; l += 2 * width) {
      const m = Math.min(l + width - 1, n - 1);
      const r = Math.min(l + 2 * width - 1, n - 1);
      if (m < l || m + 1 > r) continue; // nothing to merge

      // Copy out left and right into a conceptual buffer (visual only)
      const L = a.slice(l, m + 1);
      const R = a.slice(m + 1, r + 1);
      let buf = new Array(r - l + 1).fill(null);
      steps.push({ type: 'copyOut', l, m, r, L: L.slice(), R: R.slice(), buf: buf.slice(), a: a.slice(), msg: `Dışa kopya: [${l}..${m}] ve [${m+1}..${r}]` });

      // Build buffer by comparing L and R
      let i = 0, j = 0, b = 0;
      while (i < L.length && j < R.length) {
        const takeLeft = asc ? L[i] <= R[j] : L[i] >= R[j];
        steps.push({ type: 'compare', i: l + i, j: m + 1 + j, l, m, r, k: l + b, buf: buf.slice(), a: a.slice(), msg: `Karşılaştır: L=${L[i]} ${asc ? '<=' : '>='} R=${R[j]} → ${takeLeft ? 'L' : 'R'}` });
        const fromIndex = takeLeft ? (l + i) : (m + 1 + j);
        buf[b] = takeLeft ? L[i++] : R[j++];
        steps.push({ type: 'bufferPlace', from: fromIndex, bpos: b, k: l + b, l, m, r, buf: buf.slice(), a: a.slice(), msg: `Buffer[${b}] = ${buf[b]}` });
        b++;
      }
      while (i < L.length) {
        buf[b] = L[i++];
        steps.push({ type: 'bufferPlace', from: l + i - 1, bpos: b, k: l + b, l, m, r, buf: buf.slice(), a: a.slice(), msg: `Buffer[${b}] = ${buf[b]}` });
        b++;
      }
      while (j < R.length) {
        buf[b] = R[j++];
        steps.push({ type: 'bufferPlace', from: m + j, bpos: b, k: l + b, l, m, r, buf: buf.slice(), a: a.slice(), msg: `Buffer[${b}] = ${buf[b]}` });
        b++;
      }

      // Write back buffer into main array
      for (let t = 0; t < buf.length; t++) {
        a[l + t] = buf[t];
        steps.push({ type: 'writeBack', k: l + t, val: buf[t], l, m, r, buf: buf.slice(), a: a.slice(), msg: `Yaz: a[${l + t}] = ${buf[t]}` });
      }
      steps.push({ type: 'sorted', mode: 'range', l, r, buf: buf.slice(), a: a.slice(), msg: `Aralık sıralandı: [${l}..${r}]` });
    }
  }
  return { steps, result: a };
};
