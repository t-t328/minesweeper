import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

type CellStatus = "hidden" | "revealed" | "flagged";
interface CellProps {
  status: CellStatus;
  number?: number; //周囲の地雷数
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}
function GridCell({ status, number, onClick, onRightClick }: CellProps) {
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
        {/* 隠れているときは何も表示しない */}
      </button>
    );
  }
  if (status === "revealed") {
    return (
      <div
        className="w-10 h-10 bg-slate-100 border border-slate-400 flex items-center justify-center font-mono font-bold text-xl">
        {number === 0 ? "" : number}
      </div>
    );
  }
  if (status === "flagged") {
    return (
      <div
        className="w-10 h-10 bg-slate-300 border-t-2 border-l-2 border-white/80 border-b-2 border-r-2 border-slate-500 flex items-center justify-center text-red-600 text-2xl">
        🚩
      </div>
    );
  }
}

function App() {
  const [count, setCount] = useState(0);
  const items = Array.from({ length: 10 }, (_, index) => index);
  const board = [
    [0, 1, 0],
    [1, 'b', 1],
    [0, 1, 0]
  ]

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>
      <section id="spacer"></section>

      <section id="main">
        <div className="blocks">
          <div className="flex gap-2 p-4">
            {items.map((num) => (
              <button
                key={num}
                className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded font-bold"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        <div className="minesweeper">
          <div className="flex flex-col gap-1">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((_, cellIndex) => (
                  // <div
                  //   key={cellIndex}
                  //   className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center font-bold"
                  // >
                  //   {cell}
                  // </div>
                  <GridCell
                    key={cellIndex}
                    status="hidden"
                    onClick={() => console.log('clicked')}
                    onRightClick={(e) => { e.preventDefault(); console.log('right clicked'); }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="p-10 bg-slate-50 min-h-screen">
          <h2 className="mb-4 text-xl font-bold">クリック前のデザイン確認</h2>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 2.5rem)' }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <GridCell
                key={i}
                status="hidden"
                onClick={() => console.log('clicked')}
                onRightClick={(e) => { e.preventDefault(); console.log('right clicked'); }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default App
