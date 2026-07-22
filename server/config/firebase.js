import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let messaging = null;

try {
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn('Firebase credentials not configured. Push notifications disabled.');
  } else {
    const apps = getApps();
    let app;

    if (apps.length === 0) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      app = apps[0];
    }

    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn('Firebase Admin SDK initialization failed:', err.message);
}

export { messaging };
