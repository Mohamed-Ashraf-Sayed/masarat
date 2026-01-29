import webpush from 'web-push';

// Set VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@eduplatform.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<number> {
  const { default: prisma } = await import('@/lib/prisma');

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let successCount = 0;

  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      payload
    );

    if (success) {
      successCount++;
    } else {
      // Remove invalid subscription
      await prisma.pushSubscription.delete({
        where: { id: sub.id },
      });
    }
  }

  return successCount;
}

export async function sendPushToAll(
  payload: PushNotificationPayload
): Promise<number> {
  const { default: prisma } = await import('@/lib/prisma');

  const subscriptions = await prisma.pushSubscription.findMany();
  let successCount = 0;

  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      payload
    );

    if (success) {
      successCount++;
    }
  }

  return successCount;
}

// Generate VAPID keys (run once)
export function generateVAPIDKeys() {
  const keys = webpush.generateVAPIDKeys();
  console.log('Public Key:', keys.publicKey);
  console.log('Private Key:', keys.privateKey);
  return keys;
}
