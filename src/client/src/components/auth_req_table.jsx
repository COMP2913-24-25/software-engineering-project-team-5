import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../App";

const AuthRequestsTable = ({
    auth_requests,
    handle_request_update,
    pending,
}) => {
    /*
    This component renders a table of all authentication requests. The table has
    buttons for accepting and rejecting requests. Upon clicking the accept or reject
    buttons, a POST request is sent to the server to update the request status.

    TODO: View More button - will take expert to an enlarged view of the authentication
    request, and give them option to accept, reject or give the case to another expert.
        -> Dependancy on Enlarged Listing page for reuseable components
    */

    const navigate = useNavigate();
    const { user } = useUser();
    const { csrfToken } = useCSRF();
    const [requests, set_requests] = useState([]);

    // If not authenticated, return null
    if (user === null && user.is_expert === false) {
        return null;
    }

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
            const response = await fetch(
                "http://localhost:5000/api/update_auth_request",
                {
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
                }
            );

            // Waits for server response
            const data = await response.json();

            if (response.ok) {
                handle_request_update();
                set_success_message(
                    "Successfully " + action + "ed Authentication Request"
                );
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
    const handle_view_more = async (event, item_id, listing_name) => {
        event.preventDefault();
        set_errors({});

        try {
            const response = await fetch(
                "http://localhost:5000/api/<funcname>",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    body: JSON.stringify({
                        Item_id: item_id,
                        Listing_name: listing_name,
                    }),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                set_errors({
                    general: ["Unexpected Error. Please Try Again."],
                });
            }
        } catch (error) {
            set_errors({ general: ["Network error. Please try again."] });
        }
    };

    // Component HTML
    return (
        <div className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-lg bg-clip-border">
            {success_message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mt-4">
                    {success_message}
                </div>
            )}

            <div className="hidden xl:block">
                <table className="w-full text-left table-auto min-w-max">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="p-4 border-b border-slate-300">#</th>
                            <th className="p-4 border-b border-slate-300">
                                Listing Title
                            </th>
                            <th className="p-4 border-b border-slate-300">
                                Seller Name
                            </th>
                            <th className="p-4 border-b border-slate-300">
                                Request Created
                            </th>
                            <th className="p-4 border-b border-slate-300">
                                Proposed Price
                            </th>
                            {!pending && (
                                <th className="p-4 border-b border-slate-300">
                                    Status
                                </th>
                            )}
                            <th className="p-4 border-b border-slate-300">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => (
                            <tr key={index} className="hover:bg-slate-100">
                                <td className="p-4 border-b border-slate-200">
                                    {index + 1}
                                </td>
                                <td className="p-4 border-b border-slate-200">
                                    {request.Listing_name}
                                </td>
                                <td className="p-4 border-b border-slate-200">
                                    {request.Seller_name}
                                </td>
                                <td className="p-4 border-b border-slate-200">
                                    {request.Upload_datetime}
                                </td>
                                <td className="p-4 border-b border-slate-200">
                                    {request.Min_price}
                                </td>

                                {!pending && (
                                    <td
                                        className={`p-4 border-b border-slate-200 text-sm font-semibold 
                                ${
                                    request.Verified
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                                    >
                                        {request.Verified
                                            ? "Accepted"
                                            : "Declined"}
                                    </td>
                                )}

                                <td className="p-4 border-b border-slate-200">
                                    <div className="grid grid-cols-3 gap-2 w-full">
                                        {pending ? (
                                            <>
                                                <button
                                                    className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition duration-300"
                                                    onClick={(event) =>
                                                        handle_update(
                                                            event,
                                                            request.Item_id,
                                                            "accept"
                                                        )
                                                    }
                                                >
                                                    Accept
                                                </button>

                                                <button
                                                    className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition duration-300"
                                                    onClick={(event) =>
                                                        handle_update(
                                                            event,
                                                            request.Item_id,
                                                            "declin"
                                                        )
                                                    }
                                                >
                                                    Decline
                                                </button>

                                                <button
                                                    className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition duration-300"
                                                    onClick={(event) =>
                                                        handle_view_more(
                                                            event,
                                                            request
                                                        )
                                                    }
                                                >
                                                    View More
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition duration-300 col-span-3"
                                                onClick={(event) =>
                                                    handle_view_more(
                                                        event,
                                                        request.Item_id,
                                                        request.Listing_name
                                                    )
                                                }
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

            <div className="xl:hidden flex flex-col gap-4">
                {requests.map((request, index) => (
                    <div
                        key={index}
                        className="border border-slate-200 rounded-lg p-4 shadow-sm bg-white"
                    >
                        <p className="text-sm text-gray-600">
                            Request #{index + 1}
                        </p>
                        <p className="font-semibold text-lg">
                            {request.Listing_name}
                        </p>
                        <p className="text-sm text-gray-700">
                            Seller: {request.Seller_name}
                        </p>
                        <p className="text-sm text-gray-700">
                            Created: {request.Upload_datetime}
                        </p>
                        <p className="text-sm text-gray-700">
                            Proposed Price: {request.Min_price}
                        </p>

                        {!pending && (
                            <p
                                className={`text-sm font-semibold mt-2 
                        ${
                            request.Verified ? "text-green-600" : "text-red-600"
                        }`}
                            >
                                Status:{" "}
                                {request.Verified ? "Accepted" : "Declined"}
                            </p>
                        )}

                        <div className="grid grid-cols-3 gap-2 w-full mt-3">
                            {pending ? (
                                <>
                                    <button
                                        className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-300"
                                        onClick={(event) =>
                                            handle_update(
                                                event,
                                                request.Item_id,
                                                "accept"
                                            )
                                        }
                                    >
                                        Accept
                                    </button>

                                    <button
                                        className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-300"
                                        onClick={(event) =>
                                            handle_update(
                                                event,
                                                request.Item_id,
                                                "declin"
                                            )
                                        }
                                    >
                                        Decline
                                    </button>

                                    <button
                                        className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                                        onClick={(event) =>
                                            handle_view_more(event, request)
                                        }
                                    >
                                        View More
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 col-span-3"
                                    onClick={(event) =>
                                        handle_view_more(
                                            event,
                                            request.Item_id,
                                            request.Listing_name
                                        )
                                    }
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
