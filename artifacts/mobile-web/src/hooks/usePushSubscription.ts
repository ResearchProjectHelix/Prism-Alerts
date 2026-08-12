import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getNotificationPermission,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push';

export function usePushSubscription() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(getNotificationPermission());
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const subscribe = useCallback(async () => {
    if (!user) return;
    setIsSubscribing(true);
    setError(null);
    const { error } = await subscribeToPush(user.id);
    setError(error);
    setPermission(getNotificationPermission());
    setIsSubscribing(false);
  }, [user]);

  const unsubscribe = useCallback(async () => {
    setIsSubscribing(true);
    setError(null);
    const { error } = await unsubscribeFromPush();
    setError(error);
    setIsSubscribing(false);
  }, []);

  return {
    isSupported: isPushSupported(),
    permission,
    isSubscribed: permission === 'granted',
    isSubscribing,
    error,
    subscribe,
    unsubscribe,
  };
}
