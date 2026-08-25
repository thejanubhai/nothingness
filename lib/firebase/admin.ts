import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

function cleanPrivateKey(key: string): string {
  let cleaned = key.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n');
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      let rawJson = serviceAccountKey.trim();
      // Handle base64 encoded service account if provided
      if (!rawJson.startsWith('{') && !rawJson.startsWith('[')) {
        try {
          rawJson = Buffer.from(rawJson, 'base64').toString('utf-8');
        } catch {
          // not base64, continue
        }
      }

      const parsedServiceAccount =
        typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

      if (parsedServiceAccount.private_key) {
        parsedServiceAccount.private_key = cleanPrivateKey(parsedServiceAccount.private_key);
      }

      return initializeApp({
        credential: cert(parsedServiceAccount),
      });
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // Check individual environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: cleanPrivateKey(privateKey),
      }),
    });
  }

  // Fallback to allow build/prerender phase without crashing when env vars are unpopulated
  return initializeApp({
    projectId: projectId || 'nothingness-app',
  });
}

export const adminApp = getAdminApp();
export const adminAuth: Auth = getAuth(adminApp);
