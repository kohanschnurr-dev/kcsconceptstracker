

## Make Scope of Work PDF Photos Clickable (Lightbox)

Since the PDF is rendered as HTML in a new browser tab, we can add a pure-JS lightbox overlay. When a user clicks a photo thumbnail, it shows the full-size image in a dark overlay. Clicking the overlay dismisses it.

### Changes in `src/lib/pdfExport.ts`

1. **Update photo `<img>` tags** in `renderWorkSection` — add `onclick` handler and `cursor:pointer` style:
   ```html
   <img src="..." class="wi-photo" style="cursor:pointer;" onclick="openLightbox(this.src)" />
   ```

2. **Add lightbox HTML + JS** to the generated document (append before `</body>`):
   - A hidden full-screen overlay div with a centered `<img>`
   - `openLightbox(src)` function to show the overlay with the clicked image
   - Click-to-dismiss on the overlay
   - Minimal inline CSS for the overlay (fixed position, dark background, centered image, max-width/height constraints)

Single file edit, ~20 lines added. No external dependencies needed since this runs as standalone HTML in a browser tab.

