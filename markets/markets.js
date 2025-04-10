document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    initThemeToggle();
    
    // Markets data and state
    let marketsData = [];
    let filteredMarkets = [];
    let favorites = loadFavorites();
    let currentPage = 1;
    const itemsPerPage = 20;
    let currentSort = { field: 'marketCap', direction: 'desc' };
    let currentView = 'all';
    let currentCategory = 'all';
    let currentQuote = 'all';
    let searchTerm = '';
    
    // References to DOM elements
    const marketsTableBody = document.getElementById('markets-table-body');
    const loadingIndicator = document.getElementById('loading-markets');
    const noResultsElement = document.getElementById('no-results');
    const marketSearch = document.getElementById('market-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageIndicators = document.getElementById('page-indicators');
    const viewButtons = document.querySelectorAll('.view-btn');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const quoteButtons = document.querySelectorAll('.quote-btn');
    const sortableHeaders = document.querySelectorAll('.sortable');
    const quickInfoModal = document.getElementById('quick-info-modal');
    const quickInfoClose = document.getElementById('quick-info-close');
    
    // Initialize the page
    initMarkets();
    initEventListeners();
    
    // Define functions
    
    // Initialize theme toggle functionality
    function initThemeToggle() {
        const themeSwitch = document.querySelector('.theme-switch');
        
        // Check for saved theme preference or use device preference
        const savedTheme = localStorage.getItem('cryptowave-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-theme');
            themeSwitch.checked = true;
        }
        
        // Add event listener for theme switch
        themeSwitch.addEventListener('change', () => {
            document.body.classList.toggle('dark-theme');
            
            // Save preference
            const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('cryptowave-theme', theme);
        });
    }
    
    // Initialize the markets page with data
    async function initMarkets() {
        try {
            // Show loading indicator
            loadingIndicator.style.display = 'flex';
            noResultsElement.style.display = 'none';
            
            // Fetch markets data
            marketsData = await fetchMarketsData();
            
            // Apply initial filters
            applyFilters();
            
            // Initial sort by market cap
            sortMarkets('marketCap', 'desc');
            
            // Update the UI
            updatePagination();
            renderMarkets();
            
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
        } catch (error) {
            console.error('Error initializing markets:', error);
            loadingIndicator.style.display = 'none';
            
            // Show error message
            marketsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load markets data. Please try again later.</p>
                    </td>
                </tr>
            `;
        }
    }
    
    // Initialize event listeners for interactive elements
    function initEventListeners() {
        // Search input
        marketSearch.addEventListener('input', handleSearch);
        
        // Clear search button
        clearSearchBtn.addEventListener('click', clearSearch);
        
        // Pagination buttons
        prevPageBtn.addEventListener('click', () => navigateToPage(currentPage - 1));
        nextPageBtn.addEventListener('click', () => navigateToPage(currentPage + 1));
        
        // View filter buttons
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                currentView = button.getAttribute('data-view');
                applyFilters();
                updatePagination();
                renderMarkets();
            });
        });
        
        // Category filter buttons
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                currentCategory = button.getAttribute('data-category');
                applyFilters();
                updatePagination();
                renderMarkets();
            });
        });
        
        // Quote filter buttons
        quoteButtons.forEach(button => {
            button.addEventListener('click', () => {
                quoteButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                currentQuote = button.getAttribute('data-quote');
                applyFilters();
                updatePagination();
                renderMarkets();
            });
        });
        
        // Sortable headers
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                const newDirection = currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
                
                // Update sort headers UI
                sortableHeaders.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                header.classList.add(newDirection === 'asc' ? 'sort-asc' : 'sort-desc');
                
                sortMarkets(field, newDirection);
                renderMarkets();
            });
        });
        
        // Modal close
        quickInfoClose.addEventListener('click', closeQuickInfoModal);
        
        // Close modal when clicking outside
        quickInfoModal.addEventListener('click', (e) => {
            if (e.target === quickInfoModal) {
                closeQuickInfoModal();
            }
        });
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && quickInfoModal.classList.contains('active')) {
                closeQuickInfoModal();
            }
        });
    }
    
    // Handle search input
    function handleSearch() {
        const value = marketSearch.value.trim();
        
        // Show/hide clear button based on search input
        if (value.length > 0) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        
        searchTerm = value.toLowerCase();
        applyFilters();
        currentPage = 1; // Reset to first page
        updatePagination();
        renderMarkets();
    }
    
    // Clear search field
    function clearSearch() {
        marketSearch.value = '';
        searchTerm = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
        updatePagination();
        renderMarkets();
    }
    
    // Apply filters based on current state
    function applyFilters() {
        filteredMarkets = marketsData.filter(market => {
            // Apply search filter
            if (searchTerm) {
                const matchesSearch = 
                    market.name.toLowerCase().includes(searchTerm) || 
                    market.symbol.toLowerCase().includes(searchTerm);
                
                if (!matchesSearch) return false;
            }
            
            // Apply view filter
            if (currentView === 'favorites' && !favorites.includes(market.id)) {
                return false;
            } else if (currentView === 'gainers' && market.change24h <= 0) {
                return false;
            } else if (currentView === 'losers' && market.change24h >= 0) {
                return false;
            } else if (currentView === 'volume' && market.volume24h < 10000000) { // Example volume threshold
                return false;
            }
            
            // Apply category filter
            if (currentCategory !== 'all' && market.category !== currentCategory) {
                return false;
            }
            
            // Apply quote filter
            if (currentQuote !== 'all' && !market.symbol.endsWith(currentQuote.toUpperCase())) {
                return false;
            }
            
            return true;
        });
        
        // Show/hide no results message
        if (filteredMarkets.length === 0 && marketsData.length > 0) {
            noResultsElement.style.display = 'flex';
            marketsTableBody.innerHTML = '';
        } else {
            noResultsElement.style.display = 'none';
        }
    }
    
    // Sort markets by specified field and direction
    function sortMarkets(field, direction) {
        currentSort = { field, direction };
        
        filteredMarkets.sort((a, b) => {
            let comparison = 0;
            
            switch (field) {
                case 'price':
                    comparison = a.price - b.price;
                    break;
                case 'change':
                    comparison = a.change24h - b.change24h;
                    break;
                case 'volume':
                    comparison = a.volume24h - b.volume24h;
                    break;
                case 'marketCap':
                    comparison = a.marketCap - b.marketCap;
                    break;
                default:
                    return 0;
            }
            
            return direction === 'asc' ? comparison : -comparison;
        });
    }
    
    // Update pagination UI
    function updatePagination() {
        const totalPages = Math.ceil(filteredMarkets.length / itemsPerPage);
        
        // Update prev/next buttons
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        
        // Generate page indicators
        pageIndicators.innerHTML = '';
        
        if (totalPages <= 7) {
            // Show all pages if 7 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pageIndicators.appendChild(createPageIndicator(i));
            }
        } else {
            // Show complex pagination with ellipsis
            // Always show first page
            pageIndicators.appendChild(createPageIndicator(1));
            
            // Logic for showing middle pages with ellipsis
            if (currentPage <= 3) {
                // Near start: show 1, 2, 3, 4, 5, ..., totalPages
                for (let i = 2; i <= 5; i++) {
                    pageIndicators.appendChild(createPageIndicator(i));
                }
                pageIndicators.appendChild(createEllipsis());
            } else if (currentPage >= totalPages - 2) {
                // Near end: show 1, ..., totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
                pageIndicators.appendChild(createEllipsis());
                for (let i = totalPages - 4; i <= totalPages - 1; i++) {
                    pageIndicators.appendChild(createPageIndicator(i));
                }
            } else {
                // Middle: show 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
                pageIndicators.appendChild(createEllipsis());
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageIndicators.appendChild(createPageIndicator(i));
                }
                pageIndicators.appendChild(createEllipsis());
            }
            
            // Always show last page
            pageIndicators.appendChild(createPageIndicator(totalPages));
        }
    }
    
    // Create a page indicator element
    function createPageIndicator(pageNumber) {
        const indicator = document.createElement('div');
        indicator.className = 'page-indicator';
        indicator.textContent = pageNumber;
        
        if (pageNumber === currentPage) {
            indicator.classList.add('active');
        }
        
        indicator.addEventListener('click', () => navigateToPage(pageNumber));
        
        return indicator;
    }
    
    // Create an ellipsis element for pagination
    function createEllipsis() {
        const ellipsis = document.createElement('div');
        ellipsis.className = 'page-indicator ellipsis';
        ellipsis.textContent = '...';
        return ellipsis;
    }
    
    // Navigate to a specific page
    function navigateToPage(pageNumber) {
        const totalPages = Math.ceil(filteredMarkets.length / itemsPerPage);
        
        if (pageNumber < 1 || pageNumber > totalPages) {
            return;
        }
        
        currentPage = pageNumber;
        updatePagination();
        renderMarkets();
        
        // Scroll to top of table
        marketsTableBody.parentElement.scrollTop = 0;
    }
    
    // Render markets table with current data and filters
    function renderMarkets() {
        marketsTableBody.innerHTML = '';
        
        if (filteredMarkets.length === 0) {
            return;
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredMarkets.length);
        const pageMarkets = filteredMarkets.slice(startIndex, endIndex);
        
        pageMarkets.forEach(market => {
            const row = document.createElement('tr');
            row.setAttribute('data-market-id', market.id);
            
            row.innerHTML = `
                <td class="favorite-col">
                    <button class="favorite-btn ${favorites.includes(market.id) ? 'active' : ''}" data-market-id="${market.id}">
                        <i class="fas fa-star"></i>
                    </button>
                </td>
                <td class="asset-col">
                    <div class="asset-info">
                        <div class="asset-icon">
                            <img src="${market.iconUrl}" alt="${market.symbol}">
                        </div>
                        <div class="asset-name-container">
                            <div class="asset-name">${market.name}</div>
                            <div class="asset-symbol">${market.symbol}</div>
                        </div>
                    </div>
                </td>
                <td class="price-col price-value" data-prev-price="${market.price.toFixed(2)}">
                    $${formatNumber(market.price)}
                </td>
                <td class="change-col">
                    <div class="price-change ${market.change24h >= 0 ? 'positive' : 'negative'}">
                        ${market.change24h >= 0 ? '+' : ''}${market.change24h.toFixed(2)}%
                    </div>
                </td>
                <td class="volume-col">
                    $${formatNumber(market.volume24h)}
                </td>
                <td class="market-cap-col">
                    $${formatNumber(market.marketCap)}
                </td>
                <td class="action-col">
                    <button class="trade-btn" data-market-id="${market.id}">Trade</button>
                </td>
            `;
            
            marketsTableBody.appendChild(row);
        });
        
        // Add event listeners for favorite buttons
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(button.getAttribute('data-market-id'));
            });
        });
        
        // Add event listeners for trade buttons
        document.querySelectorAll('.trade-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const marketId = button.getAttribute('data-market-id');
                const market = marketsData.find(m => m.id === marketId);
                
                if (market) {
                    window.location.href = `/trade/${market.symbol.toLowerCase()}`;
                }
            });
        });
        
        // Add event listeners for row clicks to show quick info
        document.querySelectorAll('tr[data-market-id]').forEach(row => {
            row.addEventListener('click', () => {
                const marketId = row.getAttribute('data-market-id');
                const market = marketsData.find(m => m.id === marketId);
                
                if (market) {
                    showQuickInfoModal(market);
                }
            });
        });
    }
    
    // Toggle favorite status of a market
    function toggleFavorite(marketId) {
        const index = favorites.indexOf(marketId);
        
        if (index === -1) {
            // Add to favorites
            favorites.push(marketId);
            document.querySelectorAll(`.favorite-btn[data-market-id="${marketId}"]`).forEach(btn => {
                btn.classList.add('active');
            });
        } else {
            // Remove from favorites
            favorites.splice(index, 1);
            document.querySelectorAll(`.favorite-btn[data-market-id="${marketId}"]`).forEach(btn => {
                btn.classList.remove('active');
            });
            
            // If in favorites view, re-render
            if (currentView === 'favorites') {
                applyFilters();
                updatePagination();
                renderMarkets();
            }
        }
        
        // Save to localStorage
        saveFavorites();
    }
    
    // Save favorites to localStorage
    function saveFavorites() {
        localStorage.setItem('cryptowave-favorites', JSON.stringify(favorites));
    }
    
    // Load favorites from localStorage
    function loadFavorites() {
        const savedFavorites = localStorage.getItem('cryptowave-favorites');
        return savedFavorites ? JSON.parse(savedFavorites) : [];
    }
    
    // Format number for display
    function formatNumber(value) {
        // Format based on the magnitude
        if (value >= 1e9) {
            return (value / 1e9).toFixed(2) + 'B';
        } else if (value >= 1e6) {
            return (value / 1e6).toFixed(2) + 'M';
        } else if (value >= 1e3) {
            return (value / 1e3).toFixed(2) + 'K';
        } else if (value < 0.01) {
            return value.toFixed(6);
        } else {
            return value.toFixed(2);
        }
    }
    
    // Show quick info modal with market data
    function showQuickInfoModal(market) {
        // Update modal content
        document.getElementById('quick-info-icon').src = market.iconUrl;
        document.getElementById('quick-info-name').textContent = market.name;
        document.getElementById('quick-info-symbol').textContent = market.symbol;
        document.getElementById('quick-info-price').textContent = '$' + formatNumber(market.price);
        
        const changeElement = document.getElementById('quick-info-change');
        changeElement.textContent = `${market.change24h >= 0 ? '+' : ''}${market.change24h.toFixed(2)}%`;
        changeElement.className = `quick-info-change ${market.change24h >= 0 ? 'positive' : 'negative'}`;
        
        document.getElementById('quick-info-high').textContent = '$' + formatNumber(market.high24h);
        document.getElementById('quick-info-low').textContent = '$' + formatNumber(market.low24h);
        document.getElementById('quick-info-volume').textContent = '$' + formatNumber(market.volume24h);
        document.getElementById('quick-info-market-cap').textContent = '$' + formatNumber(market.marketCap);
        
        // Set up action buttons
        document.getElementById('quick-info-details').href = `/markets/${market.symbol.toLowerCase()}`;
        document.getElementById('quick-info-trade').href = `/trade/${market.symbol.toLowerCase()}`;
        
        // Show modal
        quickInfoModal.classList.add('active');
    }
    
    // Close quick info modal
    function closeQuickInfoModal() {
        quickInfoModal.classList.remove('active');
    }
    
    // Simulate real-time price updates
    function startPriceUpdates() {
        setInterval(() => {
            if (marketsData.length === 0) return;
            
            // Update a random selection of markets
            const updateCount = Math.floor(Math.random() * 5) + 1;
            const indices = new Array(updateCount).fill(0).map(() => 
                Math.floor(Math.random() * marketsData.length)
            );
            
            indices.forEach(index => {
                const market = marketsData[index];
                const changePercent = (Math.random() * 1 - 0.5) / 10; // -0.05% to +0.05%
                
                // Calculate new price and update the market
                const prevPrice = market.price;
                market.price = market.price * (1 + changePercent);
                market.change24h = market.change24h + changePercent * 100;
                
                // Update volume slightly
                market.volume24h = market.volume24h * (1 + (Math.random() * 0.001 - 0.0005));
                
                // Update market cap based on price change
                market.marketCap = market.marketCap * (market.price / prevPrice);
                
                // Update high/low if needed
                if (market.price > market.high24h) market.high24h = market.price;
                if (market.price < market.low24h) market.low24h = market.price;
                
                // Update UI for this market if it's visible in the current view
                updateMarketUI(market, prevPrice);
            });
        }, 3000);
    }
    
    // Update UI for a market with price change animation
    function updateMarketUI(market, prevPrice) {
        const rows = document.querySelectorAll(`tr[data-market-id="${market.id}"]`);
        
        rows.forEach(row => {
            // Update price cell with animation
            const priceCell = row.querySelector('.price-value');
            if (priceCell) {
                const oldPrice = parseFloat(priceCell.getAttribute('data-prev-price'));
                priceCell.textContent = '$' + formatNumber(market.price);
                priceCell.setAttribute('data-prev-price', market.price.toFixed(2));
                
                // Add animation class based on price direction
                if (market.price > oldPrice) {
                    priceCell.classList.remove('price-down');
                    priceCell.classList.add('price-up');
                } else if (market.price < oldPrice) {
                    priceCell.classList.remove('price-up');
                    priceCell.classList.add('price-down');
                }
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    priceCell.classList.remove('price-up', 'price-down');
                }, 2000);
            }
            
            // Update change cell
            const changeCell = row.querySelector('.price-change');
            if (changeCell) {
                changeCell.textContent = `${market.change24h >= 0 ? '+' : ''}${market.change24h.toFixed(2)}%`;
                changeCell.className = `price-change ${market.change24h >= 0 ? 'positive' : 'negative'}`;
            }
            
            // Update volume cell
            const volumeCell = row.querySelector('.volume-col');
            if (volumeCell) {
                volumeCell.textContent = '$' + formatNumber(market.volume24h);
            }
            
            // Update market cap cell
            const marketCapCell = row.querySelector('.market-cap-col');
            if (marketCapCell) {
                marketCapCell.textContent = '$' + formatNumber(market.marketCap);
            }
        });
    }
    
    // Fetch markets data (simulated for demo purposes)
    async function fetchMarketsData() {
        // This would normally be an API call
        // For this example, we'll generate mock data
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const categories = ['spot', 'futures', 'defi', 'nft', 'metaverse', 'gamefi', 'ai', 'layer1', 'layer2'];
        const quotes = ['USDT', 'BTC', 'ETH', 'USDC'];
        
        // Generate mock data
        const mockData = [
            {
                id: 'btc-usdt',
                name: 'Bitcoin',
                symbol: 'BTC/USDT',
                iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025',
                price: 76175.00,
                change24h: -2.95,
                volume24h: 80374990000,
                marketCap: 1520000000000,
                high24h: 78500.00,
                low24h: 75800.00,
                category: 'layer1'
            },
            {
                id: 'eth-usdt',
                name: 'Ethereum',
                symbol: 'ETH/USDT',
                iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=025',
                price: 1443.71,
                change24h: -5.74,
                volume24h: 15864800000,
                marketCap: 387500000000,
                high24h: 1520.00,
                low24h: 1430.00,
                category: 'layer1'
            },
            {
                id: 'sol-usdt',
                name: 'Solana',
                symbol: 'SOL/USDT',
                iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=025',
                price: 102.57,
                change24h: -4.31,
                volume24h: 11217000000,
                marketCap: 123190000000,
                high24h: 107.80,
                low24h: 100.10,
                category: 'layer1'
            },
            {
                id: 'xrp-usdt',
                name: 'XRP',
                symbol: 'XRP/USDT',
                iconUrl: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025',
                price: 1.7715,
                change24h: -5.95,
                volume24h: 1976500000,
                marketCap: 137240000000,
                high24h: 1.85,
                low24h: 1.75,
                category: 'layer1'
            },
            {
                id: 'bnb-usdt',
                name: 'BNB',
                symbol: 'BNB/USDT',
                iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=025',
                price: 631.21,
                change24h: -3.82,
                volume24h: 1876500000,
                marketCap: 95250000000,
                high24h: 650.00,
                low24h: 625.00,
                category: 'layer1'
            },
            {
                id: 'ada-usdt',
                name: 'Cardano',
                symbol: 'ADA/USDT',
                iconUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.svg?v=025',
                price: 0.7821,
                change24h: -4.25,
                volume24h: 987650000,
                marketCap: 76250000000,
                high24h: 0.8200,
                low24h: 0.7750,
                category: 'layer1'
            },
            {
                id: 'doge-usdt',
                name: 'Dogecoin',
                symbol: 'DOGE/USDT',
                iconUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=025',
                price: 0.14338,
                change24h: -4.92,
                volume24h: 2155550000,
                marketCap: 95250000000,
                high24h: 0.1500,
                low24h: 0.1400,
                category: 'nft'
            },
            {
                id: 'shib-usdt',
                name: 'Shiba Inu',
                symbol: 'SHIB/USDT',
                iconUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.svg?v=025',
                price: 0.0000375,
                change24h: -3.18,
                volume24h: 876540000,
                marketCap: 43210000000,
                high24h: 0.0000390,
                low24h: 0.0000370,
                category: 'nft'
            },
            {
                id: 'avax-usdt',
                name: 'Avalanche',
                symbol: 'AVAX/USDT',
                iconUrl: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=025',
                price: 43.89,
                change24h: -2.76,
                volume24h: 987650000,
                marketCap: 54320000000,
                high24h: 45.00,
                low24h: 43.00,
                category: 'layer1'
            },
            {
                id: 'dot-usdt',
                name: 'Polkadot',
                symbol: 'DOT/USDT',
                iconUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg?v=025',
                price: 11.25,
                change24h: -5.51,
                volume24h: 587650000,
                marketCap: 32100000000,
                high24h: 11.90,
                low24h: 11.10,
                category: 'layer1'
            },
            {
                id: 'uni-usdt',
                name: 'Uniswap',
                symbol: 'UNI/USDT',
                iconUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg?v=025',
                price: 15.32,
                change24h: 2.35,
                volume24h: 387650000,
                marketCap: 23450000000,
                high24h: 15.50,
                low24h: 14.90,
                category: 'defi'
            },
            {
                id: 'link-usdt',
                name: 'Chainlink',
                symbol: 'LINK/USDT',
                iconUrl: 'https://cryptologos.cc/logos/chainlink-link-logo.svg?v=025',
                price: 18.75,
                change24h: 1.67,
                volume24h: 487650000,
                marketCap: 21540000000,
                high24h: 19.00,
                low24h: 18.40,
                category: 'defi'
            },
            {
                id: 'atom-usdt',
                name: 'Cosmos',
                symbol: 'ATOM/USDT',
                iconUrl: 'https://cryptologos.cc/logos/cosmos-atom-logo.svg?v=025',
                price: 12.85,
                change24h: -3.21,
                volume24h: 287650000,
                marketCap: 19870000000,
                high24h: 13.20,
                low24h: 12.70,
                category: 'layer1'
            },
            {
                id: 'matic-usdt',
                name: 'Polygon',
                symbol: 'MATIC/USDT',
                iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=025',
                price: 0.9875,
                change24h: -4.53,
                volume24h: 756430000,
                marketCap: 15460000000,
                high24h: 1.0300,
                low24h: 0.9700,
                category: 'layer2'
            },
            {
                id: 'near-usdt',
                name: 'NEAR Protocol',
                symbol: 'NEAR/USDT',
                iconUrl: 'https://cryptologos.cc/logos/near-protocol-near-logo.svg?v=025',
                price: 7.85,
                change24h: 3.21,
                volume24h: 387650000,
                marketCap: 12340000000,
                high24h: 8.00,
                low24h: 7.60,
                category: 'layer1'
            }
        ];
        
        // Generate more mock data
        const additionalData = [];
        const symbolBase = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'XRP', 'LTC', 'BCH', 'EOS', 'TRX', 'XLM', 'NEO', 'ATOM', 'ONT', 'DASH', 'ZEC', 'ETC'];
        
        for (let i = 0; i < 85; i++) {
            const baseSymbol = symbolBase[Math.floor(Math.random() * symbolBase.length)];
            const quoteSymbol = quotes[Math.floor(Math.random() * quotes.length)];
            const price = Math.random() * (baseSymbol === 'BTC' ? 80000 : 1000) + 10;
            const change24h = (Math.random() * 20) - 10;
            const volume24h = Math.random() * 1000000000 + 10000000;
            const marketCap = volume24h * (Math.random() * 10 + 5);
            
            additionalData.push({
                id: `${baseSymbol.toLowerCase()}-${quoteSymbol.toLowerCase()}-${i}`,
                name: `${baseSymbol} Mock ${i + 1}`,
                symbol: `${baseSymbol}/${quoteSymbol}`,
                iconUrl: `https://via.placeholder.com/32/3B82F6/FFFFFF?text=${baseSymbol.substring(0, 2)}`,
                price,
                change24h,
                volume24h,
                marketCap,
                high24h: price * (1 + Math.random() * 0.05),
                low24h: price * (1 - Math.random() * 0.05),
                category: categories[Math.floor(Math.random() * categories.length)]
            });
        }
        
        return [...mockData, ...additionalData];
    }
    
    // Start simulated real-time price updates
    startPriceUpdates();
});
