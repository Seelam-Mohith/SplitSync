import { useState, useEffect, useCallback, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../firebase';
import api from '../api/axios';

const VAPID_KEY =
  'BO_QdV8bhQhXOQg-rXt5Im5g4BvWuEnHIvb-WCrNHfes60U3BES5o44OZBPnvKgVsA7uopQgrZVjHu7gyi_BgVw';

export function requestAndSaveToken(user) {
  if (!user || typeof Notification === 'undefined') return Promise.resolve();
  if (Notification.permission !== 'granted') return Promise.resolve();

  return getFirebaseMessaging()
    ? getToken(getFirebaseMessaging(), { vapidKey: VAPID_KEY })
        .then((token) => {
          if (token) return api.post('/notifications/token', { token });
        })
        .catch(() => {})
    : Promise.resolve();
}

export function useNotifications(user) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);

  const checkEnabled = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications/status');
      if (mountedRef.current) setEnabled(data.data.enabled);
    } catch {
      if (mountedRef.current) setEnabled(false);
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    checkEnabled();
    return () => { mountedRef.current = false; };
  }, [checkEnabled]);

  useEffect(() => {
    if (!user || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'SplitSync';
      const body = payload.notification?.body || '';
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg' });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const requestPermission = useCallback(async () => {
    if (!user || typeof Notification === 'undefined') return;

    setLoading(true);
    setError('');
    try {
      const result = await Notification.requestPermission();

      if (result === 'granted') {
        const messaging = getFirebaseMessaging();
        if (!messaging) {
          setError('Firebase messaging not available');
          return;
        }
        const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!fcmToken) {
          setError('Failed to get notification token');
          return;
        }
        await api.post('/notifications/token', { token: fcmToken });
        setEnabled(true);
      } else if (result === 'denied') {
        setError('Notification permission denied. Enable it in browser settings.');
      } else {
        setError('Notification permission dismissed');
      }
    } catch (err) {
      setError(err.message || 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const disableNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await api.delete('/notifications/token');
      setEnabled(false);
    } catch (err) {
      setError(err.message || 'Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  return { enabled, loading, error, requestPermission, disableNotifications };
}
