// Test function to switch tabs on Dashboard
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    // Remove active class from buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Temporary login logic just to preview Dashboard
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
});