import React from "react";

const ItemListing = ({
    title,
    seller,
    description,
    image,
    labels = [],
    buttons = []
}) => {

    return (
        <div className="flex border rounded-lg p-4 shadow-md bg-white w-full items-center">
            {/* Item Image */}
            <div className="w-32 h-32 bg-gray-200 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
                <img src={`data:image/${image};base64,${image}`} alt="An image <3" className="w-full h-full object-cover" />
            </div>

            {/* Item Details */}
            <div className="flex flex-col flex-grow ml-4">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-gray-600">{seller}</p>
                <p className="text-sm text-gray-700 mt-1">{description}</p>

                {/* Dynamic Labels */}
                {labels.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {labels.map((label, index) => (
                            <p key={index} className="text-gray-800 font-semibold">{label}</p>
                        ))}
                    </div>
                )}
            </div>

            {/* Buttons Section */}
            {buttons.length > 0 && (
                <div className="flex flex-col space-y-2 ml-4">
                    {buttons.map(({ text, onClick, style }, index) => (
                        <button
                            key={index}
                            onClick={onClick}
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
