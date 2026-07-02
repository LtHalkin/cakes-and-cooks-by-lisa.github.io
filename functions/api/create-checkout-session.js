// POST /api/create-checkout-session
// Body: { id, name, price }  (price in whole euro)
//
// Requires an environment variable/secret STRIPE_SECRET_KEY set on the
// Cloudflare Pages project (Dashboard > Settings > Environment variables,
// or `wrangler pages secret put STRIPE_SECRET_KEY`).
//
// This calls the Stripe REST API directly with fetch, so it works fine on
// the Workers runtime without the Stripe SDK.

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "Stripe is not configured yet." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const { id, name, price } = body;

  if (!id || !name || typeof price !== "number" || price <= 0) {
    return json({ error: "Missing or invalid product details." }, 400);
  }

  const origin = new URL(request.url).origin;

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${origin}/?order=success`);
  params.set("cancel_url", `${origin}/?order=cancelled`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "eur");
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(price * 100)));
  params.set("line_items[0][price_data][product_data][name]", name);
  params.set("metadata[product_id]", id);

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const session = await stripeRes.json();

  if (!stripeRes.ok) {
    return json({ error: session.error?.message || "Stripe request failed." }, 502);
  }

  return json({ url: session.url });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
