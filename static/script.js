// Gate Demo - Real-time control via SSE

class GateController {
    constructor() {
        this.gateContainer = document.getElementById('gateContainer');
        this.welcomeBanner = document.getElementById('welcomeBanner');
        this.welcomeText = document.getElementById('welcomeText');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.gateScene = document.querySelector('.gate-scene');

        this.isOpen = false;
        this.autoCloseTimeout = null;

        this.connectSSE();
    }

    connectSSE() {
        this.statusText.textContent = 'Connecting...';
        console.log('[Gate] Connecting to SSE...');

        const eventSource = new EventSource('/api/gate/events');

        eventSource.onopen = () => {
            console.log('[Gate] SSE stream opened');
        };

        eventSource.addEventListener('connected', () => {
            console.log('[Gate] SSE connected!');
            this.statusIndicator.classList.add('connected');
            this.statusText.textContent = 'Ready for authorization';
        });

        eventSource.addEventListener('gate_open', (event) => {
            console.log('[Gate] Received gate_open event:', event.data);
            const name = event.data;
            this.openGate(name);
        });

        eventSource.addEventListener('gate_close', () => {
            console.log('[Gate] Received gate_close event');
            this.closeGate();
        });

        eventSource.addEventListener('keepalive', () => {
            console.log('[Gate] Keepalive received');
        });

        eventSource.onmessage = (event) => {
            console.log('[Gate] Generic message:', event);
        };

        eventSource.onerror = (err) => {
            console.error('[Gate] SSE error:', err);
            this.statusIndicator.classList.remove('connected');
            this.statusText.textContent = 'Connection lost. Reconnecting...';

            // EventSource will auto-reconnect, but update UI
            setTimeout(() => {
                if (eventSource.readyState === EventSource.CONNECTING) {
                    this.statusText.textContent = 'Reconnecting...';
                }
            }, 1000);
        };
    }

    openGate(name) {
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
        }

        // Update welcome message
        this.welcomeText.textContent = `WELCOME, ${name.toUpperCase()}!`;
        this.welcomeBanner.classList.add('active');

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
