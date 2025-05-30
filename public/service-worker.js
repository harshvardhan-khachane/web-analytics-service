// Service worker installation
self.addEventListener('install', event => {
    console.log('Service Worker installing.');
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', event => {
    console.log('Service Worker activated.');
    // Take control of all clients immediately
    event.waitUntil(clients.claim());
});

// Message handler
self.addEventListener('message', event => {
    if (event.data.type === 'ANALYTICS_EVENT') {
        const eventData = event.data.payload;
        sendAnalyticsEvent(eventData);
    }
});

// Send event to backend
function sendAnalyticsEvent(eventData) {
    // Add user_id (session-based)
    const userId = getOrCreateUserId();
    const fullEvent = {
        ...eventData,
        user_id: userId
    };

    // Send to backend
    fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullEvent)
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to send event:', response.status);
        } else {
            console.log('Event successfully sent to backend');
        }
    })
    .catch(error => {
        console.error('Error sending event:', error);
    });
}

// Simple user ID management (session-based)
function getOrCreateUserId() {
    let userId = sessionStorage.getItem('analytics_user_id');
    
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('analytics_user_id', userId);
    }
    
    return userId;
}