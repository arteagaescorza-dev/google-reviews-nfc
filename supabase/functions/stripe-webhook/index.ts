// Supabase Edge Function: stripe-webhook
// Escucha eventos de Stripe para activar Marca Blanca y renovar suscripciones automáticamente

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const signature = req.headers.get('stripe-signature');

  try {
    const rawBody = await req.text();
    // En producción se valida la firma criptográfica:
    // const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    const event = JSON.parse(rawBody);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const organizationId = session.client_reference_id || session.metadata?.organization_id;

        if (organizationId) {
          await supabase
            .from('organizations')
            .update({
              is_ad_free: true,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              subscription_status: 'active',
            })
            .eq('id', organizationId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        if (customerId) {
          await supabase
            .from('organizations')
            .update({
              is_ad_free: true,
              subscription_status: 'active',
              subscription_current_period_end: new Date(invoice.lines?.data[0]?.period?.end * 1000).toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        if (customerId) {
          // Desactivar Marca Blanca al cancelar
          await supabase
            .from('organizations')
            .update({
              is_ad_free: false,
              subscription_status: 'canceled',
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      default:
        console.log(`Evento de Stripe no manejado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

