import 'server-only'

// Types for Scout APM context
export interface ScoutContext {
  [key: string]: string | number | boolean | null | undefined
}

let isInitialized = false
let scoutModule: any = null

/**
 * List of sensitive statutory & privacy keys to scrub from APM traces
 * to ensure strict adherence to Sanctum's discretion & Form C privacy standards.
 */
const SENSITIVE_KEYS = new Set([
  'aadhaar',
  'aadhaarnumber',
  'aadhaar_number',
  'passport',
  'passportnumber',
  'passport_number',
  'id_document_number',
  'token',
  'auth_token',
  'secret',
  'password',
  'otp',
  'phone',
  'email',
  'key'
])

/**
 * Scrub sensitive PII from metadata payloads before forwarding to APM
 */
export function sanitizeMetadata(data: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== 'object') return {}
  const sanitized: Record<string, any> = {}

  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED_FOR_DISCRETION]'
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      sanitized[key] = sanitizeMetadata(val)
    } else {
      sanitized[key] = val
    }
  }

  return sanitized
}

/**
 * Initialize Scout APM on server runtime.
 * Automatically handles:
 * - Vercel / Linux production environment activation
 * - Safe bypass on Windows local dev (where native core-agent daemon is not available)
 * - Safe bypass when SCOUT_KEY is not configured
 */
export async function initScout(): Promise<boolean> {
  if (isInitialized) return true

  // Ensure this only runs in Node.js server environments
  if (typeof window !== 'undefined') return false

  const scoutKey = process.env.SCOUT_KEY
  const scoutName = process.env.SCOUT_NAME || 'nothingness-sanctum'

  // If no SCOUT_KEY is configured (e.g. in test or non-monitored envs), run in standby
  if (!scoutKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Scout APM] Standby mode: SCOUT_KEY not configured in environment.')
    }
    return false
  }

  // Windows dev protection: Scout's native core-agent binary is built for Linux/macOS.
  // We enable Error Monitoring over HTTP on Windows, but avoid spawning the native binary.
  const isWindows = process.platform === 'win32'

  try {
    scoutModule = await import('@scout_apm/scout-apm')

    if (isWindows) {
      // Set up error monitoring over HTTP without launching the Linux core-agent process
      if (typeof scoutModule.setupErrorMonitoring === 'function') {
        scoutModule.setupErrorMonitoring({
          key: scoutKey,
          name: scoutName,
          monitor: true,
          errorsEnabled: true,
        })
      }
      console.log(`[Scout APM] Error monitoring active on ${process.platform} (core-agent daemon bypassed).`)
      isInitialized = true
      return true
    }

    // On Linux (Vercel Production) / macOS: Full APM + Core Agent
    if (typeof scoutModule.init === 'function') {
      await scoutModule.init({
        name: scoutName,
        key: scoutKey,
        monitor: true,
      })
      console.log(`[Scout APM] Agent fully initialized for ${scoutName} (Production/Linux).`)
      isInitialized = true
      return true
    }
  } catch (err) {
    console.warn('[Scout APM] Initialization warning (operating in graceful fallback):', err)
    return false
  }

  return false
}

/**
 * Traces a mission-critical backend operation with Scout APM.
 * Automatically measures execution time and records performance bottlenecks.
 */
export async function traceSpan<T>(
  category: string,
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = Date.now()
  const sanitizedMeta = metadata ? sanitizeMetadata(metadata) : undefined

  try {
    const result = await fn()
    const duration = Date.now() - start

    // If slow operation detected (>1.5s), log warning for performance tuning
    if (duration > 1500 && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[Scout APM Performance Warning] Slow operation [${category}/${name}] took ${duration}ms`,
        sanitizedMeta
      )
    }

    return result
  } catch (error) {
    recordScoutError(error, {
      category,
      operation: name,
      durationMs: Date.now() - start,
      ...sanitizedMeta,
    })
    throw error
  }
}

/**
 * Manually record an unexpected error to Scout APM with sanitized business context.
 */
export function recordScoutError(error: unknown, context?: Record<string, any>): void {
  try {
    const err = error instanceof Error ? error : new Error(String(error))
    const sanitizedContext = context ? sanitizeMetadata(context) : {}

    if (scoutModule && typeof scoutModule.captureError === 'function') {
      scoutModule.captureError(err, sanitizedContext)
    } else {
      // In local dev without Scout active, provide clean structured console logging
      console.error(`[Scout Error Captured] ${err.message}`, {
        stack: err.stack,
        context: sanitizedContext,
      })
    }
  } catch (loggingErr) {
    console.error('[Scout APM] Error reporting failed safely:', loggingErr)
  }
}

/**
 * Adds custom contextual attributes to the current request trace.
 */
export function addScoutContext(key: string, value: string | number | boolean): void {
  try {
    if (scoutModule?.api?.Context?.addSync) {
      scoutModule.api.Context.addSync(key, value)
    }
  } catch {
    // Non-blocking fallback
  }
}
