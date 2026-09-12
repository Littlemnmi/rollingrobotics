import { NextResponse } from 'next/server'
import {
  answerWithAzureFoundry,
  FoundryConfigurationError,
  FoundryResponseError,
} from '@/lib/ftc/azure-foundry'
import {
  readCurrentManual,
  retrieveManualContext,
} from '@/lib/ftc/manual-store'
import { retrieveOfficialSourceContext } from '@/lib/ftc/official-sources'
import { checkTutorRateLimit } from '@/lib/ftc/rate-limit'
import { OUT_OF_SCOPE_MESSAGE } from '@/lib/ftc/scope'
import type {
  GroundingSource,
  TutorApiResponse,
  TutorMessage,
} from '@/lib/ftc/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_MESSAGES = 10
const MAX_MESSAGE_LENGTH = 2_000
const MAX_CONVERSATION_LENGTH = 12_000
const MAX_REQUEST_BYTES = 25_000

export async function POST(request: Request): Promise<NextResponse> {
  const rateLimit = checkTutorRateLimit(getClientId(request))
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many questions. Please wait a few minutes and try again.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(rateLimit.retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  let messages: TutorMessage[]
  try {
    messages = parseMessages(await readBoundedJson(request))
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 413, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Invalid request payload',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const manual = await readCurrentManual()
    const manualStatus = {
      season: manual.metadata.season,
      updatedAt: manual.metadata.downloadedAt,
      url: manual.metadata.source,
    }

    const userQuestions = messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content)
    const latestQuestion = userQuestions[userQuestions.length - 1]

    if (!latestQuestion) {
      throw new Error('A user question is required')
    }

    const retrievalQuery = userQuestions.slice(-2).join('\n')
    const officialSources = await retrieveOfficialSourceContext(retrievalQuery)
    const sources: GroundingSource[] = [
      {
        id: 1,
        title: manual.metadata.title,
        url: manual.metadata.source,
        content: retrieveManualContext(retrievalQuery, manual),
      },
      ...officialSources.map((source, index) => ({
        id: index + 2,
        ...source,
      })),
    ]

    const result = await answerWithAzureFoundry(messages, sources, manual.metadata)
    if (!result.inScope) {
      const response: TutorApiResponse = {
        answer: OUT_OF_SCOPE_MESSAGE,
        rejected: true,
        sources: [],
        manual: manualStatus,
      }
      return NextResponse.json(response, {
        headers: responseHeaders(rateLimit.remaining),
      })
    }

    const usedIds = new Set(result.usedSourceIds)
    const response: TutorApiResponse = {
      answer: result.answer.trim(),
      rejected: false,
      sources: sources
        .filter((source) => usedIds.has(source.id))
        .map((source) => ({
          id: source.id,
          title: source.title,
          url: source.url,
        })),
      manual: manualStatus,
    }

    return NextResponse.json(response, {
      headers: responseHeaders(rateLimit.remaining),
    })
  } catch (error) {
    if (error instanceof FoundryConfigurationError) {
      console.error('[Sushi FTC Tutor] Azure Foundry is not configured', error)
      return NextResponse.json(
        {
          error:
            'Sushi FTC Tutor is not configured yet. An administrator must add the Azure Foundry settings.',
        },
        { status: 503, headers: responseHeaders(rateLimit.remaining) },
      )
    }

    if (error instanceof FoundryResponseError) {
      console.error('[Sushi FTC Tutor] Invalid model response', error)
      return NextResponse.json(
        { error: 'The tutor could not produce a grounded answer. Please try again.' },
        { status: 502, headers: responseHeaders(rateLimit.remaining) },
      )
    }

    console.error('[Sushi FTC Tutor] Request failed', error)
    return NextResponse.json(
      { error: 'The tutor is temporarily unavailable. Please try again shortly.' },
      { status: 502, headers: responseHeaders(rateLimit.remaining) },
    )
  }
}

function parseMessages(value: unknown): TutorMessage[] {
  if (!value || typeof value !== 'object') {
    throw new Error('Request body must be an object')
  }

  const messages = (value as Record<string, unknown>).messages
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('At least one message is required')
  }
  if (messages.length > MAX_MESSAGES) {
    throw new Error(`A maximum of ${MAX_MESSAGES} messages is allowed`)
  }

  let totalLength = 0
  const parsed: TutorMessage[] = messages.map((message, index): TutorMessage => {
    if (!message || typeof message !== 'object') {
      throw new Error(`Message ${index + 1} is invalid`)
    }

    const candidate = message as Record<string, unknown>
    const role = candidate.role
    if (role !== 'user' && role !== 'assistant') {
      throw new Error(`Message ${index + 1} has an invalid role`)
    }
    if (typeof candidate.content !== 'string') {
      throw new Error(`Message ${index + 1} must contain text`)
    }

    const content = candidate.content.trim()
    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Each message must contain 1-${MAX_MESSAGE_LENGTH} characters`,
      )
    }

    totalLength += content.length
    return { role, content }
  })

  if (totalLength > MAX_CONVERSATION_LENGTH) {
    throw new Error('The conversation is too long')
  }
  if (parsed[parsed.length - 1].role !== 'user') {
    throw new Error('The last message must be from the user')
  }

  return parsed
}

class RequestBodyTooLargeError extends Error {
  constructor() {
    super('Request body is too large')
    this.name = 'RequestBodyTooLargeError'
  }
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_REQUEST_BYTES) {
    throw new RequestBodyTooLargeError()
  }

  if (!request.body) {
    throw new Error('Request body is required')
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      totalBytes += value.byteLength
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel()
        throw new RequestBodyTooLargeError()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  return JSON.parse(new TextDecoder().decode(body))
}

function getClientId(request: Request): string {
  return (
    request.headers.get('x-azure-clientip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

function responseHeaders(remaining: number): Record<string, string> {
  return {
    'Cache-Control': 'no-store',
    'X-RateLimit-Limit': String(MAX_MESSAGES * 2),
    'X-RateLimit-Remaining': String(remaining),
  }
}
