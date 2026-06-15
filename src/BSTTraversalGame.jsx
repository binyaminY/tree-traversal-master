import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Data ─────────────────────────────────────────────────────────────────────

// Level-order (BFS) arrays — null = no node at this position.
// All trees are arbitrary binary trees (NOT BST) — values are deliberately shuffled.
const TREE_SETS = {
  easy: [
    // 3 nodes — left > root
    [5, 8, 2],
    // 3 nodes — right < root
    [7, 2, 4],
    // 3 nodes — both wrong sides
    [6, 9, 1],
    // 5 nodes — left subtree has violations
    [4, 9, 2, 5, 11],
    // 5 nodes — right subtree violations
    [8, 3, 5, null, null, 9, 1],
    // 5 nodes — left chain, 13 > root
    [5, 9, null, 13],
    // 5 nodes — right chain, right child < its right child's parent
    [2, null, 8, null, 3],
    // 7 nodes perfect — left > root
    [5, 8, 3, 6, 10, 1, 7],
    // 7 nodes perfect — shuffled
    [10, 15, 4, 12, 18, 2, 7],
    // LR zigzag — left > root
    [3, 7, null, null, 4],
    // RL zigzag — right < root
    [9, null, 4, 6],
    // 5 nodes asymmetric — inner violation
    [5, 3, 8, null, 7, 2],
    // 5 nodes — outer leaves swapped
    [6, 9, 3, 12, null, null, 1],
    // 5 nodes — right < left
    [8, 5, 3, 9, 2],
    // 4 nodes — left chain with violation deep
    [10, 3, null, 8],
    // 4 nodes — right subtree then left
    [4, null, 2, 7, 1],
    // 7 nodes — alternating violations
    [6, 4, 9, 8, 2, 11, 3],
    // 5 nodes — mixed sides
    [7, 11, 3, null, 5],
    // 7 nodes perfect — all levels violate
    [4, 6, 2, 7, 5, 3, 1],
    // 7 nodes — deep zigzag
    [1, null, 6, 9, 4],
  ],

  medium: [
    // 7 nodes — perfect, left > root
    [5, 9, 3, 7, 11, 1, 6],
    // 7 nodes — perfect, shuffled
    [8, 12, 4, 9, 15, 2, 7],
    // 7 nodes — perfect, reversed levels
    [10, 4, 15, 12, 2, 18, 7],
    // 7 nodes — inner violation
    [6, 2, 10, 4, 1, 13, 7],
    // 9 nodes — left heavy, violations in depth
    [9, 3, 14, 6, 1, 11, 17, 8, 4],
    // 9 nodes — right heavy, deep violations
    [5, 2, 11, null, null, 8, 14, 6, 10, 12, 16],
    // 9 nodes — left > root, tree extends right
    [7, 13, 4, 10, 16, 2, 8, 12, 9],
    // 9 nodes — all violations at depth 2
    [10, 6, 15, 9, 3, 18, 11, 7, 11, 1, 5],
    // 9 nodes — shuffled perfect
    [6, 10, 3, 14, 8, 1, 5, 12, 16],
    // 9 nodes — mirror of expected BST
    [8, 5, 12, 9, 2, 7, 15, null, null, 1, 4],
    // 9 nodes — alternating big/small
    [4, 8, 2, 11, 6, 1, 5, 9, 13],
    // 9 nodes — deep left violations
    [12, 7, 18, 10, 4, 16, 22, 8, 11],
    // 11 nodes — near-perfect shuffled
    [7, 11, 4, 2, 9, 6, 1, 8, 13, 3, 10],
    // 11 nodes — perfect shape, non-BST values
    [10, 16, 5, 12, 20, 2, 9, 18, 14, 22, 17],
    // 11 nodes — large values shuffled
    [20, 30, 8, 5, 35, 25, 15, 3, 7, 12, 18],
    // 9 nodes — zigzag large
    [15, 6, 20, 12, 2, 22, 10, 8, 14],
    // 9 nodes — deep right violations
    [3, 8, 1, 12, 5, null, 4, null, null, null, null, 9, 2],
    // 7 nodes — reversed BST
    [10, 7, 14, 12, 5, 16, 9],
    // 9 nodes — holes in the middle
    [9, 14, 4, null, 17, 2, null, null, null, 12, 19],
    // 11 nodes — complex asymmetric
    [6, 9, 3, 12, 7, 1, 8, null, null, 5, 10, null, null, null, 4],
  ],

  hard: [
    // 15 nodes perfect — left > root throughout
    [8, 12, 4, 14, 10, 6, 2, 15, 13, 11, 9, 7, 5, 3, 1],
    // 15 nodes perfect — different shuffle
    [5, 9, 3, 12, 6, 1, 7, 14, 10, 4, 8, 2, 11, 13, 15],
    // 15 nodes perfect — large values shuffled
    [10, 16, 4, 12, 20, 2, 8, 18, 14, 22, 17, 1, 5, 7, 9],
    // 15 nodes perfect — alternating
    [6, 10, 4, 8, 13, 2, 7, 11, 9, 12, 15, 1, 5, 3, 14],
    // 15 nodes perfect — reversed top
    [20, 30, 10, 5, 35, 15, 25, 3, 7, 32, 38, 12, 18, 23, 28],
    // 15 nodes — big/small alternating
    [9, 14, 4, 11, 17, 2, 7, 13, 10, 16, 19, 1, 5, 3, 8],
    // 11 nodes — heavy left, shuffled
    [7, 13, 3, 10, 16, 1, 5, 14, 11, 18, 15],
    // 11 nodes — heavy right, shuffled
    [4, 7, 2, 9, 5, null, 1, 11, 8, 3, 6],
    // 11 nodes — zigzag at every level
    [50, 35, 70, 60, 25, 80, 45, 55, 62, 20, 30],
    // 13 nodes — deep asymmetric
    [6, 11, 2, 8, 14, null, 4, 10, 7, 12, 16, null, null, 1, 5],
    // 13 nodes — left chain dominant
    [3, 8, 1, 11, 6, null, 2, 14, 9, 4, 7, null, null, null, null],
    // 15 nodes — mirrored BST shape, non-BST values
    [12, 5, 18, 9, 2, 14, 22, 7, 10, 1, 4, 11, 16, 20, 25],
    // 15 nodes — complex mixed
    [15, 8, 22, 12, 4, 18, 27, 9, 14, 2, 6, 16, 20, 25, 30],
    // 15 nodes — only right violations
    [11, 7, 15, 13, 4, 12, 18, 9, 14, 2, 6, 10, 16, 8, 17],
    // 15 nodes — spiral pattern
    [1, 5, 3, 8, 2, null, 7, 10, 6, null, null, null, 4, null, 9],
  ],
};

