import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  const items = Array.from({ length: 10 }, (_, index) => index);
  const board = [
    [0,1,0],
    [1,'b',1],
    [0,1,0]
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
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center font-bold"
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default App
