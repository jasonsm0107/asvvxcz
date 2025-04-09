document.addEventListener('DOMContentLoaded', function() {
    // Initialize TradingView Chart
    initTradingViewWidget();
    
    // Initialize UI Interactions
    initUIInteractions();
    
    // Initialize leverage slider
    initLeverageSlider();
    
    // Connect to real-time data sources
    connectToExchangeData();
});

// TradingView Chart Widget Initialization
function initTradingViewWidget() {
    const tradingViewWidget = new TradingView.widget({
        container_id: 'trading-chart',
        autosize: true,
        symbol: 'BINANCE:BTCUSDT',
        interval: '15',
        timezone: 'Etc/UTC',
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: 'rgba(0, 0, 0, 0)',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: false,
        studies: ['RSI@tv-basicstudies'],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        withdateranges: true,
        hide_volume: false,
        details: true,
        hotlist: true,
        calendar: true,
        // Add event listeners for chart ready
        datafeed: {
            onReady: cb => {
                setTimeout(() => cb({
                    supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"]
                }), 0);
            }
        },
        // Store the widget instance globally for other functions to access
        onChartReady: () => {
            window.tradingViewWidget = tradingViewWidget;
            // Subscribe to symbmol changes
            tradingViewWidget.onSymbolChange(subscribeToSymbolPriceUpdates);
            subscribeToSymbolPriceUpdates();
        }
    });
}

// Initialize UI Interactions
function initUIInteractions() {
    // Theme Toggle
    const themeSwitch = document.querySelector('.theme-switch');
    themeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme');
        // Reinitialize chart with new theme
        initTradingViewWidget();
    });

    // Trade Direction Toggle (Long/Short)
    const directionButtons = document.querySelectorAll('.btn-direction');
    directionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            directionButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');
            
            // Update submit button appearance based on direction
            const submitButton = document.querySelector('.btn-submit');
            submitButton.classList.remove('btn-long', 'btn-short');
            
            if (button.dataset.direction === 'long') {
                submitButton.classList.add('btn-long');
                submitButton.textContent = 'Open Long Position';
            } else {
                submitButton.classList.add('btn-short');
                submitButton.textContent = 'Open Short Position';
            }
        });
    });

    // Trade Type Toggle (Market/Limit)
    const typeButtons = document.querySelectorAll('.btn-type');
    const limitPriceGroup = document.querySelector('.limit-price');
    
    typeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            typeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');
            
            // Show/hide limit price field based on selection
            if (button.dataset.type === 'limit') {
                limitPriceGroup.classList.remove('hidden');
                // Add an animation class for smooth appearance
                limitPriceGroup.classList.add('animate-fade-in');
            } else {
                limitPriceGroup.classList.add('hidden');
            }
        });
    });

    // Amount Denomination Toggle (USDT/BTC)
    const denomButtons = document.querySelectorAll('.denomination-btn');
    const currentDenom = document.getElementById('current-denom');
    
    denomButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            denomButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');
            
            // Update the input addon text
            currentDenom.textContent = button.dataset.denom.toUpperCase();
        });
    });

    // Percentage Buttons for Amount
    const percentButtons = document.querySelectorAll('.percentage-btn');
    const amountSlider = document.querySelector('.amount-slider');
    const amountInput = document.getElementById('trade-amount');
    
    percentButtons.forEach(button => {
        button.addEventListener('click', () => {
            const percent = parseInt(button.dataset.percentage);
            amountSlider.value = percent;
            
            // Calculate the amount based on the percentage
            // This is a simulation - in a real app, you'd calculate based on actual balance
            const balance = 24350.32; // From the UI
            const amount = (balance * percent / 100).toFixed(2);
            amountInput.value = amount;
        });
    });

    // Amount Slider
    amountSlider.addEventListener('input', (e) => {
        const percent = e.target.value;
        // Calculate the amount based on the percentage
        const balance = 24350.32; // From the UI
        const amount = (balance * percent / 100).toFixed(2);
        amountInput.value = amount;
    });

    // Tabs in Bottom Panel
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.dataset.tab;
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTabId).classList.add('active');
        });
    });

    // Chart Time Interval Buttons - UPDATED TO SYNC WITH TRADINGVIEW
    const timeButtons = document.querySelectorAll('.btn-time');
    
    timeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            timeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the time interval from button text
            const interval = button.textContent.trim();
            
            // Update TradingView chart interval if widget exists
            if (window.tradingViewWidget) {
                // Map the button text to TradingView intervals
                const intervalMap = {
                    '1m': '1',
                    '5m': '5',
                    '15m': '15',
                    '1h': '60',
                    '4h': '240',
                    '1d': '1D',
                    '1w': '1W'
                };
                
                // Set the chart interval
                window.tradingViewWidget.setSymbol('BINANCE:BTCUSDT', intervalMap[interval] || interval, () => {
                    console.log(`Chart interval changed to ${interval}`);
                });
            }
        });
    });

    // Connect Wallet Button
    const walletButton = document.querySelector('.wallet-connect button');
    
    if (walletButton) {
        walletButton.addEventListener('click', () => {
            // Simulate wallet connection
            walletButton.innerHTML = '<span class="btn-icon"><i class="fas fa-check-circle"></i></span> Connected';
            walletButton.disabled = true;
        });
    }
}

