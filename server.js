const express = require('express');
const path = require('path');
const multer = require('multer');
const { WebClient } = require('@slack/web-api');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require("socket.io");

// --- Config ---
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Attach Socket.io
const PORT = process.env.PORT || 8080;

// Get Slack secrets from environment variables
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
app.use(bodyParser.json()); // Middleware for Slack Events

// --- Socket.io Connection ---
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// --- API Endpoints ---

// Endpoint to handle the initial message from the web UI
app.post('/api/send', upload.single('screenshot'), async (req, res) => {
    const { message, mill, isAlert } = req.body;
    const file = req.file;

    if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
        console.error('Server is missing Slack Token or Channel ID');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const alertIcon = (isAlert === 'true') ? '🚨' : '💬';
    const slackMessage = `${alertIcon} *[${mill}]* \n${message}`;

    try {
        let result;
        if (file) {
            result = await slackClient.files.uploadV2({
                channels: SLACK_CHANNEL_ID,
                initial_comment: slackMessage,
                file: file.buffer,
                filename: file.originalname,
            });
        } else {
            result = await slackClient.chat.postMessage({
                channel: SLACK_CHANNEL_ID,
                text: slackMessage,
            });
        }

        // IMPORTANT: Return the timestamp (ts) of the message
        const thread_ts = result.ts || (result.file && result.file.shares.public[SLACK_CHANNEL_ID][0].ts);
        if (!thread_ts) {
             console.error('Could not get thread_ts from Slack API response:', result);
             return res.status(500).json({ error: 'Failed to get message timestamp from Slack.' });
        }
        
        res.status(200).json({ success: true, message: 'Message sent.', ts: thread_ts });

    } catch (error) {
        console.error('Error sending to Slack:', error.data ? error.data.error : error.message);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

// Endpoint to handle replies from the web UI to a Slack thread
app.post('/api/reply', async (req, res) => {
    const { message, thread_ts } = req.body;

    if (!message || !thread_ts) {
        return res.status(400).json({ error: 'Message and thread_ts are required.' });
    }

    try {
        await slackClient.chat.postMessage({
            channel: SLACK_CHANNEL_ID,
            text: message,
            thread_ts: thread_ts, // This makes it a reply
        });
        res.status(200).json({ success: true, message: 'Reply sent.' });
    } catch (error) {
        console.error('Error sending reply to Slack:', error);
        res.status(500).json({ error: 'Failed to send reply.' });
    }
});


// Endpoint for Slack Events API
app.post('/slack/events', (req, res) => {
    const { type, challenge, event } = req.body;

    // Slack's URL verification challenge
    if (type === 'url_verification') {
        return res.status(200).send(challenge);
    }

    // Handle actual events
    if (type === 'event_callback') {
        // We only care about messages in threads that are not from our bot
        if (event.type === 'message' && event.thread_ts && !event.bot_id) {
            console.log('Received a threaded message from Slack:', event.text);
            // Broadcast the message to all connected web clients
            io.emit('new_message', {
                user: event.user, // You might want to resolve this to a user name
                text: event.text,
                thread_ts: event.thread_ts
            });
        }
    }

    res.status(200).send();
});


// --- Start Server ---
server.listen(PORT, () => { // Use server.listen instead of app.listen
    console.log(`Server running on http://localhost:${PORT}`);
});