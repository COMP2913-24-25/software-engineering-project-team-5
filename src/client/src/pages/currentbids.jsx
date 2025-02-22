import React from "react";
import "../App.css"; // Initial imports needed

const initialCurrentBids = [ // Items to be displayed
    { id: 1, title: "Product Title", seller: "Seller Name", description: "Product Description...", timeLeft: "12:23:60", status: "Highest Bidder", yourBid: "£70", highestBid: null },
    { id: 2, title: "Product Title", seller: "Seller Name", description: "Product Description...", timeLeft: "12:23:60", status: "Out Bid", yourBid: "£70", highestBid: "£100" },
];

export default function CurrentBids() {
    return (
        <div>
            <h1>Current Bids</h1>
            {initialCurrentBids.map((item) => ( // For all items display info, with correct button config
                <div key={item.id} className="bid-item">
                    <div className="image-placeholder"></div>
                    <div className="bid-info">
                        <h2>{item.title}</h2>
                        <p><strong>{item.seller}</strong></p>
                        <p>{item.description}</p>
                        <p><strong>Time Left:</strong> {item.timeLeft}</p>
                    </div>
                    <div className="bid-status">
                        {item.status === "Highest Bidder" && (
                            <>
                                <button className="highest-bidder">Highest Bidder</button>
                                <p>Your Bid: {item.yourBid}</p>
                            </>
                        )}
                        {item.status === "Out Bid" && (
                            <>
                                <button className="outbid">Out Bid</button>
                                <p>Your Bid: {item.yourBid}</p>
                                <p>Highest Bid: {item.highestBid}</p>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