const DIFF = {
  easy:   { label: 'קל',     emoji: '🟢', hint: true,  timeLimit: null, pts: 5  },
  medium: { label: 'בינוני', emoji: '🟡', hint: false, timeLimit: null, pts: 10 },
  hard:   { label: 'קשה',   emoji: '🔴', hint: false, timeLimit: 30,   pts: 20 },
};

const T_TYPES = ['preOrder', 'inOrder', 'postOrder'];

const T_LABELS = {
  preOrder:  'Pre-Order (שורש ← שמאל ← ימין)',
  inOrder:   'In-Order (שמאל ← שורש ← ימין)',
  postOrder: 'Post-Order (שמאל ← ימין ← שורש)',
};

const T_COLORS = {
  preOrder:  'from-pink-400 to-pink-600',
  inOrder:   'from-blue-400 to-blue-600',
  postOrder: 'from-green-400 to-green-600',
};

// ── Tree builders ─────────────────────────────────────────────────────────────

// Extract all values from a tree in BFS (level) order
const extractBFSValues = (tree) => {
  if (!tree) return [];
  const result = [];
  const queue = [tree];
  while (queue.length) {
    const node = queue.shift();
    result.push(node.value);
    if (node.left)  queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return result;
};

// Build a proper BST by inserting values one by one
const buildBST = (values) => {
  const unique = [...new Set(values)];
  if (!unique.length) return null;
  const insert = (root, v) => {
    if (!root) return { value: v, left: null, right: null };
    if (v < root.value) root.left  = insert(root.left,  v);
    else                root.right = insert(root.right, v);
    return root;
  };
  return unique.reduce((root, v) => insert(root, v), null);
};

// Build arbitrary binary tree from BFS level-order array (null = no node)
const buildFromLevelOrder = (arr) => {
  if (!arr?.length || arr[0] == null) return null;
  const root = { value: arr[0], left: null, right: null };
  const queue = [root];
  let i = 1;
  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift();
    if (i < arr.length) {
      if (arr[i] != null) {
        node.left = { value: arr[i], left: null, right: null };
        queue.push(node.left);
      }
      i++;
    }
    if (i < arr.length) {
      if (arr[i] != null) {
        node.right = { value: arr[i], left: null, right: null };
        queue.push(node.right);
      }
      i++;
    }
  }
  return root;
};


