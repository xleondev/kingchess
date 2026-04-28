# KingChess — Design Document

**Date:** 2026-04-28
**Status:** Approved

---

## Overview

A web-based chess game for kids that teaches chess from beginner to advanced. Supports player-vs-player (local and online) and player-vs-machine modes. Designed to be fun, approachable, and educational for mixed-skill children.

---

## Goals

- Teach chess from absolute basics to intermediate/advanced strategy
- Support two play modes: P2P (local + online) and vs Machine (Stockfish.js)
- Kid-friendly UI with animations, sounds, and a coaching character
- No accounts or sign-up required — guest-only experience
- Deployable as a static site to Cloudflare Pages

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS |
| Chess rules & validation | chess.js |
| AI engine | Stockfish.js (WebAssembly, runs in browser) |
| Real-time online P2P | Supabase real-time (anonymous channels) |
| Progress storage | localStorage |
| Deployment | Cloudflare Pages |

---

## Architecture

```
kingchess/
├── src/
│   ├── pages/
│   │   ├── Home        # Landing / mode selector
│   │   ├── Learn       # Lessons + quizzes
│   │   ├── Puzzles     # Tactical puzzles
│   │   ├── Play        # Game screen (all modes)
│   │   └── Profile     # Kid's progress, badges
│   ├── components/
│   │   ├── Board       # Chessboard (drag+drop, legal move highlights)
│   │   ├── Pieces      # SVG pieces (classic, approachable style)
│   │   ├── Coach       # In-game hint/tip overlay (cartoon king character)
│   │   └── UI          # Buttons, modals, badges, toasts
│   ├── engine/
│   │   ├── stockfish/  # Stockfish.js WASM wrapper + difficulty controller
│   │   └── chess/      # chess.js wrapper (moves, validation, game state)
│   ├── lessons/        # Lesson content as JSON/MDX
│   └── lib/
│       └── supabase/   # Real-time client for online P2P only
```

---

## Play Modes

### Local P2P
- Two players on the same device, pass-and-play
- Turn indicator shows whose move (e.g. "Your turn, Alex!")
- No network required

### Online P2P
- Player 1 creates a room → receives a 6-character room code (e.g. KNG-42X)
- Player 2 enters code to join
- Moves sync via Supabase real-time anonymous channel
- No sign-up or account required
- chess.js validates moves on each client independently

### vs Machine
- Powered by Stockfish.js running as a Web Worker in the browser
- Difficulty modes:
  - Easy — Stockfish Elo ~600, very limited depth
  - Medium — Stockfish Elo ~1000, moderate depth
  - Hard — Stockfish Elo ~1500, stronger play
  - Adaptive — adjusts difficulty based on player performance in session

---

## Learning System

### Structured Lessons
7 modules, unlocked in sequence:

1. The Board & Setup
2. How Each Piece Moves (one piece per lesson)
3. Special Moves (castling, en passant, pawn promotion)
4. Check, Checkmate & Stalemate
5. Basic Tactics (forks, pins, skewers)
6. Basic Strategy (center control, piece development)
7. Endgames (king & pawn endings, basic checkmates)

Each lesson contains:
- Written explanation with diagrams
- Interactive board demonstration
- Mini quiz (3 questions) to unlock the next lesson

### In-Game Coach
- Togglable per game
- Legal move dots shown when a piece is selected
- Optional "Hint" button — Stockfish suggests the best move
- Post-game review — highlights blunders and suggests better moves

### Puzzle Mode
- Curated tactical puzzles (checkmate in 1, 2, 3; win material)
- Sorted by difficulty tier
- Kids unlock harder puzzles as they solve easier ones

---

## Progress & Profile

- Kid sets a name and picks an avatar (no account needed)
- Stored in localStorage
- Tracks: lessons completed, puzzles solved, games won
- Badges awarded for milestones (e.g. "First Checkmate!", "Pawn Master", "Scholar's Mate")

---

## UI/UX

### Visual Style
- Classic wooden chessboard look
- Pieces: standard shapes, slightly rounded and friendly
- Warm color palette: deep greens, warm creams, gold accents
- Animations: smooth piece movement, bounce on capture, confetti on win
- Sounds: move click, capture, check warning, win fanfare (all toggleable)

### Kid-Friendly Details
- Large tap targets — works well on tablet
- Legal moves shown as dots on valid squares
- Check shown as red glow on the king
- Captured pieces shown in sidebar tray
- Coach character (cartoon king) delivers tips in speech bubbles
- Clear turn indicator with player name and avatar

### Navigation
- Home: large buttons for Learn / Play / Puzzles / Profile
- Play: choose mode → configure → game starts
- Lessons: progress bar, back/next navigation
- Fully responsive — mobile and tablet friendly

### Accessibility
- High contrast board option
- Sound toggle
- Readable font sizes for young readers

---

## Data Design

### localStorage (client-side)
- kc_profile — name, avatar
- kc_progress — lesson completions, puzzle solves, badge list
- kc_settings — sound on/off, coach on/off, high contrast

### Supabase (online P2P only, anonymous)
- games table — room_code, player_white, player_black, status, pgn
- game_moves table — game_id, move (UCI notation), fen, timestamp
- Real-time subscription per game room, no auth required

---

## Deployment

- Build: vite build → static files in dist/
- Deploy: Cloudflare Pages (connect GitHub repo, auto-deploy on push)
- Environment variables: Supabase URL + anon key (public, safe to expose)
- No server-side rendering, no backend server to maintain

---

## Out of Scope (v1)

- User accounts / cross-device sync
- Tournament or leaderboard features
- Chat between online players
- Mobile native app
