import React, { useState, useEffect } from "react";
import "../App.css"; // Initial imports needed
import { useUser, useCSRF } from "../App"; // Calls the user
import Listing_item from "../components/listing_items";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HomePage = () => {
    const { user } = useUser();
    const { csrfToken } = useCSRF();

    // Get a call to the back end to retrieve some data about listings. We need some items that are in the verified items and some that aren't.

    const [items, setItems] = useState([]);
    const [verified_items, set_verified_items] = useState([]);
    const [unverified_items, set_unverified_items] = useState([]);
    const [verified_index, set_verified_index] = useState(0);
    const [unverified_index, set_unverified_index] = useState(0);
    const items_per_page = 4;

    // Fetching the listings
    useEffect(() => {
        const fetch_items = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/get-items",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                        },
                        credentials: "include",
                    }
                );
                const data = await response.json();

                if (response.ok) {
                    setItems(data); // Update state with items

                    // Split the items into verified and unverified
                    const verified = data.filter(
                        (item) => item.Verified === true
                    );
                    const unverified = data.filter(
                        (item) => item.Verified === false
                    );

                    set_verified_items(verified);
                    set_unverified_items(unverified);
                } else {
                    console.error("Failed to get the listings");
                }
            } catch (error) {
                console.error("Network error: ", error);
            }
        };

        fetch_items();
    }, []);

    // Handling the next page for the items catalogue wheel
    const nextPage = (type) => {
        if (type == "verified") {
            set_verified_index((prev) =>
                prev + items_per_page < verified_items.length
                    ? prev + items_per_page
                    : prev
            );
        } else {
            set_unverified_index((prev) =>
                prev + items_per_page < unverified_items.length
                    ? prev + items_per_page
                    : prev
            );
        }
    };

    // Handling the prev page for the items catalogue wheel
    const prevPage = (type) => {
        if (type == "verified") {
            set_verified_index((prev) =>
                prev - items_per_page >= 0 ? prev - items_per_page : prev
            );
        } else {
            set_unverified_index((prev) =>
                prev - items_per_page >= 0 ? prev - items_per_page : prev
            );
        }
    };

    return (
        <div className="container mx-auto p-8 text-center">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Welcome to Bidly</h1>
                <p className="text-lg text-gray-600">
                    Bid and auction items efficiently.
                </p>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Products</h2>
            <div className="flex items-center justify-center gap-4">
                <ChevronLeft
                    className="cursor-pointer"
                    onClick={() => prevPage("unverified")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {unverified_items
                        .slice(
                            unverified_index,
                            unverified_index + items_per_page
                        )
                        .map((item, index) => (
                            <Listing_item key={index} item={item} />
                        ))}
                </div>
                <ChevronRight
                    className="cursor-pointer"
                    onClick={() => nextPage("unverified")}
                />
            </div>

            <h2 className="text-2xl font-semibold mb-4">SHOP AUTHENTIC</h2>
            <div className="flex items-center justify-center gap-4">
                <ChevronLeft
                    className="cursor-pointer"
                    onClick={() => prevPage("verified")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {verified_items
                        .slice(verified_index, verified_index + items_per_page)
                        .map((item, index) => (
                            <Listing_item key={index} item={item} />
                        ))}
                </div>
                <ChevronRight
                    className="cursor-pointer"
                    onClick={() => nextPage("verified")}
                />
            </div>
        </div>
    );
};

export default HomePage;
