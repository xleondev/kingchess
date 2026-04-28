// Stockfish.js from cdnjs is built as a self-contained web worker.
// When loaded via importScripts it hooks directly into self.onmessage / self.postMessage
// for standard UCI communication — no Stockfish() factory call needed.
importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
