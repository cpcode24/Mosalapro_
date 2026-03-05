
const stripe = Stripe('pk_test_51OJIb3GmUxtE5zwryxhgATv4mrH7w0B3MqTyySZxdnoXCeRwjJIPcHHMJbGjROae2xhEnakS2Rg8hcZuVAPQ4nrx00OepCml8z');

// Function to save payment method
function savePaymentMethodViaPaymentJs(cardData) {
  return new Promise((resolve, reject) => {
    stripe.createToken(cardData).then(function(result) {
      if (result.error) {
        reject(result.error);
      } else {
        fetch("/user/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            token: result.token.id,
            save_payment_method: true 
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            resolve(data);
          } else {
            reject(new Error(data.error || 'Failed to save payment method'));
          }
        })
        .catch(error => {
          reject(error);
        });
      }
    });
  });
}

// Legacy submit handler for backward compatibility
const submitHandler = (e) => {
  e.preventDefault();
  
  const cardNumber = document.getElementById('cardNumber')?.value;
  const cardExpiryMonth = document.getElementById('cardExpiryMonth')?.value;
  const cardExpiryYear = document.getElementById('cardExpiryYear')?.value;
  const cardCvc = document.getElementById('cardCvc')?.value;

  if (!cardNumber || !cardExpiryMonth || !cardExpiryYear || !cardCvc) {
    console.error('Missing card information');
    return;
  }

  const cardData = {
    number: cardNumber.replace(/\s/g, ''),
    exp_month: parseInt(cardExpiryMonth),
    exp_year: parseInt(cardExpiryYear),
    cvc: cardCvc
  };

  savePaymentMethodViaPaymentJs(cardData)
    .then(data => {
      console.log('Payment method saved successfully');
      // Handle success
    })
    .catch(error => {
      console.error('Error saving payment method:', error.message);
      // Handle error
    });
}

