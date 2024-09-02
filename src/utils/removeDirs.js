const fs = require('fs');
const path = require('path');

const removeDir = async (directory) => {
    try {
        if (fs.existsSync(directory)) {
            fs.rmSync(directory, { recursive: true, force: true });
            console.log(`Directory ${directory} and all its contents have been removed.`);
        } else {
            console.log(`Directory ${directory} does not exist.`);
        }
    } catch (error) {
        console.error("Error removing directory:", error);
    }
};

module.exports = removeDir;
