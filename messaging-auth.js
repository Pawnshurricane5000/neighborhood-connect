<<<<<<< HEAD
// ========================================
// MESSAGING SYSTEM - AUTHENTICATION
// ========================================

console.log('🔐 messaging-auth.js loaded successfully!');

// Global variables
let currentUser = null;
let authToken = null;
let socket = null;

// API base URL
const API_BASE = 'http://localhost:3000/api';

// Check if user is already logged in
function checkLoginStatus() {
    const savedToken = localStorage.getItem('neighborConnectToken');
    const savedUser = localStorage.getItem('neighborConnectUser');
    
    if (savedToken && savedUser) {
        try {
            authToken = savedToken;
            currentUser = JSON.parse(savedUser);
            
            // Verify token is still valid
            fetch(`${API_BASE}/profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
            .then(response => {
                if (response.ok) {
                    showMessagingInterface();
                    initializeSocket();
                    loadUserData();
                } else {
                    // Token expired or invalid
                    logout();
                }
            })
            .catch(() => {
                logout();
            });
        } catch (error) {
            logout();
        }
    } else {
        showAuthScreen();
    }
}

// Show authentication screen
function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const messagingInterface = document.getElementById('messagingInterface');
    
    if (authScreen) authScreen.classList.remove('hidden');
    if (messagingInterface) messagingInterface.classList.add('hidden');
}

// Show messaging interface
function showMessagingInterface() {
    const authScreen = document.getElementById('authScreen');
    const messagingInterface = document.getElementById('messagingInterface');
    
    if (authScreen) authScreen.classList.add('hidden');
    if (messagingInterface) messagingInterface.classList.remove('hidden');
    
    // Update user info in header
    updateUserHeader();
}

// Update user header information
function updateUserHeader() {
    if (!currentUser) return;
    
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (userAvatar) userAvatar.textContent = currentUser.avatar;
    if (userName) userName.textContent = currentUser.fullName || currentUser.username;
}

// Initialize Socket.IO connection
function initializeSocket() {
    if (!authToken) return;
    
    socket = io('http://localhost:3000', {
        auth: {
            token: authToken
        }
    });

    socket.on('connect', () => {
        console.log('Connected to messaging server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from messaging server');
    });

    socket.on('new_message', (message) => {
        handleNewMessage(message);
    });

    socket.on('user_typing', (data) => {
        // Handle typing indicator
        console.log(`${data.username} is typing...`);
    });

    socket.on('user_stopped_typing', (data) => {
        // Handle typing stopped
        console.log(`${data.username} stopped typing`);
    });
}

// Handle new message from socket
function handleNewMessage(message) {
    if (currentConversation === message.conversation_id) {
        // Add message to current conversation
        const newMessage = {
            id: message.id,
            text: message.message_text,
            sender: message.sender,
            timestamp: message.timestamp
        };
        
        conversations[message.conversation_id].messages.push(newMessage);
        conversations[message.conversation_id].lastMessage = message.message_text;
        conversations[message.conversation_id].timestamp = message.timestamp;
        
        // Update UI
        renderMessages(conversations[message.conversation_id].messages);
        renderConversations();
    } else {
        // Update conversation list to show new message
        loadConversations();
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;

    fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, 'error');
        } else {
            // Store token and user data
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('neighborConnectToken', authToken);
            localStorage.setItem('neighborConnectUser', JSON.stringify(currentUser));
            
            showNotification('Login successful!', 'success');
            showMessagingInterface();
            initializeSocket();
            loadUserData();
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Handle registration form submission
function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('registerName').value.trim();
    const city = document.getElementById('registerCity').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password || !confirmPassword || !fullName || !city || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Additional validation
    if (fullName.trim().length < 2) {
        showNotification('Full name must be at least 2 characters', 'error');
        return;
    }
    
    if (city.trim().length < 2) {
        showNotification('City must be at least 2 characters', 'error');
        return;
    }
    
    if (username.trim().length < 3) {
        showNotification('Username must be at least 3 characters', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    


    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, fullName, city })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, 'error');
        } else {
            // Store token and user data
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('neighborConnectToken', authToken);
            localStorage.setItem('neighborConnectUser', JSON.stringify(currentUser));
            
            showNotification('Account created successfully!', 'success');
            showMessagingInterface();
            initializeSocket();
            loadUserData();
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Show register form
function showRegisterForm() {
    console.log('🎯 showRegisterForm function called!');
    
    // Test if we can access DOM elements
    console.log('🔍 Testing DOM access...');
    console.log('document.body:', document.body);
    console.log('document.getElementById("loginForm"):', document.getElementById('loginForm'));
    console.log('document.getElementById("registerForm"):', document.getElementById('registerForm'));
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    console.log('📋 loginForm element:', loginForm);
    console.log('📋 registerForm element:', registerForm);
    
    if (loginForm) {
        console.log('✅ Login form found, removing active class');
        loginForm.classList.remove('active');
        console.log('✅ Removed active class from login form');
    } else {
        console.log('❌ Login form NOT found!');
    }
    
    if (registerForm) {
        console.log('✅ Register form found, adding active class');
        registerForm.classList.add('active');
        console.log('✅ Added active class to register form');
    } else {
        console.log('❌ Register form NOT found!');
    }
    
    console.log('🎉 Form switching complete');
    
    // Test if the classes were actually changed
    if (loginForm) console.log('Login form classes after:', loginForm.className);
    if (registerForm) console.log('Register form classes after:', registerForm.className);
}

// Show login form
function showLoginForm() {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

// Global functions for form switching (accessible from HTML)
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;

// Debug: Test if functions are accessible
console.log('🌐 Global functions test:');
console.log('window.showRegisterForm:', typeof window.showRegisterForm);
console.log('window.showLoginForm:', typeof window.showLoginForm);

// Test if we can call the function directly
console.log('🧪 Testing direct function call...');
try {
    showRegisterForm();
    console.log('✅ Direct function call successful');
} catch (error) {
    console.error('❌ Direct function call failed:', error);
}

// Logout functionality
function logout() {
    currentUser = null;
    authToken = null;
    currentConversation = null;
    conversations = {};
    
    localStorage.removeItem('neighborConnectToken');
    localStorage.removeItem('neighborConnectUser');
    
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    showAuthScreen();
    
    // Clear forms
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
}

// Global function for logout (accessible from HTML)
window.logout = logout;

// Load user data from backend
function loadUserData() {
    if (!authToken) return;
    
    loadConversations();
    loadUsers();
}

// Load conversations from backend
function loadConversations() {
    if (!authToken) return;
    
    fetch(`${API_BASE}/conversations`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error loading conversations:', data.error);
        } else {
            // Convert backend format to frontend format
            conversations = {};
            data.forEach(conv => {
                conversations[conv.conversation_id] = {
                    id: conv.conversation_id,
                    participants: [conv.participant1, conv.participant2],
                    lastMessage: conv.last_message || 'No messages yet',
                    timestamp: conv.last_message_time || conv.created_at,
                    unread: conv.unread_count || 0,
                    messages: [],
                    otherUser: conv.other_user,
                    otherFullName: conv.other_full_name,
                    otherCity: conv.other_city,
                    otherAvatar: conv.other_avatar
                };
            });
            
            renderConversations();
        }
    })
    .catch(error => {
        console.error('Error loading conversations:', error);
    });
}

// Load users for new conversations
function loadUsers() {
    if (!authToken) return;
    
    fetch(`${API_BASE}/users`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error loading users:', data.error);
        } else {
            // Populate user select in new conversation modal
            const userSelect = document.getElementById('newConversationUsername');
            if (userSelect) {
                userSelect.innerHTML = '<option value="">Choose a user...</option>';
                data.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.username;
                    const displayName = user.full_name ? `${user.full_name} (${user.city})` : user.username;
                    option.textContent = displayName;
                    userSelect.appendChild(option);
                });
            }
        }
    })
    .catch(error => {
        console.error('Error loading users:', error);
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Global function for notifications (accessible from HTML)
window.showNotification = showNotification;

// Setup authentication event listeners
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Check login status
    checkLoginStatus();
    
    // Setup message input functionality
    if (typeof setupMessageInput === 'function') {
        setupMessageInput();
    }
});
=======
// ========================================
// MESSAGING SYSTEM - AUTHENTICATION
// ========================================

console.log('🔐 messaging-auth.js loaded successfully!');

// Global variables
let currentUser = null;
let authToken = null;
let socket = null;

// API base URL
const API_BASE = 'http://localhost:3000/api';

// Check if user is already logged in
function checkLoginStatus() {
    const savedToken = localStorage.getItem('neighborConnectToken');
    const savedUser = localStorage.getItem('neighborConnectUser');
    
    if (savedToken && savedUser) {
        try {
            authToken = savedToken;
            currentUser = JSON.parse(savedUser);
            
            // Verify token is still valid
            fetch(`${API_BASE}/profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
            .then(response => {
                if (response.ok) {
                    showMessagingInterface();
                    initializeSocket();
                    loadUserData();
                } else {
                    // Token expired or invalid
                    logout();
                }
            })
            .catch(() => {
                logout();
            });
        } catch (error) {
            logout();
        }
    } else {
        showAuthScreen();
    }
}

// Show authentication screen
function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const messagingInterface = document.getElementById('messagingInterface');
    
    if (authScreen) authScreen.classList.remove('hidden');
    if (messagingInterface) messagingInterface.classList.add('hidden');
}

