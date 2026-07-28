import { useState } from 'react'
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
}
// --- ここから追記 ---
// 盤面のサイズを変数化（ここを自由に変更できます！）
const COLS = 9; // 列数（横）
const ROWS = 9; // 行数（縦）

// 盤面を自動生成し、地雷の配置と数字を計算する関数
const generateBoard = (cols: number, rows: number): CellData[] => {
  // 1. マスを生成（20%の確率でランダムに地雷を配置）
  const initialBoard: CellData[] = Array.from({ length: cols * rows }, (_, index) => ({
    id: index,
    status: 'hidden',
    isMine: Math.random() < 0.2,
    number: 0,
  }));

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
  if (status === "revealed") {
    if (isMine) {
      return (
        <div className={`w-10 h-10 flex items-center justify-center font-bold text-xl border border-slate-400 ${exploded ? 'bg-red-500' : 'bg-slate-200'}`}>
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
      <div className="w-10 h-10 bg-slate-200 border border-slate-400 flex items-center justify-center font-mono font-bold text-lg select-none">
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
  const [board, setBoard] = useState<CellData[]>(() => generateBoard(COLS, ROWS));
  // --- ここから追加 ---
  // 1. すでに立てた旗の数
  const flagCount = board.filter((cell) => cell.status === 'flagged').length;

  // 2. まだ開けられていないマスの中に残っている実際の爆弾の数
  const remainingMines = board.filter((cell) => cell.isMine && cell.status !== 'revealed').length;

  // 3. (おまけ) マインスイーパーの伝統的な表示（全体の地雷数 - 旗の数）
  const totalMines = board.filter((cell) => cell.isMine).length;
  const estimatedMines = totalMines - flagCount;
  // --- ここまで追加 ---
  // 左クリック処理（変更なし・1次元配列になったため正常に動作します）
// --- 修正: 連鎖オープン対応のクリック処理 ---
  const handleCellClick = (id: number) => {
    setBoard((prevBoard) => {
      // 1. 状態を安全に更新するため、盤面のディープコピーを作成
      const newBoard = prevBoard.map(cell => ({ ...cell }));
      const clickedCell = newBoard[id];

      // 既に開いているマスや、旗が立っているマスをクリックした場合は何もせず元の状態を返す
      if (clickedCell.status !== 'hidden') {
        return prevBoard;
      }

      // 2. 連鎖オープン処理のために、処理待ちのマスのIDを格納するスタック（配列）を用意
      const stack = [id];

      // スタックが空になるまでループ処理
      while (stack.length > 0) {
        // スタックから1つマスのIDを取り出す
        const currentId = stack.pop()!;
        const currentCell = newBoard[currentId];

        // 既に処理済みの場合はスキップ
        if (currentCell.status !== 'hidden') continue;

        // マスを開く
        currentCell.status = 'revealed';

        // 3. もし開いたマスが「0」かつ「地雷ではない」場合、周囲8方向をスタックに追加する
        if (currentCell.number === 0 && !currentCell.isMine) {
          const x = currentId % COLS;
          const y = Math.floor(currentId / COLS);

          // 周囲8方向のループ
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue; // 自分自身はスキップ

              const nx = x + dx;
              const ny = y + dy;

              // 盤面の範囲内かチェック
              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                const neighborId = ny * COLS + nx;
                const neighborCell = newBoard[neighborId];

                // 周囲のマスがまだ隠されていれば、スタックに追加して後で開く
                if (neighborCell.status === 'hidden') {
                  stack.push(neighborId);
                }
              }
            }
          }
        }
      }

      // 4. 連鎖処理がすべて終わった新しい盤面を返す
      return newBoard;
    });
  };
  // 右クリック処理（変更なし）
  const handleCellRightClick = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
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
        <h1 className="mb-6 text-2xl font-bold text-center text-slate-700">Minesweeper</h1>
        {/* --- ここからカウンター表示領域を追加 --- */}
        <div className="mb-4 p-3 bg-slate-200 border-2 border-slate-300 rounded-md flex justify-between items-center font-mono font-bold text-slate-700 shadow-inner">
          <div className="flex items-center gap-1">
            <span className="text-xl">🚩</span>
            <span>旗: {flagCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xl">💣</span>
            <span>残りの爆弾: {estimatedMines}</span>
          </div>
        </div>
        {/* --- ここまで追加 --- */}
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