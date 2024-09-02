const express = require('express');
const cors = require('cors');
const axios = require('axios');
const detector = require('./src/middleware/vulnDetector'); 
const triggerRouter = require('./src/routes/triggerRouter'); 
require("./src/db/mongoose")
const app = express();
app.use(cors());
app.use(express.json());

app.use(triggerRouter);

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    detector();
});
