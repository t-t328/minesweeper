import { useState, useEffect } from 'react'
import './App.css'

type CellStatus = "hidden" | "revealed" | "flagged";
interface CellProps {
  status: CellStatus;
  number?: number;
  isMine?: boolean;
  exploded?: boolean;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}
interface CellData {
  id: number;
  status: CellStatus;
  number: number;
  isMine: boolean;
  exploded?: boolean; // 👈 これを追記
}
// --- ここから追記 ---
// 盤面のサイズを変数化（ここを自由に変更できます！）
// --- 🌟 追加: 難易度（サイズ）のプリセット定義 ---
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: Record<Difficulty, { name: string; cols: number; rows: number }> = {
  easy: { name: '小 (9x9)', cols: 9, rows: 9 },
  medium: { name: '中 (12x12)', cols: 12, rows: 12 },
  hard: { name: '大 (16x16)', cols: 16, rows: 16 },
};

// (cols, rows の固定定数は削除して、Appコンポーネント内で管理します)
const createEmptyBoard = (cols: number, rows: number): CellData[] => {
  return Array.from({ length: cols * rows }, (_, index) => ({
    id: index,
    status: 'hidden',
    isMine: false,
    number: 0,
  }));
};

// ---------------------------------------------------------
// 修正版 GridCell コンポーネント（開いていないマスの影なし）
// ---------------------------------------------------------
function GridCell({ status, number = 0, isMine, exploded, onClick, onRightClick }: CellProps) {
  // 共通のベーススタイル（サイズとFlexbox設定・1pxの均一ボーダー）
  const baseStyle = "w-10 h-10 flex items-center justify-center font-mono font-bold text-xl select-none box-border border border-slate-400";

  if (status === "hidden") {
    return (
      <button
        onClick={onClick}
        onContextMenu={onRightClick}
        className={`
        ${baseStyle}
        // 影を削除し、フラットな背景色を設定
        bg-slate-300 
        // ホバー時は少し明るく
        hover:bg-slate-200 
        // クリック時はさらに明るく（沈み込みの代わりに）
        active:bg-slate-200/50
        transition-colors duration-75
        cursor-pointer
        `}
      >
        {/* 中身は空 */}
      </button>
    );
  }

  if (status === "revealed") {
    if (isMine) {
      return (
        <div className={`
          ${baseStyle}
          ${exploded ? 'bg-red-500' : 'bg-slate-200'}
        `}>
          💣
        </div>
      );
    }

    const getNumberColor = (num: number) => {
      switch (num) {
        case 1: return 'text-blue-600';
        case 2: return 'text-green-600';
        case 3: return 'text-red-600';
        case 4: return 'text-indigo-900';
        case 5: return 'text-amber-800';
        case 6: return 'text-teal-600';
        case 7: return 'text-purple-600';
        case 8: return 'text-pink-600';
        default: return 'text-transparent';
      }
    };

    return (
      <div
        onClick={onClick}
        className={`
          ${baseStyle}
          bg-slate-200 
          hover:bg-slate-300 
          cursor-pointer 
          transition-colors
        `}
      >
        {number > 0 ? (
          <span className={getNumberColor(number)}>{number}</span>
        ) : (
          <span></span>
        )}
      </div>
    );
  }

  if (status === "flagged") {
    return (
      <button
        onContextMenu={onRightClick}
        className={`
          ${baseStyle}
          bg-slate-300 
          cursor-pointer
        `}
      >
        🚩
      </button>
    );
  }

  return null;
}
// 盤面を自動生成し、地雷の配置と数字を計算する関数
// --- 🌟【修正】セーフスタート対応の盤面生成関数 ---
const generateBoard = (cols: number, rows: number, safeIndex: number, mineProbability: number): CellData[] => {
  const safeX = safeIndex % cols;
  const safeY = Math.floor(safeIndex / cols);
  const probability = mineProbability / 100; // パーセンテージを小数に変換

  // 1. マスを生成（安全地帯以外で20%の確率でランダムに地雷を配置）
  const initialBoard: CellData[] = Array.from({ length: cols * rows }, (_, index) => {
    const x = index % cols;
    const y = Math.floor(index / cols);

    // 安全地帯（クリックしたマスとその周囲8マス）かどうか
    const isSafeZone = Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1;

    return {
      id: index,
      status: 'hidden',
      // 🌟 変更: 固定の0.2から動的な確率に変更
      isMine: !isSafeZone && Math.random() < probability,
      number: 0,
    };
  });

  // 2. 地雷以外のマスについて、周囲8方向の地雷の数を計算する
  for (let i = 0; i < initialBoard.length; i++) {
    if (initialBoard[i].isMine) continue;

    const x = i % cols;
    const y = Math.floor(i / cols);
    let mineCount = 0;

    // 周囲8方向をループして確認
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        // 盤面の内側にある場合のみカウント
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          const neighborIndex = ny * cols + nx;
          if (initialBoard[neighborIndex].isMine) {
            mineCount++;
          }
        }
      }
    }
    initialBoard[i].number = mineCount;
  }

  return initialBoard;
};
// --- ここまで追記 ---

