
const savePaymentMethod = async()=> {
    const cardNum = document.getElementById("cardNum").value;
    const cardExpMonth = document.getElementById("cardExpMonth").value;
    const cardExpYear = document.getElementById("cardExpYear").value;
    const cardCvc = document.getElementById("cardCvc").value;
    const message = document.getElementById("validationMessage");
    
    // Clear previous messages
    message.innerHTML = "";
    message.className = "error_message";
    
    // Basic validation
    if (!cardNum || !cardExpMonth || !cardExpYear || !cardCvc) {
        message.innerHTML = 'All fields are required';
        return;
    }
    
    // Validate card number (basic check)
    const cardNumber = cardNum.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        message.innerHTML = 'Please enter a valid card number';
        return;
    }
    
    // Validate expiry
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (parseInt(cardExpYear) < currentYear || 
        (parseInt(cardExpYear) === currentYear && parseInt(cardExpMonth) < currentMonth)) {
        message.innerHTML = 'Card has expired';
        return;
    }
    
    // Check if Stripe is loaded
    if (typeof Stripe === 'undefined') {
        message.innerHTML = 'Payment system not loaded. Please refresh the page.';
        return;
    }
    
    // Initialize Stripe
    const stripe = Stripe('stripe_public_key_here'); 
    
    try {
        // Create token using Stripe
        const result = await stripe.createToken({
            number: cardNumber,
            exp_month: parseInt(cardExpMonth),
            exp_year: parseInt(cardExpYear),
            cvc: cardCvc
        });
        
        if (result.error) {
            message.innerHTML = result.error.message;
            return;
        }
        
        // Send token to server
        const response = await _postData('/user/payment', {
            token: result.token.id,
            save_payment_method: true
        });
        
        if (response.success) {
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = "Payment method saved successfully! Redirecting...";
            await new Promise(r => setTimeout(r, 1500));
            window.location.reload();
        } else {
            message.innerHTML = response.error || "Failed to save payment method";
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        message.innerHTML = "An error occurred! Please try again.";
    }
}

async function _postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(data)
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    }else{ return response;}
}