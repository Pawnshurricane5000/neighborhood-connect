// Welcome page functionality
let selectedCity = '';
let user = null;

// Wait for page to load
window.addEventListener('load', function() {
    console.log('Welcome page loaded');
    
    // Check if user is authenticated
    auth.onAuthStateChanged(function(firebaseUser) {
        if (firebaseUser) {
            user = firebaseUser;
            console.log('User authenticated:', firebaseUser.displayName);
            displayUserInfo(firebaseUser);
        } else {
            console.log('No user authenticated, redirecting to login');
            window.location.href = 'index.html';
        }
    });
    
    // Add event listeners
    setupEventListeners();
});

function displayUserInfo(firebaseUser) {
    console.log('Displaying user info for:', firebaseUser);
    console.log('User display name:', firebaseUser.displayName);
    console.log('User email:', firebaseUser.email);
    console.log('User photo URL:', firebaseUser.photoURL);
    
    // Display user avatar
    const avatar = document.getElementById('userAvatar');
    if (firebaseUser.photoURL) {
        avatar.src = firebaseUser.photoURL;
        console.log('Set avatar to:', firebaseUser.photoURL);
    } else {
        avatar.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiNGRjZGNjEiLz4KPHN2ZyB4PSIxNSIgeT0iMTUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMEgxOEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
        console.log('Set default avatar');
    }
    
    // Display user name and email
    const userName = firebaseUser.displayName || 'Neighbor';
    const userEmail = firebaseUser.email || '';
    
    document.getElementById('userName').textContent = userName;
    document.getElementById('userEmail').textContent = userEmail;
    
    console.log('Set user name to:', userName);
    console.log('Set user email to:', userEmail);
}

function setupEventListeners() {
    // City selection buttons
    const cityOptions = document.querySelectorAll('.city-option');
    cityOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            cityOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Select this option
            this.classList.add('selected');
            selectedCity = this.dataset.city;
            
            // Clear custom input
            document.getElementById('customCity').value = '';
            
            // Enable continue button
            updateContinueButton();
        });
    });
    
    // Custom city input
    const customCityInput = document.getElementById('customCity');
    customCityInput.addEventListener('input', function() {
        if (this.value.trim()) {
            // Clear grid selection
            cityOptions.forEach(opt => opt.classList.remove('selected'));
            selectedCity = this.value.trim();
        } else {
            selectedCity = '';
        }
        updateContinueButton();
    });
    
    // Continue button
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.addEventListener('click', function() {
        if (selectedCity) {
            saveUserCity();
        }
    });
}

function updateContinueButton() {
    const continueBtn = document.getElementById('continueBtn');
    const isValid = selectedCity.trim().length > 0;
    
    continueBtn.disabled = !isValid;
    
    if (isValid) {
        continueBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue to NeighborConnect';
    } else {
        continueBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Select your city to continue';
    }
}

function saveUserCity() {
    console.log('Saving user city:', selectedCity);
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('continueBtn').disabled = true;
    
    // Store user data in localStorage for now
    // In a real app, you'd save this to a database
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        city: selectedCity,
        joinedAt: new Date().toISOString()
    };
    
    localStorage.setItem('neighborConnectUser', JSON.stringify(userData));
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
        console.log('User data saved, redirecting to help requests');
        window.location.href = 'help-requests.html';
    }, 1500);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('continueBtn').disabled = false;
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}
