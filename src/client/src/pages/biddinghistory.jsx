import React from "react";
import "../App.css"; // Initial imports needed

const initialBiddingHistory = [ // These are the test dummy items to be displayed
    { id: 1, title: "Product Title", seller: "Seller Name", description: "Product Description...", dateFinished: "01/01/2025", status: "Auction Cancelled", price: null },
    { id: 2, title: "Product Title", seller: "Seller Name", description: "Product Description...", dateFinished: "01/01/2025", status: "Bid Won", price: "£150" },
    { id: 3, title: "Product Title", seller: "Seller Name", description: "Product Description...", dateFinished: "01/01/2025", status: "Out Bid", price: "£250" },
];

export default function BiddingHistory() {
    return (
        <div>
            <h1>Bidding History</h1>
            {initialBiddingHistory.map((item) => ( // Display details of all items in array, with correct button config
                <div key={item.id} className="bid-item">
                    <div className="image-placeholder"></div>
                    <div className="bid-info">
                        <h2>{item.title}</h2>
                        <p><strong>{item.seller}</strong></p>
                        <p>{item.description}</p>
                        <p><strong>Date Finished:</strong> {item.dateFinished}</p>
                    </div>
                    <div className="bid-status">
                        {item.status === "Auction Cancelled" && <button className="cancelled">Auction Cancelled</button>}
                        {item.status === "Bid Won" && (
                            <>
                                <button className="won">Bid Won</button>
                                <p>Paid: {item.price}</p>
                                <button>View Receipt</button>
                            </>
                        )}
                        {item.status === "Out Bid" && (
                            <>
                                <button className="outbid">Out Bid</button>
                                <p>Sold At: {item.price}</p>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
