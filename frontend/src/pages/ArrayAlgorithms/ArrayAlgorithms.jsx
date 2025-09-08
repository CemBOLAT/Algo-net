import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../../utils/auth';
import { Typography, Box, Container, TextField, Button, Paper, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ThemeToggle from '../../components/ThemeToggle';
import TopBar from '../../components/TopBar';
import FlashMessage from '../../components/FlashMessage';
import { linearSearchSteps } from './search/linearSearch';
import { binarySearchSteps } from './search/binarySearch';
// Sorting algorithms (already modularized)
import { bubbleSort } from './sorts/bubbleSort';
import { selectionSort } from './sorts/selectionSort';
import { insertionSort } from './sorts/insertionSort';
import { mergeSort } from './sorts/mergeSort';
import { quickSort } from './sorts/quickSort';
import { heapSort } from './sorts/heapSort';
import { shellSort } from './sorts/shellSort';
import { countingSort } from './sorts/countingSort';
import { radixSort } from './sorts/radixSort';
// Algorithms and controls temporarily removed per request

const ArrayAlgorithms = () => {
    const navigate = useNavigate();
    const [arr, setArr] = useState([]);
    const [value, setValue] = useState('');
    const [mode, setMode] = useState('search'); // 'search' | 'sort'
    const [algorithm, setAlgorithm] = useState('linear-search');
    const [target, setTarget] = useState('');
    const [resultText, setResultText] = useState('');
    const [showEmptyError, setShowEmptyError] = useState(false);
    const [showEmptyTargetError, setShowEmptyTargetError] = useState(false);
    const [steps, setSteps] = useState([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [fastPlaying, setFastPlaying] = useState(false);
    const [order, setOrder] = useState('asc'); // 'asc' | 'desc'
    // stripped state: keep only array and input value

    const addValue = () => {
        if (value === '') return;
        const num = isNaN(Number(value)) ? value : Number(value);
        setArr(a => [...a, num]);
        setValue('');
    };

    const removeAt = (i) => {
        setArr(a => a.filter((_, idx) => idx !== i));
    };

    const handleTree = () => {
        navigate('/tree-algorithms');
    };

    const handleLogout = () => {
        clearTokens();
        navigate('/login');
    };

    const handleCanvas = () => {
        navigate('/graph');
    };

    const handleRun = () => {
        if (arr.length === 0) {
            setShowEmptyError(true);
            setTimeout(() => setShowEmptyError(false), 1000);
            return;
        }
        if (mode === 'search' && !target) {
            setShowEmptyTargetError(true);
            setTimeout(() => setShowEmptyTargetError(false), 1000);
            return;
        }
        const t = isNaN(Number(target)) ? target : Number(target);
        setResultText('');
        setSteps([]);
        setStepIndex(0);
        setPlaying(false);

        if (mode === 'search') {
            if (algorithm === 'linear-search') {
                const { steps: st, result } = linearSearchSteps(arr, t);
                setSteps(st);
                setResultText(result.found ? `Bulundu (index: ${result.index})` : 'Bulunamadı');
            } else if (algorithm === 'binary-search') {
                const { steps: st, result } = binarySearchSteps(arr, t);
                setSteps(st);
                setResultText(result.found ? `Bulundu (sıralı kopyada index: ${result.index})` : 'Bulunamadı');
            }
        } else if (mode === 'sort') {
            let out = { steps: [], result: arr };
            const asc = order === 'asc';
            switch (algorithm) {
                case 'bubble': out = bubbleSort(arr, asc); break;
                case 'selection': out = selectionSort(arr, asc); break;
                case 'insertion': out = insertionSort(arr, asc); break;
                case 'merge': out = mergeSort(arr, asc); break;
                case 'quick': out = quickSort(arr, asc); break;
                case 'heap': out = heapSort(arr, asc); break;
                case 'shell': out = shellSort(arr, asc); break;
                case 'counting': out = countingSort(arr, asc); break;
                case 'radix': out = radixSort(arr, asc); break;
                default: out = { steps: [], result: arr };
            }
            setSteps(out.steps || []);
            setResultText('');
        }
    };

    // basic playback for steps
    const canStep = steps && steps.length > 0;
    const play = () => {
        if (canStep)
            setPlaying(true);
    };
    const fastFinish = () => {
        setStepIndex(0);
        if (canStep)
            setFastPlaying(true);
    };
    const pause = () => setPlaying(false);
    const restart = () => { setPlaying(false); setStepIndex(0); };

    React.useEffect(() => {
        if (!playing) return;
        const id = setInterval(() => {
            setStepIndex((s) => {
                if (s >= Math.max(0, steps.length - 1)) { setPlaying(false); return s; }
                return Math.min(s + 1, steps.length - 1);
            });
        }, 700);
        return () => clearInterval(id);
    }, [playing, steps.length]);
    
    React.useEffect(() => {
        if (!fastPlaying) return;
        const id = setInterval(() => {
            setStepIndex((s) => {
                if (s >= Math.max(0, steps.length - 1)) { setFastPlaying(false); return s; }
                return Math.min(s + 1, steps.length - 1);
            });
        }, 70);
        return () => clearInterval(id);
    }, [fastPlaying, steps.length]);
    const nextStep = () => setStepIndex((s) => Math.min(s + 1, Math.max(0, steps.length - 1)));
    const prevStep = () => setStepIndex((s) => Math.max(0, s - 1));

    // Modular cell props calculator (rules-driven) and small ArrayCell component
    // Replaces long chained if/else with a declarative rules array (predicate => props)
    const computeCellProps = (s, i) => {
        const compareIndices = [];
        if (s?.type === 'compare') { ['i', 'j', 'j1'].forEach(k => { if (Number.isInteger(s[k])) compareIndices.push(s[k]); }); }
        const isCompare = compareIndices.includes(i);
        const isFound = s?.type === 'found' && s.index === i;
        const isL = s?.l === i;
        const isR = s?.r === i;
        const isM = s?.m === i;

        const isBubble = mode === 'sort' && algorithm === 'bubble';
        const isBubbleSwap = isBubble && s?.type === 'swap' && (i === s.j || i === s.j1);
        const isBubbleCompare = isBubble && s?.type === 'compare' && isCompare;
        const bubbleWillSwap = isBubbleCompare ? Boolean(s?.willSwap) : false;

        const isSelectionSwap = (mode === 'sort' && algorithm === 'selection') && s?.type === 'swap' && (i === s.i || i === s.minIdx);
        const isShift = (mode === 'sort' && algorithm === 'insertion') && s?.type === 'shift' && (i === s.from || i === s.to);
        const isInsert = (mode === 'sort' && algorithm === 'insertion') && s?.type === 'insert' && i === s.idx;

        const isMerge = mode === 'sort' && algorithm === 'merge';
        const inMergeRange = isMerge && Number.isInteger(s?.l) && Number.isInteger(s?.r) && i >= s.l && i <= s.r;
        const isWriteBack = isMerge && s?.type === 'writeBack' && i === s.k;

        const isQuick = mode === 'sort' && algorithm === 'quick';
        const inQuickRange = isQuick && Number.isInteger(s?.l) && Number.isInteger(s?.r) && i >= s.l && i <= s.r;
        const isQuickPivot = isQuick && Number.isInteger(s?.qPivotIdx) && i === s.qPivotIdx;
        const isQuickScan = isQuick && ((s?.type === 'scanL' && i === s.i) || (s?.type === 'scanR' && i === s.j));
        const isQuickSwap = isQuick && s?.type === 'swap' && (i === s.i || i === s.j);

        const isHeapify = (mode === 'sort' && algorithm === 'heap') && s?.type === 'heapify' && i === s.i;
        const isLeftChild = (mode === 'sort' && algorithm === 'heap') && (['heapify', 'compareL', 'compareR', 'choose'].includes(s?.type)) && i === s.l;
        const isRightChild = (mode === 'sort' && algorithm === 'heap') && (['heapify', 'compareL', 'compareR', 'choose'].includes(s?.type)) && i === s.r;
        const isHeapSwap = (mode === 'sort' && algorithm === 'heap') && s?.type === 'swap' && (i === s.i || i === s.j);
        const isHeapChosen = (mode === 'sort' && algorithm === 'heap') && s?.type === 'choose' && i === s.largest;

        const isShellKey = (mode === 'sort' && algorithm === 'shell') && s?.type === 'key' && i === s.i;
        const isShellShift = (mode === 'sort' && algorithm === 'shell') && s?.type === 'shift' && (i === s.from || i === s.to);
        const isShellInsert = (mode === 'sort' && algorithm === 'shell') && s?.type === 'insert' && i === s.idx;

        // insertion prefix detection
        let insertionPrefixEnd;
        if (mode === 'sort' && algorithm === 'insertion') {
            for (let k = Math.min(stepIndex, steps.length - 1); k >= 0; k--) {
                const st = steps[k];
                if (st?.type === 'sorted' && st.mode === 'prefix' && Number.isInteger(st.index)) { insertionPrefixEnd = st.index; break; }
            }
        }

        // swap/shift animation predicate
        const swapAnim = mode === 'sort' && (
            (algorithm === 'bubble' && s?.type === 'swap' && (i === s.j || i === s.j1)) ||
            (algorithm === 'selection' && s?.type === 'swap' && (i === s.i || i === s.minIdx)) ||
            (algorithm === 'insertion' && s?.type === 'shift' && (i === s.from || i === s.to))
        );

        // transform predicate (what used to be a big OR list)
        const needsLift = [isCompare, isM, isBubbleSwap, isSelectionSwap, isShift, isInsert, isWriteBack, isQuickSwap, isQuickScan, isQuickPivot, isHeapSwap, isHeapChosen, isShellKey, isShellShift, isShellInsert].some(Boolean);

        // Declarative rules in precedence order. Each rule returns partial props.
        const rules = [
            { test: () => isFound, props: { bgcolor: 'success.light', boxShadow: 6 } },
            { test: () => isBubbleSwap || (isBubbleCompare && bubbleWillSwap), props: { bgcolor: 'success.light', boxShadow: 6 } },
            { test: () => isBubbleCompare && !bubbleWillSwap, props: { bgcolor: 'error.light', boxShadow: 6 } },
            { test: () => isSelectionSwap, props: { bgcolor: 'success.light', boxShadow: 6 } },
            { test: () => isShift, props: { bgcolor: 'warning.light', boxShadow: 6 } },
            { test: () => isInsert, props: { bgcolor: 'success.light', boxShadow: 6 } },
            { test: () => isWriteBack, props: { bgcolor: 'success.light', boxShadow: 6 } },
            { test: () => isQuickSwap, props: { bgcolor: 'success.light', boxShadow: 6 } },
            { test: () => isQuickScan, props: { bgcolor: 'warning.light', boxShadow: 6 } },
            { test: () => isQuickPivot, props: { bgcolor: '#FFCDD2', boxShadow: 6 } },
            { test: () => isHeapSwap, props: { bgcolor: 'success.light', boxShadow: 6 } },
            { test: () => isHeapChosen, props: { bgcolor: '#C5E1A5', boxShadow: 6 } },
            { test: () => isLeftChild, props: { bgcolor: '#BBDEFB', boxShadow: 6 } },
            { test: () => isRightChild, props: { bgcolor: '#F8BBD0', boxShadow: 6 } },
            { test: () => isHeapify, props: { bgcolor: 'action.hover', boxShadow: 6 } },
            { test: () => isShellKey, props: { bgcolor: '#B2DFDB', boxShadow: 6 } },
            { test: () => isShellShift, props: { bgcolor: 'warning.light', boxShadow: 6 } },
            { test: () => isShellInsert, props: { bgcolor: 'success.light', boxShadow: 6 } },
            { test: () => isCompare, props: { bgcolor: 'warning.light', boxShadow: 6 } },
            { test: () => isM, props: { bgcolor: '#8D6E63', boxShadow: 6 } },
            { test: () => isL, props: { bgcolor: '#F8BBD0', boxShadow: 6 } },
            { test: () => isR, props: { bgcolor: '#90CAF9', boxShadow: 6 } },
            { test: () => inMergeRange, props: { bgcolor: 'action.hover', boxShadow: 6 } },
            { test: () => inQuickRange, props: { bgcolor: 'action.hover', boxShadow: 6 } },
            { test: () => (insertionPrefixEnd !== undefined && i <= insertionPrefixEnd), props: { bgcolor: '#FFF8E1', boxShadow: 1 } }
        ];

        const match = rules.find(r => r.test());
        const bgcolor = match ? match.props.bgcolor : 'background.paper';
        const boxShadow = match ? (match.props.boxShadow ?? 1) : 1;

        return { swapAnim, boxShadow, bgcolor, isFound, transform: needsLift ? 'translateY(-8px)' : 'translateY(0)' };
    };

    const ArrayCell = ({ v, i }) => {
        const s = steps[stepIndex];
        const { swapAnim, boxShadow, bgcolor, isFound, transform } = computeCellProps(s, i);
        return (
            <Box key={`${i}-box`} className={swapAnim ? 'swap-anim' : ''} sx={(theme) => ({
                width: 56,
                height: 56,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow,
                bgcolor,
                color: isFound ? theme.palette.common.white : 'inherit',
                transform,
                transition: 'all 240ms ease'
            })}>
                <Typography sx={{ fontWeight: 600 }}>{String(v)}</Typography>
            </Box>
        );
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
            <TopBar
                title="Dizi Algoritmaları"
                actions={[
                    { label: 'Kanvas', onClick: handleCanvas, variant: 'contained', color: 'primary', ariaLabel: 'Kanvas' },
                    { label: 'Ağaç Algoritmaları', onClick: handleTree, variant: 'contained', color: 'primary', ariaLabel: 'Ağaç Algoritmaları' },
                    { label: 'Çıkış Yap', onClick: handleLogout, variant: 'contained', color: 'error', ariaLabel: 'Çıkış Yap' }
                ]}
            />
                

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <FlashMessage severity="error" message={showEmptyError && 'Dizi Boş Olamaz.'} sx={{ mb: 2 }} />
                <FlashMessage severity="error" message={showEmptyTargetError && 'Hedef Boş Olamaz.'} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" label="Değer (Enter ile ekle)" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setResultText(''); setSteps([]); addValue(); } }} />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>İşlem</InputLabel>
                        <Select value={mode} label="İşlem" onChange={(e) => {
                            const v = e.target.value;
                            setMode(v);
                            setResultText('');
                            setSteps([]);
                            setAlgorithm(v === 'search' ? 'linear-search' : 'bubble');
                        }}>
                            <MenuItem value="search">Arama</MenuItem>
                            <MenuItem value="sort">Sıralama</MenuItem>
                        </Select>
                    </FormControl>

                    {mode === 'search' && (
                        <>
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel>Arama Algoritması</InputLabel>
                                <Select value={algorithm} label="Arama Algoritması" onChange={(e) => { setResultText(''); setSteps([]); setAlgorithm(e.target.value); }}>
                                    <MenuItem value="linear-search">Linear Search</MenuItem>
                                    <MenuItem value="binary-search">Binary Search</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField size="small" label="Hedef" value={target} onChange={(e) => { setResultText(''); setSteps([]); setTarget(e.target.value); }} onKeyDown={(e) => { if (e.key === 'Enter') { handleRun(); } }} />
                        </>
                    )}

                    {mode === 'sort' && (
                        <>
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel>Sıralama Algoritması</InputLabel>
                                <Select value={algorithm} label="Sıralama Algoritması" onChange={(e) => { setResultText(''); setSteps([]); setAlgorithm(e.target.value); }}>
                                    <MenuItem value="bubble">Bubble Sort</MenuItem>
                                    <MenuItem value="selection">Selection Sort</MenuItem>
                                    <MenuItem value="insertion">Insertion Sort</MenuItem>
                                    <MenuItem value="merge">Merge Sort</MenuItem>
                                    <MenuItem value="quick">Quick Sort</MenuItem>
                                    <MenuItem value="heap">Heap Sort</MenuItem>
                                    <MenuItem value="shell">Shell Sort</MenuItem>
                                    <MenuItem value="counting">Counting Sort</MenuItem>
                                    <MenuItem value="radix">Radix Sort</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Sıra</InputLabel>
                                <Select value={order} label="Sıra" onChange={(e) => { setResultText(''); setSteps([]); setOrder(e.target.value); }}>
                                    <MenuItem value="asc">Artan</MenuItem>
                                    <MenuItem value="desc">Azalan</MenuItem>
                                </Select>
                            </FormControl>
                        </>
                    )}
                    <Button variant="contained" color="success" onClick={handleRun}>Çalıştır</Button>
                </Box>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6">Dizi</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
                        {arr.map((v, i) => (
                            <Box key={`${v}-${i}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box sx={{ position: 'relative', minWidth: 56, px: 1.5, py: 1, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1, textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: 600 }}>{String(v)}</Typography>
                                    <Tooltip title="Sil" placement="top">
                                        <IconButton
                                            size="small"
                                            onClick={() => { setResultText(''); setSteps([]); removeAt(i); }}
                                            aria-label={`Index ${i} sil`}
                                            sx={(theme) => ({
                                                position: 'absolute',
                                                top: -8,
                                                right: -8,
                                                bgcolor: theme.palette.background.paper,
                                                boxShadow: 1,
                                                width: 28,
                                                height: 28,
                                                '&:hover': { bgcolor: theme.palette.action.hover }
                                            })}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Sonuç</Typography>
                    {/* Boxes visualizer: show step snapshot if present, else show current array */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-end', minHeight: 112 }}>
                        {(steps[stepIndex]?.a ?? arr).map((v, i) => (
                            <ArrayCell key={`${i}-cell`} v={v} i={i} />
                        ))}
                    </Box>

                    {/* Heap Sort tail indicator (extracted elements at the end) */}
                    {mode === 'sort' && algorithm === 'heap' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 0.5 }}>
                            {(steps[stepIndex]?.a ?? arr).map((_, i) => {
                                // latest tail-sorted index (similar to bubble)
                                let tailStart;
                                for (let k = Math.min(stepIndex, steps.length - 1); k >= 0; k--) {
                                    const st = steps[k];
                                    if (st?.type === 'sorted' && st.mode === 'tail' && Number.isInteger(st.index)) { tailStart = st.index; break; }
                                }
                                const isFixedTail = tailStart !== undefined && i >= tailStart;
                                return (
                                    <Box key={`heap-tail-${i}`} sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: isFixedTail ? 'success.main' : 'transparent', boxShadow: isFixedTail ? '0 0 8px 2px rgba(0,255,0,0.6)' : 'none' }} />
                                );
                            })}
                        </Box>
                    )}

                    {/* Merge Sort current range indicator */}
                    {mode === 'sort' && algorithm === 'merge' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 0.5 }}>
                            {(steps[stepIndex]?.a ?? arr).map((_, i) => {
                                const s = steps[stepIndex];
                                const inRange = Number.isInteger(s?.l) && Number.isInteger(s?.r) && i >= s.l && i <= s.r;
                                return (
                                    <Box key={`merge-range-${i}`} sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: inRange ? '#80CBC4' : 'transparent', boxShadow: inRange ? '0 0 8px 2px rgba(128,203,196,0.6)' : 'none' }} />
                                );
                            })}
                        </Box>
                    )}

                    {/* Quick Sort range + pivot indicator rows */}
                    {mode === 'sort' && algorithm === 'quick' && (
                        <>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 0.5 }}>
                                {(steps[stepIndex]?.a ?? arr).map((_, i) => {
                                    const s = steps[stepIndex];
                                    const inRange = Number.isInteger(s?.l) && Number.isInteger(s?.r) && i >= s.l && i <= s.r;
                                    return (
                                        <Box key={`q-range-${i}`} sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: inRange ? '#B39DDB' : 'transparent', boxShadow: inRange ? '0 0 8px 2px rgba(179,157,219,0.6)' : 'none' }} />
                                    );
                                })}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 0.5 }}>
                                {(steps[stepIndex]?.a ?? arr).map((_, i) => {
                                    const s = steps[stepIndex];
                                    const isPivot = Number.isInteger(s?.qPivotIdx) && i === s.qPivotIdx;
                                    return (
                                        <Box key={`q-pivot-${i}`} sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: isPivot ? '#EF9A9A' : 'transparent', boxShadow: isPivot ? '0 0 8px 2px rgba(239,154,154,0.6)' : 'none' }} />
                                    );
                                })}
                            </Box>
                        </>
                    )}

                    {/* Merge Sort buffer row */}
                    {mode === 'sort' && algorithm === 'merge' && steps[stepIndex]?.buf && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 1 }}>
                            {steps[stepIndex].buf.map((bv, bi) => {
                                const s = steps[stepIndex];
                                const isBufPlace = s?.type === 'bufferPlace' && bi === s.bpos;
                                const isBufToWrite = s?.type === 'writeBack' && Number.isInteger(s?.l) && (bi === (s.k - s.l));
                                return (
                                    <Box key={`buf-${bi}`} sx={(theme) => ({
                                        width: 56,
                                        height: 40,
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: (isBufPlace || isBufToWrite) ? 6 : 1,
                                        bgcolor: isBufToWrite ? 'success.light' : (isBufPlace ? 'warning.light' : 'background.paper'),
                                        transform: (isBufPlace || isBufToWrite) ? 'translateY(-4px)' : 'translateY(0)',
                                        transition: 'all 200ms ease'
                                    })}>
                                        <Typography sx={{ fontWeight: 600 }}>{bv === null || bv === undefined ? '' : String(bv)}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {/* Counting Sort count array row */}
                    {mode === 'sort' && algorithm === 'counting' && steps[stepIndex]?.count && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 1, flexWrap: 'wrap' }}>
                            {steps[stepIndex].count.map((cv, ci) => {
                                const s = steps[stepIndex];
                                const isActive = (s?.type === 'tally' && s.idx === ci) || (s?.type === 'writeBack' && (ci + (s?.min ?? 0)) === s.value);
                                return (
                                    <Box key={`cnt-${ci}`} sx={{ width: 56, height: 40, borderRadius: 1, bgcolor: isActive ? 'warning.light' : 'background.paper', boxShadow: isActive ? 6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ fontWeight: 600 }}>{String(cv)}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {/* Radix Sort buckets row */}
                    {mode === 'sort' && algorithm === 'radix' && (steps[stepIndex]?.buckets || steps[stepIndex]?.digit !== undefined) && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 56px)', gap: 1, mt: 1 }}>
                            {Array.from({ length: 10 }).map((_, d) => {
                                const s = steps[stepIndex];
                                const bs = s?.buckets ? s.buckets[d] : [];
                                const isActive = s?.digit === d;
                                return (
                                    <Box key={`bucket-${d}`} sx={{ borderRadius: 1, boxShadow: isActive ? 6 : 1, bgcolor: isActive ? 'warning.light' : 'background.paper', p: 0.5, minHeight: 40 }}>
                                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}>kova {d}</Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {bs && bs.map((val, idx) => (
                                                <Box key={`bucket-${d}-${idx}`} sx={{ borderRadius: 1, bgcolor: 'action.hover', textAlign: 'center' }}>
                                                    <Typography variant="caption">{String(val)}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {/* Insertion Sort key indicator row */}
                    {mode === 'sort' && algorithm === 'insertion' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 0.5 }}>
                            {(steps[stepIndex]?.a ?? arr).map((_, i) => {
                                // find latest key position up to current step
                                let keyPos;
                                for (let k = Math.min(stepIndex, steps.length - 1); k >= 0; k--) {
                                    const st = steps[k];
                                    if (Number.isInteger(st?.keyPos)) { keyPos = st.keyPos; break; }
                                    if (st?.type === 'key' && Number.isInteger(st?.i)) { keyPos = st.i; break; }
                                }
                                const isKey = keyPos !== undefined && i === keyPos;
                                return (
                                    <Box key={`key-${i}`} sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: isKey ? '#7C4DFF' : 'transparent', boxShadow: isKey ? '0 0 8px 2px rgba(124,77,255,0.6)' : 'none' }} />
                                );
                            })}
                        </Box>
                    )}

                    {/* Selection Sort pivot indicator row */}
                    {mode === 'sort' && algorithm === 'selection' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 0.5 }}>
                            {(steps[stepIndex]?.a ?? arr).map((_, i) => {
                                // find latest pivot (minIdx) up to current step
                                let pivotIdx;
                                for (let k = Math.min(stepIndex, steps.length - 1); k >= 0; k--) {
                                    const st = steps[k];
                                    if (Number.isInteger(st?.minIdx)) { pivotIdx = st.minIdx; break; }
                                }
                                const isPivot = pivotIdx !== undefined && i === pivotIdx;
                                return (
                                    <Box key={`pivot-${i}`} sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: isPivot ? '#FFEB3B' : 'transparent', boxShadow: isPivot ? '0 0 8px 2px rgba(255,235,59,0.6)' : 'none' }} />
                                );
                            })}
                        </Box>
                    )}

                    {/* Bubble Sort tail indicator row */}
                    {mode === 'sort' && algorithm === 'bubble' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 0.5 }}>
                            {(steps[stepIndex]?.a ?? arr).map((_, i) => {
                                // find latest tail-sorted index up to current step
                                let tailIdx;
                                for (let k = Math.min(stepIndex, steps.length - 1); k >= 0; k--) {
                                    const st = steps[k];
                                    if (st?.type === 'sorted' && st.mode === 'tail' && Number.isInteger(st.index)) { tailIdx = st.index; break; }
                                }
                                const isTailFixed = tailIdx !== undefined && i >= tailIdx;
                                return (
                                    <Box key={`tail-${i}`} sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: isTailFixed ? 'success.main' : 'transparent', boxShadow: isTailFixed ? '0 0 8px 2px rgba(0,255,0,0.6)' : 'none' }} />
                                );
                            })}
                        </Box>
                    )}

                    {/* Index captions */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mt: 1 }}>
                        {(steps[stepIndex]?.a ?? arr).map((_, i) => (
                            <Typography key={`idx-${i}`} variant="caption" sx={{ width: 56, textAlign: 'center' }}>{i}</Typography>
                        ))}
                    </Box>

                    {/* Step description */}
                    {steps[stepIndex]?.msg && (
                        <Typography sx={{ mt: 1, fontFamily: 'monospace' }} color="text.secondary">
                            {steps[stepIndex].msg}
                        </Typography>
                    )}

                    {/* Step controls */}
                    {canStep && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                            <Button variant="outlined" onClick={prevStep} disabled={stepIndex <= 0}>Geri</Button>
                            {!fastPlaying && (
                                <Button variant="outlined" onClick={fastFinish}>Hızlı Bitir</Button>
                            )}
                            {!playing ? (
                                <Button variant="contained" onClick={play}>Oynat</Button>
                            ) : (
                                <Button variant="contained" onClick={pause}>Duraklat</Button>
                            )}
                            <Button variant="outlined" onClick={restart}>Sıfırla</Button>
                            <Button variant="outlined" onClick={nextStep} disabled={stepIndex >= Math.max(0, steps.length - 1)}>İleri</Button>
                            <Typography sx={{ ml: 2 }}>Adım: {steps.length ? stepIndex + 1 : 0}/{steps.length || 0}</Typography>
                        </Box>
                    )}

                    {/* Result text */}
                    {resultText && (
                        <Typography sx={{ mt: 2 }}>{resultText}</Typography>
                    )}
                </Paper>

            </Container>
        </Box>
    );
};

export default ArrayAlgorithms;
