import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../../App"; // Access the user

const initialExperts = [
    // Test data
    { id: 1, name: "Mohammed Sumbul", description: "Shoe Expert", field1: "Nikes", field2: "idk" },
    {
        id: 2,
        name: "Khalid Kashmiri",
        description: "Uber Driver",
        field1: "Cars",
        field2: "Computers",
    },
    {
        id: 3,
        name: "Khidir Karawita",
        description: "Artifact guy",
        field1: "Ancient artifacts",
        field2: "Roman artifacts",
    },
    {
        id: 4,
        name: "Adam Baig",
        description: "Uber Driver",
        field1: "Being awesome",
        field2: "Mortal Kombat",
    },
];

export default function SearchExperts() {
    const [search, setSearch] = useState(""); // Search term set empty
    const { user } = useUser();

    // Search filter handling
    const filteredExperts = initialExperts.filter((expert) =>
        expert.description.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (!(user?.level_of_access === 3)) {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div className="search-experts">
            <h2>Search Experts</h2>

            <div>
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
