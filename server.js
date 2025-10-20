const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuration ---
// The API Key is still a placeholder.
// In a real-world app, ensure process.env.GOOGLE_API_KEY is set.
const API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyDbwrUaG5yBIZvLGeXoNY2mBA7YAZpdUH4';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(API_KEY);

// System instruction to define the chatbot's role
const systemInstruction = `You are a friendly and helpful e-commerce customer service assistant for a store called 'The Sample Shop'. Your goal is to answer questions about the products, cart, and orders.
Current available products are: Sample Product 1 ($10.00), Sample Product 2 ($20.00), and Sample Product 3 ($30.00).
Keep your responses concise and always encourage the user to ask another question.`;

// Initialize the model with system instruction
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemInstruction,
});

// *Conversation History Manager*
// Instead of a single model instance, we use a Map to store chats (one per user/session).
// For a real-world app, this would be tied to a session ID or user ID.
// For this example, we'll use a single global chat for simplicity.
let globalChat = null;

// Function to initialize or reset the chat session
function initializeChat() {
    console.log("Initializing new chat session...");
    globalChat = model.startChat();
}

// Initialize the chat when the server starts
initializeChat();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the parent directory (job search)
app.use(express.static(path.join(__dirname, '..')));

// Mock data (unchanged)
let products = [
    {
        id: '1',
        name: 'Sample Product 1',
        description: 'This is a sample product.',
        price: '$10.00',
        discount: '10% off',
        image: 'https://via.placeholder.com/200x200?text=Product+1'
    },
    {
        id: '2',
        name: 'Sample Product 2',
        description: 'Another sample product.',
        price: '$20.00',
        discount: '15% off',
        image: 'https://via.placeholder.com/200x200?text=Product+2'
    },
    {
        id: '3',
        name: 'Sample Product 3',
        description: 'Yet another sample product.',
        price: '$30.00',
        discount: '20% off',
        image: 'https://via.placeholder.com/200x200?text=Product+3'
    }
];

let cart = [];

let orders = [
    {
        id: 'ORD001',
        date: '2024-01-15T10:30:00Z',
        status: 'Delivered',
        total: '$25.00',
        items: [
            { name: 'Sample Product 1', price: '$10.00' },
            { name: 'Sample Product 2', price: '$15.00' }
        ]
    },
    {
        id: 'ORD002',
        date: '2024-01-20T14:45:00Z',
        status: 'Shipped',
        total: '$45.00',
        items: [
            { name: 'Sample Product 3', price: '$30.00' },
            { name: 'Sample Product 1', price: '$10.00' },
            { name: 'Sample Product 2', price: '$5.00' }
        ]
    }
];

// --- API Routes (Only the Chatbot route is modified) ---

// ... (other routes like /api/products, /api/cart, /api/orders, /api/login, /api/forgot remain unchanged) ...

// *Chatbot using Gemini AI (Now functional with history)*
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!globalChat) {
        initializeChat();
    }

    try {
        // Use sendMessage to maintain conversation history
        const result = await globalChat.sendMessage(message);
        const text = result.response.text();

        res.json({ response: text });
    } catch (error) {
        console.error('Error with Gemini AI:', error);
        // On a major error, re-initialize the chat
        initializeChat(); 
        res.status(500).json({ response: 'Sorry, I am unable to respond right now. My memory has been reset. Please try your question again.' });
    }
});

// *New Route: Reset Chat History*
app.post('/api/chat/reset', (req, res) => {
    initializeChat();
    res.json({ message: 'Chat history has been reset. Start a new conversation!' });
});

// Serve HTML files (unchanged)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/forgot', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'forgot.html'));
});

app.get('/FAQ', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Faq.html'));
});

app.get('/myOrders', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'myOrders.html'));
});

app.get('/logout', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'logout.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
