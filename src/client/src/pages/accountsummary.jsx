import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserDetailsForm from "../components/user_details_form";
import AddressForm from "../components/address_form";
import { useUser, useCSRF } from "../App"; // Access the user
import Availability_calendar_set from "../components/availability_calendar";
import Availability_calendar_view from "../components/availability_calendar_view";

import PaymentForm from "../components/card_details";

// React Imports

import {PaymentElement} from '@stripe/react-stripe-js'; // Stripe payment element
import ReactDOM from 'react-dom';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';


// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_51QvN8MIrwvA3VrIBHvYeaTFzCczDtKl3HreakQojXK15LGrI0y0Yx2ZKGlpzGWSwUMUpsTLHTUH22kHZXLgNllLO00pHk35jaT');



const AccountSummary = () => {
    /*
    Allows a logged in user to view their account summary and edit their details (e.g.,
    name, address) - front end handles form validation, and routing to the different
    page when user isn't logged in (currently redirects to signup page).
    */

    const navigate = useNavigate();
    const { user } = useUser();
    const { csrfToken } = useCSRF();

    // Check if user is logged in and redirect if not
    useEffect(() => {
        if (user === null) {
            navigate("/invalid-access-rights");
        }
    }, [user, navigate]);

    // Variable to store address information
    const [addresses, set_addresses] = useState([]);

    // Empty address to pass into address_form component for Create New
    // Address functionality
    const empty_address = {
        Address_id: "",
        Line_1: "",
        Line_2: "",
        City: "",
        Country: "",
        Postcode: "",
        Region: "",
        Is_billing: "",
    };

    // Gets all the users addresses
    const get_addresses = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/get-address-details", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });

            // Waits for server response
            const data = await response.json();

            if (response.ok) {
                // If response is ok, set addresses state with server data
                set_addresses(data.addresses);
            }
        } catch (error) {
            console.error("Error fetching addresses:", error);
        }
    };

    // Updates the addresses list to remove the deleted address
    const handle_address_delete = async (addressId) => {
        set_addresses((prevAddresses) =>
            prevAddresses.filter((address) => address.Address_id !== addressId)
        );
    };

    // Gets addresses on first time load of the page
    useEffect(() => {
        if (user) {
            get_addresses();
        }
    }, [user]);

    // Gets addresses after an update to the Address table
    const handle_address_update = () => {
        get_addresses();
    };

    const handle_submit = async (availability) => {
        var is_valid = true;

        // Checking to see if the availabilities passed are valid. If not, then create an error message.

        // Iterate through the days, then the time blocks of each day
        for (const day in availability) {
            for (const time_block of availability[day]) {
                // Split the time block into its hours and then compare.
                const start_time = time_block.start_time.split(":").map(Number)[0];
                const end_time = time_block.end_time.split(":").map(Number)[0];

                if (start_time >= end_time) {
                    is_valid = false;
                    alert(
                        `Invalid time block on ${day}. ${start_time} is greater than or equal to ${end_time}`
                    );
                    break;
                }
            }

            if (!is_valid) {
                break;
            }
        }

        if (is_valid) {
            try {
                const response = await fetch("http://localhost:5000/api/set-availability", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    credentials: "include",
                    body: JSON.stringify({ availability, week_start_date: get_week_start_date() }),
                });

                if (response.ok) {
                    console.log("Availability submitted successfully");
                } else {
                    console.error("Failed to submit availability");
                }
            } catch (error) {
                console.error("Error submitting availability: ", error);
            }
        } else {
            console.log("Invalid availability: Start time must end before end time");
        }
    };

    const get_week_start_date = () => {
        const today = new Date("2025-03-16");
        const week_start_date = new Date(today);
        week_start_date.setDate(today.getDate() + 1);
        return week_start_date.toISOString().split("T")[0];
    };

    const is_expert = user?.level_of_access === 2;
    //const is_sunday = new Date().getDay() === 0; // 0 is representing Sunday in this case
    const is_sunday = true; // For testing purposes
   
    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            {/* Account Summary Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Account Summary
                </h1>
                <p className="text-xl text-gray-500 mt-2">
                    Manage your account, addresses, and more.
                </p>
            </div>

            {/* User Details Section */}
            <div className="p-6 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Personal Details</h2>
                <UserDetailsForm />
            </div>

            {/* Addresses Section */}
            <div className="p-6 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Addresses</h2>

                {/* Create New Address Form */}
                <div className="mb-6">
                    <AddressForm
                        address={empty_address}
                        on_update={handle_address_update}
                        on_delete={handle_address_delete}
                        title_text="Create New Address"
                        create_address={true}
                        button_text="Create Address"
                    />
                </div>

                {/* Existing Addresses List */}
                {addresses.length > 0 ? (
                    addresses.map((address, index) => (
                        <div key={index} className="mt-6">
                            <AddressForm
                                address={address}
                                on_update={handle_address_update}
                                on_delete={handle_address_delete}
                                title_text={`Address ${index + 1}`}
                                create_address={false}
                                button_text="Update Address"
                            />
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 mt-4">No addresses available. Please add one.</p>
                )}
            </div>

            {/* Card Details Section */}
            {user && user.level_of_access === 1 && (
                <div className="p-6 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Card Details</h2>
                    {!user.Setup_intent_ID ? (
                        <p className="text-gray-500">Please enter your card details before placing any bids.</p>
                    ) : (
                        <p className="text-gray-500">Your card details have been saved!</p>
                    )}
                    <div id="payment-form">
                        <div className="mb-4"></div>
                        <div id="card-element">
                            {/* A Stripe Element will be inserted here. */}
                            <Elements stripe={stripePromise} >
                                <PaymentForm userId={user?.User_id}/>
                            </Elements>
                        </div>
                        <div id="card-errors" role="alert"></div>
                    
                    </div>
                </div>
            )}

            {/* Expert View Availability Section (Visible only for experts)*/}
            {is_expert && (
                <div className="p-6 mb-8">
                    <Availability_calendar_view />
                </div>
            )}

            {/* Expert Availability Section (Visible only for experts on Sunday) */}
            {is_expert && is_sunday && (
                <div className="p-6 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Set Your Availability</h2>
                    <Availability_calendar_set onSubmit={handle_submit} />

                </div>
            )}

            {/* Notifications Section (Placeholder for now) */}
            <div className="p-6 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Notifications</h2>
                <p className="text-gray-500">To do: After bidding system is completed.</p>
            </div>

            {/* Bidding History / Seller Dashboard Section (Placeholder for now) */}
            <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Bidding History & Dashboard
                </h2>
                <p className="text-gray-500">To do: After bidding system is completed.</p>
            </div>
            {addresses.map((address, index) => (
                <AddressForm
                    key={index}
                    address={address}
                    on_update={handle_address_update}
                    on_delete={handle_address_delete}
                    title_text={"Address " + (index + 1)}
                    create_address={false}
                    button_text={"Update Address"}
                />
            ))}

        </div>
    );
};

export default AccountSummary;
