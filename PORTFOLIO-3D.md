# Scroll portfolio

This is a duplicate of Jonah’s existing static website. The homepage adds a scroll portfolio between the original introduction and About section. The original pages, theme variables, navigation, typography, and site content are retained. Nothing has been published.

## Preview

From this folder, run:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Open http://127.0.0.1:8767/ in your browser. Use an HTTP server rather than opening index.html directly, because the existing site uses root-relative links.

## Behavior

- Scroll through JF → Photography → Websites → Video → JF, or select a chapter below the stage.
- The supplied JF SVG’s four shapes become shallow matte extrusions. A single continuous SVG path interpolates across all five stages.
- Cards move, unfold, rotate and travel through depth. Pointer movement uses a damped spring; hovering lifts one card and shifts its neighbors.
- The original Gallery, Websites, and Videos pages remain available from the navigation. Photography opens the gallery; website panels open their actual sites. Video cards open native, keyboard-accessible playback with Escape/Close support and ordinary MP4 links as fallback.
- No video downloads or autoplay occur before opening a film. Closing releases the video; hiding the browser tab pauses it.
- Phones/tablets use shallower depth and two-column arrangements. Short viewports (under 720px high on phones/tablets or 640px on desktop), reduced-motion preferences, unavailable advanced CSS, and unavailable IntersectionObserver use a static portfolio list. Disabled JavaScript also leaves the list usable.
- “View as list” is always available when spatial motion is active. “Skip to about” bypasses the long scroll.

## Files

- `index.html`: semantic portfolio content and integration.
- `css/portfolio.css`: styles scoped to the new experience, using the existing theme tokens.
- `js/portfolio.js`: scroll interpolation, pointer spring, chapter controls, fallbacks, and video playback.
- `js/main.js`: small resilience changes for optional storage/IntersectionObserver, reduced-motion intro behavior, and a breathing frame that sleeps after settling.
- `images/portfolio/`: twelve optimized WebP images plus the original JF SVG reference (about 540 KiB total).

No package install or build step is needed. No external motion library or WebGL dependency is used. Native CSS 3D works even when WebGL is disabled; unsupported advanced motion leaves ordinary HTML content.

## Selected assets and replacement

Photography: an Acadia sunset, an Aruba pelican, an Aruba sailboat, and a Martha’s Vineyard evening sailboat, selected from the existing gallery. Originals remain in the gallery folders.

Websites: actual captured pages of dawn.place, EntLab, monkeyboard, and Katherine McVety.

Video: extracted frames from Wildfires, Harry Potter Trailer, Dad Getting Milk, and Scratch Intros. Full original MP4s remain in `videos/`.

Replace `images/portfolio/photo-1.webp` through `photo-4.webp`, the `website-*.webp` files, or `video-1.webp` through `video-4.webp` to change imagery. Update alt text, labels, and links in the portfolio section of `index.html` at the same time. Keep website screenshots around 1000px wide and video thumbnails 16:9. To substitute another video, update both the card’s `href` and `data-video`. Update `data-title` and the accessible label as appropriate.

The mark dimensions in the HTML directly reproduce `images/portfolio/jf.svg`; replacing that SVG alone does not change the CSS extrusion geometry.

## Verification

Verified in headless Chrome at desktop (1440×1000), tablet (768×1024), and phone (390×844), with light/dark themes, all five chapter states, hover motion, video playback/cleanup, static list mode, reduced motion, and disabled JavaScript. All twelve assets load and the tested phone/tablet layouts have no horizontal overflow. No video requests occur before interaction. Existing design warnings (such as original gradient headlines and grain) were preserved intentionally rather than redesigned.

Safari/Firefox and physical-device GPU performance have not been directly tested. The site remains static and uses standard CSS transforms, SVG, sticky positioning, native dialog/video, and requestAnimationFrame. The animation loop runs only in response to scrolling or pointer input and stops once settled/offscreen.
