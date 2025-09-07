// ========================================
// MESSAGING SYSTEM - CHAT FUNCTIONALITY
// ========================================

console.log('💬 messaging-chat.js loaded successfully!');

// Render conversations in the sidebar
function renderConversations() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    conversationsList.innerHTML = '';

    const sortedConversations = Object.values(conversations).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    sortedConversations.forEach(conversation => {
        const otherUser = conversation.otherUser || conversation.participants.find(p => p !== currentUser.username);
        const conversationItem = document.createElement('div');
        conversationItem.className = 'conversation-item';
        conversationItem.onclick = () => selectConversation(conversation.id);
        
        // Use full name if available, otherwise fall back to username
        const displayName = conversation.otherFullName ? 
            `${conversation.otherFullName} (${conversation.otherCity})` : 
            otherUser;
        
        conversationItem.innerHTML = `
            <div class="conversation-avatar">${conversation.otherAvatar || otherUser.substring(0, 2).toUpperCase()}</div>
            <div class="conversation-info">
                <h4 class="conversation-name">${displayName}</h4>
                <p class="conversation-preview">${conversation.lastMessage}</p>
            </div>
            <div class="conversation-meta">
                <div class="conversation-time">${formatTimestamp(conversation.timestamp)}</div>
                ${conversation.unread > 0 ? `<div class="unread-badge">${conversation.unread}</div>` : ''}
            </div>
        `;
        
        conversationsList.appendChild(conversationItem);
    });
}

// Select a conversation and show messages
function selectConversation(conversationId) {
    currentConversation = conversationId;
    const conversation = conversations[conversationId];
    if (!conversation) return;
    
    const otherUser = conversation.otherUser || conversation.participants.find(p => p !== currentUser.username);
    
    // Use full name if available, otherwise fall back to username
    const displayName = conversation.otherFullName ? 
        `${conversation.otherFullName} (${conversation.otherCity})` : 
        otherUser;

    // Update chat header
    updateChatHeader(displayName);

    // Load messages from backend
    loadConversationMessages(conversationId);

    // Show input area
    showMessageInput();

    // Update active conversation in sidebar
    updateActiveConversation(conversationId);

    // Mark messages as read
    markConversationAsRead(conversationId);

    // Join conversation room for real-time updates
    if (socket) {
        socket.emit('join_conversation', conversationId);
    }

    // Mobile: hide sidebar after selection
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

// Update chat header with conversation info
function updateChatHeader(otherUser) {
    const chatAvatar = document.getElementById('chatAvatar');
    const chatName = document.getElementById('chatName');
    const chatStatus = document.getElementById('chatStatus');
    
    if (chatAvatar) chatAvatar.textContent = otherUser.substring(0, 2).toUpperCase();
    if (chatName) chatName.textContent = otherUser;
    if (chatStatus) chatStatus.textContent = 'Online';
}

// Show message input area
function showMessageInput() {
    const messageInputArea = document.getElementById('messageInputArea');
    if (messageInputArea) {
        messageInputArea.style.display = 'flex';
    }
}

// Render messages in the chat area
function renderMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';

    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="message-placeholder">
                <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            </div>
        `;
        return;
    }

    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === currentUser.username ? 'sent' : 'received'}`;
        
        messageElement.innerHTML = `
            <div class="message-avatar">${message.sender.substring(0, 2).toUpperCase()}</div>
            <div class="message-content">
                <p class="message-text">${message.text}</p>
                <div class="message-time">${formatTimestamp(message.timestamp)}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Update active conversation in sidebar
function updateActiveConversation(conversationId) {
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find the conversation item by its onclick attribute
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach((item) => {
        if (item.onclick && item.onclick.toString().includes(conversationId)) {
            item.classList.add('active');
        }
    });
}

// Mark conversation as read
function markConversationAsRead(conversationId) {
    if (!conversations[conversationId] || !authToken) return;
    
    // Mark messages as read in backend
    fetch(`${API_BASE}/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error marking messages as read:', data.error);
        } else {
            // Update local state
            conversations[conversationId].unread = 0;
            renderConversations();
        }
    })
    .catch(error => {
        console.error('Error marking messages as read:', error);
    });
}

// Setup message input functionality
function setupMessageInput() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!messageInput || !sendButton) return;

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Send message on Enter (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Update send button state
    messageInput.addEventListener('input', function() {
        sendButton.disabled = !this.value.trim();
    });
}

// Load conversation messages from backend
function loadConversationMessages(conversationId) {
    if (!authToken) return;
    
    fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error loading messages:', data.error);
        } else {
            // Convert backend format to frontend format
            const messages = data.map(msg => ({
                id: msg.id,
                text: msg.message_text,
                sender: msg.sender,
                timestamp: msg.timestamp
            }));
            
            // Update conversation messages
            conversations[conversationId].messages = messages;
            
            // Render messages
            renderMessages(messages);
        }
    })
    .catch(error => {
        console.error('Error loading messages:', error);
    });
}

// Send a new message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !currentConversation || !authToken) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    // Show sending state
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    // Send message to backend
    fetch(`${API_BASE}/conversations/${currentConversation}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ messageText })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, 'error');
        } else {
            // Message sent successfully
            // The socket will handle adding it to the UI
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        showNotification('Failed to send message. Please try again.', 'error');
    })
    .finally(() => {
        // Reset send button
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    });
}

// Global function for sending messages (accessible from HTML)
window.sendMessage = sendMessage;

// Start new conversation with selected user
function startNewConversation() {
    const userSelect = document.getElementById('newConversationUsername');
    if (!userSelect) return;
    
    const selectedUsername = userSelect.value;
    
    if (!selectedUsername) {
        showNotification('Please select a user to message', 'error');
        return;
    }

    if (selectedUsername === currentUser.username) {
        showNotification('You cannot message yourself', 'error');
        return;
    }

    // Show loading state
    const startChatBtn = document.querySelector('#newConversationModal .btn-primary');
    const originalText = startChatBtn.textContent;
    startChatBtn.textContent = 'Creating...';
    startChatBtn.disabled = true;

    // Create conversation in backend
    fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ otherUsername: selectedUsername })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, 'error');
        } else {
            // Conversation created successfully
            showNotification('Conversation started!', 'success');
            closeNewConversationModal();
            
            // Reload conversations to show the new one
            loadConversations();
            
            // Select the new conversation
            setTimeout(() => {
                selectConversation(data.conversationId);
            }, 500);
        }
    })
    .catch(error => {
        console.error('Error creating conversation:', error);
        showNotification('Failed to create conversation. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        startChatBtn.textContent = originalText;
        startChatBtn.disabled = false;
    });
}

// Global function for starting new conversations (accessible from HTML)
window.startNewConversation = startNewConversation;
