const stripe = require('stripe')(process.env.stripesecretkey)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.projectURL, process.env.supabasesecretkey)

export const config = { api: { bodyParser: false } }

async function buffer(readable) {
  const chunks = []
  for await (const chunk of readable) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature']
  const buf = await buffer(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.stripewebhook)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const session = event.data.object

  if (['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated'].includes(event.type)) {
    const subscription = event.type.startsWith('checkout')
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session

    const customerId = subscription.customer
    const customer = await stripe.customers.retrieve(customerId)
    const email = customer.email

    const { data: userData } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    if (!userData) return res.status(200).json({ received: true, warning: 'No user found' })

    const plan = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly'

    await supabase.from('subscriptions').upsert({
      user_id: userData.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  if (event.type === 'customer.subscription.deleted') {
    await supabase.from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', session.id)
  }

  res.status(200).json({ received: true })
}
