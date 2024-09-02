// httpRequest.js
const http = require('http');

// Define the HTTP request function
const makeHttpRequest = () => {
    http.get('http://localhost:3001/checkforVulns', (res) => {
        let data = '';

        // Listen for data chunks
        res.on('data', (chunk) => {
            data += chunk;
        });

        // Listen for the end of the response
        res.on('end', () => {
            console.log('Response from /checkforVulns:', data);
            process.exit(0); // Exit the process after the request completes
        });

    }).on('error', (err) => {
        console.error('Error making HTTP request:', err.message);
        process.exit(1); // Exit the process with error
    });
};

// Execute the HTTP request function
makeHttpRequest();
