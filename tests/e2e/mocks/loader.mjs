export async function resolve(specifier, context, nextResolve) {
  const normalized = specifier.replace(/\\/g, '/');
  if (normalized.includes('lib/supabase/server') || normalized.includes('supabase/server')) {
    const mockUrl = new URL('./supabase-server-mock.ts', import.meta.url).href;
    return {
      format: 'module',
      shortCircuit: true,
      url: mockUrl,
    };
  }
  return nextResolve(specifier, context);
}
