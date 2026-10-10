import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getNotificationPermission,
  hasActivePushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push';

export function usePushSubscription() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(getNotificationPermission());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setPermission(getNotificationPermission());

    if (!user) {
      setIsSubscribed(false);
      return () => {
        active = false;
      };
    }

    void hasActivePushSubscription(user.id).then((subscribed) => {
      if (active) setIsSubscribed(subscribed);
    });

    return () => {
      active = false;
    };
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user) return;
    setIsSubscribing(true);
    setError(null);

    try {
      const result = await subscribeToPush(user.id);
      setError(result.error);
      setPermission(getNotificationPermission());
      setIsSubscribed(!result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enable notifications.');
      setIsSubscribed(false);
    } finally {
      setIsSubscribing(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    setIsSubscribing(true);
    setError(null);

    try {
      const result = await unsubscribeFromPush();
      setError(result.error);
      if (!result.error) setIsSubscribed(false);
      setPermission(getNotificationPermission());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to turn off notifications.');
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  return {
    isSupported: isPushSupported(),
    permission,
    isSubscribed,
    isSubscribing,
    error,
    subscribe,
    unsubscribe,
  };
}
