export interface Puzzle {
  id: string
  title: string
  fen: string
  solution: string[]  // UCI moves e.g. ['a1a8']
  hint: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export const PUZZLES: Puzzle[] = [
  {
    id: 'p1',
    title: 'Checkmate in 1',
    fen: 'k7/8/1K6/8/8/8/8/R7 w - - 0 1',
    solution: ['a1a8'],
    hint: 'The rook can deliver checkmate on the back rank.',
    difficulty: 'beginner',
  },
  {
    id: 'p2',
    title: 'Back Rank Mate',
    fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
    solution: ['a1a8'],
    hint: 'The king is trapped by its own pawns!',
    difficulty: 'beginner',
  },
  {
    id: 'p3',
    title: 'Rook Checkmate',
    fen: '7k/8/5KR1/8/8/8/8/8 w - - 0 1',
    solution: ['g6g8'],
    hint: 'The rook delivers checkmate with the king providing support.',
    difficulty: 'beginner',
  },
  {
    id: 'p4',
    title: 'Queen Delivers Check',
    fen: '6k1/5ppp/8/8/8/8/5PP1/6QK w - - 0 1',
    solution: ['g1d4'],
    hint: 'The queen can check the king from a distance.',
    difficulty: 'intermediate',
  },
  {
    id: 'p5',
    title: 'Knight Fork',
    fen: '4k3/4p3/8/8/8/8/8/3NK3 w - - 0 1',
    solution: ['d1f2'],
    hint: 'A knight can attack two pieces at once!',
    difficulty: 'intermediate',
  },
]
