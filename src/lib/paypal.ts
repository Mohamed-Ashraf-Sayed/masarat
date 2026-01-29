// PayPal Configuration and Helper Functions

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Get PayPal Access Token
export async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Create PayPal Order
export async function createPayPalOrder(
  amount: number,
  currency: string = 'USD',
  description: string,
  customId?: string
): Promise<{ id: string; status: string; links: any[] }> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description,
          custom_id: customId,
        },
      ],
      application_context: {
        brand_name: 'Masarat',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('PayPal create order error:', error);
    throw new Error('Failed to create PayPal order');
  }

  return response.json();
}

// Capture PayPal Payment
export async function capturePayPalPayment(orderId: string): Promise<{
  id: string;
  status: string;
  payer: {
    payer_id: string;
    email_address: string;
    name: { given_name: string; surname: string };
  };
  purchase_units: Array<{
    custom_id?: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
}> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('PayPal capture error:', error);
    throw new Error('Failed to capture PayPal payment');
  }

  return response.json();
}

// Get PayPal Order Details
export async function getPayPalOrderDetails(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal order details');
  }

  return response.json();
}

// Refund PayPal Payment
export async function refundPayPalPayment(
  captureId: string,
  amount?: number,
  currency: string = 'USD'
): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  const body: any = {};
  if (amount) {
    body.amount = {
      value: amount.toFixed(2),
      currency_code: currency,
    };
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('PayPal refund error:', error);
    throw new Error('Failed to refund PayPal payment');
  }

  return response.json();
}
