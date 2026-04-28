# KingChess

A kid-friendly chess game with lessons, puzzles, local and online play.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS
- chess.js (move validation)
- Stockfish.js WASM (AI engine, runs in browser)
- Supabase (online P2P real-time)
- Deployed on Cloudflare Pages

## Development

```bash
pnpm install
pnpm dev
```

## Environment Variables

Create `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

Run the SQL in `docs/supabase-schema.sql` in your Supabase SQL editor.

## Deploy to Cloudflare Pages

1. Push to GitHub
2. Connect repo to Cloudflare Pages
3. Build command: `pnpm build`
4. Build output: `dist`
5. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