// Show messaging interface
function showMessagingInterface() {
    const authScreen = document.getElementById('authScreen');
    const messagingInterface = document.getElementById('messagingInterface');
    
    if (authScreen) authScreen.classList.add('hidden');
    if (messagingInterface) messagingInterface.classList.remove('hidden');
    
    // Update user info in header
    updateUserHeader();
}

// Update user header information
function updateUserHeader() {
    if (!currentUser) return;
    
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (userAvatar) userAvatar.textContent = currentUser.avatar;
    if (userName) userName.textContent = currentUser.fullName || currentUser.username;
}

// Initialize Socket.IO connection
function initializeSocket() {
    if (!authToken) return;
    
    socket = io('http://localhost:3000', {
        auth: {
            token: authToken
        }
    });

    socket.on('connect', () => {
        console.log('Connected to messaging server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from messaging server');
    });

    socket.on('new_message', (message) => {
        handleNewMessage(message);
    });

    socket.on('user_typing', (data) => {
        // Handle typing indicator
        console.log(`${data.username} is typing...`);
    });

    socket.on('user_stopped_typing', (data) => {
        // Handle typing stopped
        console.log(`${data.username} stopped typing`);
    });
}

// Handle new message from socket
function handleNewMessage(message) {
    if (currentConversation === message.conversation_id) {
        // Add message to current conversation
        const newMessage = {
            id: message.id,
            text: message.message_text,
            sender: message.sender,
            timestamp: message.timestamp
        };
        
        conversations[message.conversation_id].messages.push(newMessage);
        conversations[message.conversation_id].lastMessage = message.message_text;
        conversations[message.conversation_id].timestamp = message.timestamp;
        
        // Update UI
        renderMessages(conversations[message.conversation_id].messages);
        renderConversations();
    } else {
        // Update conversation list to show new message
        loadConversations();
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;

    fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, 'error');
        } else {
            // Store token and user data
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('neighborConnectToken', authToken);
            localStorage.setItem('neighborConnectUser', JSON.stringify(currentUser));
            
            showNotification('Login successful!', 'success');
            showMessagingInterface();
            initializeSocket();
            loadUserData();
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Handle registration form submission
function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('registerName').value.trim();
    const city = document.getElementById('registerCity').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password || !confirmPassword || !fullName || !city || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Additional validation
    if (fullName.trim().length < 2) {
        showNotification('Full name must be at least 2 characters', 'error');
        return;
    }
    
    if (city.trim().length < 2) {
        showNotification('City must be at least 2 characters', 'error');
        return;
    }
    
    if (username.trim().length < 3) {
        showNotification('Username must be at least 3 characters', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    


    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, fullName, city })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, 'error');
        } else {
            // Store token and user data
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('neighborConnectToken', authToken);
            localStorage.setItem('neighborConnectUser', JSON.stringify(currentUser));
            
            showNotification('Account created successfully!', 'success');
            showMessagingInterface();
            initializeSocket();
            loadUserData();
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Show register form
function showRegisterForm() {
    console.log('🎯 showRegisterForm function called!');
    
    // Test if we can access DOM elements
    console.log('🔍 Testing DOM access...');
    console.log('document.body:', document.body);
    console.log('document.getElementById("loginForm"):', document.getElementById('loginForm'));
    console.log('document.getElementById("registerForm"):', document.getElementById('registerForm'));
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    console.log('📋 loginForm element:', loginForm);
    console.log('📋 registerForm element:', registerForm);
    
    if (loginForm) {
        console.log('✅ Login form found, removing active class');
        loginForm.classList.remove('active');
        console.log('✅ Removed active class from login form');
    } else {
        console.log('❌ Login form NOT found!');
    }
    
    if (registerForm) {
        console.log('✅ Register form found, adding active class');
        registerForm.classList.add('active');
        console.log('✅ Added active class to register form');
    } else {
        console.log('❌ Register form NOT found!');
    }
    
    console.log('🎉 Form switching complete');
    
    // Test if the classes were actually changed
    if (loginForm) console.log('Login form classes after:', loginForm.className);
    if (registerForm) console.log('Register form classes after:', registerForm.className);
}

// Show login form
function showLoginForm() {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

// Global functions for form switching (accessible from HTML)
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;

// Debug: Test if functions are accessible
console.log('🌐 Global functions test:');
console.log('window.showRegisterForm:', typeof window.showRegisterForm);
console.log('window.showLoginForm:', typeof window.showLoginForm);

// Test if we can call the function directly
console.log('🧪 Testing direct function call...');
try {
    showRegisterForm();
    console.log('✅ Direct function call successful');
} catch (error) {
    console.error('❌ Direct function call failed:', error);
}

// Logout functionality
function logout() {
    currentUser = null;
    authToken = null;
    currentConversation = null;
    conversations = {};
    
    localStorage.removeItem('neighborConnectToken');
    localStorage.removeItem('neighborConnectUser');
    
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    showAuthScreen();
    
    // Clear forms
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
}

// Global function for logout (accessible from HTML)
window.logout = logout;

// Load user data from backend
function loadUserData() {
    if (!authToken) return;
    
    loadConversations();
    loadUsers();
}

// Load conversations from backend
function loadConversations() {
    if (!authToken) return;
    
    fetch(`${API_BASE}/conversations`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error loading conversations:', data.error);
        } else {
            // Convert backend format to frontend format
            conversations = {};
            data.forEach(conv => {
                conversations[conv.conversation_id] = {
                    id: conv.conversation_id,
                    participants: [conv.participant1, conv.participant2],
                    lastMessage: conv.last_message || 'No messages yet',
                    timestamp: conv.last_message_time || conv.created_at,
                    unread: conv.unread_count || 0,
                    messages: [],
                    otherUser: conv.other_user,
                    otherFullName: conv.other_full_name,
                    otherCity: conv.other_city,
                    otherAvatar: conv.other_avatar
                };
            });
            
            renderConversations();
        }
    })
    .catch(error => {
        console.error('Error loading conversations:', error);
    });
}

// Load users for new conversations
function loadUsers() {
    if (!authToken) return;
    
    fetch(`${API_BASE}/users`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error loading users:', data.error);
        } else {
            // Populate user select in new conversation modal
            const userSelect = document.getElementById('newConversationUsername');
            if (userSelect) {
                userSelect.innerHTML = '<option value="">Choose a user...</option>';
                data.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.username;
                    const displayName = user.full_name ? `${user.full_name} (${user.city})` : user.username;
                    option.textContent = displayName;
                    userSelect.appendChild(option);
                });
            }
        }
    })
    .catch(error => {
        console.error('Error loading users:', error);
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Global function for notifications (accessible from HTML)
window.showNotification = showNotification;

// Setup authentication event listeners
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Check login status
    checkLoginStatus();
    
    // Setup message input functionality
    if (typeof setupMessageInput === 'function') {
        setupMessageInput();
    }
});
>>>>>>> 3dc65e7cba26a703c63e38d82ccff2cfbce780e2
