import React from "react";
import "../App.css"; // Initial imports needed

const HomePage = () => {
    return ( 
        <div>
            <section className="intro-section">
                <div className="intro-text">
                    <h1>INTRO TO WEBSITE TEXT</h1>
                    <p>Body Text - about what you can do on the website - sell items, buy items, auction format</p>
                    <button>Get Started</button>
                </div>
                <div className="intro-image"></div>
            </section>


            <section>
                <h2>TRENDING PRODUCTS</h2>
                <div className="product-list" style={{ display: "flex", gap: "10px" }}>
                    {[...Array(2)].map((_, index) => (
                        <div className="bid-item" key={index}>
                            <div className="image-placeholder"></div>
                            <div className="bid-info">
                                <h2>Product Title</h2>
                                <p>Seller Name</p>
                                <p>Bid: £150</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2>SHOP AUTHENTIC</h2>
                <div className="product-list" style={{ display: "flex", gap: "10px" }}>
                    {[...Array(2)].map((_, index) => (
                        <div className="bid-item" key={index}>
                            <div className="image-placeholder"></div>
                            <div className="bid-info">
                                <h2>Product Title</h2>
                                <p>Seller Name</p>
                                <p>Bid: £150</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HomePage;
