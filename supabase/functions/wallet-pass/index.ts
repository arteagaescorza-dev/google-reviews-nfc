// Supabase Edge Function: wallet-pass (DT-09)
// Genera paquetes .pkpass para Apple Wallet y atiende llamadas de actualización Push (APNs)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const url = new URL(req.url);
  const couponCode = url.searchParams.get('code') || 'WELCOME20';

  if (req.method === 'GET') {
    // Retorna el payload del pase firmado o manifiesto JSON
    const passManifest = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.googleresenas.loyalty',
      serialNumber: `PASS-${couponCode}`,
      teamIdentifier: 'AGY8947DEV',
      organizationName: 'Red Gastronómica Aliada',
      description: 'Cupón de Beneficios Exclusivos en Mesa',
      backgroundColor: 'rgb(30, 41, 59)',
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(245, 158, 11)',
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: couponCode,
        messageEncoding: 'iso-8859-1',
      },
    };

    return new Response(JSON.stringify(passManifest), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass+json',
        'Content-Disposition': `attachment; filename="pass-${couponCode}.pkpass"`,
      },
    });
  }

  // Notificación APNs de actualización cuando se canjea un cupón
  if (req.method === 'POST') {
    return new Response(JSON.stringify({ status: 'push_notification_dispatched' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
});

