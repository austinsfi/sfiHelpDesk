const express = require('express');
const path = require('path');
const multer = require('multer'); // For file uploads
const { WebClient } = require('@slack/web-api'); // The new Slack client

// --- Config ---
const app = express();
const PORT = process.env.PORT || 8080;

// Get new Slack secrets from environment variables
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

// Initialize Slack client
if (!SLACK_BOT_TOKEN) {
    console.error('Missing SLACK_BOT_TOKEN!');
}
const slackClient = new WebClient(SLACK_BOT_TOKEN);

// Set up multer for file uploads in memory
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// --- Middleware ---
// Serve static files (our index.html)
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint ---
// Use upload.single('screenshot') to look for a file named 'screenshot'
app.post('/api/send', upload.single('screenshot'), async (req, res) => {
    // Text fields now come from req.body
    const { message, mill, isAlert } = req.body;
    const file = req.file; // The uploaded file is here
    
    if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
        console.error('Server is missing Slack Token or Channel ID');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    // Format the message
    const alertIcon = (isAlert === 'true') ? '🚨' : '💬'; // isAlert will be a string
    const slackMessage = `${alertIcon} *[${mill}]* \n${message}`;

    try {
        if (file) {
            // --- UPDATED: Use files.uploadV2 ---
            await slackClient.files.uploadV2({
                channel_id: SLACK_CHANNEL_ID, // UPDATED: from 'channels'
                initial_comment: slackMessage,
                file: file.buffer,          // The actual file data
                filename: file.originalname // The original file name
            });
        } else {
            // --- If there is NO file, just send a text message ---
            await slackClient.chat.postMessage({
                channel: SLACK_CHANNEL_ID,
                text: slackMessage
            });
        }
        
        res.status(200).json({ success: true, message: 'Message sent.' });

    } catch (error) {
        console.error('Error sending to Slack:', error.message);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});const express = require('express');
const path = require('path');
const multer = require('multer'); // For file uploads
const { WebClient } = require('@slack/web-api'); // The new Slack client

// --- Config ---
const app = express();
const PORT = process.env.PORT || 8080;

// Get new Slack secrets from environment variables
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

// Initialize Slack client
if (!SLACK_BOT_TOKEN) {
    console.error('Missing SLACK_BOT_TOKEN!');
}
const slackClient = new WebClient(SLACK_BOT_TOKEN);

// Set up multer for file uploads in memory
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// --- Middleware ---
// Serve static files (our index.html)
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint ---
// Use upload.single('screenshot') to look for a file named 'screenshot'
app.post('/api/send', upload.single('screenshot'), async (req, res) => {
    // Text fields now come from req.body
    const { message, mill, isAlert } = req.body;
    const file = req.file; // The uploaded file is here
    
    if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
        console.error('Server is missing Slack Token or Channel ID');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    // Format the message
    const alertIcon = (isAlert === 'true') ? '🚨' : '💬'; // isAlert will be a string
    const slackMessage = `${alertIcon} *[${mill}]* \n${message}`;

    try {
        if (file) {
            // --- UPDATED: Use files.uploadV2 ---
            await slackClient.files.uploadV2({
                channel_id: SLACK_CHANNEL_ID, // UPDATED: from 'channels'
                initial_comment: slackMessage,
                file: file.buffer,          // The actual file data
                filename: file.originalname // The original file name
            });
        } else {
            // --- If there is NO file, just send a text message ---
            await slackClient.chat.postMessage({
                channel: SLACK_CHANNEL_ID,
                text: slackMessage
            });
        }
        
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