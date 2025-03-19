import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "../App";

const ItemListing = ({
    itemId,
    title,
    seller,
    description,
    availableUntil,
    images = [],
    labels = [],
    buttons = []
}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState("");
    const navigate = useNavigate();
    const { user } = useUser();


    // Function to calculate time remaining
    const calculateTimeRemaining = (availableUntil) => {
        const endTime = new Date(availableUntil).getTime();
        const now = new Date().getTime();
        const diffMs = endTime - now;

        if (diffMs <= 0) {
            return `Expired on ${new Date(availableUntil).toLocaleString()}`;
        }

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs / 60000) % 60);
        const seconds = Math.floor((diffMs / 1000) % 60);

        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    // Update time remaining every second
    useEffect(() => {
        setTimeRemaining(calculateTimeRemaining(availableUntil));

        const interval = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining(availableUntil));
        }, 1000);

        return () => clearInterval(interval);
    }, [availableUntil]);

    // Navigate to EnlargedListingPage when clicking anywhere except buttons
    const handleNavigation = (e) => {
        if (user?.level_of_access === 1) {
            if (!e.target.closest("button")) {
                navigate(`/item/${encodeURIComponent(title)}/${itemId}`);
            }
        }
    };

    return (
        <div
            className={`flex flex-col md:flex-row border rounded-lg p-4 shadow-md bg-white w-full items-center transition ${user?.level_of_access === 3 ? "cursor-default" : "cursor-pointer hover:shadow-lg"}`}
            onClick={handleNavigation}
        >
            {/* Image Carousel */}
            <div className="w-70 h-40 bg-gray-200 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center relative">
                {images.length > 1 ? (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length); }}
                            className="absolute left-1 bg-white/80 hover:bg-gray-200 rounded-full p-1 shadow-md"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-800" />
                        </button>
                        <img
                            src={`data:image/${images[currentImageIndex].Image};base64,${images[currentImageIndex].Image}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length); }}
                            className="absolute right-1 bg-white/80 hover:bg-gray-200 rounded-full p-1 shadow-md"
                        >
                            <ChevronRight className="h-5 w-5 text-gray-800" />
                        </button>
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                    </>
                ) : (
                    <img
                        src={`data:image/${images[0].Image};base64,${images[0].Image}`}
                        alt="Item image"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Item Details */}
            <div className="flex flex-col flex-grow ml-0 md:ml-4 mt-4 md:mt-0">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-gray-600">{seller}</p>
                <p className="text-sm text-gray-700 mt-1">{description}</p>

                {/* Labels */}
                <div className="mt-2 space-y-1">
                    {labels.map((label, index) => (
                        <p key={index} className="text-gray-800 font-semibold">{label}</p>
                    ))}
                    {availableUntil && (
                        <p className="text-gray-800 font-semibold">Time Remaining: {timeRemaining}</p>
                    )}
                </div>
            </div>

            {/* Buttons */}
            {buttons.length > 0 && (
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 ml-0 md:ml-4 mt-4 md:mt-0">
                    {buttons.map(({ text, onClick, style }, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); onClick(); }}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap ${style || "bg-blue-500 text-white hover:bg-blue-600"}`}
                        >
                            {text}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ItemListing;