const traversal = {
  preOrder(n, r = [])  { if (!n) return r; r.push(n.value); traversal.preOrder(n.left, r);  traversal.preOrder(n.right, r);  return r; },
  inOrder(n, r = [])   { if (!n) return r; traversal.inOrder(n.left, r);  r.push(n.value); traversal.inOrder(n.right, r);  return r; },
  postOrder(n, r = []) { if (!n) return r; traversal.postOrder(n.left, r); traversal.postOrder(n.right, r); r.push(n.value); return r; },
};

// ── Tree layout: inorder-index for x → no overlaps ever ──────────────────────

const countNodes = (n) => n ? 1 + countNodes(n.left) + countNodes(n.right) : 0;
const maxDepth   = (n) => n ? 1 + Math.max(maxDepth(n.left), maxDepth(n.right)) : 0;

const calcPositions = (tree, W = 480) => {
  const n = countNodes(tree);
  const xStep = n > 1 ? (W - 60) / (n - 1) : 0;
  const pos = {};
  let i = 0;
  const assign = (node, depth) => {
    if (!node) return;
    assign(node.left, depth + 1);
    pos[node.value] = { x: n > 1 ? 30 + i * xStep : W / 2, y: 40 + depth * 72 };
    i++;
    assign(node.right, depth + 1);
  };
  assign(tree, 0);
  return pos;
};

// ── Tree SVG ──────────────────────────────────────────────────────────────────

