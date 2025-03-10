import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserDetailsForm from "../components/user_details_form";
import AddressForm from "../components/address_form";
import { useUser, useCSRF } from "../App"; // Access the user
import Availabilty_calendar from "../components/availability_calendar";

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
                        "X-CSRF-TOKEN": csrfToken,
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
                    alert(`Invalid time block on ${day}. ${start_time} is greater than or equal to ${end_time}`);
                    break
                }

            }

            if (!is_valid){ break; }

        }

        if (is_valid){
            try {
                const response = await fetch("http://localhost:5000/api/set-availability", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN" : csrfToken,
                    },
                    credentials: "include",
                    body: JSON.stringify({availability, week_start_date: get_week_start_date()})
                })
    
                if (response.ok) {
                    console.log("Availability submitted successfully");
                } else {
                    console.error("Failed to submit availability")
                }
    
            } catch (error) {
                console.error("Error submitting availability: ", error)
            }
            
        } else {
            console.log("Invalid availability: Start time must end before end time");
        }


    };

    const get_week_start_date = () => {
        const today = new Date();
        const week_start_date = new Date(today);
        week_start_date.setDate(today.getDate() + ((1 + today.getDay()) % 7 || 7));
        return week_start_date.toISOString().split("T")[0];
    }

    const is_expert = user?.level_of_access === 2;
    const is_sunday = new Date().getDay() === 0; // 0 is representing Sunday in this case
    //const is_sunday = true; // For testing purposes

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
                on_update={handle_address_update}
                on_delete={handle_address_delete}
                title_text="Create New Address"
                create_address={true}
                button_text={"Create Address"}
            />

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

            <h1 className="text-2xl font-display font-semibold text-left px-[0.5em] pt-[1em]">
                Card Details
            </h1>

            <h3 className="text-2xl font-display font-semibold text-left px-[0.5em] pt-[1em]">
                To do: After bidding system completed
            </h3>

            {is_expert && is_sunday && (<Availabilty_calendar onSubmit={handle_submit}/>)}
            {/* Only displays the availability calendar if the user is an expert and it is a sunday */}
        
        </div>
    );
};

export default AccountSummary;
