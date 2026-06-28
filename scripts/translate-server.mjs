import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Mistral } from '@mistralai/mistralai'

const PORT = Number(process.env.TRANSLATE_PORT || 8787)
const MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest'
const MAX_ITEMS = 120

async function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const content = await readFile(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 1) continue
    const key = trimmed.slice(0, separator).trim()
    const rawValue = trimmed.slice(separator + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

function collectRequestBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 500_000) {
        reject(new Error('Request body is too large.'))
        request.destroy()
      }
    })
    request.on('end', () => resolveBody(body))
    request.on('error', reject)
  })
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .slice(0, MAX_ITEMS)
    .map((item) => {
      if (typeof item === 'string') {
        return { text: item.trim(), type: 'unknown', level: '' }
      }
      return {
        text: String(item?.text || '').trim(),
        type: String(item?.type || 'unknown'),
        level: String(item?.level || ''),
      }
    })
    .filter((item) => item.text)
}

function parseTranslations(text) {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('Translation response was not valid JSON.')
    return JSON.parse(text.slice(start, end + 1))
  }
}

function messageContentToText(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((part) => {
      if (typeof part === 'string') return part
      return part?.text || ''
    })
    .join('\n')
}

async function translateItems(items) {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('Missing MISTRAL_API_KEY. Add it to flashcard-app/.env or your shell environment.')
  }

  const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY,
  })

  const result = await mistral.chat.complete({
    model: MODEL,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'Translate German flashcard items into concise, natural English. Preserve names. For word items, return only the direct meaning. For sentence and grammar items, translate the full item. Return valid JSON only: {"translations":["..."]}. The translations array must have the same length and order as the input items.',
      },
      {
        role: 'user',
        content: JSON.stringify({ items }),
      },
    ],
  })

  const text = messageContentToText(result.choices?.[0]?.message?.content).trim()
  const parsed = parseTranslations(text)
  if (!Array.isArray(parsed.translations)) {
    throw new Error('Translation response did not include a translations array.')
  }
  return parsed.translations.map((translation) => String(translation || '').trim())
}

await loadEnvFile()

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      provider: 'mistral',
      model: MODEL,
      hasApiKey: Boolean(process.env.MISTRAL_API_KEY),
    })
    return
  }

  if (request.method !== 'POST' || request.url !== '/api/translate') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  try {
    const body = await collectRequestBody(request)
    const payload = JSON.parse(body || '{}')
    const items = normalizeItems(payload.items)

    if (!items.length) {
      sendJson(response, 400, { error: 'No German items were provided.' })
      return
    }

    const translations = await translateItems(items)
    sendJson(response, 200, { translations })
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Translation failed.',
    })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Translation server listening at http://127.0.0.1:${PORT}`)
})
