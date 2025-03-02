import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserDetailsForm from "../components/user_details_form";
import AddressForm from "../components/address_form";
import { useUser } from "../App"; // Access the user

const AccountSummary = () => {
    /*
    Allows a logged in user to view their account summary and edit their details (e.g.,
    name, address) - front end handles form validation, and routing to the different
    page when user isn't logged in (currently redirects to signup page).
    */

    const navigate = useNavigate();
    const { user } = useUser();

    // Check if user is logged in and redirect if not
    useEffect(() => {
        if (!user) {
            navigate("/signup");
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
            const response = await fetch(
                "http://localhost:5000/api/get-address-details",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );

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

    return (
        <div className="pl-[10%] pr-[10%]">
            <h1 className="text-2xl font-display font-semibold text-left px-[0.5em] pt-[1em]">
                View Bidding history and seller dashboard button: do after
                Button component (?) created.
            </h1>

            <h1 className="text-2xl font-display font-semibold text-left px-[0.5em] pt-[1em]">
                Notifications
            </h1>

            <h3 className="text-2xl font-display font-semibold text-left px-[0.5em] pt-[1em]">
                To do: After bidding system completed
            </h3>

            <h1 className="text-2xl font-display font-semibold text-left px-[0.5em] pt-[1em]">
                Account Summary
            </h1>

            <UserDetailsForm />

            <h1 className="text-xl font-display font-semibold text-left px-[0.5em] pt-[2em]">
                Addresses
            </h1>

            <AddressForm
                address={empty_address}
                onUpdate={handle_address_update}
                onDelete={handle_address_delete}
                title_text="Create New Address"
                create_address={true}
                button_text={"Create Address"}
            />

            {addresses.map((address, index) => (
                <AddressForm
                    key={index}
                    address={address}
                    onUpdate={handle_address_update}
                    onDelete={handle_address_delete}
                    title_text={"Address " + (index + 1)}
                    create_address={false}
                    button_text={"Update Address"}
                />
            ))}

            <h1 className="text-2xl font-display font-semibold text-left px-[0.5em] pt-[1em]">
                Card Details
            </h1>

            <h3 className="text-2xl font-display font-semibold text-left px-[0.5em] pt-[1em]">
                To do: After bidding system completed
            </h3>
        </div>
    );
};

export default AccountSummary;
