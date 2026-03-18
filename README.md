# n8n-nodes-muapi

[n8n](https://n8n.io/) community nodes for [MuAPI](https://muapi.ai) — a generative media AI platform supporting text-to-image, image-to-video, audio generation, image enhancement, and more.

## Nodes

### MuAPI (Predictor)

Generate images, videos, and audio using 60+ AI models across 7 categories:

| Category | Models |
|----------|--------|
| **Text to Image** | FLUX Dev/Schnell, FLUX Kontext Dev/Pro/Max, HiDream Fast/Dev/Full, Reve, GPT-4o, Midjourney V7, Wan 2.1, Seedream 3/4, Qwen |
| **Image to Image** | FLUX Kontext Dev/Pro/Max (I2I), FLUX Kontext Effects, GPT-4o Edit, Reve Edit, Midjourney V7 (I2I/Style/Omni), SeedEdit, Qwen Edit |
| **Text to Video** | Veo 3, Veo 3 Fast, Wan 2.1/2.2, Runway, Kling V3, Seedance Pro/V1.5, MiniMax Hailuo, HunyuanVideo, PixVerse, Sora 2 |
| **Image to Video** | Veo 3, Veo 3 Fast, Wan 2.1/2.2, Runway, Kling V3, Seedance, Midjourney V7, HunyuanVideo, PixVerse, Sora 2 |
| **Image Enhance** | AI Upscale, Background Remover, Face Swap, Skin Enhancer, Photo Colorizer, Ghibli Style, Anime Generator, Image Extender, Object Eraser, Product Shot |
| **Video Edit** | Wan AI Effects, Face Swap (Video), Dress Change, AI Clipping, Lipsync |
| **Audio** | Suno Create/Remix/Extend, MMAudio Text-to-Audio, MMAudio Video-to-Audio |

### MuAPI Upload

Upload media files (images, videos, audio) to MuAPI and get a hosted URL to use in generation tasks.

- Accepts binary data from previous n8n nodes
- Accepts a URL (downloads then re-uploads)
- Auto-detects MIME type from filename or content-type header

## Installation

### Via n8n Community Nodes (recommended)

1. Go to **Settings → Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-muapi`
4. Restart n8n

### Via npm (self-hosted)

```bash
cd ~/.n8n
npm install n8n-nodes-muapi
sudo systemctl restart n8n
```

### Docker

Add to your environment:

```
N8N_COMMUNITY_PACKAGES=n8n-nodes-muapi
```

## Credentials

1. Get your API key from [muapi.ai/dashboard/keys](https://muapi.ai/dashboard/keys)
2. In n8n go to **Credentials → New Credential → MuAPI API**
3. Enter your API key

## Example Workflow

```
[Manual Trigger] → [MuAPI: Text to Image (FLUX Dev)] → [MuAPI Upload] → [HTTP Request: download result]
```

## API Pattern

MuAPI uses an async submit → poll pattern:

1. `POST /api/v1/{endpoint}` → returns `{ "request_id": "abc123" }`
2. `GET /api/v1/predictions/{id}/result` → poll until `{ "status": "completed", "outputs": [...] }`

The **MuAPI** node handles this automatically. Set **"Return Request ID Only"** in options to get the ID immediately and poll manually with the **Predict Result** endpoint.

## License

MIT
