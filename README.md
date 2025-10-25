# 🎮 Somnia Arcade

A modern, Apple-inspired arcade homepage built for the Somnia Network. Featuring your first game **Bushido** and designed to scale with future games.

## ✨ Features

- **Modern Apple-Style Design**: Clean, minimalist interface with smooth animations
- **Somnia Brand Colors**: Vibrant cyan, blue, and purple gradients
- **Responsive Layout**: Optimized for all device sizes
- **Smooth Animations**: Parallax effects, hover interactions, and scroll animations
- **Game Showcase**: Featured game cards with stats and "Play Now" buttons
- **Network Stats**: Display Somnia Network's impressive capabilities
- **Ready to Scale**: Easy to add more games as your arcade grows

## 🎨 Design Philosophy

Inspired by Apple's design language:
- Frosted glass effects (backdrop blur)
- Smooth transitions and micro-interactions
- Generous white space
- Typography hierarchy
- Gradient accents using Somnia colors

## 🚀 Getting Started

1. Simply open `index.html` in your web browser
2. No build process required - pure HTML, CSS, and JavaScript

```bash
# If you want to run a local server
python -m http.server 8000
# or
npx serve
```

Then visit `http://localhost:8000`

## 🎯 Customization

### Adding New Games

Edit the `games-grid` section in `index.html`:

```html
<div class="game-card">
    <div class="game-image your-game-bg">
        <div class="game-badge">New</div>
    </div>
    <div class="game-info">
        <h3>Your Game Name</h3>
        <p>Game description</p>
        <div class="game-stats">
            <!-- Add your stats -->
        </div>
        <button class="btn-play">Play Now</button>
    </div>
</div>
```

### Customizing Colors

All colors are defined in CSS variables in `styles.css`:

```css
:root {
    --somnia-cyan: #00D4FF;
    --somnia-blue: #0080FF;
    --somnia-purple: #6B00E5;
    --somnia-dark-purple: #4A0099;
}
```

### Connecting Your Bushido Game

Update the Play Now button in `script.js`:

```javascript
document.querySelectorAll('.btn-play').forEach(button => {
    button.addEventListener('click', (e) => {
        const gameName = e.target.closest('.game-card').querySelector('h3').textContent;
        if (gameName === 'Bushido') {
            window.location.href = '/bushido'; // Your Bushido game URL
        }
    });
});
```

## 🔗 Integration with Web3

The "Connect Wallet" button is ready for Web3 integration. Add your preferred wallet connection library (WalletConnect, MetaMask, etc.):

```javascript
// Example with ethers.js
document.querySelector('.btn-connect').addEventListener('click', async () => {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        // Connected!
    }
});
```

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- All modern mobile browsers

## 🎮 Featured Game: Bushido

Your first game is prominently featured with:
- Eye-catching red gradient theme with samurai sword emoji
- Player count and rating display
- Prominent "Play Now" call-to-action

## 🌐 Somnia Network

Built to showcase the power of Somnia Network:
- 400,000+ TPS capacity
- Sub-second transaction speed
- Ultra-low transaction costs

## 📄 License

This project is open source and available for use in your Somnia Arcade.

## 🤝 Contributing

Feel free to customize and extend this arcade homepage as your game collection grows!

---

Built with ❤️ for the Somnia Network

