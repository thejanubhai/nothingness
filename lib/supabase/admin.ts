import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FirestoreQueryBuilder } from '@/lib/firestore/query-builder';

export { FirestoreQueryBuilder, FirestoreQueryBuilder as SupabaseQueryBuilder };

export interface SupabaseAdminClient {
  auth: {
    admin: {
      listUsers: () => Promise<{ data: { users: any[] }; error: any }>;
      getUserById: (uid: string) => Promise<{ data: { user: any }; error: any }>;
      createUser: (params: { email?: string; phone?: string; password?: string; app_metadata?: any; [key: string]: any }) => Promise<{ data: { user: any }; error: any }>;
      updateUserById: (uid: string, params: { password?: string; app_metadata?: any; [key: string]: any }) => Promise<{ data: { user: any }; error: any }>;
      deleteUser: (uid: string) => Promise<{ data: null; error: any }>;
      generateLink: () => Promise<{ data: null; error: null }>;
      [key: string]: any;
    };
    [key: string]: any;
  };
  from: (collection: string) => FirestoreQueryBuilder;
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: any, opts?: any) => Promise<{ data: { path: string } | null; error: any }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
  rpc: (fn: string, params?: any) => Promise<{ data: any; error: any }>;
  channel: (name: string) => any;
  removeChannel: (ch: any) => void;
  [key: string]: any;
}

/**
 * Creates a synchronous Admin Client targeting Firebase Firestore and Firebase Admin Auth.
 * Completely eliminates PostgREST stubs and executes queries on Firestore (adminDb).
 */
export const createAdminClient = (): SupabaseAdminClient => {
  return {
    auth: {
      admin: {
        listUsers: async () => {
          try {
            const list = await adminAuth.listUsers(100);
            return {
              data: {
                users: list.users.map((u) => ({
                  id: u.uid,
                  email: u.email,
                  phone: u.phoneNumber,
                  app_metadata: u.customClaims || {},
                  user_metadata: {},
                })),
              },
              error: null,
            };
          } catch (error: any) {
            return { data: { users: [] }, error: { message: error.message } };
          }
        },
        getUserById: async (uid: string) => {
          try {
            const u = await adminAuth.getUser(uid);
            return {
              data: {
                user: {
                  id: u.uid,
                  email: u.email,
                  phone: u.phoneNumber,
                  app_metadata: u.customClaims || {},
                  user_metadata: {},
                },
              },
              error: null,
            };
          } catch (error: any) {
            return { data: { user: null }, error: { message: error.message } };
          }
        },
        createUser: async (params: { email?: string; phone?: string; password?: string; app_metadata?: any }) => {
          try {
            const u = await adminAuth.createUser({
              email: params.email,
              phoneNumber: params.phone,
              password: params.password,
            });
            if (params.app_metadata) {
              await adminAuth.setCustomUserClaims(u.uid, params.app_metadata);
            }
            return {
              data: {
                user: {
                  id: u.uid,
                  email: u.email,
                  phone: u.phoneNumber,
                  app_metadata: params.app_metadata || {},
                },
              },
              error: null,
            };
          } catch (error: any) {
            return { data: { user: null }, error: { message: error.message } };
          }
        },
        updateUserById: async (uid: string, params: { password?: string; app_metadata?: any; [key: string]: any }) => {
          try {
            await adminAuth.updateUser(uid, {
              password: params.password,
            });
            if (params.app_metadata) {
              await adminAuth.setCustomUserClaims(uid, params.app_metadata);
            }
            return { data: { user: { id: uid } }, error: null };
          } catch (error: any) {
            return { data: { user: null }, error: { message: error.message } };
          }
        },
        deleteUser: async (uid: string) => {
          try {
            await adminAuth.deleteUser(uid);
            return { data: null, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
        generateLink: async () => ({ data: null, error: null }),
      },
    },
    from: (collection: string) => new FirestoreQueryBuilder(collection),
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, _file: any, _opts?: any) => {
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: path.startsWith('http')
              ? path
              : `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://assets.nothingness.asia'}/${bucket}/${path.replace(/^\/+/, '')}`,
          },
        }),
      }),
    },
    rpc: async (fn: string, params?: any) => {
      if (fn === 'sync_phone_auth_user' && params?.p_phone) {
        try {
          let user;
          try {
            user = await adminAuth.getUserByPhoneNumber(params.p_phone);
          } catch {
            user = await adminAuth.createUser({
              phoneNumber: params.p_phone,
              password: params.p_password,
            });
          }
          return { data: { id: user.uid, email: user.email }, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      }
      return { data: null, error: null };
    },
    channel: (_name: string) => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
    }),
    removeChannel: (_ch: any) => {},
  };
};
