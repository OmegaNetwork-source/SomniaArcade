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
            walletAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
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

        // Auto-fill Quest Tracker
        const questInput = document.getElementById('quest-wallet-input');
        if (questInput) questInput.value = walletAddress;
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
            if (statValue && !statValue.classList.contains('animated')) {
                const rawValue = statValue.textContent.replace(/,/g, '');
                const target = parseInt(rawValue);

                if (!isNaN(target)) {
                    animateCounter(statValue, target);
                    statValue.classList.add('animated');
                }
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.game-stats').forEach(stats => {
    statsObserver.observe(stats);
});

// Gradient text animation is now handled via CSS animations

// Image Modal Functions
function viewFullImage(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = imageSrc;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});

// Load gallery images from postimg.cc
document.addEventListener('DOMContentLoaded', async () => {
    const galleryItems = document.querySelectorAll('.gallery-item');

    // Manual direct URLs map - update these with actual direct image URLs if known
    // Format: code -> direct URL
    const manualDirectUrls = {
        // Example: 'SnrxwD72': 'https://i.postimg.cc/SnrxwD72/image.png',
    };

    // Process each gallery item
    for (const item of galleryItems) {
        const img = item.querySelector('img');
        const pageUrl = item.dataset.pageUrl;
        const code = item.dataset.imageCode;

        // Check manual URLs first
        if (manualDirectUrls[code]) {
            img.src = manualDirectUrls[code];
            img.style.opacity = '1';

            item.addEventListener('click', () => {
                viewFullImage(img.src);
            });
            continue;
        }

        // Try expanded list of possible URL formats (more comprehensive)
        const possibleUrls = [
            // Direct postimg.cc image CDN formats
            `https://i.postimg.cc/${code}/image.png`,
            `https://i.postimg.cc/${code}/image.jpg`,
            `https://i.postimg.cc/${code}.png`,
            `https://i.postimg.cc/${code}.jpg`,
            `https://i.postimg.cc/${code}`,
            // Alternative CDN paths
            `https://i.postimg.cc/gallery/${code}.png`,
            `https://i.postimg.cc/gallery/${code}.jpg`,
            // Base domain formats (less likely but worth trying)
            `https://postimg.cc/${code}/image.png`,
            `https://postimg.cc/${code}/image.jpg`,
            `https://postimg.cc/${code}.png`,
            `https://postimg.cc/${code}.jpg`,
        ];

        let loaded = false;
        let triedUrls = [];

        // Try loading each URL
        for (const url of possibleUrls) {
            const loadedUrl = await new Promise((resolve) => {
                const testImg = new Image();
                testImg.onload = () => {
                    resolve(url);
                };
                testImg.onerror = () => {
                    resolve(null);
                };
                // Set timeout to prevent hanging
                setTimeout(() => resolve(null), 3000);
                testImg.src = url;
            });

            if (loadedUrl) {
                img.src = loadedUrl;
                img.style.opacity = '1';
                loaded = true;
                break;
            }
        }

        // If all URL attempts failed, try fetching via CORS proxy (silently fail if it doesn't work)
        if (!loaded) {
            try {
                // Try alternative CORS proxies silently
                const proxies = [
                    `https://api.allorigins.win/get?url=${encodeURIComponent(pageUrl)}`,
                    `https://corsproxy.io/?${encodeURIComponent(pageUrl)}`
                ];

                for (const proxyUrl of proxies) {
                    try {
                        const response = await Promise.race([
                            fetch(proxyUrl),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                        ]);

                        if (response.ok) {
                            const data = await response.json();
                            const html = data.contents || data;

                            // Extract image URL from HTML
                            const imgMatch = html.match(/https?:\/\/i\.postimg\.cc\/[^\s"']+\.(png|jpg|jpeg|webp)/i);
                            if (imgMatch && imgMatch[0]) {
                                img.src = imgMatch[0];
                                img.style.opacity = '1';
                                loaded = true;
                                break;
                            }
                        }
                    } catch (e) {
                        // Silently continue to next proxy
                        continue;
                    }
                }
            } catch (e) {
                // Silently continue if CORS proxy fails
            }
        }

        // If still not loaded, show placeholder
        if (!loaded) {
            img.style.opacity = '0.3';
            img.style.background = 'rgba(255, 255, 255, 0.05)';
            img.alt = 'Click to view image';

            // Check if placeholder already exists
            let placeholder = item.querySelector('.image-placeholder');
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: rgba(255,255,255,0.6); font-size: 0.9rem; pointer-events: none; z-index: 1;';
                placeholder.textContent = 'Click to view';
                item.style.position = 'relative';
                item.appendChild(placeholder);
            }
        }

        // Set up click handler
        item.addEventListener('click', () => {
            if (img.src && (img.src.includes('i.postimg.cc') || img.src.includes('postimg.cc'))) {
                viewFullImage(img.src);
            } else {
                window.open(pageUrl, '_blank');
            }
        });
    }

    // Prevent modal close when clicking on image or button
    const modalImage = document.getElementById('modalImage');
    const galleryViewButtons = document.querySelectorAll('.gallery-view-btn');

    if (modalImage) {
        modalImage.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    galleryViewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.gallery-item');
            const img = item.querySelector('img');
            const pageUrl = item.dataset.pageUrl;
            if (img.src && (img.src.includes('i.postimg.cc') || img.src.includes('postimg.cc'))) {
                viewFullImage(img.src);
            } else {
                window.open(pageUrl, '_blank');
            }
        });
    });
});

