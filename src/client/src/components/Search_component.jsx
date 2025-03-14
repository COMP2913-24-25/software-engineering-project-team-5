
const Search_component = ({user, item, searchQuery, setSearchQuery}) => { // remove search query from navbar component and App.js since 
                                                                        // it does not need to be global anymore (remove from current_listings too)

    const handleSearch = () => {
        const queryParam = encodeURIComponent(searchQuery); // Encode the search query  to safely parse
        navigate("/current_listings", { state: { searchQuery } }); // Navigate to the current listings page with the search query
    };

    return (
        <div className="flex-grow flex ml-2">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="p-2 rounded-md border border-gray-300 w-1/3"
                            />
                            <button
                                type="submit"
                                onClick={handleSearch}
                                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                            >
                                Search
                            </button>
                        </div>
    );
};

export default Search_component;