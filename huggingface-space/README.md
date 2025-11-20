# Hugging Face Space Server Files

This directory contains the server files needed to deploy the Zombobs multiplayer server to Hugging Face Spaces.

## Files

- **`Dockerfile`** - Docker configuration for Hugging Face Spaces
- **`server.js`** - Socket.io server configured for port 7860 (HF Spaces default)
- **`package.json`** - Node.js dependencies

## Deployment

1. Upload these files to the **root** of your Hugging Face Space repository
2. The Space will automatically build and deploy using the Dockerfile
3. **Web URL** (for viewing/sharing): `https://huggingface.co/spaces/OttertonDays/zombs`
4. **Direct URL** (for game client/Socket.io): `https://ottertondays-zombs.hf.space`

## Important Notes

- The game client MUST use the **Direct URL** (`.hf.space`) to avoid connection errors (302 Redirects/CORS) caused by the Hugging Face iframe wrapper.
- These files are **separate** from the local development server in `../server/`
- The local server runs on port 3000
- The Hugging Face server runs on port 7860
- Both servers have the same functionality, just different ports

