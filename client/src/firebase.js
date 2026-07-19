import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyB7WhRdjJRhABZG6HP5p3i2jNqakcR6I3s',
  authDomain: 'splitsync-f9adb.firebaseapp.com',
  projectId: 'splitsync-f9adb',
  storageBucket: 'splitsync-f9adb.firebasestorage.app',
  messagingSenderId: '189863896972',
  appId: '1:189863896972:web:b3109a552deba7c50ad8a9',
};

const app = initializeApp(firebaseConfig);

let messaging = null;

export function getFirebaseMessaging() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    if (!messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  }
  return null;
}

export default app;
