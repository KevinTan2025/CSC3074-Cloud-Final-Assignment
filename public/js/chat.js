document.addEventListener('DOMContentLoaded', () => {
    initChatWidget();
});

function initChatWidget() {
    // Inject HTML
    const chatHTML = `
        <div class="chat-widget">
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <h5>Customer Support</h5>
                    <button class="close-chat" id="closeChat">&times;</button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <!-- Messages will appear here -->
                    <div class="typing-indicator" id="typingIndicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Type a message...">
                    <button id="sendMessageBtn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="chat-launcher" id="chatLauncher">
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = chatHTML;
    document.body.appendChild(div);

    // Elements
    const launcher = document.getElementById('chatLauncher');
    const window = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeChat');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    const messagesContainer = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');

    // State
    let isOpen = false;
    let history = [];
    let isFirstOpen = true;

    // Toggle Chat
    function toggleChat() {
        isOpen = !isOpen;
        window.classList.toggle('active', isOpen);
        
        if (isOpen && isFirstOpen) {
            isFirstOpen = false;
            sendWelcomeMessage();
        }
    }

    launcher.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Send Message
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        input.value = '';
        
        // Show typing
        showTyping(true);

        try {
            // Get user info
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userName = user ? user.full_name : 'Guest';

            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text, 
                    history: history,
                    userName: userName
                })
            });

            const data = await response.json();
            
            showTyping(false);
            addMessage(data.response, 'bot');

            // Update history
            history.push({ role: "user", content: text });
            history.push({ role: "assistant", content: data.response });

        } catch (error) {
            console.error('Chat error:', error);
            showTyping(false);
            addMessage('Sorry, I am having trouble connecting to the server.', 'bot');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Helpers
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        
        if (sender === 'bot') {
            // Use marked to parse Markdown for bot messages
            div.innerHTML = marked.parse(text);
        } else {
            div.textContent = text;
        }
        
        messagesContainer.insertBefore(div, typingIndicator);
        scrollToBottom();
    }

    function showTyping(show) {
        typingIndicator.style.display = show ? 'block' : 'none';
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function sendWelcomeMessage() {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const name = user ? user.full_name : 'Guest';
        
        addMessage(`Hello, ${name}. I am your virtual assistant from BookingKaka, what can I help you?`, 'bot');
    }
}
