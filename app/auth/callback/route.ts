import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRedirectPath } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      return NextResponse.redirect(`${origin}${getRedirectPath(data.user)}`)
    }
  }

  // Return the user to an error page or home with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
