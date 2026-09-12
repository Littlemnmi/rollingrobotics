'use client'

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import type {
  TutorApiResponse,
  TutorMessage,
  TutorSource,
} from '@/lib/ftc/types'

interface DisplayMessage extends TutorMessage {
  id: string
  rejected?: boolean
  sources?: TutorSource[]
}

interface ManualStatus {
  season: string
  updatedAt: string
  url: string
}

interface FtcTutorChatProps {
  initialManual: ManualStatus
}

const EXAMPLE_QUESTIONS = [
  "How do you earn ranking points in this year's game?",
  'How should a new FTC team get started with programming?',
  'How are FTC judged awards evaluated?',
]

export function FtcTutorChat({
  initialManual,
}: FtcTutorChatProps): React.ReactElement {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [manual, setManual] = useState(initialManual)
  const conversation = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length === 0 && !loading) {
      return
    }

    const frame = requestAnimationFrame(() => {
      const scrollContainer = conversation.current
      scrollContainer?.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth',
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [messages, loading])

  const submitQuestion = async (submittedQuestion: string) => {
    const content = submittedQuestion.trim()
    if (!content || loading) {
      return
    }

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setQuestion('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/ftc-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-10).map(({ role, content: text }) => ({
            role,
            content: text,
          })),
        }),
      })
      const payload: unknown = await response.json()

      if (!response.ok) {
        throw new Error(readApiError(payload))
      }
      if (!isTutorApiResponse(payload)) {
        throw new Error('The tutor returned an invalid response.')
      }

      setManual(payload.manual)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: payload.answer,
          rejected: payload.rejected,
          sources: payload.sources,
        },
      ])
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The tutor is temporarily unavailable.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitQuestion(question)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submitQuestion(question)
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="border-b border-slate-200 bg-gradient-to-r from-primary-700 via-primary-600 to-cyan-600 px-4 py-4 text-white sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <SparklesIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Sushi FTC Tutor</h2>
              <p className="text-sm text-blue-50">
                Grounded in official FIRST resources
              </p>
            </div>
          </div>
          <a
            href={manual.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/25 sm:self-auto"
          >
            <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
            {manual.season} manual
            <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="flex h-[70svh] min-h-[500px] max-h-[760px] flex-col">
        <div
          ref={conversation}
          className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6"
          aria-live="polite"
          aria-busy={loading}
        >
          {messages.length === 0 && (
            <div className="mx-auto flex max-w-2xl flex-col items-center py-4 text-center sm:py-10">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <SparklesIcon className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                What would you like to learn about FTC?
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                Questions default to the {manual.season} FTC game, so you can ask
                naturally without mentioning FTC. You can also ask about robots,
                programming, events, awards, or running a team. Clearly unrelated
                questions are declined.
              </p>
              <div className="mt-7 grid w-full gap-3 sm:grid-cols-3">
                {EXAMPLE_QUESTIONS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => void submitQuestion(example)}
                    className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium leading-5 text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/40"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  <SparklesIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[78%] ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-primary-600 text-white'
                    : message.rejected
                      ? 'rounded-bl-md border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100'
                      : 'rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-a:text-primary-600 dark:prose-a:text-primary-300">
                    <ReactMarkdown
                      components={{
                        a: ({ children, href, title }) =>
                          href && isOfficialSourceUrl(href) ? (
                            <a
                              href={href}
                              title={title}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ) : (
                            <span>{children}</span>
                          ),
                        img: ({ alt }) => <span>{alt ?? ''}</span>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </p>
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-600">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Official sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <a
                          key={source.id}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:border-primary-400 hover:bg-primary-50 dark:border-slate-600 dark:bg-slate-900 dark:text-primary-300"
                        >
                          [{source.id}] {source.title}
                          <ArrowTopRightOnSquareIcon
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
                </span>
              )}
            </article>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <SparklesIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-1" role="status">
                Checking official FIRST sources
                <span className="animate-pulse">...</span>
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
          {error && (
            <p
              className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3">
            <label htmlFor="ftc-question" className="sr-only">
              Ask an FTC question
            </label>
            <textarea
              id="ftc-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2_000}
              rows={2}
              disabled={loading}
              placeholder="Ask a FIRST Tech Challenge question..."
              className="min-h-[52px] flex-1 resize-none rounded-2xl border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
              aria-label="Send question"
            >
              <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            AI can make mistakes. The official Competition Manual and FTC Q&amp;A
            are the final authority. Manual downloaded{' '}
            {formatManualDate(manual.updatedAt)}.
          </p>
        </div>
      </div>
    </div>
  )
}

function readApiError(payload: unknown): string {
  if (
    payload &&
    typeof payload === 'object' &&
    typeof (payload as Record<string, unknown>).error === 'string'
  ) {
    return (payload as Record<string, string>).error
  }
  return 'The tutor is temporarily unavailable.'
}

function isTutorApiResponse(value: unknown): value is TutorApiResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  const manual = candidate.manual
  return (
    typeof candidate.answer === 'string' &&
    typeof candidate.rejected === 'boolean' &&
    Array.isArray(candidate.sources) &&
    !!manual &&
    typeof manual === 'object' &&
    typeof (manual as Record<string, unknown>).season === 'string' &&
    typeof (manual as Record<string, unknown>).updatedAt === 'string' &&
    typeof (manual as Record<string, unknown>).url === 'string'
  )
}

function formatManualDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'recently'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function isOfficialSourceUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'firstinspires.org' ||
        url.hostname.endsWith('.firstinspires.org'))
    )
  } catch {
    return false
  }
}
