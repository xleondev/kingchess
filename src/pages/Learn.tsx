import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LESSONS } from '../lessons/lessons'
import { useProgress } from '../lib/progress/useProgress'
import { LessonView } from './lesson/LessonView'

export function Learn() {
  const navigate = useNavigate()
  const { completedLessons, completeLesson } = useProgress()
  const [activeLesson, setActiveLesson] = useState<string | null>(null)

  const lesson = LESSONS.find((l) => l.id === activeLesson)

  if (lesson) {
    return (
      <LessonView
        lesson={lesson}
        onComplete={completeLesson}
        onBack={() => setActiveLesson(null)}
        isCompleted={completedLessons.includes(lesson.id)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/')} className="text-brand-green font-semibold">← Home</button>
      <h1 className="text-3xl font-bold text-brand-green mt-4 mb-6">Lessons</h1>
      <div className="flex flex-col gap-3">
        {LESSONS.map((lesson, i) => {
          const done = completedLessons.includes(lesson.id)
          const locked = i > 0 && !completedLessons.includes(LESSONS[i - 1].id)
          return (
            <button
              key={lesson.id}
              onClick={() => !locked && setActiveLesson(lesson.id)}
              disabled={locked}
              className={`flex items-center gap-4 p-4 rounded-2xl shadow text-left transition-opacity ${
                locked ? 'bg-gray-200 opacity-60 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                done ? 'bg-green-500 text-white' : locked ? 'bg-gray-400 text-white' : 'bg-brand-green text-white'
              }`}>
                {done ? '✓' : locked ? '🔒' : i + 1}
              </div>
              <div>
                <p className="font-bold text-gray-800">{lesson.title}</p>
                <p className="text-sm text-gray-500">{lesson.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
