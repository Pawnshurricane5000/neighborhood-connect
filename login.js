// Login functionality
// Wait for Firebase to load
window.addEventListener('load', function() {
    console.log('Page loaded, waiting for Firebase...');
    
    // Add event listeners to buttons
    const googleLoginBtn = document.querySelector('.google-login-btn');
    const manualLoginBtn = document.querySelector('.manual-login-btn');
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', loginWithGoogle);
    }
    
    if (manualLoginBtn) {
        manualLoginBtn.addEventListener('click', goToManualLogin);
    }
    
    // Check if user is already logged in
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('User authenticated:', user.displayName);
            console.log('User email:', user.email);
            console.log('User photo URL:', user.photoURL);
            console.log('User UID:', user.uid);
            
            // Always go to welcome page if logged in (for testing)
            console.log('User is logged in, redirecting to welcome page');
            window.location.href = 'welcome.html';
        } else {
            console.log('No user logged in');
        }
    });
    
    // Handle redirect result (this runs after onAuthStateChanged)
    auth.getRedirectResult().then(function(result) {
        if (result.credential) {
            console.log('Redirect result received:', result.user);
            console.log('User authenticated via redirect:', result.user.displayName);
            // The onAuthStateChanged will handle the redirect
        } else {
            console.log('No redirect result');
        }
    }).catch(function(error) {
        console.error('Redirect result error:', error);
    });
});

function loginWithGoogle() {
    console.log('Google login button clicked');
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    
    // Try popup first, fallback to redirect if blocked
    auth.signInWithPopup(provider).then(function(result) {
        console.log('Popup login successful:', result.user.displayName);
        document.getElementById('loading').style.display = 'none';
        
        // Always go to welcome page (for testing)
        console.log('Login successful, redirecting to welcome page');
        window.location.href = 'welcome.html';
    }).catch(function(error) {
        console.log('Popup failed, trying redirect:', error.code);
        
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            // Fallback to redirect
            console.log('Using redirect fallback');
            auth.signInWithRedirect(provider).then(function() {
                console.log('Redirect initiated successfully');
            }).catch(function(redirectError) {
                console.error('Redirect also failed:', redirectError);
                document.getElementById('loading').style.display = 'none';
                alert('Login failed. Please try again or check your browser settings.');
            });
        } else {
            console.error('Login failed:', error);
            document.getElementById('loading').style.display = 'none';
            alert('Login failed: ' + error.message);
        }
    });
}

function goToManualLogin() {
    console.log('Manual login button clicked');
    // Go to the existing messaging login page
    console.log('Redirecting to messaging-login.html');
    window.location.href = 'messaging-login.html';
}

// Test function to verify JavaScript is working
function testClick() {
    alert('JavaScript is working!');
}
