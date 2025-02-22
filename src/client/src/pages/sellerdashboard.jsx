import React from "react";
import "../App.css"; // Initial imports needed

const SellerDashboard = () => {
    return (
        <div>
            <h1>Currently Listed Items</h1>
            <div className="bid-list" style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div className="bid-item" style={{ background: "#e0e0e0", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "5px", padding: "20px", width: "180px", height: "120px" }}>
                    <strong>CREATE NEW LISTING</strong>
                </div>
                <div className="bid-item">
                    <div className="image-placeholder"></div>
                    <div className="bid-info">
                        <h2>Product Title</h2>
                        <p>Time Remaining: 01:10:02</p>
                        <p>Bid: £150</p>
                    </div>
                </div>
                <div className="bid-item">
                    <div className="image-placeholder"></div>
                    <div className="bid-info">
                        <h2>Product Title</h2>
                        <p>Time Remaining: 10:50:14</p>
                        <p>Bid: £150</p>
                    </div>
                </div>
            </div>

            <h1>Authentication Pending</h1>
            <div className="filter-section">
                <select>
                    <option>Filter</option>
                </select>
                <label><input type="checkbox" /> Pending Allocation</label>
                <label><input type="checkbox" /> Under Review</label>
                <label><input type="checkbox" /> More Info</label>
            </div>

            <div className="bid-item">
                <div className="image-placeholder"></div>
                <div className="bid-info">
                    <h2>Product Title</h2>
                    <p>Product Description...</p>
                </div>
                <div className="bid-status">
                    <button className="pending">Pending Allocation</button>
                    <button>View Auth Request</button>
                </div>
            </div>

            <div className="bid-item">
                <div className="image-placeholder"></div>
                <div className="bid-info">
                    <h2>Product Title</h2>
                    <p>Product Description...</p>
                </div>
                <div className="bid-status">
                    <button className="under-review">Under Review</button>
                    <button>View Auth Request</button>
                </div>
            </div>

            <div className="bid-item">
                <div className="image-placeholder"></div>
                <div className="bid-info">
                    <h2>Product Title</h2>
                    <p>Product Description...</p>
                </div>
                <div className="bid-status">
                    <button className="more-info">More Info</button>
                    <button>View Auth Request</button>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;