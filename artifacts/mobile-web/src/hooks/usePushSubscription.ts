import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getNotificationPermission, getPushSubscriptionState, isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push';

export function usePushSubscription() {
  const { user } = useAuth();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [operationError, setError] = useState<string | null>(null);
  const isSupported = isPushSupported();
  const registration = useQuery({
    queryKey: ['push-registration', user?.id],
    queryFn: () => getPushSubscriptionState(user!.id),
    enabled: !!user && isSupported,
    staleTime: 10_000,
  });
  const { refetch } = registration;
  const subscribe = useCallback(async () => {
    if (!user) return;
    setIsSubscribing(true); setError(null);
    try { const result = await subscribeToPush(user.id); setError(result.error); await refetch(); }
    catch { setError('Could not enable notifications. Try again.'); }
    finally { setIsSubscribing(false); }
  }, [user, refetch]);
  const unsubscribe = useCallback(async () => {
    if (!user) return;
    setIsSubscribing(true); setError(null);
    try { const result = await unsubscribeFromPush(user.id); setError(result.error); await refetch(); }
    catch { setError('Could not update notification registration. Try again.'); }
    finally { setIsSubscribing(false); }
  }, [user, refetch]);
  return {
    isSupported,
    permission: registration.data?.permission ?? getNotificationPermission(),
    isSubscribed: registration.data?.isSubscribed === true,
    hasBrowserSubscription: registration.data?.hasBrowserSubscription === true,
    isChecking: registration.isFetching,
    registrationError: registration.isError,
    isSubscribing,
    error: operationError ?? registration.error?.message ?? null,
    subscribe, unsubscribe,
    refresh: refetch,
  };
}
