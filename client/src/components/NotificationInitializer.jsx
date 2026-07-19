import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { requestAndSaveToken } from '../hooks/useNotifications';

export default function NotificationInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) requestAndSaveToken(user);
  }, [user]);

  return null;
}
