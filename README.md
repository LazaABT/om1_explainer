# Inside the OM-1

A scroll-driven 3D explainer of how the 1972 Olympus OM-1 film SLR works: lens, mirror, finder, meter, shutter, film and the developed negative.

**[Open it](index.html)** (one self-contained page; scroll, or use the arrow keys, to move through it. Click "Turn sound on" for the shutter sounds.)

## Build

The page is bundled from `src/` and `vendor/` into a single file:

```
python build.py
```

This writes `OM-1.html`; `index.html` is a copy of it for GitHub Pages. `STORYBOARD.md` has the plan, chapter list and accuracy notes.

## Credits

An independent tribute, not affiliated with Olympus or OM Digital Solutions. Drawings are simplified; the dog is fictional.

- Photos, shown in greyscale: `refs/chamber.jpg` and `refs/mirror/om1_screen_release.jpg` by JBouchez, CC BY-SA 4.0; `refs/screen1.jpg` (Focus-screen-1) by Shieldforyoureyes, CC BY-SA 3.0. All from Wikimedia Commons.
- [three.js](https://threejs.org) r160, MIT licence.
- Fonts: Instrument Serif, DM Sans and DM Mono, SIL Open Font License.
