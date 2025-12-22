const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    baseURL: process.env.OPENAI_API_BASE || 'https://api.deepseek.com',
    apiKey: process.env.OPENAI_API_KEY,
});

router.post('/message', async (req, res) => {
    try {
        const { message, history, userName } = req.body;

        // Construct messages array with system prompt and history
        const messages = [
            { 
                role: "system", 
                content: `You are a helpful virtual assistant for BookingKaka, a hotel booking platform. 
                Your goal is to assist users with their inquiries about rooms, bookings, and services.
                The user's name is ${userName || 'Guest'}.
                Be polite, professional, and concise.` 
            },
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
