# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file PWA tap-tempo BPM calculator. No build step, no dependencies, no framework. All app logic lives in `index.html` (inline CSS + JS). Served via nginx in Docker, exposed publicly via a Cloudflare Tunnel.

## Running locally

```bash
docker compose up
```

The app is served at `http://localhost` (nginx default port 80). Changes to `index.html`, `sw.js`, `manifest.json`, or the SVG icons take effect immediately on reload — nginx mounts them as read-only bind mounts, so no container restart is needed.

The Cloudflare Tunnel (`cloudflared` service) requires a valid `TUNNEL_TOKEN` in `.env` to connect. The token is stored in `.env` and references the "bpm" tunnel in Cloudflare Zero Trust → Networks → Tunnels.

## Architecture

All logic is self-contained in `index.html`:

- **BPM calculation**: Keeps a rolling window of up to 9 taps (8 intervals). On each tap, computes the mean interval in ms and converts to BPM (`60000 / avg`). Auto-resets after 3 seconds of inactivity (`RESET_DELAY`).
- **Feedback**: Pulse animation on `#tap-area`, dot indicators showing interval count, SVG countdown ring draining over the reset window.
- **Input**: `pointerdown` on the tap area, plus spacebar/Enter keyboard support.
- **PWA**: `manifest.json` for installability; `sw.js` caches all static assets with a cache-first strategy. Cache version is `bpm-v1` — bump this string when assets change to force clients to re-fetch.

## Deployment

```bash
docker compose up -d
```

That's it. The `cloudflared` container maintains the tunnel to Cloudflare's edge; no port forwarding or DNS config required on the host.
