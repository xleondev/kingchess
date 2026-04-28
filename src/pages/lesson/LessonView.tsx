import { useState, useRef } from 'react'
import { Board } from '../../components/Board/Board'
import type { Lesson } from '../../lessons/lessons'

interface LessonViewProps {
  lesson: Lesson
  onComplete: (id: string) => void
  onBack: () => void
  isCompleted: boolean
}

export function LessonView({ lesson, onComplete, onBack, isCompleted }: LessonViewProps) {
  const [phase, setPhase] = useState<'read' | 'quiz'>('read')
  const [quizIndex, setQuizIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const correctRef = useRef(0)

  const quiz = lesson.quiz[quizIndex]

  const handleAnswer = (idx: number) => {
    if (selected !== null) return // already answered this question
    setSelected(idx)
    const isCorrect = idx === quiz.correct
    if (isCorrect) correctRef.current += 1

    setTimeout(() => {
      if (quizIndex + 1 < lesson.quiz.length) {
        setQuizIndex((i) => i + 1)
        setSelected(null)
      } else {
        setDone(true)
        if (!isCompleted) onComplete(lesson.id)
      }
    }, 800)
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col p-4 gap-4 max-w-lg mx-auto">
      <button onClick={onBack} className="self-start text-brand-green font-semibold">← Lessons</button>
      <h1 className="text-2xl font-bold text-brand-green">{lesson.title}</h1>

      {phase === 'read' && (
        <>
          <div className="w-full max-w-sm mx-auto pointer-events-none">
            <Board fen={lesson.demoFen} turn="w" onMove={() => {}} />
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">{lesson.content}</p>
          <button
            onClick={() => setPhase('quiz')}
            className="bg-brand-green text-white py-3 rounded-xl font-bold text-lg"
          >
            Take the Quiz →
          </button>
        </>
      )}

      {phase === 'quiz' && !done && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">Question {quizIndex + 1} of {lesson.quiz.length}</p>
          <p className="text-xl font-bold text-gray-800">{quiz.question}</p>
          <div className="flex flex-col gap-2">
            {quiz.options.map((opt, i) => {
              let bg = 'bg-white border-2 border-gray-200'
              if (selected !== null) {
                if (i === quiz.correct) bg = 'bg-green-100 border-green-500'
                else if (i === selected) bg = 'bg-red-100 border-red-400'
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={`${bg} py-3 px-4 rounded-xl text-left font-medium transition-colors`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {done && (
        <div className="text-center flex flex-col gap-4">
          <div className="text-5xl">{correctRef.current === lesson.quiz.length ? '🎉' : '👍'}</div>
          <p className="text-2xl font-bold text-brand-green">
            {correctRef.current}/{lesson.quiz.length} correct!
          </p>
          {isCompleted && <p className="text-green-600 font-semibold">Lesson already completed — great review!</p>}
          <button onClick={onBack} className="bg-brand-green text-white py-3 rounded-xl font-bold text-lg">
            Back to Lessons
          </button>
        </div>
      )}
    </div>
  )
}
