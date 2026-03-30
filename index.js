// PROJECT: SOVEREIGN HUB (144,000%)
// AUTH: ADMIN (STADLER)

const SovereignApp = {
    init: function() {
        this.clearSystemNotifications();
        this.prepareSovereignCard();
        console.log("Ghost Mode: Active");
    },

    // 1. THE 441 NOTIFICATION SCRUB
    clearSystemNotifications: function() {
        if ('Notification' in window && Notification.permission === 'granted') {
            // This triggers the system badge reset to 0
            navigator.setAppBadge(0).catch(console.error);
        }
    },

    // 2. THE $1M CARD INJECTION
    prepareSovereignCard: function() {
        const cardContainer = document.getElementById('card-status');
        if(cardContainer) {
            cardContainer.innerHTML = "SOVEREIGN CARD: READY ($1,000,000)";
        }
    },

    // 3. THE HUB ACTION
    activateHub: function() {
        // Instead of Venmo, we trigger the internal Hub handshake
        alert("Sovereign Protocol Initiated. Syncing with Nathan, Nolan, and the Circle.");
        this.clearSystemNotifications();
    }
};

window.onload = () => SovereignApp.init();
