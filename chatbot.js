/**
 * UWO Helpdesk Chatbot Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const chatbotWidget = document.getElementById('uwo-chatbot-widget');
    const toggleBtn = chatbotWidget.querySelector('.chatbot-toggle-btn');
    const closeBtns = chatbotWidget.querySelectorAll('.close-panel-btn, .chatbot-close-btn');
    const chatbotPanel = chatbotWidget.querySelector('.chatbot-panel');
    const sendBtn = chatbotWidget.querySelector('.chatbot-send-btn');
    const chatInput = chatbotWidget.querySelector('#chatbot-input');
    const chatArea = chatbotWidget.querySelector('.chat-area');
    const navHomeBtns = document.querySelectorAll('#nav-home, #nav-home-chat');
    const navChatBtns = document.querySelectorAll('#nav-chat, #nav-chat-inner');
    const homeView = document.getElementById('home-view');
    const chatView = document.getElementById('chat-view');
    const startChatCta = document.getElementById('start-chat-cta');

    // Email collector elements
    const emailCollector = document.getElementById('email-collector');
    const closeCollectorBtn = emailCollector.querySelector('.close-collector-btn');
    const submitEmailBtn = document.getElementById('submit-email-btn');
    const userEmailInput = document.getElementById('user-email-input');
    const gdprAgree = document.getElementById('gdpr-agree');

    let welcomeSent = false;
    let pendingAction = null; // To remember what the user wanted to do (chat or faq)

    const isEmailCollected = () => {
        const email = localStorage.getItem('uwo_chatbot_email');
        console.log('🔍 Checking lead status:', email ? `Email found: ${email}` : 'No lead info found');
        return email;
    };

    const closeChat = (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        chatbotPanel.classList.remove('active');
        chatbotWidget.classList.remove('chat-open');
        console.log('Chat explicitly closed');

        // Force hide transition/visibility to ensure it closes
        chatbotPanel.style.display = 'none';
        chatbotPanel.style.visibility = 'hidden';
        chatbotPanel.style.opacity = '0';
    };
    window.closeChat = closeChat;

    const toggleChat = (e) => {
        if (e) e.stopPropagation();

        const isActive = chatbotPanel.classList.contains('active');
        if (isActive) {
            closeChat();
        } else {
            chatbotPanel.classList.add('active');
            chatbotWidget.classList.add('chat-open');
            chatbotPanel.style.display = 'flex';
            chatbotPanel.style.visibility = 'visible';
            chatbotPanel.style.opacity = '1';
            console.log('Chat Opened');
        }
    };

    // Explicit Close Handling
    const attachCloseListeners = () => {
        const buttons = chatbotWidget.querySelectorAll('.close-panel-btn, .chatbot-close-btn');
        buttons.forEach(btn => {
            // Remove old listener if any to avoid double triggers
            btn.removeEventListener('click', closeChat);
            btn.addEventListener('click', closeChat);
        });
    };

    // Initial attachment
    attachCloseListeners();

    toggleBtn.addEventListener('click', toggleChat);

    // View Switching Logic (with collector guard)
    const showView = (viewName) => {
        console.log(`🚀 Switching view to: ${viewName}`);

        if (viewName === 'chat' && !isEmailCollected()) {
            console.log('⚠️ Lead form required for Chat');
            pendingAction = 'chat';
            emailCollector.style.display = 'flex';
            return;
        }

        if (viewName === 'home') {
            homeView.style.display = 'flex';
            chatView.style.display = 'none';
            navHomeBtns.forEach(btn => btn.classList.add('active'));
            navChatBtns.forEach(btn => btn.classList.remove('active'));
            emailCollector.style.display = 'none';
        } else {
            homeView.style.display = 'none';
            chatView.style.display = 'flex';
            navHomeBtns.forEach(btn => btn.classList.remove('active'));
            navChatBtns.forEach(btn => btn.classList.add('active'));
            emailCollector.style.display = 'none';
            chatInput.focus();
            if (!welcomeSent) {
                console.log('🤖 Sending first welcome message...');
                setTimeout(sendWelcomeMessage, 500);
            }
        }
    };
    window.showView = showView;

    // Collector Submission Logic
    submitEmailBtn.addEventListener('click', async () => {
        const email = userEmailInput.value.trim();
        const gdpr = gdprAgree.checked;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (!gdpr) {
            alert('Please agree to the GDPR terms to continue.');
            return;
        }

        submitEmailBtn.disabled = true;
        const originalText = submitEmailBtn.textContent;
        submitEmailBtn.textContent = 'Saving...';

        try {
            console.log('📤 Sending lead to backend:', email);
            // Store in backend
            await fetch('http://localhost:5000/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    source: 'UWO Chatbot',
                    message: `Chatbot Lead - Intercepted ${pendingAction || 'Manual Chat'}`
                })
            });

            // Store in local storage
            localStorage.setItem('uwo_chatbot_email', email);
            console.log('✅ Lead saved successfully');

            // Proceed to chat or FAQ
            if (pendingAction === 'chat') {
                showView('chat');
            } else if (pendingAction && pendingAction.startsWith('faq:')) {
                const question = pendingAction.replace('faq:', '');
                executeFaq(question);
            } else {
                showView('chat');
            }
            emailCollector.style.display = 'none';
        } catch (err) {
            console.warn('Backend unavailable, allowing session-only access.');
            // Even if backend fails, allow user to proceed but maybe log it?
            localStorage.setItem('uwo_chatbot_email', email);
            showView('chat');
        } finally {
            submitEmailBtn.disabled = false;
            submitEmailBtn.textContent = originalText;
        }
    });

    closeCollectorBtn.addEventListener('click', () => {
        emailCollector.style.display = 'none';
        pendingAction = null;
    });

    navHomeBtns.forEach(btn => btn.addEventListener('click', () => showView('home')));
    navChatBtns.forEach(btn => btn.addEventListener('click', () => showView('chat')));
    startChatCta.addEventListener('click', () => showView('chat'));

    const executeFaq = (question) => {
        showView('chat');
        chatInput.value = question;
        handleSend();
    };

    window.handleFaqClick = (question) => {
        console.log(`❓ FAQ Clicked: ${question}`);
        if (!isEmailCollected()) {
            console.log('⚠️ Lead form required for FAQ');
            pendingAction = `faq:${question}`;
            emailCollector.style.display = 'flex';
            return;
        }
        executeFaq(question);
    };

    // Send Welcome Message
    const sendWelcomeMessage = () => {
        const welcomeMsg = "Hi 👋 I'm UWO™ AI Assistant. How can I help you today?";
        addMessage(welcomeMsg, 'bot');
        welcomeSent = true;

        // Initial Suggestions
        addSuggestions([
            { text: "What is UWO™?", icon: "fa-circle-info" },
            { text: "Help Center", icon: "fa-book" },
            { text: "How to partner with us?", icon: "fa-handshake" }
        ]);
    };

    // Add Suggestion Chips
    const addSuggestions = (suggestions) => {
        // Remove anyway existing suggestions first
        const existing = document.querySelector('.suggestions-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.classList.add('suggestions-container');

        suggestions.forEach(item => {
            const chip = document.createElement('div');
            chip.classList.add('suggestion-chip');
            chip.innerHTML = `<i class="fa-solid ${item.icon}"></i> ${item.text}`;
            chip.onclick = () => {
                chatInput.value = item.text;
                handleSend();
                container.remove();
            };
            container.appendChild(chip);
        });

        chatArea.appendChild(container);
        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: 'smooth'
        });
    };

    // Add Message to Chat Area
    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-wrapper');
        messageDiv.classList.add(sender === 'bot' ? 'bot-wrapper' : 'user-wrapper');

        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        messageDiv.innerHTML = `
            <div class="message ${sender === 'bot' ? 'bot-message' : 'user-message'}">
                ${text}
                <span class="message-time">${timeStr}</span>
            </div>
        `;
        chatArea.appendChild(messageDiv);

        // Scroll to bottom
        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: 'smooth'
        });
    };

    // Show/Hide Loading Indicator
    const showLoading = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message-wrapper', 'bot-wrapper');
        loadingDiv.id = 'chatbot-loading';
        loadingDiv.innerHTML = `
            <div class="message bot-message typing">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatArea.appendChild(loadingDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    };

    const hideLoading = () => {
        const loadingDiv = document.getElementById('chatbot-loading');
        if (loadingDiv) loadingDiv.remove();
    };

    // Handle Sending Message
    const handleSend = async () => {
        const text = chatInput.value.trim();
        if (text) {
            // Remove suggestions when user sends a message
            const suggestions = document.querySelector('.suggestions-container');
            if (suggestions) suggestions.remove();

            addMessage(text, 'user');
            chatInput.value = '';

            showLoading();

            try {
                const response = await fetch('http://localhost:5000/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                const data = await response.json();
                hideLoading();

                if (data.reply) {
                    addMessage(data.reply, 'bot');
                } else {
                    addMessage("I'm sorry, I'm having trouble processing that right now.", 'bot');
                }
            } catch (err) {
                hideLoading();
                console.warn("Backend not reached, using fallback response.");
                setTimeout(() => {
                    addMessage("I'm sorry, I'm having trouble connecting to my brain right now. Please feel free to reach out to us directly:\n\n📧 admin@uwo24.com\n📞 +91 8358990909 (WhatsApp)", 'bot');
                }, 1000);
            }
        }
    };

    // Event Listeners for sending
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Handle header click to return home
    const headerHome = chatbotWidget.querySelector('.home-hero h1');
    if (headerHome) {
        headerHome.style.cursor = 'pointer';
        headerHome.addEventListener('click', () => showView('home'));
    }
});
