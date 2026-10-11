import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FirestoreQueryBuilder } from '@/lib/firestore/query-builder';
import { cookies } from 'next/headers';

export { FirestoreQueryBuilder, FirestoreQueryBuilder as SupabaseQueryBuilder };

export interface SupabaseServerUser {
  id: string;
  email?: string;
  phone?: string;
  app_metadata: any;
  user_metadata: any;
  aud?: string;
  created_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  [key: string]: any;
}

export interface SupabaseServerClient {
  auth: {
    getUser: () => Promise<{ data: { user: SupabaseServerUser | null }; error: any }>;
    signInWithPassword: (credentials: { email?: string; phone?: string; password?: string }) => Promise<{ data: { user: SupabaseServerUser | null; session?: any }; error: any }>;
    signUp: (params: { email?: string; password?: string; options?: any }) => Promise<{ data: { user: SupabaseServerUser | null }; error: any }>;
    signOut: () => Promise<{ error: any }>;
    exchangeCodeForSession: () => Promise<{ data: { user: any }; error: any }>;
    [key: string]: any;
  };
  from: (table: string) => FirestoreQueryBuilder;
  [key: string]: any;
}

/**
 * Server-side Database Client for Next.js Server Components & Route Handlers.
 * Connects directly to Firebase Firestore (adminDb) and verifies Firebase session cookies.
 */
export const createClient = async (): Promise<SupabaseServerClient> => {
  const cookieStore = await cookies();

  return {
    auth: {
      getUser: async (): Promise<{ data: { user: SupabaseServerUser | null }; error: any }> => {
        try {
          const sessionCookie = cookieStore.get('__session')?.value;
          if (!sessionCookie) {
            return { data: { user: null }, error: null };
          }
          const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
          return {
            data: {
              user: {
                id: decoded.uid,
                email: decoded.email,
                phone: decoded.phone_number,
                app_metadata: decoded as Record<string, any>,
                user_metadata: (decoded.custom_claims || {}) as Record<string, any>,
                aud: 'authenticated',
                created_at: new Date().toISOString(),
                email_confirmed_at: decoded.email ? new Date().toISOString() : undefined,
                phone_confirmed_at: decoded.phone_number ? new Date().toISOString() : undefined,
              },
            },
            error: null,
          };
        } catch (error) {
          return { data: { user: null }, error: null };
        }
      },
      signInWithPassword: async (credentials: { email?: string; phone?: string; password?: string }) => {
        try {
          let userRecord;
          if (credentials.phone) {
            userRecord = await adminAuth.getUserByPhoneNumber(credentials.phone);
          } else if (credentials.email) {
            userRecord = await adminAuth.getUserByEmail(credentials.email);
          }
          if (!userRecord) {
            return { data: { user: null }, error: { message: 'Invalid credentials' } };
          }
          const customToken = await adminAuth.createCustomToken(userRecord.uid);
          return {
            data: {
              user: {
                id: userRecord.uid,
                email: userRecord.email,
                phone: userRecord.phoneNumber,
                app_metadata: {},
                user_metadata: {},
              },
              session: { access_token: customToken },
            },
            error: null,
          };
        } catch (err: any) {
          return { data: { user: null }, error: { message: err.message } };
        }
      },
      signUp: async (params: { email?: string; password?: string; options?: any }) => {
        try {
          const phone = params.options?.data?.phone;
          const userRecord = await adminAuth.createUser({
            email: params.email,
            password: params.password,
            phoneNumber: phone,
          });
          return {
            data: {
              user: {
                id: userRecord.uid,
                email: userRecord.email,
                phone: userRecord.phoneNumber,
                app_metadata: {},
                user_metadata: {},
              },
            },
            error: null,
          };
        } catch (err: any) {
          return { data: { user: null }, error: { message: err.message } };
        }
      },
      signOut: async () => {
        try {
          cookieStore.delete('__session');
          return { error: null };
        } catch {
          return { error: null };
        }
      },
      exchangeCodeForSession: async () => ({ data: { user: null }, error: null }),
    },
    from: (table: string) => new FirestoreQueryBuilder(table),
  };
};

export const createServerClient = async () => createClient();
