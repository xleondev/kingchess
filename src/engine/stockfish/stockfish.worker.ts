// This worker is loaded via Vite's ?worker syntax and mocked in tests.
// The stockfish npm package (v16) bundles WASM that is difficult to resolve
// in a Vite worker context due to WASM binary path issues. We load Stockfish
// from cdnjs instead, which works cleanly as a web worker script.
declare function importScripts(url: string): void

importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')

// @ts-ignore — Stockfish is loaded globally by importScripts
const engine = typeof Stockfish !== 'undefined' ? Stockfish() : null

if (engine) {
  engine.onmessage = (line: string) => {
    postMessage(line)
  }
}

onmessage = (e: MessageEvent<string>) => {
  engine?.postMessage(e.data)
}
