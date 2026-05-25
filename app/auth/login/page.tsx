import { loginWithOtp } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-surface-blur backdrop-blur-xl border border-border-subtle p-8 md:p-12 rounded-2xl shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-accent-gold mb-3">Access Sanctuary</h1>
          <p className="text-foreground/70 font-sans tracking-wide">Enter your email to receive a secure link. No passwords required.</p>
        </div>

        <form action={loginWithOtp} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Email Address</label>
            <input 
              type="email" 
              name="email" 
              id="email" 
              placeholder="you@example.com"
              required
              className="w-full bg-transparent border-b border-border-subtle text-foreground text-lg focus:outline-none focus:border-accent-gold pb-3 transition-colors placeholder:text-foreground/20"
            />
          </div>

          <button type="submit" className="w-full bg-foreground text-background py-4 rounded-full font-medium tracking-wide hover:bg-accent-muted transition-colors mt-8">
            Request Access
          </button>
        </form>

        <p className="text-center text-xs text-foreground/40 mt-8 tracking-wide">
          By requesting access, you agree to our Terms of Secrecy and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
