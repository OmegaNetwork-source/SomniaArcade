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

// Connect Wallet Button
document.querySelector('.btn-connect')?.addEventListener('click', (e) => {
    e.preventDefault();
    // Placeholder for wallet connection logic
    alert('Wallet connection coming soon! This will integrate with your preferred Web3 wallet.');
});

// Play Button functionality
document.querySelectorAll('.btn-play').forEach(button => {
    button.addEventListener('click', (e) => {
        const gameName = e.target.closest('.game-card').querySelector('h3').textContent;
        // Placeholder for game launch logic
        alert(`Launching ${gameName}...`);
        // In production, this would navigate to the game or open it in a modal
    });
});

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

