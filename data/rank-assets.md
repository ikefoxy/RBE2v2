# Player rank badges

Generated through the built-in ImageGen edit tool from the five supplied reference images. Files:

- `public/assets/ranks/gc1.png`
- `public/assets/ranks/gc2.png`
- `public/assets/ranks/gc3.png`
- `public/assets/ranks/ssl.png`
- `public/assets/ranks/grand-plat.png`

Prompt set: one background-extraction edit per supplied emblem, in the supplied order (GC1, GC2, GC3, SSL, Grand Plat). Remove the solid white or black rectangle, preserve the geometric silhouette, colors, internal details and division markers, retain the colored glow with transparent falloff, and return one centered emblem with transparent alpha, modest padding, no text and no redesign.

Alpha channels were inspected in the saved files. Existing team logos already had alpha; their source artwork is preserved. `logo-bounds.json` provides display view boxes so the UI can remove empty transparent margins without altering source pixels.

Correction: the original SSL and Grand Plat PNGs were swapped at the organizer’s request. SSL is the white/purple badge; Grand Plat is the cyan badge. Rocket League profile icon saved at public/assets/rocket-league.png, edited with built-in ImageGen: remove only the external white background while preserving the blue shield, silver border, car, and ball; use transparent alpha and no redesign. Defying Gravity artwork at public/assets/defying-gravity.png is the supplied PNG.

Header BYU logo: `public/assets/byu.png`, extracted from the supplied `/Users/isaacfox/Desktop/byu.png` with the built-in image generation tool. Prompt: “Remove ONLY the white background outside the blue oval, making it fully alpha transparent. Preserve the blue oval and the solid white Y inside it, exact original shapes and proportions, crisp clean edges. No redesign, no shadows, no added text. Tightly framed transparent PNG for a small website header logo.”

Platinum II and III: built-in image tool background extraction from `/Users/isaacfox/Desktop/plat2.jpg` and `plat3.jpg` respectively, saved as `public/assets/ranks/plat2.png` and `plat3.png`. Shared prompt: “Remove the black background and black empty cutouts, producing an actual alpha-transparent PNG. Preserve the exact cyan and white emblem shapes, highlights, proportions and all internal geometric details. Do not swap or redesign the symbol. No black rectangle, no new text, no shadow or scenery. Center the emblem with a modest transparent margin, consistent with website rank badges.” The supplied filenames determine badge identity.
