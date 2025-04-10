document.addEventListener('DOMContentLoaded', function() {
    // Initialize TradingView Chart
    initTradingViewWidget();
    
    // Initialize UI Interactions
    initUIInteractions();
    
    // Connect to real-time data sources
    connectToExchangeData();
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize pair selector dropdown
    initPairSelector();
    
    // Initialize market activity panel
    initMarketActivity();
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
        studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'MF@tv-basicstudies'],
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
            // Subscribe to symbol changes
            tradingViewWidget.onSymbolChange(subscribeToSymbolPriceUpdates);
            subscribeToSymbolPriceUpdates();
            
            // Show success toast
            showToast('Chart Loaded', 'TradingView chart has been successfully initialized.', 'success');
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

    // Trade Direction Toggle (Buy/Sell)
    const directionButtons = document.querySelectorAll('.btn-direction');
    const tradeDirectionLabel = document.querySelector('.trade-direction-label');
    
    directionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            directionButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');
            
            // Update submit button appearance based on direction
            const submitButton = document.querySelector('.btn-submit');
            submitButton.classList.remove('btn-buy', 'btn-sell');
            
            if (button.dataset.direction === 'buy') {
                submitButton.classList.add('btn-buy');
                submitButton.textContent = 'Buy BTC';
                tradeDirectionLabel.textContent = 'Buy';
                
                // Show USDT balance for buying
                document.getElementById('available-usdt').classList.remove('hidden');
                document.getElementById('available-btc').classList.add('hidden');
            } else {
                submitButton.classList.add('btn-sell');
                submitButton.textContent = 'Sell BTC';
                tradeDirectionLabel.textContent = 'Sell';
                
                // Show BTC balance for selling
                document.getElementById('available-usdt').classList.add('hidden');
                document.getElementById('available-btc').classList.remove('hidden');
            }
            
            // Update conversion direction
            updateTokenConversion();
        });
    });

    // Trade Type Toggle (Market/Limit/Stop)
    const typeButtons = document.querySelectorAll('.btn-type');
    const limitPriceGroup = document.querySelector('.limit-price');
    const stopPriceGroup = document.querySelector('.stop-price');
    
    typeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            typeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');
            
            // Show/hide price fields based on selection
            const type = button.dataset.type;
            
            // Hide all price fields first
            limitPriceGroup.classList.add('hidden');
            stopPriceGroup.classList.add('hidden');
            
            // Show relevant price fields based on trade type
            if (type === 'limit') {
                limitPriceGroup.classList.remove('hidden');
                // Add an animation class for smooth appearance
                limitPriceGroup.classList.add('animate-fade-in');
            } else if (type === 'stop') {
                limitPriceGroup.classList.remove('hidden');
                stopPriceGroup.classList.remove('hidden');
                // Add animations
                limitPriceGroup.classList.add('animate-fade-in');
                stopPriceGroup.classList.add('animate-fade-in');
            }
            
            // Update form calculations
            updateTradeCalculations();
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
            
            // Update conversion text
            updateTokenConversion();
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
            calculateAmountFromPercentage(percent);
            
            // Add animation to the clicked button
            button.classList.add('animate-pulse');
            setTimeout(() => {
                button.classList.remove('animate-pulse');
            }, 500);
        });
    });

    // Amount Slider
    amountSlider.addEventListener('input', (e) => {
        const percent = e.target.value;
        calculateAmountFromPercentage(percent);
    });
    
    // Amount Input
    amountInput.addEventListener('input', updateTradeCalculations);
    
    // Limit Price Input
    const limitPriceInput = document.getElementById('limit-price');
    if (limitPriceInput) {
        limitPriceInput.addEventListener('input', updateTradeCalculations);
    }
    
    // Stop Price Input
    const stopPriceInput = document.getElementById('stop-price');
    if (stopPriceInput) {
        stopPriceInput.addEventListener('input', updateTradeCalculations);
    }

    // Advanced Options Toggle
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedContent = document.getElementById('advanced-content');
    
    if (advancedToggle && advancedContent) {
        advancedToggle.addEventListener('click', () => {
            advancedToggle.classList.toggle('active');
            advancedContent.classList.toggle('active');
        });
    }

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
                
                const currentSymbol = window.tradingViewWidget.symbolInterval().split(',')[0];
                
                // Set the chart interval
                window.tradingViewWidget.setSymbol(currentSymbol, intervalMap[interval] || interval, () => {
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
            walletButton.innerHTML = '<span class="btn-icon"><i class="fas fa-circle-notch fa-spin"></i></span> Connecting...';
            walletButton.disabled = true;
            
            // Simulate connection delay
            setTimeout(() => {
                walletButton.innerHTML = '<span class="btn-icon"><i class="fas fa-check-circle"></i></span> Connected';
                showToast('Wallet Connected', 'Your wallet has been successfully connected.', 'success');
            }, 2000);
        });
    }
    
    // Submit Button (Buy/Sell)
    const submitButton = document.querySelector('.btn-submit');
    
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            const amount = document.getElementById('trade-amount').value;
            if (!amount || parseFloat(amount) <= 0) {
                showToast('Invalid Amount', 'Please enter a valid amount to trade.', 'error');
                document.getElementById('trade-amount').classList.add('animate-shake');
                setTimeout(() => {
                    document.getElementById('trade-amount').classList.remove('animate-shake');
                }, 500);
                return;
            }
            
            const direction = document.querySelector('.btn-direction.active').dataset.direction;
            const tradeType = document.querySelector('.btn-type.active').dataset.type;
            
            // Get current price
            const currentPrice = document.querySelector('.current-price').textContent.trim();
            
            // Determine order price based on trade type
            let orderPrice = currentPrice;
            if (tradeType === 'limit' || tradeType === 'stop') {
                const limitPriceInput = document.getElementById('limit-price');
                if (limitPriceInput && limitPriceInput.value) {
                    orderPrice = limitPriceInput.value;
                }
            }
            
            // Create order object
            const order = {
                direction,
                type: tradeType,
                price: orderPrice,
                amount,
                total: document.getElementById('total-amount').textContent,
                timestamp: new Date().toISOString()
            };
            
            console.log('Submitting order:', order);
            
            // Simulate order placement
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
            
            setTimeout(() => {
                submitButton.disabled = false;
                if (direction === 'buy') {
                    submitButton.innerHTML = 'Buy BTC';
                    showToast(
                        'Order Placed', 
                        `Successfully placed a ${tradeType} order to buy ${amount} BTC at ${orderPrice} USDT.`, 
                        'success'
                    );
                } else {
                    submitButton.innerHTML = 'Sell BTC';
                    showToast(
                        'Order Placed', 
                        `Successfully placed a ${tradeType} order to sell ${amount} BTC at ${orderPrice} USDT.`, 
                        'success'
                    );
                }
                
                // Clear form
                document.getElementById('trade-amount').value = '';
                if (tradeType === 'limit' || tradeType === 'stop') {
                    document.getElementById('limit-price').value = '';
                    if (tradeType === 'stop') {
                        document.getElementById('stop-price').value = '';
                    }
                }
                
                updateTradeCalculations();
                amountSlider.value = 0;
                
                // Add the order to the open orders table (in a real app, this would come from the server)
                addOrderToTable(order);
            }, 2000);
        });
    }
}

