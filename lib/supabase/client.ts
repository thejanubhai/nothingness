/**
 * Client-Side Database & Auth Bridge.
 * Exposes auth and query interfaces backed by Firebase Auth and active session state.
 */

export interface SupabaseClient<Database = any, SchemaName = any, Schema = any> {
  auth: any;
  channel: (name: string) => any;
  removeChannel: (ch: any) => void;
  from: (table: string) => any;
  [key: string]: any;
}

export const createClient = (): SupabaseClient => {
  const channelObj = {
    on: (_event: any, _opts: any, _callback?: any) => channelObj,
    subscribe: () => channelObj,
    unsubscribe: () => {},
  };

  return {
    auth: {
      getUser: async () => {
        try {
          if (typeof window === 'undefined') {
            return { data: { user: null }, error: null };
          }
          const res = await fetch('/api/user/active-context');
          if (res.ok) {
            const ctx = await res.json();
            if (ctx.isLoggedIn && ctx.user) {
              return { data: { user: ctx.user }, error: null };
            }
          }
          return { data: { user: null }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      },
      getSession: async () => {
        try {
          if (typeof window === 'undefined') {
            return { data: { session: null }, error: null };
          }
          const res = await fetch('/api/user/active-context');
          if (res.ok) {
            const ctx = await res.json();
            if (ctx.isLoggedIn && ctx.user) {
              return { data: { session: { user: ctx.user, access_token: 'firebase-session' } }, error: null };
            }
          }
          return { data: { session: null }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        if (typeof window !== 'undefined') {
          const handler = (e: any) => {
            if (e.detail?.isLoggedIn && e.detail?.user) {
              callback('SIGNED_IN', { user: e.detail.user });
            } else {
              callback('SIGNED_OUT', null);
            }
          };
          window.addEventListener('active-context-updated', handler);
          return {
            data: {
              subscription: {
                unsubscribe: () => window.removeEventListener('active-context-updated', handler),
              },
            },
          };
        }
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      registerPasskey: async () => ({ data: null, error: null }),
      signOut: async () => {
        if (typeof window !== 'undefined') {
          document.cookie = '__session=; Max-Age=0; path=/;';
          window.location.href = 'https://janubhai.space/auth?app=nothingness';
        }
        return { error: null };
      },
    },
    channel: (_name: string) => channelObj,
    removeChannel: (_ch: any) => {},
    from: (_table: string) => {
      const createChainable = (): any => ({
        select: (_cols?: string) => createChainable(),
        eq: (_k: string, _v: any) => createChainable(),
        neq: (_k: string, _v: any) => createChainable(),
        in: (_k: string, _v: any[]) => createChainable(),
        order: (_k: string, _opts?: any) => createChainable(),
        limit: (_n: number) => createChainable(),
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        insert: (_data: any) => createChainable(),
        update: (_data: any) => createChainable(),
        delete: () => createChainable(),
        then: (resolve: any, reject: any) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
      });
      return createChainable();
    },
  };
};
