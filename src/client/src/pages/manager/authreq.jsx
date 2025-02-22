import React, { useState } from "react";
import "./authreq.css";

const initialRequests = [
    { id: 1, title: "2nd Opinion", status: "Pending" },
    { id: 2, title: "New Request", status: "Pending" },
    { id: 3, title: "Under Review", status: "Assigned" },
];

export default function AuthenticationRequests() {
    const [requests, setRequests] = useState(initialRequests);
    const [filter, setFilter] = useState("");

    // Handle filtering by title
    const filteredRequests = requests.filter((req) =>
        req.title.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="auth-requests">
            <h2>Authentication Requests</h2>

            {/* Filter Input */}
            <input
                type="text"
                placeholder="Filter..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />

            {/* Requests List */}
            {filteredRequests.map((req) => (
                <div key={req.id} className="request-card">
                    <div className="request-info">
                        <h3>Title</h3>
                        <p>{req.title}</p>
                    </div>
                    <div className="request-actions">
                        {req.status === "Pending" ? (
                            <button>Assign Expert</button>
                        ) : (
                            <button>View Assignment</button>
                        )}
                        <button>View Request</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
