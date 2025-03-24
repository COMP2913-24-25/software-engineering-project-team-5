import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCSRF } from "../App";
import config from "../../config";

const AuthRequestsTable = ({ auth_requests, handle_request_update, pending }) => {
    /*
    This component renders a table of all authentication requests. The table has
    buttons for accepting and rejecting requests. Upon clicking the accept or reject
    buttons, a POST request is sent to the server to update the request status.
    */

    const navigate = useNavigate();
    const { csrfToken } = useCSRF();
    const [requests, set_requests] = useState([]);
    const { api_base_url } = config;

    // Sets request to auth_requests when component first loaded
    useEffect(() => {
        if (auth_requests) {
            set_requests(auth_requests);
        } else {
            set_requests([]);
        }
    }, [auth_requests]);

    // Success and error messages
    const [errors, set_errors] = useState({});
    const [success_message, set_success_message] = useState("");

    // After clicking on the accept or decline button, this function sends a request to update the request details
    const handle_update = async (event, request_id, action) => {
        event.preventDefault();

        try {
            const response = await fetch(`${api_base_url}/api/update_auth_request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    request_id: request_id,
                    action: action,
                }),
                credentials: "include",
            });

            // Waits for server response
            const data = await response.json();

            if (response.ok) {
                handle_request_update();
                set_success_message("Successfully " + action + "ed Authentication Request");
            } else {
                set_errors({
                    general: ["Unexpected Error. Please Try Again."],
                });
            }
        } catch (error) {
            set_errors({ general: ["Network error. Please try again."] });
        }
    };

    // TODO: After Enlarged Listing page implemented - reuse components from there.
    const handle_view_more = async (event, Item_id, Listing_name) => {
        event.preventDefault();
        set_errors({});
        let url = "/authrequest/" + String(Listing_name) + "/" + String(Item_id);
        navigate(url);
    };

    // If no requests, show a message
    if (requests.length === 0) {
        return (
            <div className=" p-6 mb-4 text-center">
                <p className="text-gray-600 text-lg">No authentication requests available.</p>
            </div>
        );
    }

    // Component HTML
    return (
        <div>
            {success_message && (
                <div
                    className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6"
                    role="alert"
                    aria-live="assertive"
                >
                    {success_message}
                </div>
            )}

            {/* Table for larger screens */}
            <div className="hidden xl:block">
                <table className="w-full text-left" role="table" aria-labelledby="table-title">
                    <caption id="table-title" className="sr-only">
                        Listing requests table
                    </caption>
                    <thead>
                        <tr className="bg-gray-50">
                            <th
                                className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700"
                                role="columnheader"
                            >
                                #
                            </th>
                            <th
                                className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700"
                                role="columnheader"
                            >
                                Listing Title
                            </th>
                            <th
                                className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700"
                                role="columnheader"
                            >
                                Seller Name
                            </th>
                            <th
                                className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700"
                                role="columnheader"
                            >
                                Request Created
                            </th>
                            <th
                                className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700"
                                role="columnheader"
                            >
                                Proposed Price
                            </th>
                            {!pending && (
                                <th
                                    className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700"
                                    role="columnheader"
                                >
                                    Status
                                </th>
                            )}
                            <th
                                className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700"
                                role="columnheader"
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => (
                            <tr key={index} className="hover:bg-gray-50" role="row">
                                <td
                                    className="p-4 border-b border-gray-200 text-sm text-gray-700"
                                    role="cell"
                                >
                                    {index + 1}
                                </td>
                                <td
                                    className="p-4 border-b border-gray-200 text-sm text-gray-700"
                                    role="cell"
                                >
                                    {request.Listing_name}
                                </td>
                                <td
                                    className="p-4 border-b border-gray-200 text-sm text-gray-700"
                                    role="cell"
                                >
                                    {request.Seller_name}
                                </td>
                                <td
                                    className="p-4 border-b border-gray-200 text-sm text-gray-700"
                                    role="cell"
                                >
                                    {request.Upload_datetime}
                                </td>
                                <td
                                    className="p-4 border-b border-gray-200 text-sm text-gray-700"
                                    role="cell"
                                >
                                    ${request.Min_price}
                                </td>

                                {!pending && (
                                    <td
                                        className={`p-4 border-b border-gray-200 text-sm font-semibold 
                                        ${request.Verified ? "text-green-600" : "text-red-600"}`}
                                        role="cell"
                                    >
                                        {request.Verified ? "Accepted" : "Declined"}
                                    </td>
                                )}

                                <td className="p-4 border-b border-gray-200" role="cell">
                                    <div className="flex gap-2">
                                        {pending ? (
                                            <>
                                                <button
                                                    className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 text-sm"
                                                    onClick={(event) =>
                                                        handle_update(
                                                            event,
                                                            request.Item_id,
                                                            "accept"
                                                        )
                                                    }
                                                    aria-label={`Accept request for ${request.Listing_name}`}
                                                >
                                                    Accept
                                                </button>

                                                <button
                                                    className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 text-sm"
                                                    onClick={(event) =>
                                                        handle_update(
                                                            event,
                                                            request.Item_id,
                                                            "declin"
                                                        )
                                                    }
                                                    aria-label={`Decline request for ${request.Listing_name}`}
                                                >
                                                    Decline
                                                </button>

                                                <button
                                                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm"
                                                    onClick={(event) =>
                                                        handle_view_more(
                                                            event,
                                                            request.Item_id,
                                                            request.Listing_name
                                                        )
                                                    }
                                                    aria-label={`View more details of ${request.Listing_name}`}
                                                >
                                                    View More
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm"
                                                onClick={(event) =>
                                                    handle_view_more(
                                                        event,
                                                        request.Item_id,
                                                        request.Listing_name
                                                    )
                                                }
                                                aria-label={`View more details of ${request.Listing_name}`}
                                            >
                                                View More
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Cards for smaller screens */}
            <div className="xl:hidden flex flex-col gap-4" role="list">
                {requests.map((request, index) => (
                    <div key={index} role="listitem" aria-labelledby={`request-${index + 1}`}>
                        <p className="text-sm text-gray-600" id={`request-${index + 1}`}>
                            Request #{index + 1}
                        </p>
                        <p className="font-semibold text-lg text-gray-800">
                            {request.Listing_name}
                        </p>
                        <p className="text-sm text-gray-700">Seller: {request.Seller_name}</p>
                        <p className="text-sm text-gray-700">Created: {request.Upload_datetime}</p>
                        <p className="text-sm text-gray-700">
                            Proposed Price: ${request.Min_price}
                        </p>

                        {!pending && (
                            <p
                                className={`text-sm font-semibold mt-2 
                                ${request.Verified ? "text-green-600" : "text-red-600"}`}
                            >
                                Status: {request.Verified ? "Accepted" : "Declined"}
                            </p>
                        )}

                        <div className="flex gap-2 mt-3">
                            {pending ? (
                                <>
                                    <button
                                        className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 text-sm"
                                        onClick={(event) =>
                                            handle_update(event, request.Item_id, "accept")
                                        }
                                        aria-label={`Accept request for ${request.Listing_name}`}
                                    >
                                        Accept
                                    </button>

                                    <button
                                        className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 text-sm"
                                        onClick={(event) =>
                                            handle_update(event, request.Item_id, "declin")
                                        }
                                        aria-label={`Decline request for ${request.Listing_name}`}
                                    >
                                        Decline
                                    </button>

                                    <button
                                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm"
                                        onClick={(event) =>
                                            handle_view_more(
                                                event,
                                                request.Item_id,
                                                request.Listing_name
                                            )
                                        }
                                        aria-label={`View more details of ${request.Listing_name}`}
                                    >
                                        View More
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm"
                                    onClick={(event) =>
                                        handle_view_more(
                                            event,
                                            request.Item_id,
                                            request.Listing_name
                                        )
                                    }
                                    aria-label={`View more details of ${request.Listing_name}`}
                                >
                                    View More
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuthRequestsTable;
