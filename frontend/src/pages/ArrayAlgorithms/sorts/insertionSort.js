// Insertion Sort: returns { steps, result }
export const insertionSort = (array, asc = true) => {
  const a = array.slice();
  const stepsLocal = [];
  for (let i = 1; i < a.length; i++) {
    let key = a[i];
    let j = i - 1;
    // announce key for this pass
    stepsLocal.push({ type: 'key', keyVal: key, keyPos: i, i, a: a.slice(), msg: `Anahtar: a[${i}]=${key}` });
    while (j >= 0) {
      const cond = (asc && a[j] > key) || (!asc && a[j] < key);
      // compare current j with key position j+1
      stepsLocal.push({ type: 'compare', i: j+1, j, keyVal: key, keyPos: j+1, a: a.slice(), msg: `Karşılaştır: a[${j}]=${a[j]} ${asc ? '>' : '<'} key=${key} ? ${cond ? 'Evet → kaydır' : 'Hayır'}` });
      if (!cond) break;
      a[j + 1] = a[j];
      stepsLocal.push({ type: 'shift', from: j, to: j + 1, keyVal: key, keyPos: j, a: a.slice(), msg: `Kaydır: a[${j}] → a[${j+1}]` });
      j--;
    }
    a[j + 1] = key;
    stepsLocal.push({ type: 'insert', idx: j + 1, value: key, keyPos: j + 1, a: a.slice(), msg: `Ekle: key=${key} → index ${j+1}` });
    stepsLocal.push({ type: 'sorted', mode: 'prefix', index: i, a: a.slice(), msg: `Sabitlendi: prefix sonu ${i}` });
  }
  return { steps: stepsLocal, result: a };
};