const TreeViz = ({ tree, sequence, correct, gameState, hint, onClickNode }) => {
  const [hovered, setHovered] = useState(null);

  if (!tree) return (
    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <p className="text-gray-400 text-sm">בחר רמת קושי כדי להתחיל</p>
    </div>
  );

  const W = 480;
  const pos = calcPositions(tree, W);
  const depth = maxDepth(tree);
  const H = 40 + depth * 72 + 30;

  const lines = [];
  const addLines = (node) => {
    if (!node) return;
    const p = pos[node.value];
    if (node.left)  { lines.push([p, pos[node.left.value]]);  addLines(node.left);  }
    if (node.right) { lines.push([p, pos[node.right.value]]); addLines(node.right); }
  };
  addLines(tree);

  const nextHint  = hint && gameState === 'playing' ? correct[sequence.length] : null;
  const clickable = gameState === 'playing';

  const nodeColor = (v) => {
    const idx = sequence.indexOf(v);
    if (idx !== -1) return correct[idx] === v ? '#10b981' : '#ef4444';
    if (hovered === v && clickable) return '#3b82f6';
    return '#f3f4f6';
  };

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      className="rounded-lg border border-gray-200 bg-white"
      style={{ maxHeight: Math.min(H, 400) }}
    >
      {lines.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d1d5db" strokeWidth="2" />
      ))}
      {Object.entries(pos).map(([val, { x, y }]) => {
        const v = +val;
        const sel = sequence.includes(v);
        return (
          <g key={val}
            onMouseEnter={() => setHovered(v)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => clickable && onClickNode(v)}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
          >
            {v === nextHint && (
              <circle cx={x} cy={y} r="33" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.8" />
            )}
            {hovered === v && clickable && v !== nextHint && (
              <circle cx={x} cy={y} r="31" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.4" />
            )}
            <circle
              cx={x} cy={y} r="24"
              fill={nodeColor(v)}
              stroke={sel ? '#374151' : '#9ca3af'}
              strokeWidth={sel ? 2.5 : 1.5}
              style={{ transition: 'fill 0.15s' }}
            />
            <text
              x={x} y={y} textAnchor="middle" dy="0.35em"
              fontSize={v > 99 ? '11' : '13'} fontWeight="bold"
              fill={sel ? '#fff' : '#1f2937'}
              pointerEvents="none"
            >
              {val}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export default function BSTTraversalGame() {
  const [difficulty, setDifficulty] = useState(null);
  const [levelIdx,   setLevelIdx]   = useState(0);
  const [travIdx,    setTravIdx]     = useState(0);
  const [tree,       setTree]        = useState(null);
  const [correct,    setCorrect]     = useState([]);
  const [sequence,   setSequence]    = useState([]);
  const [gameState,  setGameState]   = useState('idle');
  const [score,      setScore]       = useState(0);
  const [levelsWon,  setLevelsWon]   = useState(0);
  const [message,    setMessage]     = useState('');
  const [timeLeft,   setTimeLeft]    = useState(null);
  const customInputRef                  = useRef(null);
  const notesRef                        = useRef(null);
  const [showCustom,   setShowCustom]   = useState(false);
  const [customError,  setCustomError]  = useState('');

  const pasteFromClipboard = (ref) => {
    const text = window.prompt('הדבק את הטקסט כאן (Cmd+V) ולחץ אישור:') ?? '';
    if (!text || !ref.current) return;
    const el = ref.current;
    const start = el.selectionStart ?? el.value.length;
    const end   = el.selectionEnd   ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
  };

  const cfg          = difficulty ? DIFF[difficulty] : null;
  const traversalKey = T_TYPES[travIdx % 3];

  // ── Timer ──
  useEffect(() => {
    if (gameState !== 'playing' || !cfg?.timeLimit) return;
    if (timeLeft <= 0) {
      setGameState('lost');
      setMessage('⏰ הזמן נגמר! נסה שוב');
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [gameState, timeLeft, cfg]);

  // ── Core: load a level ──
  const loadLevel = useCallback((diff, lIdx, tIdx, overrideTree = null) => {
    const sets = TREE_SETS[diff];
    const t = overrideTree ?? buildFromLevelOrder(sets[lIdx % sets.length]);
    const tKey = T_TYPES[tIdx % 3];
    const seq = traversal[tKey](t);
    setTree(t);
    setCorrect(seq);
    setSequence([]);
    setGameState('playing');
    setMessage(`🎮 ${T_LABELS[tKey]}`);
    setTimeLeft(DIFF[diff].timeLimit);
  }, []);

  // ── Select difficulty (resets everything) ──
  const selectDifficulty = (diff) => {
    setDifficulty(diff);
    setScore(0);
    setLevelsWon(0);
    setLevelIdx(0);
    setTravIdx(0);
    loadLevel(diff, 0, 0);
  };

  // ── Switch traversal type manually ──
  const selectTraversal = (tIdx) => {
    if (!difficulty || !tree) return;
    setTravIdx(tIdx);
    const tKey = T_TYPES[tIdx % 3];
    setCorrect(traversal[tKey](tree));
    setSequence([]);
    setGameState('playing');
    setMessage(`🎮 ${T_LABELS[tKey]}`);
    setTimeLeft(cfg?.timeLimit ?? null);
  };

  // ── Advance to next level (keep same traversal type, change tree) ──
  const nextLevel = () => {
    if (!difficulty) return;
    const newL = levelIdx + 1;
    setLevelIdx(newL);
    loadLevel(difficulty, newL, travIdx);
  };

  // ── Retry same level ──
  const retry = () => {
    if (!difficulty || !tree) return;
    const tKey = T_TYPES[travIdx % 3];
    setCorrect(traversal[tKey](tree));
    setSequence([]);
    setGameState('playing');
    setMessage('🔄 נסה שוב!');
    setTimeLeft(cfg?.timeLimit ?? null);
  };

  // ── Click a node ──
  const clickNode = (v) => {
    if (gameState !== 'playing') return;
    const newSeq = [...sequence, v];
    setSequence(newSeq);
    if (v !== correct[newSeq.length - 1]) {
      setGameState('lost');
      setMessage(`❌ טעות! הצומת הבא היה ${correct[newSeq.length - 1]}`);
    } else if (newSeq.length === correct.length) {
      const pts = cfg?.pts ?? 10;
      setScore(s => s + pts);
      setLevelsWon(l => l + 1);
      setGameState('won');
      setMessage(`🎉 מצוין! +${pts} נקודות`);
    } else {
      setMessage('✅ נכון! המשך...');
    }
  };

  // ── Convert current tree to BST ──
  const convertToBST = () => {
    if (!tree) return;
    const diff = difficulty ?? 'medium';
    if (!difficulty) setDifficulty('medium');
    const values = extractBFSValues(tree);
    loadLevel(diff, levelIdx, travIdx, buildBST(values));
  };

  // ── Custom tree ──
  const applyCustomTree = () => {
    const raw = customInputRef.current?.value ?? '';
    const vals = raw
      .split(/[,\s]+/)
      .filter(s => s.trim() !== '')
      .map(Number)
      .filter(v => !isNaN(v));
    if (!vals.length) {
      setCustomError('❌ הכנס מספרים מופרדים בפסיקים, לדוגמה: 15, 10, 5, 50');
      return;
    }
    const diff = difficulty ?? 'medium';
    if (!difficulty) setDifficulty('medium');
    setCustomError('');
    setShowCustom(false);
    if (customInputRef.current) customInputRef.current.value = '';
    loadLevel(diff, levelIdx, travIdx, buildFromLevelOrder(vals));
  };

  // ── Message style ──
  const msgStyle =
    message.includes('❌') || message.includes('⏰') ? 'bg-red-50 text-red-700 border-red-200' :
    message.includes('🎉')                           ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
    message.includes('✅')                           ? 'bg-green-50 text-green-700 border-green-200' :
                                                       'bg-blue-50 text-blue-700 border-blue-200';

  const hint         = !!(cfg?.hint && gameState === 'playing');
  const totalLevels  = difficulty ? TREE_SETS[difficulty].length : 1;
  const timerPct     = cfg?.timeLimit ? (timeLeft / cfg.timeLimit) * 100 : 100;
  const timerColor   = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#10b981';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-950 p-4 sm:p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-3">

        {/* Header */}
        <div className="text-center pt-2 pb-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">🌳 Tree Traversal Master</h1>
          <p className="text-purple-300 mt-1 text-sm">תרגל שלושת סוגי מעבר על עצים בינאריים</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'ניקוד', value: score, color: 'text-purple-300' },
            { label: 'שלבים', value: levelsWon, color: 'text-green-400' },
            {
              label: difficulty ? `${(levelIdx % totalLevels) + 1}/${totalLevels}` : 'שלב',
              value: difficulty ? DIFF[difficulty].emoji + ' ' + DIFF[difficulty].label : '—',
              color: 'text-blue-300',
              small: true,
            },
          ].map(({ label, value, color, small }) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <div className="text-xs text-white/50 mb-1">{label}</div>
              <div className={`font-bold ${small ? 'text-base' : 'text-2xl'} ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Difficulty */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <div className="text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">רמת קושי</div>
          <div className="flex gap-2">
            {Object.entries(DIFF).map(([key, d]) => (
              <button
                key={key}
                onClick={() => selectDifficulty(key)}
                className={`flex-1 py-2.5 px-2 rounded-lg font-bold text-sm transition-all ${
                  difficulty === key
                    ? 'bg-white text-purple-900 shadow-lg scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div>{d.emoji} {d.label}</div>
                <div className="text-xs font-normal opacity-70 mt-0.5">
                  {d.timeLimit ? `⏱ ${d.timeLimit}s` : d.hint ? '💡 רמזים' : '🚫 ללא רמזים'}
                </div>
                <div className="text-xs font-normal opacity-70">+{d.pts} נק׳</div>
              </button>
            ))}
          </div>
        </div>

        {/* Traversal selector */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <div className="text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">סוג Traversal</div>
          <div className="flex flex-col sm:flex-row gap-2">
            {T_TYPES.map((type, idx) => (
              <button
                key={type}
                onClick={() => selectTraversal(idx)}
                className={`flex-1 px-3 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  traversalKey === type && difficulty
                    ? `bg-gradient-to-r ${T_COLORS[type]} text-white shadow-lg scale-105`
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {T_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Timer bar (hard mode) */}
        {cfg?.timeLimit && gameState === 'playing' && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>זמן שנותר</span>
              <span className={timeLeft <= 10 ? 'text-red-400 font-bold' : ''}>{timeLeft}s</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
              />
            </div>
          </div>
        )}

        {/* Game area */}
        {tree && (
          <div className="bg-white rounded-xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">העץ שלך</h2>
              {hint && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
                  💡 הצומת הבא מסומן בטבעת צהובה
                </span>
              )}
            </div>

            <TreeViz
              tree={tree}
              sequence={sequence}
              correct={correct}
              gameState={gameState}
              hint={hint}
              onClickNode={clickNode}
            />

            {/* Sequence */}
            <div className="mt-3">
              <div className="text-xs font-bold text-gray-500 mb-1">הסדר שבחרת:</div>
              <div dir="ltr" className="flex gap-1.5 flex-wrap p-2.5 bg-gray-50 rounded-lg min-h-9 items-center border border-gray-200">
                {sequence.length > 0
                  ? sequence.map((val, i) => (
                      <span key={i} className={`px-2.5 py-0.5 rounded font-bold text-white text-sm ${
                        correct[i] === val ? 'bg-green-500' : 'bg-red-500'
                      }`}>{val}</span>
                    ))
                  : <span className="text-gray-400 text-xs">לחץ על הצמתים בסדר הנכון...</span>
                }
              </div>
            </div>

            {/* Progress */}
            {correct.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>התקדמות</span>
                  <span>{sequence.length}/{correct.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-purple-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(sequence.length / correct.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`mt-3 p-2.5 rounded-lg font-bold text-sm border ${msgStyle}`}>
                {message}
              </div>
            )}

            {/* Post-game buttons */}
            {(gameState === 'won' || gameState === 'lost') && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {gameState === 'won' && (
                  <button
                    onClick={() => nextLevel(true)}
                    className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow transition"
                  >
                    הבא ⬅️
                  </button>
                )}
                <button
                  onClick={retry}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow transition"
                >
                  🔄 נסה שוב
                </button>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex gap-2 flex-wrap">
          {gameState === 'playing' && difficulty && (
            <button
              onClick={() => nextLevel(false)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition text-sm"
            >
              ⏭️ דלג לשלב הבא
            </button>
          )}
          <button
            onClick={() => setShowCustom(s => !s)}
            className="px-4 py-2 bg-orange-500/80 hover:bg-orange-500 text-white font-bold rounded-lg transition text-sm"
          >
            ✏️ עץ משלך
          </button>
          {tree && (
            <button
              onClick={convertToBST}
              className="px-4 py-2 bg-indigo-500/80 hover:bg-indigo-500 text-white font-bold rounded-lg transition text-sm"
            >
              🔢 המר ל-BST
            </button>
          )}
          <button
            onClick={() => {
              setDifficulty(null); setTree(null); setSequence([]);
              setGameState('idle'); setMessage(''); setScore(0);
              setLevelsWon(0); setLevelIdx(0); setTravIdx(0);
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition text-sm"
          >
            ↩️ איפוס
          </button>
        </div>

        {/* Custom tree */}
        {showCustom && (
          <div className="bg-white rounded-xl shadow-xl p-4">
            <h3 className="font-bold text-gray-800 mb-3">עץ מותאם אישית</h3>
            <input
              type="text"
              dir="ltr"
              ref={customInputRef}
              defaultValue=""
              onChange={() => setCustomError('')}
              onKeyDown={e => {
                if (e.key === 'Enter') { applyCustomTree(); return; }
                if (e.key === ' ' && customInputRef.current) {
                  const val = customInputRef.current.value;
                  if (/\d$/.test(val)) {
                    e.preventDefault();
                    customInputRef.current.value = val + ', ';
                    setCustomError('');
                  }
                }
              }}
              placeholder="לדוגמה: 5  3  7  2  ← רווח = פסיק אוטומטי"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:border-purple-400 text-gray-800"
              autoFocus
            />
            {customError && (
              <div className="text-red-600 text-sm mb-3 font-bold">{customError}</div>
            )}
            <div className="flex gap-2">
              <button onClick={applyCustomTree}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow transition">
                ✅ צור עץ
              </button>
              <button onClick={() => pasteFromClipboard(customInputRef)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg shadow transition border border-gray-200">
                📋 הדבק
              </button>
              <button onClick={() => { setShowCustom(false); if (customInputRef.current) customInputRef.current.value = ''; }}
                className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded-lg shadow transition">
                ❌ בטל
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700 text-sm">📝 הערות</span>
            <button
              onClick={() => pasteFromClipboard(notesRef)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-200 transition"
            >
              📋 הדבק
            </button>
          </div>
          <textarea
            ref={notesRef}
            dir="ltr"
            defaultValue=""
            placeholder="כתוב כאן הערות חופשיות..."
            rows={3}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-purple-400 resize-y"
          />
        </div>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-sm text-white/70">
          <div className="font-bold text-white/90 mb-2">📖 איך משחקים</div>
          <ul className="space-y-1">
            <li>✔️ בחר רמת קושי ← בחר traversal ← לחץ על הצמתים בסדר</li>
            <li>✔️ 🟢 קל — עצים קטנים + רמז בטבעת צהובה על הצומת הבא</li>
            <li>✔️ 🟡 בינוני — עצים בינוניים, ללא רמזים</li>
            <li>✔️ 🔴 קשה — עצים גדולים + טיימר 30 שניות</li>
            <li>✔️ "דלג" עובר לשלב הבא ללא ניקוד</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
