import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

/** Converts a base64url VAPID key into the Uint8Array format the Push API expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/win|mac|linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Registers the service worker (idempotent — safe to call more than once),
 * requests notification permission, subscribes to push, and upserts the
 * subscription into Supabase keyed to the current user + this device's
 * endpoint (so a user can have multiple active subscriptions, one per device).
 */
export async function subscribeToPush(userId: string): Promise<{ error: string | null }> {
  if (!isPushSupported()) {
    return { error: 'Push notifications are not supported in this browser.' };
  }
  if (!VAPID_PUBLIC_KEY) {
    return { error: 'Missing VITE_VAPID_PUBLIC_KEY — check your .env file.' };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { error: 'Notification permission was not granted.' };
    }

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      }));

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { error: 'Push subscription did not return the expected keys.' };
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth_key: json.keys.auth,
        platform: detectPlatform(),
      },
      { onConflict: 'endpoint' },
    );

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error subscribing to push.' };
  }
}

/** Unsubscribes this device and removes its row from push_subscriptions. */
export async function unsubscribeFromPush(): Promise<{ error: string | null }> {
  if (!isPushSupported()) return { error: null };

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return { error: null };

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error unsubscribing.' };
  }
}
