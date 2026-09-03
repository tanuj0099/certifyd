'use client';

import { useState, useEffect } from 'react';
import { saveSubscriptionAction } from '@/actions/pushActions';

// Public VAPID key retrieved from Vercel ENV
const NEXT_PUBLIC_VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setIsSubscribed(true);
        }
      } catch (e) {
        console.error('Error checking push subscription', e);
      }
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);
  async function subscribeToPush() {
    if (!isSupported) return false;

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register the service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      // Send to server
      const result = await saveSubscriptionAction(subscription.toJSON());
      if (result.success) {
        setIsSubscribed(true);
        return true;
      } else {
        throw new Error(result.error || 'Failed to save subscription');
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
      return false;
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribeToPush
  };
}
