const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Get the secure Slack URL from environment variables
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// --- Middleware ---
// Parse JSON bodies (for our API)
app.use(express.json());
// Serve static files (our index.html) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint ---
// The browser will send messages here
app.post('/api/send', async (req, res) => {
    // Get the mill ID and message from the browser
    const { message, mill, isAlert } = req.body;

    if (!SLACK_WEBHOOK_URL) {
        console.error('SLACK_WEBHOOK_URL is not set!');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    // Format the message
    const alertIcon = isAlert ? '🚨' : '💬';
    const slackMessage = `${alertIcon} *[${mill}]* \n${message}`;

    try {
        // Send the message to Slack
        await axios.post(SLACK_WEBHOOK_URL, { text: slackMessage });
        res.status(200).json({ success: true, message: 'Message sent.' });
    } catch (error) {
        console.error('Error sending to Slack:', error.message);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});