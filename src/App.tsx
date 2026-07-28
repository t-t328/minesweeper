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
  // 修正点1: 1次元配列 (CellData[]) として定義し直しました
  const [board, setBoard] = useState<CellData[]>([
    { id: 0, status: 'hidden', isMine: false, number: 0 },
    { id: 1, status: 'hidden', isMine: false, number: 1 },
    { id: 2, status: 'hidden', isMine: true,  number: 0 }, // 💣 地雷あり
    { id: 3, status: 'hidden', isMine: false, number: 1 },
    { id: 4, status: 'hidden', isMine: false, number: 2 }, // 周囲に2個の地雷
    { id: 5, status: 'hidden', isMine: false, number: 1 },
    { id: 6, status: 'hidden', isMine: true,  number: 0 }, // 💣 地雷あり
    { id: 7, status: 'hidden', isMine: false, number: 1 },
    { id: 8, status: 'hidden', isMine: false, number: 0 },
  ]);

  // 左クリック処理（変更なし・1次元配列になったため正常に動作します）
  const handleCellClick = (id: number) => {
    setBoard((prevBoard) =>
      prevBoard.map((cell) => {
        if (cell.id === id) {
          return { ...cell, status: 'revealed' };
        }
        return cell;
      })
    );
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
        
        {/* CSS Gridを使って3x3の盤面を構成 */}
        <div 
          className="grid gap-0.5 bg-slate-400 border-2 border-slate-500 p-1" 
          style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
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