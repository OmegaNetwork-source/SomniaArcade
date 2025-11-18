// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.background = 'rgba(10, 10, 15, 0.8)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.game-card, .feature-card, .about-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Wallet Connection State
let walletConnected = false;
let walletAddress = null;
let somiBalance = 0;

// SOMI Token Contract Address (placeholder - update with actual contract)
// TODO: Replace with actual SOMI token contract address
const SOMI_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Update with real address
const SOMI_DECIMALS = 18; // Standard ERC20 decimals, adjust if different

// Connect Wallet Button
const connectWalletBtn = document.getElementById('connect-wallet-btn');
const somiBalanceNav = document.getElementById('somi-balance');
const somiAmountNav = document.getElementById('somi-amount');

connectWalletBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await connectWallet();
});

// Wallet Connection Function
async function connectWallet() {
    try {
        // Check if Web3 is available
        if (typeof window.ethereum !== 'undefined') {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            walletAddress = accounts[0];
            walletConnected = true;
            
            // Update UI
            updateWalletUI();
            
            // Fetch SOMI balance
            await fetchSomiBalance();
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        } else {
            // Fallback: show mock connection for demo
            walletAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
            walletConnected = true;
            updateWalletUI();
            // Mock balance for demo
            somiBalance = Math.floor(Math.random() * 10000) + 100;
            updateSomiBalance();
            alert('Wallet connected! (Demo mode - connect a real wallet for production)');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        walletAddress = accounts[0];
        fetchSomiBalance();
    }
}

// Update Wallet UI
function updateWalletUI() {
    if (walletConnected) {
        connectWalletBtn.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        connectWalletBtn.classList.add('connected');
        somiBalanceNav.style.display = 'flex';
    } else {
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.classList.remove('connected');
        somiBalanceNav.style.display = 'none';
    }
}

// Fetch SOMI Balance
async function fetchSomiBalance() {
    if (!walletConnected || !walletAddress) return;
    
    try {
        if (typeof window.ethereum !== 'undefined' && typeof ethers !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // If SOMI contract address is set, fetch token balance
            if (SOMI_CONTRACT_ADDRESS && SOMI_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
                try {
                    // ERC20 standard balanceOf function
                    const contract = new ethers.Contract(
                        SOMI_CONTRACT_ADDRESS,
                        [
                            "function balanceOf(address owner) view returns (uint256)",
                            "function decimals() view returns (uint8)"
                        ],
                        provider
                    );
                    
                    // Get balance and decimals
                    const [balance, decimals] = await Promise.all([
                        contract.balanceOf(walletAddress),
                        contract.decimals().catch(() => SOMI_DECIMALS) // Fallback to default if decimals() not available
                    ]);
                    
                    // Convert from wei/smallest unit to human-readable format
                    somiBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));
                    
                } catch (tokenError) {
                    console.error('Error fetching SOMI token balance:', tokenError);
                    // Fallback to native balance if token fetch fails
                    try {
                        const balance = await provider.getBalance(walletAddress);
                        somiBalance = parseFloat(ethers.utils.formatEther(balance));
                        console.warn('Showing native balance instead of SOMI token balance. Please set SOMI_CONTRACT_ADDRESS.');
                    } catch (nativeError) {
                        console.error('Error fetching native balance:', nativeError);
                        somiBalance = 0;
                    }
                }
            } else {
                // No contract address set, fetch native balance as fallback
                try {
                    const balance = await provider.getBalance(walletAddress);
                    somiBalance = parseFloat(ethers.utils.formatEther(balance));
                    console.warn('SOMI contract address not set. Showing native balance. Please set SOMI_CONTRACT_ADDRESS in script.js to show actual SOMI token balance.');
                } catch (nativeError) {
                    console.error('Error fetching native balance:', nativeError);
                    somiBalance = 0;
                }
            }
        } else if (typeof window.ethereum !== 'undefined') {
            // ethers.js not loaded, use direct RPC call
            try {
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [walletAddress, 'latest']
                });
                somiBalance = parseInt(balance, 16) / Math.pow(10, 18);
                console.warn('ethers.js not loaded. Showing native balance. Please include ethers.js to fetch SOMI token balance.');
            } catch (error) {
                console.error('Error fetching balance:', error);
                somiBalance = 0;
            }
        } else {
            somiBalance = 0;
        }
        
        updateSomiBalance();
    } catch (error) {
        console.error('Error fetching SOMI balance:', error);
        somiBalance = 0;
        updateSomiBalance();
    }
}

// Update SOMI Balance Display
function updateSomiBalance() {
    const formattedBalance = somiBalance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    somiAmountNav.textContent = formattedBalance;
}

// Disconnect Wallet
function disconnectWallet() {
    walletConnected = false;
    walletAddress = null;
    somiBalance = 0;
    updateWalletUI();
    updateSomiBalance();
}

// Check if already connected on page load
window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                walletAddress = accounts[0];
                walletConnected = true;
                updateWalletUI();
                await fetchSomiBalance();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
});

// Play Button functionality - now handled by direct links in HTML
// Bushido links to: https://bushido-omega.vercel.app/

// Parallax effect for hero visual elements
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach((card, index) => {
        const speed = (index + 1) * 0.3;
        card.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Add hover effect to game cards
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
});

// Dynamic stats counter animation
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(progress * target);
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Animate counters when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statValue = entry.target.querySelector('.stat-value');
            if (statValue && !statValue.classList.contains('animated')) {
                const target = parseInt(statValue.textContent.replace(/,/g, ''));
                animateCounter(statValue, target);
                statValue.classList.add('animated');
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.game-stats').forEach(stats => {
    statsObserver.observe(stats);
});

// Gradient text animation is now handled via CSS animations

// Console easter egg
console.log('%c🎮 Welcome to Somnia Arcade!', 'font-size: 20px; color: #00D4FF; font-weight: bold;');
console.log('%cBuilt on the Somnia Network', 'font-size: 14px; color: #6B00E5;');
console.log('%cInterested in building games? Contact us!', 'font-size: 12px; color: #0080FF;');

