// Gate Demo - Polling for state updates

class GateController {
    constructor() {
        this.gateContainer = document.getElementById('gateContainer');
        this.welcomeBanner = document.getElementById('welcomeBanner');
        this.welcomeText = document.getElementById('welcomeText');
        this.dockMessage = document.getElementById('dockMessage');
        this.dockText = document.getElementById('dockText');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.gateScene = document.querySelector('.gate-scene');

        this.isOpen = false;
        this.lastTimestamp = 0;
        this.autoCloseTimeout = null;

        this.startPolling();
    }

    startPolling() {
        this.statusIndicator.classList.add('connected');
        this.statusText.textContent = 'Ready for authorization';

        // Poll every second
        setInterval(() => this.checkStatus(), 1000);
    }

    async checkStatus() {
        try {
            const response = await fetch('/api/gate/status');
            const state = await response.json();

            // Check if this is a new gate open event
            if (state.is_open && state.timestamp > this.lastTimestamp) {
                this.lastTimestamp = state.timestamp;
                this.openGate(state.name, state.dock);
            }
        } catch (error) {
            console.error('[Gate] Poll error:', error);
        }
    }

    openGate(name, dock) {
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
        }

        // Update welcome message
        this.welcomeText.textContent = `WELCOME, ${name.toUpperCase()}!`;
        this.welcomeBanner.classList.add('active');

        // Show dock instructions
        this.dockText.textContent = `Please proceed to Dock Door ${dock}`;
        this.dockMessage.classList.add('active');

        // Update status
        this.statusIndicator.classList.add('active');
        this.statusText.textContent = 'Access granted!';

        // Create sparkle effects
        this.createSparkles();

        // Open the gate
        this.gateContainer.classList.add('open');
        this.isOpen = true;

        // Auto-close after 8 seconds
        this.autoCloseTimeout = setTimeout(() => {
            this.closeGate();
        }, 8000);
    }

    closeGate() {
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }

        // Close the gate
        this.gateContainer.classList.remove('open');
        this.isOpen = false;

        // Reset welcome message after gate closes
        setTimeout(() => {
            this.welcomeText.textContent = 'OUTPOST ACCESS';
            this.welcomeBanner.classList.remove('active');
            this.dockMessage.classList.remove('active');
            this.statusIndicator.classList.remove('active');
            this.statusText.textContent = 'Ready for authorization';
        }, 1200);
    }

    createSparkles() {
        const colors = ['#FFE66D', '#00D4FF', '#FF6B35'];
        const gateRect = this.gateContainer.getBoundingClientRect();
        const sceneRect = this.gateScene.getBoundingClientRect();

        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.style.background = colors[i % colors.length];

                // Position relative to gate center
                const centerX = gateRect.left - sceneRect.left + gateRect.width / 2;
                const centerY = gateRect.top - sceneRect.top + gateRect.height / 2;

                sparkle.style.left = `${centerX + (Math.random() - 0.5) * 200}px`;
                sparkle.style.top = `${centerY + (Math.random() - 0.5) * 200}px`;

                this.gateScene.appendChild(sparkle);

                // Remove sparkle after animation
                setTimeout(() => sparkle.remove(), 800);
            }, i * 100);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GateController();
});
