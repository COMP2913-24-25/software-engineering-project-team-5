import React, { useState } from "react";
import "./searchexp.css"; // Initial imports needed

const initialExperts = [ // Test data
    { id: 1, name: "Mohammed Sumbul", description: "Shoe Expert", field1: "Nikes", field2: "idk" },
    { id: 2, name: "Khalid Kashmiri", description: "Uber Driver", field1: "Cars", field2: "Computers" },
    { id: 3, name: "Khidir Karawita", description: "Artifact guy", field1: "Ancient artifacts", field2: "Roman artifacts" },
    { id: 4, name: "Adam Baig", description: "Uber Driver", field1: "Being awesome", field2: "Mortal Kombat" },
];

export default function SearchExperts() {
    const [search, setSearch] = useState(""); // Search term set empty

    // Search filter handling
    const filteredExperts = initialExperts.filter((expert) =>
        expert.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="search-experts">
            <h2>Search Experts</h2>

            <div >
                <input
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="filter-btn">Filter</button>
            </div>

            <div className="experts-grid">
                {filteredExperts.map((expert) => (
                    <div key={expert.id} className="container">
                        <div className="profile-pic">🗿</div>
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
