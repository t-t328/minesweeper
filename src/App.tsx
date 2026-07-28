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
const COLS = 9; // 列数（横）
const ROWS = 9; // 行数（縦）
const createEmptyBoard = (cols: number, rows: number): CellData[] => {
  return Array.from({ length: cols * rows }, (_, index) => ({
    id: index,
    status: 'hidden',
    isMine: false,
    number: 0,
  }));
};
// 盤面を自動生成し、地雷の配置と数字を計算する関数
// --- 🌟【修正】セーフスタート対応の盤面生成関数 ---
const generateBoard = (cols: number, rows: number, safeIndex: number): CellData[] => {
  const safeX = safeIndex % cols;
  const safeY = Math.floor(safeIndex / cols);

  // 1. マスを生成（安全地帯以外で20%の確率でランダムに地雷を配置）
  const initialBoard: CellData[] = Array.from({ length: cols * rows }, (_, index) => {
    const x = index % cols;
    const y = Math.floor(index / cols);

    // 安全地帯（クリックしたマスとその周囲8マス）かどうか
    const isSafeZone = Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1;

    return {
      id: index,
      status: 'hidden',
      isMine: !isSafeZone && Math.random() < 0.2,
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

// ---------------------------------------------------------
// GridCellコンポーネントは元のコードのまま変更なしでOKです！
// ---------------------------------------------------------
function GridCell({ status, number = 0, isMine, exploded, onClick, onRightClick }: CellProps) {
  if (status === "hidden") {
    return (
      <button
        onClick={onClick}
        onContextMenu={onRightClick}
        className="
        w-10 h-10 
        bg-slate-300 
        border-t-2 border-l-2 border-white/80
        border-b-2 border-r-2 border-slate-500
        shadow-md shadow-slate-900/20
        hover:bg-slate-200 
        active:border-t-slate-500 active:border-l-slate-500
        active:border-b-white/80 active:border-r-white/80
        active:shadow-inner active:shadow-slate-900/10
        transition-all duration-75
        flex items-center justify-center
        font-mono font-bold text-xl
        cursor-pointer
        ">
      </button>
    );
  }
  // GridCell関数内の status === "revealed" の部分を修正
  if (status === "revealed") {
    if (isMine) {
      return (
        <div className={`w-10 h-10 flex items-center justify-center font-bold text-xl border border-slate-400 ${exploded ? 'bg-red-500' : 'bg-slate-200'}`}>
          💣
        </div>
      );
    }
    const getNumberColor = (num: number) => {
      // ...（既存の色分けコードそのまま）...
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
        onClick={onClick} /* 👈 これを追加して、開いたマスもクリックできるようにする */
        className="w-10 h-10 bg-slate-200 hover:bg-slate-300 border border-slate-400 flex items-center justify-center font-mono font-bold text-lg select-none cursor-pointer transition-colors" /* 👈 hoverやcursorを追加 */
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
        className="
          w-10 h-10 bg-slate-300 
          border-t-2 border-l-2 border-white/80
          border-b-2 border-r-2 border-slate-500
          flex items-center justify-center text-xl cursor-pointer
        "
      >
        🚩
      </button>
    );
  }
}

// ---------------------------------------------------------
// Appコンポーネントのリファクタリング
// ---------------------------------------------------------
function App() {
  // 関数を使って自動生成するように変更
  const [board, setBoard] = useState<CellData[]>(() => createEmptyBoard(COLS, ROWS));
  // 🌟 新機能: ゲームの状態を管理する state を追加
  type GameState = 'playing' | 'gameOver' | 'gameClear';
  const [gameState, setGameState] = useState<GameState>('playing');
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
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  // 🌟 新機能: 盤面が変化するたびにクリア・ゲームオーバーを判定する
  // --- 🌟 追加: 1秒ごとに時間を進めるタイマーのロジック ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);
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

    if (revealedCount === (COLS * ROWS) - totalMines) {
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
    if (gameState !== 'playing') return; // 👈 プレイ中以外はクリック操作を無視

    setBoard((prevBoard) => {
      // 🌟【重要】もしまだ地雷が配置されていない場合、クリックされたマスを安全地帯として盤面を生成
      const hasMines = prevBoard.some(cell => cell.isMine);
      const currentBoard = hasMines ? prevBoard : generateBoard(COLS, ROWS, id);
      // --- 🌟 追加: 初回クリック時（地雷生成の瞬間）にタイマーを開始 ---
      if (!hasMines) {
        setIsRunning(true);
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
        const x = id % COLS;
        const y = Math.floor(id / COLS);
        const unrevealedNeighbors: number[] = []; // 周囲の開いていないマス(hidden or flagged)
        let flagCount = 0; // 周囲の旗の数

        // 周囲8方向を調査
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
              const neighborId = ny * COLS + nx;
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
          const cx = currentId % COLS;
          const cy = Math.floor(currentId / COLS);

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx;
              const ny = cy + dy;

              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                const neighborId = ny * COLS + nx;
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
        {/* --- ここからカウンター表示領域を追加 --- */}
        <div className="mb-4 p-3 bg-slate-200 border-2 border-slate-300 rounded-md 
          flex justify-between items-center font-mono font-bold text-slate-700 shadow-inner">
          <div className="flex items-center gap-1">
            <span className="text-xl">🚩</span>
            <span>旗: {flagCount}</span>
          </div>
          {/* --- 🌟 追加: タイム表示部分 --- */}
          <div className="flex items-center gap-1">
            <span className="text-xl">⏱️</span>
            <span>タイム: {time}秒</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xl">💣</span>
            <span>残りの爆弾: {estimatedMines}</span>
          </div>
        </div>
        {/* --- ここまで追加 --- */}
        {/* 🌟 新機能: ゲーム状態の表示とリスタートボタン */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xl font-bold text-slate-700">
            {gameState === 'playing' && 'プレイ中...'}
            {gameState === 'gameOver' && 'ゲームオーバー'}
            {gameState === 'gameClear' && '🥳 ゲームクリア！'}
          </div>
          <button
            onClick={() => {
              setBoard(createEmptyBoard(COLS, ROWS)); // 盤面を再生成
              setGameState('playing'); // 状態をプレイ中に戻す
              setTime(0);          // 👈 🌟 追加: タイムを0にリセット
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
          // バッククォート (`) と ${} を使って、COLS 変数を埋め込みます
          style={{ gridTemplateColumns: `repeat(${COLS}, 2.5rem)` }}
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