// Helper function to calculate amount from percentage
function calculateAmountFromPercentage(percent) {
    const amountInput = document.getElementById('trade-amount');
    const activeDirection = document.querySelector('.btn-direction.active').dataset.direction;
    const activeDenom = document.querySelector('.denomination-btn.active').dataset.denom;
    
    let balance;
    if (activeDirection === 'buy') {
        // For buying, use USDT balance
        balance = 24350.32; // From the UI
    } else {
        // For selling, use BTC balance
        balance = 1.2459; // From the UI
    }
    
    // Calculate the amount based on the percentage and active denomination
    const amount = (balance * percent / 100).toFixed(activeDenom === 'btc' ? 8 : 2);
    amountInput.value = amount;
    
    // Update trade calculations
    updateTradeCalculations();
}

// Update token conversion text
function updateTokenConversion() {
    const amountInput = document.getElementById('trade-amount');
    const conversionText = document.getElementById('token-conversion-text');
    const activeDirection = document.querySelector('.btn-direction.active').dataset.direction;
    const activeDenom = document.querySelector('.denomination-btn.active').dataset.denom;
    
    // Current BTC price
    const btcPrice = parseFloat(document.querySelector('.current-price').textContent.trim());
    
    if (!amountInput.value || isNaN(parseFloat(amountInput.value))) {
        conversionText.textContent = activeDenom === 'usdt' 
            ? '≈ 0.00000000 BTC' 
            : '≈ 0.00 USDT';
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    
    if (activeDenom === 'usdt') {
        // Converting USDT to BTC
        const btcAmount = (amount / btcPrice).toFixed(8);
        conversionText.textContent = `≈ ${btcAmount} BTC`;
    } else {
        // Converting BTC to USDT
        const usdtAmount = (amount * btcPrice).toFixed(2);
        conversionText.textContent = `≈ ${usdtAmount} USDT`;
    }
}

// Update trade calculations (fees, total, etc.)
function updateTradeCalculations() {
    const amountInput = document.getElementById('trade-amount');
    const totalAmount = document.getElementById('total-amount');
    const feeAmount = document.getElementById('fee-amount');
    const activeDirection = document.querySelector('.btn-direction.active').dataset.direction;
    const activeTradeType = document.querySelector('.btn-type.active').dataset.type;
    const activeDenom = document.querySelector('.denomination-btn.active').dataset.denom;
    
    // Current BTC price
    let price = parseFloat(document.querySelector('.current-price').textContent.trim());
    
    // Use limit price if available
    if (activeTradeType === 'limit' || activeTradeType === 'stop') {
        const limitPriceInput = document.getElementById('limit-price');
        if (limitPriceInput && limitPriceInput.value && !isNaN(parseFloat(limitPriceInput.value))) {
            price = parseFloat(limitPriceInput.value);
        }
    }
    
    if (!amountInput.value || isNaN(parseFloat(amountInput.value))) {
        totalAmount.textContent = '0.00 USDT';
        feeAmount.textContent = '0.00 USDT';
        updateTokenConversion();
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    let total, fee;
    
    if (activeDenom === 'usdt') {
        // Amount is in USDT
        total = amount;
        fee = total * 0.001 * 0.8; // 0.1% fee with 20% discount
    } else {
        // Amount is in BTC
        total = amount * price;
        fee = total * 0.001 * 0.8; // 0.1% fee with 20% discount
    }
    
    // Update display
    totalAmount.textContent = `${total.toFixed(2)} USDT`;
    feeAmount.textContent = `${fee.toFixed(2)} USDT`;
    
    // Update conversion display
    updateTokenConversion();
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
            "btcusdt@depth20@100ms",
            "btcusdt@trade"
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
        
        // Handle trade updates
        if (data.e === 'trade' && data.s === 'BTCUSDT') {
            updateRecentTrades(data);
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
        
        // Update conversion and calculations if needed
        updateTradeCalculations();
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

// Update recent trades from WebSocket data
function updateRecentTrades(tradeData) {
    const tradeList = document.querySelector('.trade-list');
    if (!tradeList) return;
    
    // Create new trade item
    const tradeItem = document.createElement('li');
    tradeItem.className = `trade-item ${tradeData.m ? 'sell' : 'buy'}`;
    
    // Format time
    const time = new Date(tradeData.T);
    const formattedTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
    
    tradeItem.innerHTML = `
        <div class="trade-time">${formattedTime}</div>
        <div class="trade-price">${parseFloat(tradeData.p).toFixed(2)}</div>
        <div class="trade-amount">${parseFloat(tradeData.q).toFixed(6)}</div>
    `;
    
    // Add the trade to the beginning of the list
    tradeList.prepend(tradeItem);
    
    // Add animation
    tradeItem.classList.add('animate-slide-in-right');
    
    // Remove oldest trade if list gets too long
    if (tradeList.children.length > 30) {
        tradeList.removeChild(tradeList.lastChild);
    }
}

// Calculate and update the spread between highest bid and lowest ask
function updateSpread() {
    const asks = document.querySelectorAll('.orderbook-asks .price');
    const bids = document.querySelectorAll('.orderbook-bids .price');
    
    if (asks.length > 0 && bids.length > 0) {
        const lowestAsk = parseFloat(asks[0].textContent);
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
    if (window.tradingViewWidget) {
        const symbol = window.tradingViewWidget.symbolInterval().split(',')[0];
        console.log('Subscribed to updates for:', symbol);
        
        // Here you would change the WebSocket subscription if the symbol changes
        // For now we'll just keep it simple
    }
}

// Initialize tooltips
function initTooltips() {
    // Already handled in CSS with data-tooltip attribute
}

// Initialize pair selector dropdown
function initPairSelector() {
    const pairSelector = document.querySelector('.pair-selector');
    const pairDropdown = document.querySelector('.pair-dropdown-content');
    
    if (pairSelector && pairDropdown) {
        // Toggle dropdown on click
        pairSelector.addEventListener('click', (e) => {
            pairDropdown.classList.toggle('hidden');
            
            // Add animation when showing
            if (!pairDropdown.classList.contains('hidden')) {
                pairDropdown.classList.add('animate-fade-in');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!pairSelector.contains(e.target) && !pairDropdown.contains(e.target)) {
                pairDropdown.classList.add('hidden');
            }
        });
        
        // Handle pair selection
        const pairItems = document.querySelectorAll('.pair-dropdown-item');
        pairItems.forEach(item => {
            item.addEventListener('click', () => {
                // Get pair data
                const pairSymbol = item.querySelector('.pair-symbol').textContent;
                const pairIcon = item.querySelector('.pair-icon').innerHTML;
                const pairName = item.querySelector('.pair-name').textContent;
                const pairPrice = item.querySelector('.pair-current-price').textContent;
                const pairChange = item.querySelector('.pair-price-change').textContent;
                const isPricePositive = item.querySelector('.pair-price-change').classList.contains('positive');
                
                // Update current pair display
                document.querySelector('.current-pair .pair-icon').innerHTML = pairIcon;
                document.querySelector('.current-pair .pair-details h2').textContent = pairSymbol;
                document.querySelector('.current-pair .pair-price .price').textContent = pairPrice;
                
                const changeElem = document.querySelector('.current-pair .pair-price .change');
                changeElem.textContent = pairChange;
                changeElem.className = `change ${isPricePositive ? 'positive' : 'negative'}`;
                
                // Update TradingView chart symbol
                if (window.tradingViewWidget) {
                    const symbol = `BINANCE:${pairSymbol.replace('/', '')}`;
                    const interval = window.tradingViewWidget.symbolInterval().split(',')[1];
                    window.tradingViewWidget.setSymbol(symbol, interval);
                }
                
                // Update UI elements
                document.querySelector('.btn-submit.btn-buy').textContent = `Buy ${pairSymbol.split('/')[0]}`;
                document.querySelector('.btn-submit.btn-sell').textContent = `Sell ${pairSymbol.split('/')[0]}`;
                
                // Show notification
                showToast(
                    'Symbol Changed',
                    `Trading pair changed to ${pairSymbol}`,
                    'info'
                );
                
                // Close dropdown
                pairDropdown.classList.add('hidden');
            });
        });
        
        // Search functionality
        const searchInput = pairDropdown.querySelector('.pair-search input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                pairItems.forEach(item => {
                    const pairSymbol = item.querySelector('.pair-symbol').textContent.toLowerCase();
                    const pairName = item.querySelector('.pair-name').textContent.toLowerCase();
                    
                    if (pairSymbol.includes(searchTerm) || pairName.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
        
        // Category filter
        const categoryButtons = pairDropdown.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter pairs
                const category = button.textContent.trim().toLowerCase();
                
                if (category === 'all') {
                    // Show all pairs
                    pairItems.forEach(item => {
                        item.style.display = 'flex';
                    });
                } else {
                    // Filter by category
                    pairItems.forEach(item => {
                        const pairSymbol = item.querySelector('.pair-symbol').textContent;
                        if (pairSymbol.toLowerCase().includes(category)) {
                            item.style.display = 'flex';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                }
            });
        });
    }
}

// Initialize market activity panel
function initMarketActivity() {
    // Add market activity toggle button to chart header
    const chartIndicators = document.querySelector('.chart-indicators');
    if (chartIndicators) {
        const activityButton = document.createElement('button');
        activityButton.className = 'btn btn-indicator';
        activityButton.innerHTML = '<i class="fas fa-list"></i><span>Activity</span>';
        chartIndicators.appendChild(activityButton);
        
        // Toggle market activity panel
        const activityPanel = document.querySelector('.market-activity-panel');
        activityButton.addEventListener('click', () => {
            activityPanel.classList.toggle('active');
        });
        
        // Close button
        const closeButton = activityPanel.querySelector('.panel-close');
        closeButton.addEventListener('click', () => {
            activityPanel.classList.remove('active');
        });
        
        // Activity tabs
        const activityTabs = activityPanel.querySelectorAll('.activity-tab');
        const activityContents = activityPanel.querySelectorAll('.activity-tab-content');
        
        activityTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update active tab
                activityTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                activityContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${targetTab}-content`) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    
    toast.innerHTML = `
        <div class="toast-icon ${type}">
            <i class="${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Add close button functionality
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (toastContainer.contains(toast)) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
}

// Add order to the open orders table
function addOrderToTable(order) {
    // Check if we have empty state
    const emptyState = document.querySelector('#open-orders .empty-state');
    if (emptyState) {
        // Replace empty state with table
        const openOrdersTab = document.getElementById('open-orders');
        openOrdersTab.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Pair</th>
                        <th>Type</th>
                        <th>Side</th>
                        <th>Price</th>
                        <th>Amount</th>
                        <th>Filled</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="open-orders-body">
                </tbody>
            </table>
        `;
    }
    
    // Get table body
    const tableBody = document.getElementById('open-orders-body');
    if (!tableBody) return;
    
    // Format date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    
    // Create row
    const row = document.createElement('tr');
    row.className = 'animate-fade-in';
    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>BTC/USDT</td>
        <td>${order.type.charAt(0).toUpperCase() + order.type.slice(1)}</td>
        <td class="side ${order.direction}">${order.direction.charAt(0).toUpperCase() + order.direction.slice(1)}</td>
        <td>${parseFloat(order.price).toFixed(2)}</td>
        <td>${parseFloat(order.amount).toFixed(6)}</td>
        <td>0.000000</td>
        <td>${order.total}</td>
        <td><span class="status" style="background-color: rgba(94, 92, 230, 0.1); color: var(--color-info);">Open</span></td>
        <td>
            <button class="btn-icon cancel-order"><i class="fas fa-times"></i></button>
        </td>
    `;
    
    // Add to table
    tableBody.prepend(row);
    
    // Add cancel order functionality
    const cancelButton = row.querySelector('.cancel-order');
    cancelButton.addEventListener('click', () => {
        // Simulate cancellation
        row.querySelector('.status').innerHTML = '<span class="status cancelled">Cancelled</span>';
        cancelButton.disabled = true;
        cancelButton.style.opacity = '0.5';
        
        showToast('Order Cancelled', 'Your order has been successfully cancelled.', 'info');
    });
}