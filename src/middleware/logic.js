const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const execPromise = promisify(exec);

const copyFiles = async (src, dest) => {
    return new Promise((resolve, reject) => {
        fs.cp(src, dest, { recursive: true }, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

const logic = async (req, res, next) => {
    try {
        const giturl = "https://github.com/mukul-oo7/Organization_backend";
        const repoPath = await cloneRepository(giturl);
        const srcDir = '/Users/pratikanand/Desktop/tool/tests';
        const destDir = path.join(repoPath, 'tests');
        const dir = path.join(repoPath);

        await copyFiles(srcDir, destDir);
        console.log('Test files copied successfully.');
        let stdoutStr, stderrStr;
        try {
            const { stdout, stderr } = await execPromise(`cd ${repoPath} && npm install && npm run test`);
            stdoutStr = Buffer.from(stdout, 'utf-8').toString();
            stderrStr = Buffer.from(stderr, 'utf-8').toString();
        } catch (executionError) {
            // Capture the output even if there's an error
            stdoutStr = executionError.stdout ? Buffer.from(executionError.stdout, 'utf-8').toString() : '';
            stderrStr = executionError.stderr ? Buffer.from(executionError.stderr, 'utf-8').toString() : '';
        }

        console.log('Tests executed. Monitoring stderr for failed tests.');
        console.log('Terminal Output:', stderrStr);
        const extractedOutputs = extractTestResults(stderrStr);
        console.log('Extracted Test Results:', extractedOutputs);
        req.extractedOutputs = extractedOutputs;
        req.testDirectory = dir;

        next();
    } catch (error) {
        console.error('Critical Error during execution:', error);
        res.status(500).send({ error: 'An internal server error occurred.', details: error.message });
    }
};

const cloneRepository = async (giturl) => {
    const repoName = "Organization_backend";
    const clonePath = path.join(__dirname, repoName);

    if (!fs.existsSync(clonePath)) {
        console.log(`Cloning repository: ${giturl}`);
        await execPromise(`git clone ${giturl} ${clonePath}`);
        console.log('Repository cloned successfully.');
    } else {
        console.log('Repository already exists. Skipping clone.');
    }

    return clonePath;
};
const extractTestResults = (output) => {
    const lines = output.split('\n');
    console.log(output)
    const extractedResults = {};
    const pattern = /● (.*) › (DELETE|POST|GET|PUT) (\/[^\s]*)\s+(.*)$/;

    lines.forEach(line => {
        const match = line.match(pattern);
        if (match) {
            const [, description, method, route, message] = match;
            // Constructing the key-value pair
            extractedResults[`${method} ${route}`] = `${description} › ${method} ${route} ${message}`;
        }
    });

    return extractedResults;
};

module.exports = logic;
