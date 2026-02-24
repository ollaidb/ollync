import { supabase } from '../lib/supabaseClient'
import i18n from '../i18n'

const VAPID_PUBLIC_KEY = import.meta.env?.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined

const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const getRegistration = async () => {
  const registration = await navigator.serviceWorker.ready
  return registration
}

const serializeSubscription = (subscription: PushSubscription) => {
  const json = subscription.toJSON()
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh || '',
    auth: json.keys?.auth || ''
  }
}

export const getPushPermission = () => {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export const getExistingSubscription = async () => {
  if (!isPushSupported()) return null
  const registration = await getRegistration()
  return registration.pushManager.getSubscription()
}

export const enablePushForUser = async (userId: string) => {
  if (!isPushSupported()) {
    throw new Error(i18n.t('errors:pushUnsupported'))
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error(i18n.t('errors:pushMissingKey'))
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(i18n.t('errors:pushPermissionDenied'))
  }

  const registration = await getRegistration()
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    }))

  const { endpoint, p256dh, auth } = serializeSubscription(subscription)
  const payload = {
    user_id: userId,
    endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('push_subscriptions') as any)
    .upsert(payload, { onConflict: 'endpoint' })

  if (error) {
    throw error
  }

  return subscription
}

export const disablePushForUser = async (userId: string) => {
  if (!isPushSupported()) return
  const registration = await getRegistration()
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('push_subscriptions') as any)
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
  }
}

export const isPushEnabled = async () => {
  const subscription = await getExistingSubscription()
  return !!subscription
}