// New function for leverage slider
function initLeverageSlider() {
    // Find the leverage selector element
    const leverageSelector = document.querySelector('.leverage-selector');
    const leverageValue = document.querySelector('.leverage-value');
    const leverageAdjust = document.querySelector('.leverage-adjust');
    
    // Create leverage slider modal
    const createLeverageModal = () => {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'leverage-modal';
        modal.innerHTML = `
            <div class="leverage-modal-content">
                <div class="leverage-modal-header">
                    <h4>Adjust Leverage</h4>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="leverage-slider-container">
                    <div class="leverage-range">
                        <span>1x</span>
                        <span>125x</span>
                    </div>
                    <input type="range" class="leverage-slider" min="1" max="125" step="1" value="10">
                    <div class="leverage-markers">
                        <span class="marker" style="left: 0%">1x</span>
                        <span class="marker" style="left: 20%">25x</span>
                        <span class="marker" style="left: 40%">50x</span>
                        <span class="marker" style="left: 60%">75x</span>
                        <span class="marker" style="left: 80%">100x</span>
                        <span class="marker" style="left: 100%">125x</span>
                    </div>
                </div>
                <div class="leverage-input-group">
                    <input type="number" class="leverage-input" min="1" max="125" value="10">
                    <span class="leverage-input-suffix">x</span>
                </div>
                <div class="leverage-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Higher leverage increases both potential profits and risk of liquidation.</p>
                </div>
                <div class="leverage-modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-apply">Apply</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Get modal elements
        const closeBtn = modal.querySelector('.close-modal');
        const slider = modal.querySelector('.leverage-slider');
        const input = modal.querySelector('.leverage-input');
        const cancelBtn = modal.querySelector('.btn-cancel');
        const applyBtn = modal.querySelector('.btn-apply');
        
        // Sync slider and input
        slider.addEventListener('input', () => {
            input.value = slider.value;
        });
        
        input.addEventListener('input', () => {
            // Validate input
            let val = parseInt(input.value);
            if (isNaN(val)) val = 1;
            if (val < 1) val = 1;
            if (val > 125) val = 125;
            
            slider.value = val;
            input.value = val;
        });
        
        // Close modal on buttons
        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            });
        });
        
        // Apply leverage
        applyBtn.addEventListener('click', () => {
            const newLeverage = slider.value;
            if (leverageValue) {
                leverageValue.textContent = `${newLeverage}x`;
                
                // Add scale animation to leverage value
                leverageValue.classList.add('leverage-change');
                setTimeout(() => {
                    leverageValue.classList.remove('leverage-change');
                }, 500);
            }
            
            modal.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });
        
        // Animation for modal appearance
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    };
    
    // Add click event to leverage adjust button
    if (leverageAdjust) {
        leverageAdjust.addEventListener('click', createLeverageModal);
    }
    
    // Add CSS for leverage modal
    const style = document.createElement('style');
    style.textContent = `
        .leverage-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .leverage-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .leverage-modal.fade-out {
            opacity: 0;
        }
        
        .leverage-modal-content {
            background-color: var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            width: 100%;
            max-width: 450px;
            padding: 24px;
            transform: translateY(20px);
            transition: transform 0.3s ease;
        }
        
        .leverage-modal.active .leverage-modal-content {
            transform: translateY(0);
        }
        
        .leverage-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .leverage-modal-header h4 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
        }
        
        .close-modal {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--color-text-secondary);
            font-size: 1.25rem;
            transition: color 0.2s ease;
        }
        
        .close-modal:hover {
            color: var(--color-text-primary);
        }
        
        .leverage-slider-container {
            margin-bottom: 24px;
        }
        
        .leverage-range {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            color: var(--color-text-secondary);
            font-size: 0.875rem;
        }
        
        .leverage-slider {
            width: 100%;
            height: 8px;
            -webkit-appearance: none;
            appearance: none;
            background: linear-gradient(to right, var(--color-primary) 0%, var(--color-secondary) 100%);
            border-radius: 4px;
            outline: none;
        }
        
        .leverage-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            cursor: pointer;
            border: 3px solid var(--color-primary);
            transition: transform 0.2s ease;
        }
        
        .leverage-slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
        }
        
        .leverage-markers {
            position: relative;
            width: 100%;
            height: 20px;
            margin-top: 8px;
        }
        
        .leverage-markers .marker {
            position: absolute;
            transform: translateX(-50%);
            font-size: 0.75rem;
            color: var(--color-text-secondary);
        }
        
        .leverage-input-group {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: 0 12px;
        }
        
        .leverage-input {
            border: none;
            outline: none;
            height: 48px;
            flex: 1;
            font-size: 1.25rem;
            font-weight: 600;
            background-color: transparent;
            color: var(--color-text-primary);
        }
        
        .leverage-input-suffix {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--color-text-primary);
        }
        
        .leverage-warning {
            display: flex;
            align-items: flex-start;
            background-color: rgba(243, 18, 96, 0.05);
            padding: 12px;
            border-radius: var(--radius-md);
            margin-bottom: 24px;
        }
        
        .leverage-warning i {
            color: var(--color-danger);
            margin-right: 12px;
            margin-top: 2px;
        }
        
        .leverage-warning p {
            color: var(--color-text-secondary);
            font-size: 0.875rem;
            margin: 0;
        }
        
        .leverage-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        
        .btn-cancel {
            padding: 10px 20px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background-color: transparent;
            font-weight: 500;
            color: var(--color-text-secondary);
            transition: background-color 0.2s ease;
        }
        
        .btn-cancel:hover {
            background-color: var(--color-bg-tertiary);
        }
        
        .btn-apply {
            padding: 10px 24px;
            border-radius: var(--radius-md);
            background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
            color: white;
            font-weight: 500;
            border: none;
            box-shadow: 0 4px 12px rgba(3, 127, 252, 0.2);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .btn-apply:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(3, 127, 252, 0.3);
        }
        
        .leverage-change {
            animation: leverage-pulse 0.5s ease;
        }
        
        @keyframes leverage-pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.2);
                color: var(--color-secondary);
            }
        }
    `;
    document.head.appendChild(style);
}

// Connect to exchange data sources for real-time price updates and order book
function connectToExchangeData() {
    // Create WebSocket connection for real-time price updates
    const socket = new WebSocket('wss://stream.binance.com:9443/ws');
    
    // Subscribe to BTC/USDT market data
    const subscribeMsg = {
        method: "SUBSCRIBE",
        params: [
            "btcusdt@ticker",
            "btcusdt@depth20@100ms"
        ],
        id: 1
    };
    
    // Connection opened -> Subscribe to streams
    socket.addEventListener('open', () => {
        console.log('Connected to Binance WebSocket');
        socket.send(JSON.stringify(subscribeMsg));
    });
    
    // Listen for messages from the server
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        // Handle ticker updates (price data)
        if (data.e === 'ticker' && data.s === 'BTCUSDT') {
            updatePriceDisplay(data);
        }
        
        // Handle order book updates
        if (data.e === 'depthUpdate' && data.s === 'BTCUSDT') {
            updateOrderBook(data);
        }
    });
    
    // Handle errors and reconnection
    socket.addEventListener('error', (error) => {
        console.error('WebSocket Error:', error);
    });
    
    socket.addEventListener('close', (event) => {
        console.log('Connection closed. Reconnecting...', event.code);
        // Reconnect after a delay
        setTimeout(connectToExchangeData, 5000);
    });
}

// Update price display from WebSocket data
function updatePriceDisplay(tickerData) {
    // Update price in trading pair selection
    const pairPrice = document.querySelector('.pair-price .price');
    const pairChange = document.querySelector('.pair-price .change');
    
    if (pairPrice && pairChange) {
        const price = parseFloat(tickerData.c).toFixed(2);
        const change = parseFloat(tickerData.P).toFixed(2);
        
        // Update with animation
        pairPrice.classList.add('price-flash');
        setTimeout(() => pairPrice.classList.remove('price-flash'), 500);
        
        pairPrice.textContent = price;
        pairChange.textContent = (change > 0 ? '+' : '') + change + '%';
        
        // Update change class based on price movement
        pairChange.className = 'change ' + (change >= 0 ? 'positive' : 'negative');
        
        // Update market stats
        const highStat = document.querySelector('.stat:nth-child(1) .stat-value');
        const lowStat = document.querySelector('.stat:nth-child(2) .stat-value');
        const volumeStat = document.querySelector('.stat:nth-child(3) .stat-value');
        
        if (highStat) highStat.textContent = parseFloat(tickerData.h).toFixed(2);
        if (lowStat) lowStat.textContent = parseFloat(tickerData.l).toFixed(2);
        if (volumeStat) volumeStat.textContent = parseFloat(tickerData.v).toFixed(2) + ' BTC';
        
        // Also update the current price in order book spread
        const currentPrice = document.querySelector('.current-price');
        if (currentPrice) {
            currentPrice.textContent = price;
        }
    }
}

// Update order book from WebSocket data
function updateOrderBook(depthData) {
    // Clear existing data if there's a full update (u === 0)
    if (depthData.u === 0) {
        document.querySelector('.orderbook-asks').innerHTML = '';
        document.querySelector('.orderbook-bids').innerHTML = '';
    }
    
    // Get containers
    const asksContainer = document.querySelector('.orderbook-asks');
    const bidsContainer = document.querySelector('.orderbook-bids');
    
    if (!asksContainer || !bidsContainer) return;
    
    // Calculate maximum total for depth visualization
    const calculateMaxTotal = (asks, bids) => {
        let max = 0;
        
        // Check asks
        for (let [price, amount] of asks) {
            const total = parseFloat(price) * parseFloat(amount);
            if (total > max) max = total;
        }
        
        // Check bids
        for (let [price, amount] of bids) {
            const total = parseFloat(price) * parseFloat(amount);
            if (total > max) max = total;
        }
        
        return max;
    };
    
    const maxTotal = calculateMaxTotal(depthData.a, depthData.b);
    
    // Update asks (sell orders)
    if (depthData.a && depthData.a.length > 0) {
        // Sort asks ascending by price
        const asks = depthData.a.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
        
        // Clear and rebuild asks container
        asksContainer.innerHTML = '';
        
        asks.forEach(([price, amount]) => {
            const priceFloat = parseFloat(price);
            const amountFloat = parseFloat(amount);
            const total = priceFloat * amountFloat;
            const depthWidth = Math.min(100, (total / maxTotal) * 100);
            
            const row = document.createElement('div');
            row.className = 'orderbook-row';
            row.innerHTML = `
                <div class="price sell">${priceFloat.toFixed(2)}</div>
                <div class="amount">${amountFloat.toFixed(4)}</div>
                <div class="total">
                    <div class="depth-visualization sell" style="width: ${depthWidth}%;"></div>
                    <span>${total.toFixed(2)}</span>
                </div>
            `;
            
            // Add with animation
            row.style.opacity = '0';
            asksContainer.appendChild(row);
            setTimeout(() => {
                row.style.transition = 'opacity 0.3s ease';
                row.style.opacity = '1';
            }, 10);
        });
    }
    
    // Update bids (buy orders)
    if (depthData.b && depthData.b.length > 0) {
        // Sort bids descending by price
        const bids = depthData.b.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
        
        // Clear and rebuild bids container
        bidsContainer.innerHTML = '';
        
        bids.forEach(([price, amount]) => {
            const priceFloat = parseFloat(price);
            const amountFloat = parseFloat(amount);
            const total = priceFloat * amountFloat;
            const depthWidth = Math.min(100, (total / maxTotal) * 100);
            
            const row = document.createElement('div');
            row.className = 'orderbook-row';
            row.innerHTML = `
                <div class="price buy">${priceFloat.toFixed(2)}</div>
                <div class="amount">${amountFloat.toFixed(4)}</div>
                <div class="total">
                    <div class="depth-visualization buy" style="width: ${depthWidth}%;"></div>
                    <span>${total.toFixed(2)}</span>
                </div>
            `;
            
            // Add with animation
            row.style.opacity = '0';
            bidsContainer.appendChild(row);
            setTimeout(() => {
                row.style.transition = 'opacity 0.3s ease';
                row.style.opacity = '1';
            }, 10);
        });
    }
    
    // Calculate and update spread
    updateSpread();
}

// Calculate and update the spread between highest bid and lowest ask
function updateSpread() {
    const asks = document.querySelectorAll('.orderbook-asks .price');
    const bids = document.querySelectorAll('.orderbook-bids .price');
    
    if (asks.length > 0 && bids.length > 0) {
        const lowestAsk = parseFloat(asks[asks.length - 1].textContent);
        const highestBid = parseFloat(bids[0].textContent);
        
        const spreadValue = lowestAsk - highestBid;
        const spreadPercent = (spreadValue / lowestAsk) * 100;
        
        const spreadElement = document.querySelector('.spread-value');
        if (spreadElement) {
            spreadElement.textContent = spreadPercent.toFixed(2) + '%';
        }
    }
}

// Function to subscribe to symbol price updates when the chart symbol changes
function subscribeToSymbolPriceUpdates() {
    // This would need to be extended to handle different symbols
    // but for now we're just focusing on BTC/USDT
    
    if (window.tradingViewWidget) {
        const symbol = window.tradingViewWidget.symbolInterval().split(',')[0];
        console.log('Subscribed to updates for:', symbol);
        
        // Here you would change the WebSocket subscription if the symbol changes
        // For now we'll just keep it simple
    }
}

// Add custom CSS for new leverage slider features and price flash animations
const additionalStyle = document.createElement('style');
additionalStyle.textContent = `
    .price-flash {
        animation: price-flash 0.5s ease;
    }
    
    @keyframes price-flash {
        0%, 100% {
            color: var(--color-text-primary);
        }
        50% {
            color: var(--color-primary);
        }
    }
    
    .orderbook-row {
        opacity: 1;
        transition: opacity 0.3s ease;
    }
    
    .orderbook-row.new-row {
        background-color: rgba(3, 127, 252, 0.1);
        animation: new-row-flash 0.8s ease forwards;
    }
    
    @keyframes new-row-flash {
        0% {
            background-color: rgba(3, 127, 252, 0.1);
        }
        100% {
            background-color: transparent;
        }
    }
    
    .leverage-value {
        transition: color 0.3s ease, transform 0.3s ease;
    }
    
    /* Enhanced slider thumb styling */
    input[type="range"]::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px rgba(3, 127, 252, 0.2);
    }
    
    input[type="range"]::-webkit-slider-thumb:hover {
        box-shadow: 0 0 0 5px rgba(3, 127, 252, 0.3);
    }
    
    /* Improved chart time button hover state */
    .btn-time {
        position: relative;
        overflow: hidden;
    }
    
    .btn-time:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: var(--color-primary);
        transition: all 0.3s ease;
        transform: translateX(-50%);
    }
    
    .btn-time:hover:after {
        width: 80%;
    }
    
    .btn-time.active:after {
        width: 90%;
    }
`;
document.head.appendChild(additionalStyle);