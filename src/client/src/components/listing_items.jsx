import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../App";

const Listing_item = (props) => {

    const { user } = useUser();
    const [wishlist, set_wishlist] = useState(false);
    const [time_left, set_time_left] = useState("00:00:00");
    const item = props.item;
    const available_until = new Date(item.Available_until).getTime();

    const toggle_wishlist = () => {
        if (user) {
            set_wishlist(!wishlist);
            console.log(`Item ${item.Item_id} added to wishlist"`);
            // Implement api call here to add to the users wishlist!
        }
    };

    useEffect(() => {
        // Calculates the amount of time left.
        const calculate_time_left = () => {
            const time_now = new Date().getTime();
            const difference_time = available_until - time_now; 

            // incase the time runs out while the user is viewing the listing.
            if (difference_time > 0){
                const hours = Math.floor(difference_time / (1000 * 60 * 60));
                const minutes = Math.floor((difference_time % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference_time % (1000 * 60)) / 1000);

                set_time_left(`${hours.toString().padStart(2,"0")}:${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`);
            } else {
                set_time_left("00:00:00");
            }

        };

        const timer = setInterval(calculate_time_left, 1000);
        return () => clearInterval(timer);

    }, [item.Available_until]);

    return (
        // Components html

        // Can't comment within the divs??
        <div className="flex flex-wrap justify-center gap-5 mb-8">

            {[...Array(1)].map((_, index) => (
                
                <div className="w-[220px] border border-gray-300 rounded-lg overflow-hidden bg-gray-100 transition-transform transform hover:scale-105 cursor-pointer flex flex-col items-center" key={index}>
    
                    <div className="w-full h-[180px] bg-gray-200 flex items-center justify-center overflow-hidden relative">
                            {user && (<span className={`absolute top-2 right-2 cursor-pointer text-xl ${wishlist ? "text-red-600" : "text-white"}`} onClick={toggle_wishlist}>♥</span>)}
                            <img src={`data:image/${item.Image};base64,${item.Image}`} alt="An image <3" className="w-full h-full object-cover"/>
                    </div>

                    <div className="p-4 w-full font-sans">
                        <div className="flex justify-between items-center font-bold mb-2">
                            <a href="https://localhost:5000/signup" className="text-blue-600 hover:underline">{item.Listing_name}</a>
                            <p>{item.Verified && <span className="text-yellow-500 text-xl">★</span>}</p>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-700">
                            <span>{item.Seller_username}</span>
                            <span>£{(item.Current_bid > item.Min_price) ? item.Current_bid.toFixed(2) : item.Min_price.toFixed(2)}</span>
                        </div>

                        <div className={`flex justify-between items-center text-sm ${new Date(item.Available_until) - new Date() < 12 * 60 * 60 * 1000 ? "text-red-600" : "text-gray-700"}`}>
                            <span>{time_left}</span>
                        </div>

                    </div>
                </div>
                ))}

        </div>
    );
}

export default Listing_item