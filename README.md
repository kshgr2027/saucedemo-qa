# SauceDemo E2E Purchase Test (Playwright + TypeScript)

One end-to-end test covering the primary purchase journey of https://www.saucedemo.com/ as `standard_user`
(public demo credentials supplied by the assessment). Test customer data is synthetic.

## Technology
Playwright 1.63 (`@playwright/test`), TypeScript, Chromium, Node.js/npm, Page Object Model.

## Prerequisites
- Node.js and npm (developed and verified on Node 24.19.0 and npm 11.17.0)
- Internet access to https://www.saucedemo.com/

## Setup
```bash
npm install
npx playwright install chromium
```

## Run

### Normal execution (headless, full speed)
```bash
npx playwright test
```

### Headed execution (opens a maximized browser window)
```bash
npx playwright test --headed
```

### Slow motion, for human observation (PowerShell)
```powershell
$env:SLOW_MO = "500"; npx playwright test --headed; Remove-Item Env:SLOW_MO
```
(bash/macOS/Linux: `SLOW_MO=500 npx playwright test --headed`)

`SLOW_MO` is milliseconds of delay per Playwright action; unset or `0` means full speed.
Normal automated execution is intentionally fast. Slow motion is only for human observation and debugging;
it is **not** used for synchronisation. Playwright auto-waiting and web-first assertions do that.

### Report
```bash
npx playwright show-report
```
Failures keep a screenshot, video and trace in `test-results/`.

## Test flow
Login -> inventory -> add Sauce Labs Backpack -> cart -> checkout -> customer info -> overview
(item, item total, total = item total + tax, total) -> Finish -> "Thank you for your order!" ->
**Generate PDF order** -> verify a PDF download.

The PDF step uses Playwright's `download` event: it checks that a download is received without failure, that the
suggested filename ends in `.pdf`, and that the saved file starts with the `%PDF` signature. The copy is saved
as `order-receipt.pdf` in the test's folder under `test-results/` and attached to the HTML report (the app's own
filename is not assumed). This shows the app generated and delivered a downloadable order document. It does not
prove any real payment or fulfilment, since SauceDemo is a demo.

## What the test validates
- Login succeeds and the inventory page loads; the Backpack is listed at $29.99
- The item is added (button flips to "Remove", cart badge shows 1) and appears alone in the cart
- Checkout overview shows the correct item and price, "Item total: $29.99", total = item total + tax, and
  "Total: $32.39" (an observed baseline)
- Finish shows "Thank you for your order!"
- "Generate PDF order" produces a PDF download (see above)

## Structure
```
tests/checkout.spec.ts     business flow, test data, assertions via page objects
pages/LoginPage.ts         login form
pages/InventoryPage.ts     product list, add to cart, cart badge
pages/CartPage.ts          cart contents, start checkout
pages/CheckoutPage.ts      customer info, overview, totals, completion, PDF order download
playwright.config.ts       baseURL, data-test as test-id attribute, reporters, artifacts, headed/slow-mo options
```

## Design notes
- Locators use SauceDemo's `data-test` attributes via `getByTestId` (configured in `playwright.config.ts`) and
  `getByRole` for buttons. The product is found by name, not by position.
- Web-first assertions only; no fixed sleeps.
- Isolation: Playwright gives each test a fresh browser context, and the test logs in itself, so it depends on
  no other test or stored state.
- Headed runs use `viewport: null` plus `--start-maximized`; headless keeps the Desktop Chrome viewport so the
  test does not depend on screen size.

## Known limitations
- Single browser (Chromium) and a single happy-path test; defects found in exploratory testing are not automated.
- Depends on the live public site: price, tax or markup changes would break it.
- The exact total (`$32.39`) is a baseline observed for this product, not a documented requirement; the tax rule
  is undocumented. The subtotal + tax = total check does not depend on the tax rule.
- The PDF check validates the download and file signature, not the PDF's contents.
- Requires network access; no mocking.
