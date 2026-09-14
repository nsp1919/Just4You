# Just4You Static Ad Previews

Local production only, 2026-09-13. Two concepts, each explicitly recomposed for feed and Story/Reels. No finished poster was cropped to make another size.

## Deliverables

| File | Size | Concept |
| --- | --- | --- |
| [just4you-personal-4x5.png](just4you-personal-4x5.png) | 1080 x 1350 | More than a birthday message. |
| [just4you-personal-9x16.png](just4you-personal-9x16.png) | 1080 x 1920 | More than a birthday message. |
| [just4you-link-4x5.png](just4you-link-4x5.png) | 1080 x 1350 | One link. A little more love. |
| [just4you-link-9x16.png](just4you-link-9x16.png) | 1080 x 1920 | One link. A little more love. |

[Contact sheet](contact-sheet.png), left to right: personal feed, personal Story, link feed, link Story.

## Editable Source And Reproduction

Single HTML source: [ads.html](ads.html). Styles are inline. Query parameters select `concept=personal|link` and `format=4x5|9x16`. The default is personal feed. Open locally after rendering; no persistent server is required to view the HTML.

Run from the Birthday workspace root:

```powershell
node marketing/meta-ads/2026-09-13/images/render.mjs
```

Use `--first` for the initial personal-feed check only. A full run regenerates all PNGs, the contact sheet and [qa.json](qa.json). The renderer uses existing Playwright, Sharp and installed Microsoft Edge. No packages were installed. It starts a temporary loopback-only server, blocks external browser requests and closes the server and browser afterward. All generated files and local font copies remain in this images directory.

## Sources And Rights

- Claim reference: [existing Reel 01 brief](../../../instagram/reel-01-five-photos.md). It describes personalised celebration websites, photos, messages and sharing by link. Its pricing, hosting term and privacy wording were explicitly excluded. No live product/account verification was performed.
- Hero: [staged demo capture](../../../instagram/reel-01-assets/clean-01-hero.png), 450 x 800 original. Extract rectangle: x=0, y=0, width=355, height=632. This removes black capture padding; the actual product pixels are preserved.
- Letter: [staged demo capture](../../../instagram/reel-01-assets/clean-02-letter.png), 450 x 800 original. Extract rectangle: x=0, y=203, width=355, height=429. This removes upper whitespace and black capture padding, showing the existing letter opening without inventing message content.
- Gallery screenshot was inspected but not used. No personal photo assets, generated video assets, customer data or authenticated sources were used.
- Both concepts visibly say **Sample celebration**. The staged screen contains the demo names Priya and Rahul and an existing ring motif; it is a general celebration example, not a newly generated birthday-specific screen or customer testimonial.
- **Permissions unknown for paid use. These are local demo previews, not cleared paid-ad assets.** Confirm rights to the staged screenshot content and demo names before publication. Face-free crops reduce exposure but do not establish a license.
- Fonts: locally installed Georgia Bold and Trebuchet MS Regular/Bold from Windows Fonts, copied into the local assets directory for deterministic rendering. Font-file redistribution rights are not established; do not distribute the font copies without checking their license.

## QA

- All four PNGs individually inspected with the image viewer, plus the contact sheet.
- Automated output checks: exact dimensions; nonblank pixel variation; image loading and natural dimensions; local font loading; browser errors; text line bounds; text-to-text and text-to-product overlap; required safe areas. Per-export results and element coordinates are in [qa.json](qa.json).
- Feed text/product bounds: at least 64px from each edge. Story text/product bounds: x=64..950, y=250..1500, reserving the requested 130px right and 420px bottom areas. Large empty top/bottom zones are intentional platform-overlay clearance.
- Source images render at approximately 1.03x to 1.16x natural width. Their original capture softness/confetti is retained; no upscaling AI, image reconstruction or feature fabrication was used.
- Source diagnostics found no HTML/JavaScript errors. First render identified a CTA margin violation, corrected and rerendered successfully. Visual review identified a Story frame/footer intersection, corrected before final export.
- No old prices, URLs, one-year hosting claims, privacy guarantees, fake testimonials, platform chat UI, fake ad buttons or audio are included.

## Meta Handoff

Creative CTA is exactly **Message SURPRISE** with **for the demo**. Choose Meta's official **Send message** button externally when configuring the ad; it is intentionally not drawn into the image. Check actual placement previews and rights clearance before publishing. No upload, account access, publication, ad configuration or spend was performed here. Video production is outside this static-image assignment.