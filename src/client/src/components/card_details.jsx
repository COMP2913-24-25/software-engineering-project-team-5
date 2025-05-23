import { useEffect, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useUser, useCSRF } from "../App"; // Access the user
import config from "../../config";

const PaymentForm = ({ userId , onCardDetailsSubmitted }) => {

  const [error, setError] = useState(null);
  const { user } = useUser();
  const stripe = useStripe();
  const elements = useElements();
  const { csrfToken } = useCSRF();
  const { api_base_url } = config;


  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const agreeToTerms = window.confirm("By clicking OK, you agree to the terms and conditions of the website. \nYou agree to us saving your card for future purposes."); 
    if (!agreeToTerms) {
      return;
    }

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
      const response = await fetch(`${api_base_url}/api/create-setup-intent`, {
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

      // 4) Fetch the updated user data from the backend
      const userResponse = await fetch(`${api_base_url}/api/get-user-details`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRF-TOKEN": csrfToken,
        },
        credentials: "include",
      });
      const updatedUser = await userResponse.json();

      // 5) Call the callback function to update the Setup_intent_ID status
      onCardDetailsSubmitted(updatedUser.Setup_intent_ID);

      console.log("updatedUser.", updatedUser);
      console.log("updatedUser.Setup_intent_ID", updatedUser.Setup_intent_ID);
      
      //onCardDetailsSubmitted(user.Setup_intent_ID);
    } catch (error) {
      console.error('Caught error:', error);
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement options={{ hidePostalCode: true }} />
      {error && <div>{error}</div>}
      <button type="submit" disabled={!stripe}>Save Card</button>
    </form>
  );

};

export default PaymentForm;

