# Pass & Certificate Studio — Developer Guide & Manual

The **Pass & Certificate Studio** is a browser-based, vector-accurate design and document generation engine built into **YUGANTAR 2026**. It allows festival administrators to design passes, ID badges, and participation/merit certificates with dynamic participant data and download pixel-perfect vector PDFs.

---

## 1. Document Coordinate Model & Scaling

### Typography Points vs. Screen Pixels
The studio designer uses standard **PostScript Points ($\text{pt}$)** as its canonical internal coordinate unit:
$$72\text{ pt} = 1\text{ inch} = 25.4\text{ mm}$$

This ensures that regardless of the user's screen resolution or device pixel ratio, the generated PDF matches physical print standards exactly:

| Preset Name | Dimensions ($\text{pt}$) | Dimensions ($\text{mm}$) | Standard Orientation |
|---|---|---|---|
| **A4 Portrait** | $595.28 \times 841.89$ | $210 \times 297$ | Portrait |
| **A4 Landscape** | $841.89 \times 595.28$ | $297 \times 210$ | Landscape |
| **A5 Portrait** | $419.53 \times 595.28$ | $148 \times 210$ | Portrait |
| **A5 Landscape** | $595.28 \times 419.53$ | $210 \times 148$ | Landscape |
| **Certificate** | $841.89 \times 595.28$ | $297 \times 210$ | Landscape |
| **ID Badge** | $242.00 \times 380.00$ | $85.4 \times 134$ | Portrait |
| **Custom** | User Defined | User Defined | Either |

### Real Fit-to-Screen Algorithm
The canvas container recalculates its zoom level whenever the window resizes or the user clicks **Fit**:
$$\text{Zoom}_{\text{fit}} = \min\left(\frac{W_{\text{viewport}} - 64}{W_{\text{template}}}, \frac{H_{\text{viewport}} - 64}{H_{\text{template}}}, 1.8\right)$$

- Left and right inspector panels can be collapsed (`isLeftCollapsed`, `isRightCollapsed`) so that the canvas can expand to $100\%$ of the screen width.
- Canvas panning is supported via middle-click drag or holding the spacebar.

---

## 2. Canvas Element Model

Every element on the canvas implements the `StudioElement` base interface:

```typescript
interface BaseElement {
  id: string;
  type: 'text' | 'field' | 'qr' | 'shape' | 'image';
  x: number;       // Position in pt from top-left
  y: number;       // Position in pt from top-left
  width: number;   // Width in pt
  height: number;  // Height in pt
  rotation?: number;
  opacity?: number;
  isLocked?: boolean;
}
```

### Supported Element Types
1. **`TextElement`:** Static typography with custom font family (`Helvetica`, `Times-Roman`, `Courier`), size, weight, letter spacing, alignment, and hex color.
2. **`FieldElement`:** Dynamic tokens that resolve to live participant or competition data at render time.
3. **`QrElement`:** 2D QR Code vector matrix embedding a cryptographically verified token URL (`https://.../verify?code=...`).
4. **`ShapeElement`:** Rectangles, divider lines, and borders with fill and stroke controls.
5. **`ImageElement`:** External images (official college logos, sponsor marks, organizer signatures) with aspect ratio locking.

---

## 3. Dynamic Tokens Matrix

The engine supports the following dynamic tokens in text and field elements:

| Token | Sample Value | Data Source |
|---|---|---|
| `{{recipient_name}}` | Om Satange | `registrations.leader_name` or team member |
| `{{competition_name}}` | Project Competition | `competitions.name` |
| `{{team_name}}` | Circuit Breakers | `registrations.team_name` |
| `{{college_name}}` | Priyadarshini College of Eng. | `registrations.leader_college` |
| `{{registration_id}}` | `REG-2026-PC-0142` | `registrations.id` |
| `{{certificate_code}}` | `YUG-2026-PC-9821` | `issued_certificates.certificate_code` |
| `{{rank_citation}}` | First Prize / Participation | `issued_certificates.rank_citation` |
| `{{event_date}}` | March 15-16, 2026 | `site_settings.festival_dates` |
| `{{qr_code}}` | [Embedded 2D Matrix] | HMAC signed verification URL |

---

## 4. Multi-Member Team Certificate Issuance

When generating certificates for team competitions, the batch issuance module in [`src/app/admin/studio/page.tsx`](file:///e:/new%20project/src/app/admin/studio/page.tsx) provides a policy toggle:

1. **Individual Member Certificates (Recommended):**
   - Parses `form_data` JSON to extract all team members.
   - Generates an individual certificate for each member with their exact personal name.
   - Prevents premature duplicate skipping: the duplicate verification query in [`src/lib/certificateService.ts`](file:///e:/new%20project/src/lib/certificateService.ts) verifies `WHERE registration_id = ? AND recipient_name = ? AND certificate_type = ?`, ensuring every team member is issued their certificate without collision.

2. **Team Leader / Solo Only:**
   - Issues a certificate solely to the primary registrant.

---

## 5. Vector PDF Rendering (`src/lib/studioPdfRenderer.ts`)

The PDF rendering pipeline uses `pdf-lib` and executes entirely in server memory:
1. **Document Setup:** Initializes a `PDFDocument` with exact `[width_pt, height_pt]`.
2. **Font Embedding:** Maps standard typographic weights to PostScript fonts (`Helvetica`, `Helvetica-Bold`, `Times-Roman`, `Times-Roman-Bold`).
3. **Unicode Normalization:** Sanitizes non-ASCII currency signs and typographic quotes (e.g., converting `₹` to `INR ` to prevent PDF-Lib font stream crashes).
4. **Layer Sorting:** Elements are sorted by `zIndex` before rendering.
5. **Word Wrapping:** Enforces boundary wrapping so participant names and titles never overflow the paper edge.
6. **Binary Stream Delivery:** Document bytes are serialized to a `Uint8Array` buffer and streamed as `application/pdf`.
