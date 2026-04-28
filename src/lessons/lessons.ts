export interface LessonQuiz {
  question: string
  options: string[]
  correct: number
}

export interface Lesson {
  id: string
  title: string
  description: string
  demoFen: string
  content: string
  quiz: LessonQuiz[]
}

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'The Board & Setup',
    description: 'Learn how the chessboard is arranged and where the pieces go.',
    demoFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    content: 'The chessboard has 64 squares arranged in 8 rows (ranks) and 8 columns (files). White pieces start on ranks 1 and 2, black pieces on ranks 7 and 8. The queen goes on her own color!',
    quiz: [
      { question: 'How many squares does a chessboard have?', options: ['32', '48', '64', '72'], correct: 2 },
      { question: 'Where does the white queen start?', options: ['d1', 'e1', 'd8', 'a1'], correct: 0 },
      { question: 'Which color moves first?', options: ['Black', 'White', 'Either', 'Neither'], correct: 1 },
    ],
  },
  {
    id: 'lesson-2',
    title: 'How Pawns Move',
    description: 'Pawns are the foot soldiers. Learn their special rules.',
    demoFen: '8/8/8/8/8/8/PPPPPPPP/8 w - - 0 1',
    content: 'Pawns move forward one square at a time, but on their first move they can move two squares. Pawns capture diagonally — one square forward and to the side.',
    quiz: [
      { question: 'How does a pawn capture?', options: ['Straight ahead', 'Diagonally forward', 'Backwards', 'Any direction'], correct: 1 },
      { question: 'How far can a pawn move on its first move?', options: ['1 square only', 'Up to 2 squares', '3 squares', 'As far as it wants'], correct: 1 },
      { question: 'What direction do white pawns move?', options: ['Down (towards rank 1)', 'Up (towards rank 8)', 'Sideways', 'Any direction'], correct: 1 },
    ],
  },
  {
    id: 'lesson-3',
    title: 'The Rook',
    description: 'The rook is a powerful piece that controls rows and columns.',
    demoFen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
    content: 'The rook moves any number of squares horizontally or vertically. It cannot jump over other pieces. Two rooks working together are extremely powerful!',
    quiz: [
      { question: 'How does a rook move?', options: ['Diagonally', 'In an L-shape', 'Horizontally or vertically', 'One square any direction'], correct: 2 },
      { question: 'Can a rook jump over pieces?', options: ['Yes', 'No', 'Only over pawns', 'Only when capturing'], correct: 1 },
      { question: 'How many squares can a rook move in one turn?', options: ['1', '2', '3', 'Any number'], correct: 3 },
    ],
  },
  {
    id: 'lesson-4',
    title: 'The Bishop',
    description: 'Bishops slide diagonally and stick to one color.',
    demoFen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
    content: 'The bishop moves any number of squares diagonally. Each bishop stays on its starting color for the entire game. A bishop on white squares always stays on white squares!',
    quiz: [
      { question: 'How does a bishop move?', options: ['Horizontally or vertically', 'Diagonally', 'In an L-shape', 'One square any direction'], correct: 1 },
      { question: 'How many color squares does a bishop visit?', options: ['All squares', 'Only one color', 'Two colors alternating', 'It depends'], correct: 1 },
      { question: 'Can a bishop jump over pieces?', options: ['Yes', 'No'], correct: 1 },
    ],
  },
  {
    id: 'lesson-5',
    title: 'The Knight',
    description: 'Knights are the only pieces that can jump over others!',
    demoFen: '8/8/8/8/3N4/8/8/8 w - - 0 1',
    content: 'The knight moves in an L-shape: two squares in one direction, then one square perpendicular. It is the only piece that can jump over other pieces. Knights are tricky!',
    quiz: [
      { question: 'What shape does a knight move in?', options: ['Straight line', 'Diagonal', 'L-shape', 'Circle'], correct: 2 },
      { question: 'Can a knight jump over other pieces?', options: ['Yes', 'No'], correct: 0 },
      { question: 'From the center of the board, how many squares can a knight reach?', options: ['2', '4', '8', '16'], correct: 2 },
    ],
  },
  {
    id: 'lesson-6',
    title: 'Check & Checkmate',
    description: 'Learn the goal of chess — trapping the enemy king!',
    demoFen: '4k3/4Q3/4K3/8/8/8/8/8 b - - 0 1',
    content: 'Check means your king is under attack. You must escape check immediately by moving the king, blocking the attack, or capturing the attacker. Checkmate means there is no escape — game over!',
    quiz: [
      { question: 'What is check?', options: ['Winning the game', 'King under attack', 'A draw', 'Losing a piece'], correct: 1 },
      { question: 'How can you escape check?', options: ['Move king, block, or capture attacker', 'Only move the king', 'Only capture the attacker', 'Pass your turn'], correct: 0 },
      { question: 'What is checkmate?', options: ['A check you can escape', 'A check with no escape', 'A draw', 'Capturing the queen'], correct: 1 },
    ],
  },
  {
    id: 'lesson-7',
    title: 'Basic Strategy',
    description: 'Control the center and develop your pieces early.',
    demoFen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    content: 'The four key principles: 1) Control the center with pawns and pieces. 2) Develop knights and bishops early. 3) Castle to keep your king safe. 4) Connect your rooks. Follow these and you will start strong every game!',
    quiz: [
      { question: 'Which squares are the center of the board?', options: ['a1, h1, a8, h8', 'd4, d5, e4, e5', 'a4, a5, h4, h5', 'All 64 squares'], correct: 1 },
      { question: 'What should you do in the opening?', options: ['Move the same piece twice', 'Develop knights and bishops', 'Move only pawns', 'Attack immediately'], correct: 1 },
      { question: 'Why should you castle early?', options: ['It wins more points', 'It keeps your king safe', 'It is required by rules', 'It develops the rook faster'], correct: 1 },
    ],
  },
]
