const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Load System Prompt
const promptPath = path.join(__dirname, '../config/system_prompt.txt');
let systemPromptTemplate = '';

try {
    systemPromptTemplate = fs.readFileSync(promptPath, 'utf8');
} catch (err) {
    console.error('Error reading system prompt:', err);
    systemPromptTemplate = 'You are a helpful assistant for BookingKaka.';
}

// Initialize OpenAI client
const openai = new OpenAI({
    baseURL: process.env.OPENAI_API_BASE || 'https://api.deepseek.com',
    apiKey: process.env.OPENAI_API_KEY,
});

router.post('/message', async (req, res) => {
    try {
        const { message, history, userName } = req.body;

        // Prepare System Prompt
        const currentUserName = userName || 'Guest';
        const systemPrompt = systemPromptTemplate.replace('{userName}', currentUserName);

        // Construct messages array with system prompt and history
        const messages = [
            { role: "system", content: systemPrompt },
            ...(history || []),
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: process.env.OPENAI_MODEL || "deepseek-chat",
        });

        const botResponse = completion.choices[0].message.content;

        res.json({ response: botResponse });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ message: 'Failed to process chat request' });
    }
});

module.exports = router;
