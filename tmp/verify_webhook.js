
const orderId = 'JzAB3BGQ5aUpb6x964nw';
const webhookSecret = 'fslno_archival_key';

const payload = {
  event: 'tracking.update',
  msg: {
    tracking_number: 'TEST_TRACKING_123',
    slug: 'fedex',
    tag: 'Delivered', // This should map to 'completed'
    order_id: orderId
  }
};

async function testWebhook() {
  console.log('Testing webhook with payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`http://localhost:9003/api/webhooks/shipping?secret=${webhookSecret}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error during webhook test:', error);
  }
}

testWebhook();
