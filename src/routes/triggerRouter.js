const express = require("express");
const router = new express.Router();
const VulnDetector = require("../models/vulnDetectorSchema");
const removeFiles = require('../utils/removeDirs');
const logic = require("../middleware/logic");
let a = false;

router.get('/checkforVulns', logic, async (req, res) => {
    a = true;
    try {
        const vulnDetected = req.extractedOutputs;
        console.log("Extracted Test Results:", vulnDetected);

        const lastTicket = await VulnDetector.findOne().sort({ ticketId: -1 });
        let newTicketId = lastTicket ? lastTicket.ticketId + 1 : 0;

        const newTicketData = [];
        for (const [route, message] of Object.entries(vulnDetected)) {
            newTicketData.push({
                description: { [route]: message },
                ticketId: newTicketId
            });
        }

        let insertedData;
        try {
            insertedData = await VulnDetector.insertMany(newTicketData);
            console.log("Inserted data:", insertedData);
        } catch (error) {
            console.error('Error inserting data:', error.message);
            return res.status(500).send({ success: false, message: 'Failed to insert vulnerability data.' });
        }

        if (!lastTicket) {
            res.status(201).send({
                success: true,
                message: 'First scan completed. No previous vulnerabilities to compare.',
                issues: newTicketData
            });
            await removeFiles(req.testDirectory);
            return;
        }

        const previousIssues = await VulnDetector.find({ ticketId: { $lte: lastTicket.ticketId } });

        const previousDescriptions = previousIssues.map(issue => JSON.stringify(issue.description));
        const currentDescriptions = newTicketData.map(issue => JSON.stringify(issue.description));

        const resolvedIssues = previousIssues.filter(issue => {
            const desc = JSON.stringify(issue.description);
            return !currentDescriptions.includes(desc);
        });

        if (resolvedIssues.length > 0) {
            const resolvedIds = resolvedIssues.map(issue => issue._id);
            await VulnDetector.updateMany(
                { _id: { $in: resolvedIds } },
                { $set: { resolved: true, resolvedTicketId: newTicketId } }
            );
        }

        const newVulnerabilities = newTicketData.filter(issue => {
            const desc = JSON.stringify(issue.description);
            return !previousDescriptions.includes(desc);
        });

        let message;
        if (resolvedIssues.length === 0 && newVulnerabilities.length === 0) {
            message = 'No new vulnerabilities detected and no resolved issues found.';
        } else if (resolvedIssues.length > 0 && newVulnerabilities.length === 0) {
            message = 'Resolved vulnerabilities detected.';
        } else if (newVulnerabilities.length > 0 && resolvedIssues.length === 0) {
            message = 'New vulnerabilities detected.';
        } else {
            message = 'New vulnerabilities detected and some issues were resolved.';
        }

        try {
            await removeFiles(req.testDirectory);
            console.log("Directory removed successfully.");
        } catch (removeError) {
            console.error('Error removing directory:', removeError.message);
        }

        res.status(201).send({
            success: true,
            message,
            resolvedIssues,
            newVulnerabilities,
            currentTicketId: newTicketId
        });

    } catch (error) {
        console.error('Error processing vulnerabilities:', error.message);
        res.status(500).send({ success: false, message: 'Failed to save vulnerability.' });
    }
});

router.get("/check", async (req, res) => {
    if (a) {
        a = false;
        res.status(204).send("New Data available");
    } else {
        res.status(203).send("No new data");
    }
});

router.get("/tickerData", async (req, res) => {
    try {
        const allData = await VulnDetector.find({});
        res.status(200).send(allData);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send({ success: false, message: 'Failed to fetch data.' });
    }
});

module.exports = router;
