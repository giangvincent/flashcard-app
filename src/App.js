import React, { useState } from 'react';

const schedule = { easy: 1, medium: 3, hard: 7 };

export default function App() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target.result.split(/\n+/).filter(Boolean);
      setCards(data);
      setIndex(0);
    };
    reader.readAsText(file);
  }

  const current = cards[index] ?? 'All done!';

  const next = () => setIndex(i => Math.min(i + 1, cards.length));
  const grade = g => setIndex(i => Math.min(i + schedule[g], cards.length));

  return (
    <div id="app">
      <div id="card" className="front">
        <p id="content">{current}</p>
      </div>
      <div id="controls">
        <input type="file" accept="text/plain" onChange={handleFile} />
        <button id="next" onClick={next}>Next</button>
        {['easy','medium','hard'].map(g => (
          <button key={g} data-grade={g} className="grade-btn" onClick={() => grade(g)}>{g.charAt(0).toUpperCase()+g.slice(1)}</button>
        ))}
        <button id="forget" onClick={next}>Forget</button>
      </div>
    </div>
  );
}