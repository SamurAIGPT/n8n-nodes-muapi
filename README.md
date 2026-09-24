# n8n-nodes-muapi

[![Powered by MuAPI](https://img.shields.io/badge/Powered%20by-MuAPI-6366f1?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNHYtNGgtMnYtMmg0djZoLTJ6bTAtOFY2aDJ2MmgtMnoiLz48L3N2Zz4=)](https://muapi.ai?utm_source=github&utm_medium=badge&utm_campaign=n8n-nodes-muapi)


[n8n](https://n8n.io/) community nodes for [MuAPI](https://muapi.ai?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-muapi) — a generative media AI platform supporting text-to-image, image-to-video, audio generation, image enhancement, and more.

## Related Projects

- [n8n-nodes-seedance2](https://github.com/Anil-matcha/n8n-nodes-seedance2) — n8n community node specifically for Seedance 2 video generation
- [Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) — Free self-hosted UI for the same MuAPI models

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

1. Get your API key from [muapi.ai/dashboard/keys](https://muapi.ai/dashboard/keys?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-muapi)
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

## API Guides

These focused Muapi guides provide endpoint schemas and runnable examples for the media workflows available through the nodes:

- [Image Upscaler API](https://github.com/Anil-matcha/Image-Upscaler-API) · [Background Remover API](https://github.com/Anil-matcha/Background-Remover-API) · [Image Face Swap API](https://github.com/Anil-matcha/Image-Face-Swap-API)
- [Video Upscaler API](https://github.com/Anil-matcha/Video-Upscaler-API) · [Video to Audio API](https://github.com/Anil-matcha/Video-to-Audio-API) · [Video Face Swap API](https://github.com/Anil-matcha/Video-Face-Swap-API)
- [Virtual Try-On API](https://github.com/Anil-matcha/Virtual-Try-On-API) · [Product Photography API](https://github.com/Anil-matcha/Product-Photography-API) · [Watermark Remover API](https://github.com/Anil-matcha/Watermark-Remover-API)
- [AI Music API](https://github.com/Anil-matcha/AI-Music-API) · [AI Avatar Lipsync API](https://github.com/Anil-matcha/AI-Avatar-Lipsync-API)
