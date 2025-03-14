import { useEffect, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser, useCSRF } from "../App"; // Access the user

const PaymentForm = ({ userId }) => {

  const [error, setError] = useState(null);
  //const [clientSecret, setClientSecret] = useState(null);
  const stripe = useStripe();
  const elements = useElements();
  const { csrfToken } = useCSRF();


  const handleSubmit = async (event) => {
    event.preventDefault();
    
    

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        return;
    }

    // 1) create a payment method from the information the user entered
    const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
    });
    // token depreciated
    //const { token, error: stripeError } = await stripe.createToken(cardElement);
    // Create the Payment Method (not a token)
    if (stripeError) {
      setError(stripeError.message);
      return;
    }
    console.log("_______________")
    console.log("payment method", paymentMethod);
    console.log("payment method id", paymentMethod.id);
    try {
      // 2) call backend to create setup intent
      const response = await fetch('http://localhost:5000/api/create-setup-intent', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
        }),
        credentials: "include",
      });
      console.log("RESPONSE", response);
      // SetupIntent returns client_secret
      const { client_secret: client_secret } = await response.json();
      //setClientSecret(client_Secret);
      console.log("client secret", client_secret);
      
      // confirm the card setup (maybe only if different?? currently says You cannot confirm this SetupIntent because it has already succeeded.)
      // const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(client_secret, {
      //   payment_method: paymentMethod.id,
      // });
      // if (stripeError) {
      //   setError(stripeError.message);
      //   console.log(stripeError.message);
      //   console.log('not working');
      //   return;
      // }
      // console.log('SAVE CARD: ');
      // // Send the token to the backend to attach to the customer
      // const saveCardResponse = await fetch('http://localhost:5000/api/save-card', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //    // token: token.id, // The token returned by Stripe
      //     userId: userId,
      //     payment_method_id: paymentMethod.id,
      //   }),
      // });
      // console.log("SAVE CARD RESPONSE", saveCardResponse);
      // const data = await saveCardResponse.json();
      // if (data.success) {
      //   console.log('Card saved successfully!');
      // } else {
      //   setError('Something went wrong.');
      // }
    } catch (error) {
      console.error('Caught error:', error);
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div>{error}</div>}
      <button type="submit" disabled={!stripe}>Save Card</button>
    </form>
  );
};

export default PaymentForm;

// import { useState } from 'react';
// import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// const PaymentForm = ({ userId }) => {
//   const [error, setError] = useState(null);
//   const stripe = useStripe();
//   const elements = useElements();

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!stripe || !elements) {
//       // Stripe.js has not loaded yet
//       return;
//     }

//     const cardElement = elements.getElement(CardElement);

//     const { token, error: stripeError } = await stripe.createToken(cardElement);

//     if (stripeError) {
//       setError(stripeError.message);
//       return;
//     }
//     (async () => {
//         const response = await fetch('/create-setup-intent');
//         const {client_secret: clientSecret} = await response.json();
//         // Render the form using the clientSecret
//       })();
//     // Send the token to your backend to attach to the customer
//     const response = await fetch('/api/save-card', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         token: token.id, // The token returned by Stripe
//         userId: userId,
//       }),
//     });

//     const data = await response.json();
//     if (data.success) {
//       console.log('Card saved successfully!');
//     } else {
//       setError('Something went wrong.');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <CardElement />
//       {error && <div>{error}</div>}
//       <button type="submit" disabled={!stripe}>Save Card</button>
//     </form>
//   );
// };

// export default PaymentForm;




// // import React from 'react';
// // import {PaymentElement} from '@stripe/react-stripe-js';

// // const SetupForm = () => {
// //   return (
// //     <form>
// //       <PaymentElement />
// //       <button>Submit</button>
// //     </form>
// //   );
// // };

// // export default SetupForm;