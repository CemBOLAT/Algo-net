// Bubble Sort: returns { steps, result }
export const bubbleSort = (array, asc = true) => {
  const a = array.slice();
  const stepsLocal = [];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      const willSwap = (asc && a[j] > a[j+1]) || (!asc && a[j] < a[j+1]);
      stepsLocal.push({
        type: 'compare',
        j, j1: j+1,
        a: a.slice(),
        willSwap,
        msg: `Karşılaştır: a[${j}]=${a[j]} ${asc ? '>' : '<'} a[${j+1}]=${a[j+1]} ? ${willSwap ? 'Evet → Takas' : 'Hayır → Takas yok'}`
      });
      if (willSwap) {
        [a[j], a[j+1]] = [a[j+1], a[j]];
        stepsLocal.push({ type: 'swap', j, j1: j+1, a: a.slice(), msg: `Takas: a[${j}] ↔ a[${j+1}]` });
      }
    }
    const sortedIdx = a.length - 1 - i;
    stepsLocal.push({ type: 'sorted', mode: 'tail', index: sortedIdx, a: a.slice(), msg: `Sabitlendi: son indeks ${sortedIdx}` });
  }
  return { steps: stepsLocal, result: a };
};