// --- 1. レベル1 & レベル2 を網羅したソルバー関数 ---
const solveBoard = (board: CellData[], cols: number, rows: number, safeIndex: number): boolean => {
  // シミュレーション用の盤面データを作成（状態を独立させる）
  const simBoard = board.map(cell => ({
    ...cell,
    simStatus: 'hidden' as 'hidden' | 'revealed' | 'flagged'
  }));

  // 初回クリック位置を開く（0の連鎖オープンもここでシミュレート）
  const openQueue = [safeIndex];
  while (openQueue.length > 0) {
    const idx = openQueue.pop()!;
    if (simBoard[idx].simStatus !== 'hidden') continue;
    simBoard[idx].simStatus = 'revealed';

    // もし数字が0なら周囲も連鎖的に開く
    if (simBoard[idx].number === 0 && !simBoard[idx].isMine) {
      const x = idx % cols;
      const y = Math.floor(idx / cols);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const nId = ny * cols + nx;
            if (simBoard[nId].simStatus === 'hidden') {
              openQueue.push(nId);
            }
          }
        }
      }
    }
  }

  let progress = true;
  while (progress) {
    progress = false;

    // --- レベル1：基本ルール（局所推論） ---
    for (let i = 0; i < simBoard.length; i++) {
      const cell = simBoard[i];
      if (cell.simStatus !== 'revealed' || cell.number === 0) continue;

      const x = i % cols;
      const y = Math.floor(i / cols);
      const hiddenNeighbors: number[] = [];
      let flaggedCount = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const nId = ny * cols + nx;
            if (simBoard[nId].simStatus === 'hidden') {
              hiddenNeighbors.push(nId);
            } else if (simBoard[nId].simStatus === 'flagged') {
              flaggedCount++;
            }
          }
        }
      }

      // 条件A：隠しマス数 ＋ フラグ数 ＝ 数字 ならば、すべて地雷（フラグを立てる）
      if (hiddenNeighbors.length + flaggedCount === cell.number && hiddenNeighbors.length > 0) {
        for (const nId of hiddenNeighbors) {
          if (simBoard[nId].simStatus !== 'flagged') {
            simBoard[nId].simStatus = 'flagged';
            progress = true;
          }
        }
      }

      // 条件B：フラグ数 ＝ 数字 ならば、残りの隠しマスはすべて安全（オープンする）
      if (flaggedCount === cell.number && hiddenNeighbors.length > 0) {
        for (const nId of hiddenNeighbors) {
          if (simBoard[nId].simStatus === 'hidden') {
            simBoard[nId].simStatus = 'revealed';
            progress = true;
          }
        }
      }
    }

    if (progress) continue;

    // --- レベル2：サブセット論理（集合の引き算） ---
    const constraints: { indices: Set<number>; mines: number }[] = [];
    for (let i = 0; i < simBoard.length; i++) {
      const cell = simBoard[i];
      if (cell.simStatus !== 'revealed' || cell.number === 0) continue;

      const x = i % cols;
      const y = Math.floor(i / cols);
      const hiddenIndices = new Set<number>();
      let flaggedCount = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const nId = ny * cols + nx;
            if (simBoard[nId].simStatus === 'hidden') {
              hiddenIndices.add(nId);
            } else if (simBoard[nId].simStatus === 'flagged') {
              flaggedCount++;
            }
          }
        }
      }

      const remainingMines = cell.number - flaggedCount;
      if (hiddenIndices.size > 0) {
        constraints.push({ indices: hiddenIndices, mines: remainingMines });
      }
    }

    // 制約同士を比較して部分集合を検出
    for (let p = 0; p < constraints.length; p++) {
      for (let q = 0; q < constraints.length; q++) {
        if (p === q) continue;
        const c1 = constraints[p];
        const c2 = constraints[q];

        // c1 が c2 の完全な部分集合であるか (c1 ⊂ c2)
        const isSubset = [...c1.indices].every(id => c2.indices.has(id));
        if (isSubset && c1.indices.size < c2.indices.size) {
          const diffIndices = [...c2.indices].filter(id => !c1.indices.has(id));
          const diffMines = c2.mines - c1.mines;

          if (diffMines === 0) {
            // 差分マスはすべて安全
            for (const id of diffIndices) {
              if (simBoard[id].simStatus === 'hidden') {
                simBoard[id].simStatus = 'revealed';
                progress = true;
              }
            }
          } else if (diffMines === diffIndices.length) {
            // 差分マスはすべて地雷
            for (const id of diffIndices) {
              if (simBoard[id].simStatus !== 'flagged') {
                simBoard[id].simStatus = 'flagged';
                progress = true;
              }
            }
          }
        }
      }
    }
  }

  // 最終判定：すべての非地雷マスが露出していればクリア可能（true）
  return simBoard.every(cell => cell.isMine || cell.simStatus === 'revealed');
};

