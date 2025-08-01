import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Finance Achiever pricing plans - ultra-affordable pricing
const PRICING_PLANS = {
  courses: {
    priceId: 'price_courses_399', // $3.99/month
    name: 'Courses Only',
    price: 399, // in cents
  },
  ai_tutor: {
    priceId: 'price_ai_tutor_399', // $3.99/month  
    name: 'AI Tutor Only',
    price: 399, // in cents
  },
  bundle: {
    priceId: 'price_bundle_499', // $4.99/month
    name: 'Complete Bundle',
    price: 499, // in cents
  }
};

export async function createSubscription(customerId: string, planId: string) {
  try {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function createCustomer(email: string, name: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        platform: 'Finance Achiever'
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

export async function createPaymentIntent(amount: number, currency = 'usd') {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        platform: 'Finance Achiever'
      }
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export { stripe, PRICING_PLANS };