import React, { useState } from "react";
import "../App.css"; // Initial imports needed

const initialWatchList = [ // Items to be displayed
    { id: 1, title: "Product Title", seller: "Seller Name", description: "Product Description...", currentBid: "£150", timeRemaining: "01:10:12", image: "https://via.placeholder.com/150" },
    { id: 2, title: "Product Title", seller: "Seller Name", description: "Product Description...", startBid: "£50", timeRemaining: "48:10:19", image: "https://via.placeholder.com/150" },
    { id: 3, title: "Product Title", seller: "Seller Name", description: "Product Description...", startBid: "£5,000", timeRemaining: "72:23:09", image: "https://via.placeholder.com/150" },
    { id: 4, title: "Product Title", seller: "Seller Name", description: "Product Description...", startBid: "£5", timeRemaining: "48:12:12", image: "https://via.placeholder.com/150" },

];

export default function WatchList() {
    const [watchList, setWatchList] = useState(initialWatchList);

    const removeItem = (id) => { // For remove item button, simple filter to remve it
        setWatchList(watchList.filter((item) => item.id !== id));
    };

    return (
        <div>
            <h1>Watch List</h1>
            {watchList.length === 0 ? ( // Check if watchlist is empty
                <p className="empty-watchlist">Your watchlist is empty :(</p>
            ) : (
                watchList.map((item) => ( // Displays all items in watchlist
                    <div key={item.id} className="bid-item">
                        <div className="image-placeholder"></div>
                        <div className="bid-info">
                            <h2>{item.title}</h2>
                            <p><strong>{item.seller}</strong></p>
                            <p>{item.description}</p>
                            <p><strong>Time Remaining:</strong> {item.timeRemaining}</p>
                        </div>
                        <div className="bid-status">
                            <button className="remove-btn" onClick={() => removeItem(item.id)}>Remove Item From Watch List</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
