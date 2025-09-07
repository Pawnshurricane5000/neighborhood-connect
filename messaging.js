// ========================================
// MESSAGING SYSTEM - MAIN JAVASCRIPT FILE
// ========================================

console.log('📱 messaging.js loaded successfully!');

// Global variables
let currentUser = null;
let currentConversation = null;
let conversations = {};
let allUsers = new Set();

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Don't call checkLoginStatus here as it's handled in messaging-auth.js
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // New conversation modal keyboard support
    const newConversationInput = document.getElementById('newConversationUsername');
    if (newConversationInput) {
        newConversationInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                startNewConversation();
            }
        });
    }

    // Mobile sidebar close on outside click
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('conversationsSidebar');
            const toggleButton = document.querySelector('.mobile-toggle');
            
            if (sidebar && toggleButton && !sidebar.contains(e.target) && !toggleButton.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            const sidebar = document.getElementById('conversationsSidebar');
            if (sidebar) {
                sidebar.classList.remove('show');
            }
        }
    });
}

// Utility function to format timestamps
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('conversationsSidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// Global function for toggling sidebar (accessible from HTML)
window.toggleSidebar = toggleSidebar;

// Show new conversation modal
function showNewConversationModal() {
    const modal = document.getElementById('newConversationModal');
    const input = document.getElementById('newConversationUsername');
    
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'block';
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

// Global function for showing modal (accessible from HTML)
window.showNewConversationModal = showNewConversationModal;

// Close new conversation modal
function closeNewConversationModal() {
    const modal = document.getElementById('newConversationModal');
    const input = document.getElementById('newConversationUsername');
    
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        if (input) {
            input.value = '';
        }
    }
}

// Global function for closing modal (accessible from HTML)
window.closeNewConversationModal = closeNewConversationModal;

// Start new conversation (placeholder - will be implemented in messaging-chat.js)
function startNewConversation() {
    console.log('startNewConversation called - this should be implemented in messaging-chat.js');
    // This function will be overridden by messaging-chat.js
}

// Global function for starting new conversations (accessible from HTML)
window.startNewConversation = startNewConversation;

// Send message (placeholder - will be implemented in messaging-chat.js)
function sendMessage() {
    console.log('sendMessage called - this should be implemented in messaging-chat.js');
    // This function will be overridden by messaging-chat.js
}

// Global function for sending messages (accessible from HTML)
window.sendMessage = sendMessage;

// Logout function (placeholder - will be implemented in messaging-auth.js)
function logout() {
    console.log('logout called - this should be implemented in messaging-auth.js');
    // This function will be overridden by messaging-auth.js
}

// Global function for logout (accessible from HTML)
window.logout = logout;
