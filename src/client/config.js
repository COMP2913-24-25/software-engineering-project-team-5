const config = {
    development: {
        api_base_url: "http://localhost:5000",
    },
    production: {
        // apiBaseUrl: "http://yourusername.pythonanywhere.com",
        api_base_url: "http://localhost:5000",
    },
};

export default config[process.env.NODE_ENV || "development"];
