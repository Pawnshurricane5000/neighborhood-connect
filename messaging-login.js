// ========================================
// MESSAGING SYSTEM - LOGIN FUNCTIONALITY
// ========================================

// Check if user is already logged in
function checkLoginStatus() {
    const savedUser = localStorage.getItem('neighborConnectUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMessagingInterface();
        loadUserData();
    } else {
        showLoginScreen();
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('usernameInput');
    if (!usernameInput) return;
    
    const username = usernameInput.value.trim();
    
    if (username.length < 2) {
        alert('Username must be at least 2 characters long');
        return;
    }

    // Create or load user
    currentUser = {
        username: username,
        avatar: username.substring(0, 2).toUpperCase(),
        lastSeen: new Date().toISOString()
    };

    // Save user to localStorage
    localStorage.setItem('neighborConnectUser', JSON.stringify(currentUser));
    
    // Add to all users if new
    if (!allUsers.has(username)) {
        allUsers.add(username);
        saveAllUsers();
    }

    showMessagingInterface();
    loadUserData();
}

// Show messaging interface
function showMessagingInterface() {
    const loginScreen = document.getElementById('loginScreen');
    const messagingInterface = document.getElementById('messagingInterface');
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (messagingInterface) messagingInterface.classList.remove('hidden');
    
    // Update user info in header
    updateUserHeader();
    
    // Initialize messaging components
    renderConversations();
    setupMessageInput();
}

// Show login screen
function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const messagingInterface = document.getElementById('messagingInterface');
    
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (messagingInterface) messagingInterface.classList.add('hidden');
}

// Update user header information
function updateUserHeader() {
    if (!currentUser) return;
    
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (userAvatar) userAvatar.textContent = currentUser.avatar;
    if (userName) userName.textContent = currentUser.username;
}

// Logout functionality
function logout() {
    currentUser = null;
    currentConversation = null;
    conversations = {};
    localStorage.removeItem('neighborConnectUser');
    showLoginScreen();
}

// Load user data from localStorage
function loadUserData() {
    if (!currentUser) return;
    
    const savedConversations = localStorage.getItem(`neighborConnectConversations_${currentUser.username}`);
    const savedUsers = localStorage.getItem('neighborConnectAllUsers');
    
    if (savedConversations) {
        conversations = JSON.parse(savedConversations);
    }
    
    if (savedUsers) {
        allUsers = new Set(JSON.parse(savedUsers));
    }

    // Initialize with some default conversations if none exist
    if (Object.keys(conversations).length === 0) {
        initializeDefaultConversations();
    }
}

// Initialize default conversations for new users
function initializeDefaultConversations() {
    if (!currentUser) return;
    
    const defaultUsers = ['Sarah', 'Mike', 'Emily', 'David', 'Lisa'];
    
    defaultUsers.forEach(username => {
        if (username !== currentUser.username) {
            allUsers.add(username);
            const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            conversations[conversationId] = {
                id: conversationId,
                participants: [currentUser.username, username],
                lastMessage: `Hi ${username}! Welcome to NeighborConnect!`,
                timestamp: new Date().toISOString(),
                unread: 0,
                messages: [
                    {
                        id: Date.now(),
                        text: `Hi ${username}! Welcome to NeighborConnect!`,
                        sender: currentUser.username,
                        timestamp: new Date().toISOString()
                    }
                ]
            };
        }
    });
    
    saveAllUsers();
    saveUserData();
}

// Setup login form event listener
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});
