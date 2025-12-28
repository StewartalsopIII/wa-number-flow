# wa-number-flow-llm

WhatsApp Number Flow is a Next.js 14 (App Router) web app that extracts every WhatsApp phone number from uploaded screenshots using the OpenRouter API (Gemini 2.5 Flash). Numbers are logged locally so you can open chats only once, and Argentina-specific validation highlights formats that might fail on WhatsApp.

## Prerequisites
- Node.js 18 or newer
- npm 9+
- OpenRouter account and API key with credits

## Installation
1. Clone or copy this repository and open the project directory:
   ```bash
   cd wa-number-flow-llm
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables
Create a `.env.local` file in the project root and add your OpenRouter key:
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```
Restart the dev server any time you change environment variables.

## Getting Your OpenRouter API Key
1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to the **Keys** section
4. Create a new API key
5. Add credits to your account (Gemini 2.5 Flash is very affordable)
6. Copy the key into `.env.local`

## Running the App
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Using the App
1. Drag-and-drop or click to upload a PNG/JPEG WhatsApp screenshot (max 10MB).
2. The app sends the image to Gemini 2.5 Flash via OpenRouter for OCR.
3. All detected digit-only numbers appear with badges for new vs. already processed entries.
4. New numbers are logged locally (`public/processed_numbers.json`) and exposed as `wa.me` links.
5. Use **Open All New Chats** to launch WhatsApp tabs with a 500 ms stagger, or **Copy List to Clipboard** for quick sharing.
6. Suspicious Argentine numbers are shown separately with reasons (missing 54 or missing mobile 9).
7. Use **Reset Log** to clear the processed number history at any time.

## Browser Configuration (Pop-up Blocking)
### Chrome / Edge
1. Upload once and click **Open All New Chats**.
2. If a popup banner appears, click the icon in the address bar.
3. Choose **Always allow pop-ups from localhost** and reload.

### Firefox
1. Open **Settings → Privacy & Security**.
2. In **Permissions → Block pop-up windows**, click **Exceptions…**.
3. Add `http://localhost:3000` and allow.

### Safari
1. Go to **Safari → Settings → Websites → Pop-up Windows**.
2. Locate `localhost:3000` and set to **Allow**.

Alternative: hold `Cmd` (Mac) or `Ctrl` (Windows) while clicking **Open All** to reduce popup blocking.

## API Endpoints
- `POST /api/process-image`
  - Body: `{ "image": "<base64 string>", "mimeType": "image/png|image/jpeg" }`
  - Response: `{ numbers, newNumbers, skipped, suspiciousNumbers, totalProcessed, lastUpdated, logPath }`
- `GET /api/log`
  - Response: `{ processedNumbers, totalProcessed, lastUpdated, logPath }`
- `DELETE /api/log`
  - Response: `{ success: true, processedNumbers: [], totalProcessed: 0, lastUpdated, logPath }`

## Testing
Run the Jest suite for utilities and log handling:
```bash
npm test
```

## Troubleshooting
- **Popup blocked**: follow the browser configuration steps above.
- **API key invalid**: confirm `OPENROUTER_API_KEY` is set in `.env.local` and you have credits.
- **No numbers found**: ensure the screenshot is sharp and numbers are visible; try zooming in the chat before capturing.
- **Suspicious number warnings**: review the suggested fix (missing country code or mobile 9) before contacting.
- **OpenRouter errors**: rate limits or network interruptions trigger retry with exponential backoff; retry after a short wait if failures persist.

## Project Highlights
- Next.js 14 App Router + Tailwind CSS UI
- Gemini 2.5 Flash via OpenRouter for OCR (no local OCR required)
- Local JSON log to prevent reopening chats
- React Dropzone upload workflow with previews and validation
- Jest test coverage for phone utilities and log management