// --- 2. 解けるまで再生成を繰り返すラッパー関数 ---
const generateGuessFreeBoard = (cols: number, rows: number, safeIndex: number, mineProbability: number): CellData[] => {
  let attempts = 0;
  while (attempts < 1000) { // 無限ループ防止の保険
    // 既存の generateBoard 関数を流用してランダム配置を作成
    const candidateBoard = generateBoard(cols, rows, safeIndex, mineProbability); // ※mineProbability引数に注意

    // ソルバーに通して最後まで解けるか検証
    if (solveBoard(candidateBoard, cols, rows, safeIndex)) {
      return candidateBoard; // 運ゲーなしで解ける盤面なら決定！
    }
    attempts++;
  }
  // 万が一見つからなかった場合は最後の候補をそのまま返す
  return generateBoard(cols, rows, safeIndex, mineProbability);
};

// ---------------------------------------------------------
// Appコンポーネントのリファクタリング
// ---------------------------------------------------------
function App() {
  // 🌟 追加: 選択中の難易度を管理するステート（初期値は 'easy'）
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  // 🌟 追加: 地雷確率を管理するステート（初期値: 20%）
  const [mineProbability, setMineProbability] = useState<number>(20);

  // 現在の列数・行数を取得
  const cols = DIFFICULTIES[difficulty].cols;
  const rows = DIFFICULTIES[difficulty].rows;

  const [board, setBoard] = useState<CellData[]>(() => createEmptyBoard(cols, rows));

  // ... (タイマーやゲーム状態のステートはそのまま)
  // 関数を使って自動生成するように変更
  // const [board, setBoard] = useState<CellData[]>(() => createEmptyBoard(cols, rows));
  // 🌟 新機能: ゲームの状態を管理する state を追加
  // 🌟 修正: 'standby' を追加
  type GameState = 'standby' | 'playing' | 'gameOver' | 'gameClear';
  // 🌟 修正: 初期状態を 'standby' に設定
  const [gameState, setGameState] = useState<GameState>('standby');
  // --- ここから追加 ---
  // 1. すでに立てた旗の数
  const flagCount = board.filter((cell) => cell.status === 'flagged').length;

  // 2. まだ開けられていないマスの中に残っている実際の爆弾の数
  // const remainingMines = board.filter((cell) => cell.isMine && cell.status !== 'revealed').length;

  // 3. (おまけ) マインスイーパーの伝統的な表示（全体の地雷数 - 旗の数）
  const totalMines = board.filter((cell) => cell.isMine).length;
  const estimatedMines = totalMines - flagCount;
  // --- ここまで追加 ---
  // --- 🌟 追加: タイマー用の State ---
  // --- 🌟 変更: ミリ秒単位で時間を管理する State ---
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  // --- 🌟 追加: 1秒ごとに時間を進めるタイマーのロジック ---
  // --- 🌟 変更: requestAnimationFrame を使った高精度タイマー ---
  useEffect(() => {
    let animationFrameId: number;
    // タイマー再開時や開始時のズレを防ぐため、基準となる開始時刻を計算
    let startTime = Date.now() - elapsedTime;

    if (isRunning) {
      const updateTimer = () => {
        setElapsedTime(Date.now() - startTime);
        animationFrameId = requestAnimationFrame(updateTimer);
      };
      animationFrameId = requestAnimationFrame(updateTimer);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning]);
  // 🌟 新機能: 盤面が変化するたびにクリア・ゲームオーバーを判定する
  useEffect(() => {
    // プレイ中でなければ判定処理を行わない
    if (gameState !== 'playing') return;

    // ① ゲームオーバー判定: 「開かれている(revealed)」かつ「地雷(isMine)」のマスが1つでもあればアウト
    const isGameOver = board.some(cell => cell.status === 'revealed' && cell.isMine);
    if (isGameOver) {
      setGameState('gameOver');
      setIsRunning(false); // 👈 🌟 追加: ゲームオーバー時にタイマー停止
      // すべての地雷を強制的に表示する（踏んだ地雷は exploded を true にして赤くする）
      setBoard(prev => prev.map(cell =>
        cell.isMine
          ? { ...cell, status: 'revealed', exploded: cell.status === 'revealed' }
          : cell
      ));
      return;
    }

    // ② ゲームクリア判定: (全マス数 - 地雷の数) と (開かれたマスの数) が一致するか
    const totalMines = board.filter(cell => cell.isMine).length;
    // まだ地雷が配置されていない（初期状態）のときはクリア判定を行わない
    if (totalMines === 0) return;
    const revealedCount = board.filter(cell => cell.status === 'revealed').length;

    if (revealedCount === (cols * rows) - totalMines) {
      setGameState('gameClear');
      setIsRunning(false); // 👈 🌟 追加: ゲームクリア時にタイマー停止
      // クリア演出として、すべての地雷マスに自動で旗を立てる
      setBoard(prev => prev.map(cell =>
        cell.isMine ? { ...cell, status: 'flagged' } : cell
      ));
    }
  }, [board, gameState]); // 👈 board か gameState が変化するたびに実行される
  // 左クリック処理（変更なし・1次元配列になったため正常に動作します）
  // --- 修正: 連鎖オープン対応のクリック処理 ---
  // --- 修正: ショートカット機能と連鎖オープンを統合したクリック処理 ---
  const handleCellClick = (id: number) => {
    // 🌟 修正: 'standby' または 'playing' のときだけクリックを許可（ゲームオーバー/クリア時は無効）
    if (gameState === 'gameOver' || gameState === 'gameClear') return;
    setBoard((prevBoard) => {
      // 🌟【重要】もしまだ地雷が配置されていない場合、クリックされたマスを安全地帯として盤面を生成
      const hasMines = prevBoard.some(cell => cell.isMine);
      const currentBoard = hasMines ? prevBoard : generateGuessFreeBoard(cols, rows, id, mineProbability);
      // --- 🌟 追加: 初回クリック時（地雷生成の瞬間）にタイマーを開始 ---
      if (!hasMines) {
        setIsRunning(true);
        setGameState('playing'); // 👈 🌟 追加: 初手クリック時に 'playing' に切り替える
      }
      const newBoard = currentBoard.map(cell => ({ ...cell }));
      const clickedCell = newBoard[id];

      // 旗が立っているマスをクリックした場合は何もしない
      if (clickedCell.status === 'flagged') {
        return prevBoard;
      }

      const stack: number[] = [];
      let stateChanged = false; // 盤面に変化があったかどうかを判定するフラグ

      // 🌟【新機能】すでに開かれている「数字マス」をクリックした場合
      if (clickedCell.status === 'revealed' && clickedCell.number > 0) {
        const x = id % cols;
        const y = Math.floor(id / cols);
        const unrevealedNeighbors: number[] = []; // 周囲の開いていないマス(hidden or flagged)
        let flagCount = 0; // 周囲の旗の数

        // 周囲8方向を調査
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              const neighborId = ny * cols + nx;
              const neighborCell = newBoard[neighborId];

              if (neighborCell.status !== 'revealed') {
                unrevealedNeighbors.push(neighborId);
                if (neighborCell.status === 'flagged') {
                  flagCount++;
                }
              }
            }
          }
        }

        // 💡 パターンA: 周囲の「開いていないマスの数」と「マスの数字」が同じなら、すべて旗を立てる
        if (unrevealedNeighbors.length === clickedCell.number) {
          unrevealedNeighbors.forEach(nid => {
            if (newBoard[nid].status === 'hidden') {
              newBoard[nid].status = 'flagged';
              stateChanged = true;
            }
          });
        }
        // 💡 パターンB: 周囲の「旗の数」と「マスの数字」が同じなら、残りのマスをすべて開く
        else if (flagCount === clickedCell.number) {
          unrevealedNeighbors.forEach(nid => {
            if (newBoard[nid].status === 'hidden') {
              stack.push(nid); // 開く処理のスタックに追加
            }
          });
        }

        // どちらの条件も満たさない、かつ盤面に変化がない場合は元の状態を返す
        if (stack.length === 0 && !stateChanged) return prevBoard;
      }
      // 🌟【既存機能】隠されているマスを通常クリックした場合
      else if (clickedCell.status === 'hidden') {
        stack.push(id);
      }

      // --- 共通: スタックに積まれたマスを開く処理（連鎖オープン含む） ---
      while (stack.length > 0) {
        const currentId = stack.pop()!;
        const currentCell = newBoard[currentId];

        // 既に処理済みの場合はスキップ
        if (currentCell.status !== 'hidden') continue;

        currentCell.status = 'revealed';
        stateChanged = true;

        // 連鎖オープン：開いたマスが「0」なら周囲をスタックに追加
        if (currentCell.number === 0 && !currentCell.isMine) {
          const cx = currentId % cols;
          const cy = Math.floor(currentId / cols);

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx;
              const ny = cy + dy;

              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                const neighborId = ny * cols + nx;
                if (newBoard[neighborId].status === 'hidden') {
                  stack.push(neighborId);
                }
              }
            }
          }
        }
      }

      // 何か変更があった場合のみ新しい盤面を返す
      return stateChanged ? newBoard : prevBoard;
    });
  };
  // 右クリック処理（変更なし）
  const handleCellRightClick = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (gameState !== 'playing') return; // 👈 プレイ中以外は右クリックを無視
    setBoard((prevBoard) =>
      prevBoard.map((cell) => {
        if (cell.id === id) {
          const newStatus: CellStatus = cell.status === 'hidden' ? 'flagged' : 'hidden';
          return { ...cell, status: newStatus };
        }
        return cell;
      })
    );
  };

  // 修正点2: 描画エリアを統一し、CSS Gridで3列に折り返すようにしました
  return (
    <section id="main" className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="p-10">
        <h1 className="mb-6 text-2xl font-bold text-center !text-slate-950">Minesweeper</h1>
        {/* --- 🌟 追加: タイトルの下のサイズ選択ボタン UI --- */}
        <div className="my-4 flex justify-center gap-2">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setDifficulty(key);
                setBoard(createEmptyBoard(DIFFICULTIES[key].cols, DIFFICULTIES[key].rows));
                setGameState('standby'); // 👈 🌟 追加: 難易度変更時に状態をスタンバイに戻す
                setElapsedTime(0);
                setIsRunning(false);
              }}
              className={`px-3 py-1 rounded-md font-bold text-sm transition-colors ${difficulty === key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
            >
              {DIFFICULTIES[key].name}
            </button>
          ))}
        </div>
        {/* --- ここまで --- */}
        {/* --- 🌟 追加: サイズ選択の下に配置した地雷確率のスライドバー UI --- */}
        <div className="mb-4 flex flex-col items-center gap-1 bg-slate-100 p-3 rounded-md border border-slate-300">
          <div className="flex justify-between w-full max-w-xs text-sm font-bold text-slate-700">
            <span>地雷確率</span>
            <span>{mineProbability}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={mineProbability}
            disabled={isRunning} // 👈 ゲーム開始後はスライドバーを無効化
            onChange={(e) => setMineProbability(Number(e.target.value))}
            className="w-full max-w-xs cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {/* --- ここからカウンター表示領域を追加 --- */}
        <div className="mb-4 p-3 bg-slate-200 border-2 border-slate-300 rounded-md 
          flex justify-between items-center font-mono font-bold text-slate-700 shadow-inner">
          <div className="flex items-center gap-1">
            <span className="text-xl">🚩</span>
            <span>旗: {flagCount}</span>
          </div>
          {/* --- 🌟 追加: タイム表示部分 --- */}
          {/* --- 🌟 変更: ミリ秒を秒に変換し、小数点第2位まで表示 --- */}
          {/* <div className="flex items-center gap-1">
            <span className="text-xl">⏱️</span>
            <span>タイム: {(elapsedTime / 1000).toFixed(2)}秒</span>
          </div> */}
          <div className="flex items-center gap-1">
            <span className="text-xl">💣</span>
            <span>残りの爆弾: {estimatedMines}</span>
          </div>
        </div>
        {/* --- ここまで追加 --- */}
        {/* 🌟 新機能: ゲーム状態の表示とリスタートボタン */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xl font-bold text-slate-700">
            {gameState === 'standby' && 'クリックしてスタート'} {/* 👈 🌟 追加 */}
            {gameState === 'playing' && `タイム: ${(elapsedTime / 1000).toFixed(2)}秒`}
            {gameState === 'gameOver' && 'ゲームオーバー'}
            {gameState === 'gameClear' && `タイム: ${(elapsedTime / 1000).toFixed(2)}秒`}
          </div>
          <button
            onClick={() => {
              setBoard(createEmptyBoard(cols, rows)); // 盤面を再生成
              setGameState('standby'); // 状態をスタンバイに戻す
              setElapsedTime(0);          // 👈 🌟 追加: タイムを0にリセット
              setIsRunning(false); // 👈 🌟 追加: タイマーを停止状態にする
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
            active:bg-blue-700 font-bold shadow-md transition-colors"
          >
            リスタート
          </button>
        </div>
        {/* CSS Gridを使って3x3の盤面を構成 */}
        <div
          className="inline-grid gap-0.5 bg-slate-400 border-2 border-slate-500 p-1"
          // バッククォート (`) と ${} を使って、cols 変数を埋め込みます
          style={{ gridTemplateColumns: `repeat(${cols}, 2.5rem)` }}
        >
          {board.map((cell) => (
            <GridCell
              key={cell.id}
              status={cell.status}
              number={cell.number}
              isMine={cell.isMine}
              exploded={cell.exploded} // 👈 これを追記！
              onClick={() => handleCellClick(cell.id)}
              onRightClick={(e) => handleCellRightClick(e, cell.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default App