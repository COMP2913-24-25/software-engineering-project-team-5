import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../../App"; // Access the user
import AuthRequestsTable from "../../components/auth_req_table";
import { useNotification } from "../../components/NotificationComponent";

const EAuthReq = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { notify } = useNotification();
    const { csrfToken } = useCSRF();

    // Check if expert user is logged in and redirect if not
    useEffect(() => {
        if (user === null) {
            navigate("/invalid-access-rights");
        }

        if (user) {
            if (user.is_expert === false) {
                navigate("/invalid-access-rights");
            }
        }
    }, [user]);

    // Variables to store pending and past authentication requests
    const [pending_auth_requests, set_pending_auth_requests] = useState([]);
    const [past_auth_requests, set_past_auth_requests] = useState([]);

    // useRef to store the previous pending count to detect new assignments
    const prevPendingCount = useRef(0);

    // Gets all the authentication requests assigned to the expert
    const get_auth_requests = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/get-experts-authentication-requests",
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
                // If response is ok, set variables to server data
                set_pending_auth_requests(data.pending_auth_requests);
                set_past_auth_requests(data.past_auth_requests);

                if (data.pending_auth_requests.length > prevPendingCount.current) {
                    // notify("New expert authentication request received! click here", "/expert/auth");
                }
                prevPendingCount.current = data.pending_auth_requests.length;
            } else {
                console.error("Error fetching authentication requests:", data.error);
            }
        } catch (error) {
            console.error("Error fetching authentication requests:", error);
        }
    };

    // When expert Accepts or Declines an authentication request, it re-gets the request data
    // so that the pending and past requests lists are up to date with most recent change.
    const handle_request_update = () => {
        get_auth_requests();
    };

    // Gets authentication requests on first time load of the page
    useEffect(() => {
        if (user?.level_of_access === 2) {
            get_auth_requests();
        } else {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Authentication Requests Dashboard
                </h1>
                <p className="text-xl text-gray-500 mt-2">
                    View and manage your assigned authentication requests here.
                </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Pending Authentication Requests
            </h2>
            <AuthRequestsTable
                auth_requests={pending_auth_requests}
                handle_request_update={handle_request_update}
                pending={true}
            />

            <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-4">
                Past Authentication Requests
            </h2>
            <AuthRequestsTable
                auth_requests={past_auth_requests}
                handle_request_update={handle_request_update}
                pending={false}
            />
        </div>
    );
};

export default EAuthReq;
