## Re-Entry

A sci-fi endless descent prototype where you free-fall through a shattered orbital ring, dodging debris and harvesting charge as you go.

### Controls

| Action | Keyboard | Touch / Mobile |
| --- | --- | --- |
| Strafe left / right | `A` `D` or `←` `→` | Swipe left / right |
| Pulse shield (clear nearby debris) | `Space` (costs charge) | Double tap |
| Start / Retry | `Space` or click buttons | Tap buttons |

### Features

- Five-lane vertical descent with procedural debris patterns and parallax light trails
- Charge nodes to replenish shields and fuel pulse clears
- Local best depth tracking via `localStorage`

### Run locally

```bash
python -m http.server 8000
```

Visit [http://localhost:8000/fall/](http://localhost:8000/fall/)

