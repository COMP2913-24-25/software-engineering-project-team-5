import React, { useState } from "react";
import "./searchexp.css";

const initialExperts = [
    { id: 1, name: "Mohammed Sumbul", description: "Cybersecurity Expert", field1: "AI", field2: "Blockchain" },
    { id: 2, name: "Khalid Kashmiri", description: "Data Science Consultant", field1: "Python", field2: "Machine Learning" },
    { id: 3, name: "Khidir Karawita", description: "Software Engineer", field1: "React", field2: "Cloud Computing" },
    { id: 4, name: "Adam Baig", description: "Forensics Analyst", field1: "Threat Analysis", field2: "Incident Response" },
    { id: 5, name: "Ismail Kanbawi", description: "IT Risk Manager", field1: "Governance", field2: "Compliance" },
    { id: 6, name: "Bruce Lee", description: "Network Security Specialist", field1: "Firewalls", field2: "Penetration Testing" },
];

export default function SearchExperts() {
    const [search, setSearch] = useState("");

    // Handle search filter
    const filteredExperts = initialExperts.filter((expert) =>
        expert.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="search-experts">
            <h2>Search Experts</h2>

            {/* Search & Filter Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="filter-btn">☰ Filter</button>
            </div>

            {/* Experts List */}
            <div className="experts-grid">
                {filteredExperts.map((expert) => (
                    <div key={expert.id} className="expert-card">
                        <div className="profile-pic">👤</div>
                        <div className="expert-info">
                            <h3>{expert.name}</h3>
                            <p>{expert.description}</p>
                            <div className="tags">
                                <span>{expert.field1}</span>
                                <span>{expert.field2}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
