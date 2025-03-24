import React, { useState, useEffect } from "react";
import { useCSRF } from "../App";
import config from "../../config";

const AddressForm = ({
    address,
    on_update,
    on_delete,
    title_text,
    create_address,
    button_text,
}) => {
    /*
    This component renders a form for editing an address. The form includes fields for
    Line 1, Line 2, City, Country, Postcode, Region, Is_billing, and a submit button.
    Upon submission, the form data is sent to the server to update details
    */

    const { csrfToken } = useCSRF();
    const { api_base_url } = config;

    // Sets form data - Address_id is blank ("") when new address is being created
    const [form_data, set_form_data] = useState({
        Address_id: address.Address_id || "",
        Line_1: address.Line_1,
        Line_2: address.Line_2,
        City: address.City,
        Country: address.Country,
        Postcode: address.Postcode,
        Region: address.Region,
        Is_billing: address.Is_billing,
        create_address: create_address,
    });

    // Success and error messages
    const [errors, set_errors] = useState({});
    const [success_message, set_success_message] = useState("");

    // Updates form data as the user is typing in the input fields
    const handle_change = (event) => {
        const field_name = event.target.name;
        const field_value = event.target.value;

        set_form_data((previous_data) => ({
            ...previous_data,
            [field_name]: field_value,
        }));

        // Sets success message to blank - when user clicks on the update button
        // and everything is updated successfully, they will be a banner showing a
        // success message - we want this banner to go if they further edit the form.
        set_success_message("");
    };

    // Not null validation check for all fields
    const validate_form = () => {
        const new_errors = {};

        if (!form_data.Line_1.trim()) {
            new_errors.Line_1 = ["Line 1 is required"];
        }

        if (!form_data.Line_2.trim()) {
            new_errors.Line_2 = ["Line 2 is required"];
        }

        if (!form_data.City.trim()) {
            new_errors.City = ["City is required"];
        }

        if (!form_data.Country.trim()) {
            new_errors.Country = ["Country is required"];
        }

        if (!form_data.Postcode.trim()) {
            new_errors.Postcode = ["Postcode is required"];
        }

        if (!form_data.Region.trim()) {
            new_errors.Region = ["Region is required"];
        }

        return new_errors;
    };

    // After clicking the update button, this function sends the updated form data to the server
    const handle_submit = async (event) => {
        event.preventDefault();
        set_errors({});

        // Performs client side validation
        const validation_errors = validate_form();
        if (Object.keys(validation_errors).length > 0) {
            set_errors(validation_errors);
            return;
        }

        // Calls server to update address
        try {
            form_data.Address_id = address.Address_id;

            const response = await fetch(`${api_base_url}/api/update-address`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify(form_data),
                credentials: "include",
            });

            const data = await response.json();

            // Assigns error/success messages
            if (!response.ok) {
                if (data.errors) {
                    set_errors(data.errors);
                } else {
                    set_errors({
                        general: ["Unexpected Error. Please Try Again."],
                    });
                }
            } else {
                set_success_message("Successfully updated address.");
                on_update();
            }
        } catch (error) {
            set_errors({
                general: ["Network error. Please check your connection and try again."],
            });
        }
    };

    // After clicking the delete button, this function sends a request to delete the address from the server
    const handle_delete = async (event) => {
        event.preventDefault();
        set_errors({});

        try {
            const response = await fetch(`${api_base_url}/api/delete-address`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ Address_id: address.Address_id }),
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                // Function call to removes the form showing the deleted address
                on_delete(address.Address_id);
            } else {
                set_errors({
                    general: ["Unexpected Error. Please Try Again."],
                });
            }
        } catch (error) {
            console.error("Error deleting address:", error);
            set_errors({ general: ["Network error. Please try again."] });
        }
    };

    // Component HTML
    return (
        <div className="mx-auto bg-white shadow rounded-lg">
            <h2 className="text-xl font-display font-semibold text-left px-[0.5em] pt-[2em]">
                {title_text}
            </h2>

            <form onSubmit={handle_submit} className="p-4">
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <div className="w-full">
                            <label className="block font-medium mb-1" htmlFor="Line_1">
                                Line 1
                            </label>
                            <input
                                id="Line_1"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                type="text"
                                name="Line_1"
                                value={form_data.Line_1}
                                onChange={handle_change}
                                required
                                aria-label="Enter address line 1"
                            />
                            {errors.Line_1 && (
                                <p className="text-red-500 text-sm mt-1">{errors.Line_1[0]}</p>
                            )}
                        </div>

                        <div className="w-full">
                            <label className="block font-medium mb-1" htmlFor="Line_2">
                                Line 2
                            </label>
                            <input
                                id="Line_2"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                type="text"
                                name="Line_2"
                                value={form_data.Line_2}
                                onChange={handle_change}
                                aria-label="Enter address line 2"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <div className="w-full">
                            <label className="block font-medium mb-1" htmlFor="City">
                                City
                            </label>
                            <input
                                id="City"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                type="text"
                                name="City"
                                value={form_data.City}
                                onChange={handle_change}
                                required
                                aria-label="Enter city"
                            />
                            {errors.City && (
                                <p className="text-red-500 text-sm mt-1">{errors.City[0]}</p>
                            )}
                        </div>

                        <div className="w-full">
                            <label className="block font-medium mb-1" htmlFor="Country">
                                Country
                            </label>
                            <input
                                id="Country"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                type="text"
                                name="Country"
                                value={form_data.Country}
                                onChange={handle_change}
                                required
                                aria-label="Enter country"
                            />
                            {errors.Country && (
                                <p className="text-red-500 text-sm mt-1">{errors.Country[0]}</p>
                            )}
                        </div>
                    </div>

                    <div
                        className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0"
                        htmlFor="Postcode"
                    >
                        <div className="w-full">
                            <label className="block font-medium mb-1">Postcode</label>
                            <input
                                id="Postcode"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                type="text"
                                name="Postcode"
                                value={form_data.Postcode}
                                onChange={handle_change}
                                required
                                aria-label="Enter postcode"
                            />
                            {errors.Postcode && (
                                <p className="text-red-500 text-sm mt-1">{errors.Postcode[0]}</p>
                            )}
                        </div>

                        <div className="w-full">
                            <label className="block font-medium mb-1" htmlFor="Region">
                                Region
                            </label>
                            <input
                                id="Region"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                type="text"
                                name="Region"
                                value={form_data.Region}
                                onChange={handle_change}
                                aria-label="Enter region"
                            />
                        </div>
                    </div>

                    <div className="w-full flex items-center space-x-2">
                        <label className="font-medium" htmlFor="Is_billing">
                            Is Billing Address
                        </label>
                        <input
                            id="Is_billing"
                            type="checkbox"
                            name="Is_billing"
                            checked={form_data.Is_billing}
                            // In place onChange to change is_billing to boolean true when clicked
                            onChange={(e) =>
                                set_form_data({
                                    ...form_data,
                                    Is_billing: e.target.checked,
                                })
                            }
                            aria-label="Is this the billing address?"
                        />
                    </div>
                </div>

                {success_message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mt-4">
                        {success_message}
                    </div>
                )}

                <div
                    className={`grid gap-4 mt-4 ${create_address ? "grid-cols-1" : "grid-cols-9"}`}
                >
                    <button
                        type="submit"
                        className={`${
                            create_address ? "w-full" : "lg:col-span-7 md:col-span-6 col-span-5"
                        } bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300`}
                        aria-label={create_address ? "Create address" : "Update address"}
                    >
                        {button_text}
                    </button>

                    {!create_address && (
                        <button
                            type="button"
                            className="lg:col-span-2 md:col-span-3 col-span-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-300"
                            onClick={handle_delete}
                            aria-label="Delete address"
                        >
                            Delete Address
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AddressForm;
