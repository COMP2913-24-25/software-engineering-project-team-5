import React, { useState } from "react";
import "./authreq.css"; // Initial imports needed

const initialRequests = [ // Test data for request table
    { id: 1, title: "2nd Opinion", status: "Pending" },
    { id: 2, title: "New Request", status: "Pending" },
    { id: 3, title: "Under Review", status: "Assigned" },
];

export default function MAuthReq() {
    const [requests, setReq] = useState(initialRequests);
    const [filter, setFilter] = useState("");

    // Handle filtering by title
    const filterReq = requests.filter((req) => // Filtering function -> filters by title
        req.title.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="auth-requests">
            <h2>Authentication Requests</h2>

            <input
                type="text"
                placeholder="Filter..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />

            {filterReq.map((req) => (
                <div key={req.id} className="container">
                    <div>
                        <h3>Title</h3>
                        <p>{req.title}</p>
                    </div>
                    <div>
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
