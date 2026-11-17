// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs in Supabase Edge Functions (Deno runtime)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

// Helper: Generates Google OAuth2 JWT Bearer token for FCM v1 API
async function getGoogleAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 3600

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: iat,
  }

  const encoder = new TextEncoder()
  const base64UrlEncode = (data: Uint8Array | string) => {
    const uint8 = typeof data === 'string' ? encoder.encode(data) : data
    let binary = ''
    for (let i = 0; i < uint8.byteLength; i++) {
      binary += String.fromCharCode(uint8[i])
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet))
  const messageToSign = `${encodedHeader}.${encodedClaimSet}`

  // Format private key from PEM to CryptoKey
  const pem = serviceAccount.private_key
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(messageToSign)
  )

  const signature = base64UrlEncode(new Uint8Array(signatureBuffer))
  const signedJwt = `${messageToSign}.${signature}`

  // Exchange signed JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new Error(`Failed to obtain Google access token: ${errText}`)
  }

  const tokenData = await tokenRes.json()
  return tokenData.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload = await req.json()
    const { record } = payload

    if (!record || !record.id_veterinaria) {
      return new Response(JSON.stringify({ error: 'Payload missing record or id_veterinaria' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Retrieve Firebase service account from environment secret
    const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!serviceAccountStr) {
      console.warn('FIREBASE_SERVICE_ACCOUNT secret not configured. Skipping push.')
      return new Response(JSON.stringify({ status: 'skipped', reason: 'no_fcm_credentials' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const serviceAccount = JSON.parse(serviceAccountStr)
    const projectId = serviceAccount.project_id
    const accessToken = await getGoogleAccessToken(serviceAccount)

    // Optional: Get clinic brand name from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'veterinarias' },
    })

    let nombreVeterinaria = 'Clínica Veterinaria'
    try {
      const { data: vet } = await supabase
        .from('veterinarias')
        .select('nombre')
        .eq('id_veterinaria', record.id_veterinaria)
        .maybeSingle()

      if (vet?.nombre) {
        nombreVeterinaria = vet.nombre
      }
    } catch (e) {
      console.warn('Could not fetch clinic name:', e)
    }

    const topic = `veterinaria_${record.id_veterinaria}`
    const pushTitle = record.titulo || 'Nueva Publicación'
    const pushBody = record.resumen || record.contenido?.substring(0, 120) || `Nueva publicación de ${nombreVeterinaria}`

    // Build FCM v1 message structure
    const fcmMessage = {
      message: {
        topic: topic,
        notification: {
          title: pushTitle,
          body: pushBody,
        },
        data: {
          tipo: String(record.tipo || 'ANUNCIO'),
          id_publicacion: String(record.id_publicacion),
          id_veterinaria: String(record.id_veterinaria),
          nombre_veterinaria: nombreVeterinaria,
          titulo: String(pushTitle),
          cuerpo: String(pushBody),
          imagen_url: record.imagen_url ? String(record.imagen_url) : '',
          trace_id: crypto.randomUUID(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'HIGH',
          ttl: '86400s',
          direct_boot_ok: true,
          notification: {
            title: pushTitle,
            body: pushBody,
            sound: 'default',
            default_sound: true,
            default_vibrate_timings: true,
            notification_priority: 'PRIORITY_MAX',
            visibility: 'PUBLIC',
            channel_id: 'default',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            image: record.imagen_url || undefined,
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title: pushTitle,
                body: pushBody,
              },
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
          fcm_options: {
            image: record.imagen_url || undefined,
          },
        },
      },
    }

    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmMessage),
      }
    )

    const fcmResult = await fcmResponse.json()

    if (!fcmResponse.ok) {
      console.error('FCM Send Error:', fcmResult)
      return new Response(JSON.stringify({ error: 'FCM delivery failed', details: fcmResult }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        topic,
        fcm_message_id: fcmResult.name,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Push Announcements Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
