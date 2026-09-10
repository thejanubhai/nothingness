export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initScout } = await import('./lib/monitoring/scout')
    await initScout()
  }
}
