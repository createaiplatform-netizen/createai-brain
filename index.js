require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

function calculateCartTotal() {
  return 5000; // 0.00 in cents
}

async function createPaymentIntent() {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateCartTotal(),
      currency: 'usd',
      payment_method_types: ['card'],
    });
    console.log('✅ Client Secret: ' + paymentIntent.client_secret);
    console.log('Copy this client_secret into client.html to complete the process.');
  } catch (error) {
    console.error('❌ Error creating Payment Intent:', error.message);
  }
}

createPaymentIntent();