// Console easter egg
console.log('%c🎮 Welcome to Somnia Arcade!', 'font-size: 20px; color: #00D4FF; font-weight: bold;');
console.log('%cBuilt on the Somnia Network', 'font-size: 14px; color: #6B00E5;');
console.log('%cInterested in building games? Contact us!', 'font-size: 12px; color: #0080FF;');

// Quest Tracker Logic
const questCheckBtn = document.getElementById('btn-check-quest');
const questInput = document.getElementById('quest-wallet-input');
const questResults = document.getElementById('quest-results');

if (questCheckBtn && questInput) {
    questCheckBtn.addEventListener('click', checkQuestStatus);
    questInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkQuestStatus();
    });
}

async function checkQuestStatus() {
    const address = questInput.value.trim();
    if (!address || !address.startsWith('0x')) {
        alert('Please enter a valid wallet address');
        return;
    }

    const originalText = questCheckBtn.textContent;
    questCheckBtn.textContent = 'Checking...';
    questCheckBtn.disabled = true;

    try {
        // Use the verify endpoint which sums up all scores
        const response = await fetch(`https://arcadebots.solarstudios.co/api/verify?wallet=${address}`);
        const data = await response.json();

        if (data && typeof data.totalScore !== 'undefined') {
            document.getElementById('quest-total-score').textContent = data.totalScore.toLocaleString();

            const statusText = document.getElementById('quest-status-text');
            const remainingVal = document.getElementById('quest-remaining');

            if (data.completed) {
                statusText.textContent = "COMPLETED! 🎉";
                statusText.style.color = "#45ffb1"; // Success Green
                remainingVal.textContent = "0";
                remainingVal.style.color = "#45ffb1";
            } else {
                statusText.textContent = "In Progress";
                statusText.style.color = "#ffcc00"; // Warning Yellow
                const needed = Math.max(0, 5000 - data.totalScore);
                remainingVal.textContent = needed.toLocaleString();
                remainingVal.style.color = "#ff4f6d"; // Red
            }

            questResults.style.display = 'block';

            // Animation for effect
            questResults.style.opacity = '0';
            requestAnimationFrame(() => {
                questResults.style.transition = 'opacity 0.5s ease';
                questResults.style.opacity = '1';
            });
        } else {
            alert('Could not fetch data. Try again later.');
        }
    } catch (error) {
        console.error('Quest check failed:', error);
        alert('Failed to connect to Quest API. Make sure you are online.');
    } finally {
        questCheckBtn.textContent = originalText;
        questCheckBtn.disabled = false;
    }
}

