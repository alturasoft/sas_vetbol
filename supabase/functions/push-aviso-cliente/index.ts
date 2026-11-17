// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { JWT } from "npm:google-auth-library"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

declare const Deno: any;

// ─── Configuración ────────────────────────────────────────────────────────
const serviceAccountRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}";
let serviceAccount: any = {};
try {
  serviceAccount = JSON.parse(serviceAccountRaw);
} catch (e) {
  console.error("[INIT] ERROR: No se pudo parsear FIREBASE_SERVICE_ACCOUNT:", e);
}

// ─── Helper: log con timestamp ────────────────────────────────────────────
function log(step: string, data: unknown) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), step, data }));
}

// ─── Handler principal ────────────────────────────────────────────────────
serve(async (req: Request) => {
  const traceId = crypto.randomUUID();
  log("TRACE_START", { traceId, method: req.method, url: req.url });

  try {
    // ── PASO 1: Leer y validar payload ────────────────────────────────────
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      log("STEP_1_ERROR", { traceId, error: "Body no es JSON válido", detail: String(e) });
      return new Response(JSON.stringify({ traceId, error: "Body inválido" }), { status: 400 });
    }

    log("STEP_1_PAYLOAD", { traceId, type: body.type, table: body.table, schema: body.schema });

    const record = body.record;
    if (!record) {
      log("STEP_1_ERROR", { traceId, error: "body.record es null/undefined" });
      return new Response(JSON.stringify({ traceId, error: "Sin record en payload" }), { status: 400 });
    }

    const { id_aviso, id_veterinaria, id_cliente, titulo, cuerpo } = record;
    log("STEP_1_RECORD", { traceId, id_aviso, id_veterinaria, id_cliente, titulo });

    if (!id_cliente) {
      log("STEP_1_ERROR", { traceId, error: "id_cliente faltante en record" });
      return new Response(JSON.stringify({ traceId, error: "id_cliente requerido" }), { status: 400 });
    }

    // ── PASO 2: Validar Service Account ───────────────────────────────────
    const { client_email, private_key, project_id } = serviceAccount;
    if (!client_email || !private_key || !project_id) {
      log("STEP_2_ERROR", {
        traceId,
        error: "FIREBASE_SERVICE_ACCOUNT incompleto",
        tieneClientEmail: !!client_email,
        tienePrivateKey: !!private_key,
        tieneProjectId: !!project_id,
      });
      return new Response(JSON.stringify({ traceId, error: "Configuración Firebase incompleta" }), { status: 500 });
    }
    log("STEP_2_SERVICE_ACCOUNT_OK", { traceId, project_id, client_email });

    // ── PASO 3: Obtener Access Token de Google ────────────────────────────
    let accessToken: string | null | undefined;
    try {
      const client = new JWT({
        email: client_email,
        key: private_key,
        scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
      });
      const tokens = await client.getAccessToken();
      accessToken = tokens.token;
    } catch (e) {
      log("STEP_3_ERROR", { traceId, error: "Falló la obtención del Access Token", detail: String(e) });
      return new Response(JSON.stringify({ traceId, error: "Error obteniendo Access Token", detail: String(e) }), { status: 500 });
    }

    if (!accessToken) {
      log("STEP_3_ERROR", { traceId, error: "Access Token vacío después de getAccessToken()" });
      return new Response(JSON.stringify({ traceId, error: "Access Token vacío" }), { status: 500 });
    }
    log("STEP_3_TOKEN_OK", { traceId, tokenLength: accessToken.length });

    // ── PASO 4: Inicializar Supabase y buscar FCM Token del Cliente ────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log("STEP_4_FETCH_CLIENT_TOKEN", { traceId, id_cliente });
    const { data: cliente, error: dbError } = await supabase
      .schema('veterinarias')
      .from('clientes')
      .select('fcm_token')
      .eq('id_cliente', id_cliente)
      .single();

    if (dbError) {
      log("STEP_4_DB_ERROR", { traceId, error: dbError.message });
      return new Response(JSON.stringify({ traceId, error: "Cliente no encontrado o error en DB", detail: dbError.message }), { status: 404 });
    }

    const token = cliente?.fcm_token;
    if (!token || token.trim().length === 0) {
      log("STEP_4_NO_TOKEN", { traceId, id_cliente, status: "Cliente no tiene FCM token registrado" });
      return new Response(JSON.stringify({ traceId, success: false, error: "El cliente no tiene token FCM registrado" }), { status: 200 });
    }

    log("STEP_4_TOKEN_FOUND", { traceId, tokenPreview: `...${token.substring(token.length - 15)}` });

    // Obtener nombre de la veterinaria para colocarlo como encabezado
    let nombreVeterinaria = "Veterinaria";
    try {
      const { data: vet } = await supabase
        .schema('veterinarias')
        .from('veterinarias')
        .select('nombre')
        .eq('id_veterinaria', id_veterinaria)
        .maybeSingle();

      if (vet?.nombre && vet.nombre.trim().length > 0) {
        nombreVeterinaria = vet.nombre.trim();
      }
    } catch (err) {
      log("STEP_4_VET_FETCH_WARN", { traceId, error: String(err) });
    }

    const notifTitle = nombreVeterinaria;
    const cleanTitulo = (titulo ?? "").trim();
    const cleanCuerpo = (cuerpo ?? "").trim();
    const notifBody = cleanTitulo && cleanCuerpo
      ? `${cleanTitulo}\n${cleanCuerpo}`
      : (cleanTitulo || cleanCuerpo || "Tienes un nuevo aviso de la veterinaria.");

    // URL de FCM v1
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${project_id}/messages:send`;

    // ── PASO 5: Enviar notificación directa a FCM con PRIORIDAD MÁXIMA ───
    // Configuración de máxima prioridad para despertar de Doze mode, pantalla bloqueada y app cerrada
    const tokenPayload = {
      message: {
        token,
        notification: {
          title: notifTitle,
          body: notifBody,
        },
        data: {
          tipo: "AVISO_CLIENTE",
          id_aviso: String(id_aviso ?? ""),
          id_veterinaria: String(id_veterinaria ?? ""),
          nombre_veterinaria: nombreVeterinaria,
          titulo: cleanTitulo,
          cuerpo: cleanCuerpo,
          trace_id: traceId,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "HIGH",
          ttl: "86400s",
          direct_boot_ok: true,
          notification: {
            title: notifTitle,
            body: notifBody,
            sound: "default",
            default_sound: true,
            default_vibrate_timings: true,
            notification_priority: "PRIORITY_MAX",
            visibility: "PUBLIC",
            click_action: "FLUTTER_NOTIFICATION_CLICK",
            channel_id: "default",
          },
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          payload: {
            aps: {
              alert: {
                title: notifTitle,
                body: notifBody,
              },
              sound: "default",
              badge: 1,
              "content-available": 1,
            },
          },
        },
      },
    };

    log("STEP_5_SENDING", { traceId });
    const res = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(tokenPayload),
    });

    const result = await res.json();
    log("STEP_5_SEND_RESULT", { traceId, httpStatus: res.status, ok: res.ok, result });

    return new Response(
      JSON.stringify({ traceId, success: res.ok, result }),
      { headers: { "Content-Type": "application/json" }, status: res.ok ? 200 : 500 }
    );

  } catch (error) {
    log("UNHANDLED_ERROR", { traceId, error: String(error) });
    return new Response(
      JSON.stringify({ traceId, success: false, error: (error as any).message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
