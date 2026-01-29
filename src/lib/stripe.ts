import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when API key is not set
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backward compatibility
export const stripe = {
  get customers() { return getStripe().customers; },
  get paymentIntents() { return getStripe().paymentIntents; },
  get paymentMethods() { return getStripe().paymentMethods; },
  get refunds() { return getStripe().refunds; },
  get charges() { return getStripe().charges; },
  get webhooks() { return getStripe().webhooks; },
};

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Helper to create or get Stripe customer
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const { default: prisma } = await import('@/lib/prisma');

  // Check if customer exists
  const existingCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId },
  });

  if (existingCustomer) {
    return existingCustomer.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  // Save to database
  await prisma.stripeCustomer.create({
    data: {
      userId,
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

// Create payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string,
  customerId: string,
  metadata: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    customer: customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

// Process refund
export async function processRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    reason: (reason as Stripe.RefundCreateParams.Reason) || 'requested_by_customer',
  };

  if (amount) {
    refundParams.amount = Math.round(amount * 100);
  }

  return stripe.refunds.create(refundParams);
}

// Get payment methods for customer
export async function getPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return paymentMethods.data;
}

// Format amount for display
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}
