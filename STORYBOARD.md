# OM-1: storyboard

**Subject.** Olympus OM-1 (1972, launched as the M-1), with a 50mm f/1.8 Zuiko.
A film SLR, not a DSLR. Clockwork shutter, air-damped mirror, and one 1.35 V cell that
powers only a needle meter.

**Form.** One unbroken shot. A single 3D toon camera in a single world. Scroll position is
the playhead. Nothing cuts: every change of subject is a camera move, an explode, a section
cut, or a portal. Text sits opposite the camera and swaps sides as the camera crosses.

**Look.** Minimalist. Bone paper, black ink line art, flat two-tone cel shading, generous empty
space. One accent, vermilion, reserved for light. Large serif headlines, mono captions, no
boxes, no ornament. Copy is kept short. The page goes dark only inside the camera.

**Star of the show.** A dog called Biscuit, on a hill at golden hour. The scene exists as a
real pop-up diorama in the 3D world, in front of the lens the whole time. You only see it
when the view turns round.

**One source of truth.** Focus distance, f-number, shutter speed and focal length are shared
state. The 3D lens, the ray fans, the viewfinder blur, the split image and the needle are all
computed from the same numbers using thin-lens maths, so they cannot disagree.

| # | Chapter | What moves | Side | Teaches |
|---|---------|-----------|------|---------|
| 0 | Hero | Camera turns slowly, title | centre | Hook, sound toggle |
| 1 | The brick problem | Ghost of a big SLR shrinks onto the OM-1 | camera R, text L | Maitani's size and weight goal |
| 2 | Controls | Swing to top view, parts glow in turn | camera L, text R | Speed ring on the mount, sparse top plate, meter-only battery |
| 3 | Exploded | Camera pulls apart along the axis, then visits lens, mirror box, prism, shutter, back | alternates | "Take the camera apart into units by function" |
| 4 | The light path | Reassemble, section plane sweeps through, rays flow | camera R | Lens > mirror > screen > prism > eye. Mirror up > film |
| 5 | How a lens works | Section zooms to lens. Live ray fans | camera centre, text in turn | Bending, inversion, focusing (6 mm of travel), iris and f-stops, depth of field |
| 6 | Viewfinder | Turn round, the world appears, fly into the eyepiece | full | Blurry, then the eye adjusts (timed, capped). Finder aids labelled |
| 7 | Compose | Finder shrinks to a panel, section beside it | split | Focus and split image, zoom, CdS meter and needle, stop-down preview |
| 8 | The click | Finder fills the screen. Click. Blackout (timed, capped) | full | The finder goes dark because the mirror is up |
| 9 | 1/250 s in slow motion | Blackout opens into the inside of the camera, scrubbed clock | camera C | Order of events: stop down, mirror up, curtains, mirror down |
| 10 | The shutter | View from the back, slit changes, gears run | camera R | Slit width, clockwork delay at slow speeds |
| 11 | Flash | Flash slides on, X contact closes, pop | camera L | Why sync stops at 1/60 |
| 12 | Film | Dive into the frame, crystals, then wind on | camera R | Latent image, upside-down negative, what one stroke of the lever does |
| 13 | Ending | Print drops in next to the camera | hero | Payoff and specs |

## Timed moments (not purely scroll)

- **Eye adjusts:** progress = max(scroll through the segment, time since arrival / 1.6 s).
- **Blackout:** starts at the click, lasts 0.45 s or until scrolled past.
- Scrolling back resets both.

## Sound (synthesised, no audio files)

Shutter (mirror up, curtains, mirror return), aperture detents, film-advance ratchet tied to
scroll, flash whine and pop, escapement buzz. Browsers need a click before audio can play, so
there is a sound button on the title and in the corner.

## Accuracy notes

Checked against the instruction manual: 136 x 83 x 50 mm, 510 g, 1 to 1/1000 s plus B, X sync
to 1/60, two CdS cells beside the eyepiece, 1.35 V mercury cell, 97% / 0.92x finder, 1-13
screen, 46 mm flange, 150 degree advance, ASA 25 to 1600, 45 cm minimum focus.

Sources disagree on weight (490 vs 510 g); the page uses the manual's 510 g.

Deliberately simplified, and flagged on the page where it matters:

- Millisecond timings in the slow-motion chapter are illustrative. No published OM-1 figures found.
- The clockwork is a generic gear-and-anchor escapement, not a copy of the OM-1 layout.
- Ray diagrams use a thin lens rather than tracing through all six elements.
- The curtain travel direction and small part placements are drawn from general knowledge.
- The zoom section uses a later S Zuiko 35-70mm f/3.5-4.5.


## Revision 2: after the first review

The timing now lives in `src/story.js` as named scenes. Each scene has a travel in and a hold, and every track is keyed off those names, so scenes can be added or moved without renumbering anything.

**Scrolling.** A hold takes two or three wheel notches to push through (a small bar at the bottom shows progress). A big flick stops at the next hold. Stopping mid-move carries on to the next hold. Arrow keys and space go hold to hold. Rewind is a 2.4 s eased journey through the whole story.

**Added scenes.** Battery drop-out. Section plane arrives, then the near half lifts away. Focus on flower, house, then the split circle on the dog's ear. Thin slice of focus, bokeh forming, six-sided bokeh, deep focus. Lens swap for the zoom. Film roll, ASA dial, aperture and shutter on the meter via the cord. Hold before the shot, dog opens its mouth. Slow motion in seven held steps. Slit at 1/1000, 1/250 and 1/60. One stroke with the shell turned to glass. Latent specks, developer bath, silver growth, two roads (fixer vs slide reversal), picture spreading from a corner. Print and negative hop in on a drying line.

**Model changes from photos** (`refs/`, sources in each `SOURCES.md`). Body 33 mm deep with a projecting mount housing, lens axis off-centre, faceted hump, aperture ring at the front of the lens, knurled rings, rewind and ASA dial details, battery under the wind lever, door hinged on the take-up side, base mechanism with a large toothed gear, cam and brass plate.

**Flicker.** Found with a temporal variance map of live holds. Cause: idle camera sway crawling hairlines and label text, plus a fast brightness pulse on the rays. Holds are now truly still, rays flow slowly, labels sit on whole pixels.

**Accuracy notes.** Early OM-1s link the rings to the meter with a cord over pulleys that turns the meter in its housing (repair forum accounts; layout here is simplified, no photo found). The finder shown matches a split-image screen such as the 1-13, which is an interchangeable option; the OM-1's standard screen is the microprism type. Crystals are drawn as simple polygons. Real grains are irregular clumps.
