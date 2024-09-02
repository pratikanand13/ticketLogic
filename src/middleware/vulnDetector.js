// detector.js
const { spawn } = require('child_process');
const path = require('path');

const detector = async () => {
    const filePath = path.resolve(__dirname, '../../actions-runner');
    const command = './run.sh';

    return new Promise((resolve) => {
        const childProcess = spawn(command, [], { cwd: filePath, shell: true });

        childProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`stdout: ${output}`);

            if (output.includes('Job build completed with result: Succeeded')) {
                console.log('Job build succeeded.');

                // Execute the HTTP request script
                const httpRequestProcess = spawn('node', ['httpRequest.js'], { cwd: __dirname, shell: true });

                httpRequestProcess.stdout.on('data', (data) => {
                    console.log(`HTTP request stdout: ${data}`);
                });

                httpRequestProcess.stderr.on('data', (data) => {
                    console.error(`HTTP request stderr: ${data}`);
                });

                httpRequestProcess.on('close', (code) => {
                    console.log(`HTTP request process exited with code ${code}`);
                });

                // Resolve the initial Promise but keep the detector running
                resolve(true);
            }
        });

        childProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        childProcess.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
        });
    });
};

module.exports = detector;
