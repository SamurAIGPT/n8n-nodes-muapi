# FLUX 3 Video API: Python Wrapper for Black Forest Labs' Text-to-Video & Image-to-Video

[![Powered by MuAPI](https://img.shields.io/badge/Powered%20by-MuAPI-6366f1?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNHYtNGgtMnYtMmg0djZoLTJ6bTAtOFY2aDJ2MmgtMnoiLz48L3N2Zz4=)](https://muapi.ai?utm_source=github&utm_medium=badge&utm_campaign=flux-3-video-api)

[![PyPI version](https://img.shields.io/pypi/v/flux-3-video-api.svg)](https://pypi.org/project/flux-3-video-api/)
[![GitHub stars](https://img.shields.io/github/stars/SamurAIGPT/flux-3-video-api.svg)](https://github.com/SamurAIGPT/flux-3-video-api/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.7+](https://img.shields.io/badge/python-3.7+-blue.svg)](https://www.python.org/downloads/)

A focused Python wrapper for the **FLUX 3 video API** — Black Forest Labs' unified multimodal frontier model, delivered via [muapi.ai](https://muapi.ai?utm_source=github&utm_medium=readme&utm_campaign=flux-3-video-api). Generate cinematic video clips with native synchronized audio from a text prompt (Text-to-Video) or from a static image (Image-to-Video), using the same architecture that jointly produces image, video, and audio.

> 🌌 **FLUX 3** was announced by Black Forest Labs on July 23, 2026 as a unified multimodal frontier model — one architecture generates image, video, and native synchronized audio, and extends to action-prediction for robotics. [MuAPI](https://muapi.ai/flux-3?utm_source=github&utm_medium=readme&utm_campaign=flux-3-video-api) activates each FLUX 3 endpoint automatically for existing API keys as Black Forest Labs opens general availability — no separate waitlist required.

## Related Projects

- [Flux-3-Dev-API](https://github.com/Anil-matcha/Flux-3-Dev-API) — Python SDK covering the full FLUX 3 family, including image endpoints
- [awesome-flux-3-api-prompts](https://github.com/Anil-matcha/awesome-flux-3-api-prompts) — Curated FLUX 3 API guide, prompts, parameters, and examples
- [Seedance-2.5-API](https://github.com/SamurAIGPT/Seedance-2.5-API) — Python wrapper for ByteDance's Seedance 2.5 video model
- [veo4-video-generator](https://github.com/SamurAIGPT/veo4-video-generator) — Ready-made video generator built on Google's Veo 4
- [Generative-Media-Skills](https://github.com/SamurAIGPT/Generative-Media-Skills) — Skills runtime for generative media API prompts
- [muapi-cli](https://github.com/SamurAIGPT/muapi-cli) — CLI for running MuAPI generation tasks, including FLUX 3

## 🚀 Why Use the FLUX 3 Video API?

FLUX 3 is Black Forest Labs' unified multimodal frontier model — the same weights that generate images also generate video and native synchronized audio in a single request.

- **Native Synchronized Audio**: `generate_audio` produces dialogue, sound effects, and music matched to the visuals — no separate audio pipeline required.
- **Text-to-Video & Image-to-Video**: Generate a clip from a prompt alone, or animate an existing still image with physically consistent motion.
- **Unified Model Architecture**: Same frontier model family as FLUX 3's image endpoints — consistent visual style across image and video outputs.
- **Developer-First**: Simple Python SDK backed by MuAPI's infrastructure — one API key, five FLUX 3 endpoints (image and video).

## 🌟 Key Features

- ✅ **FLUX 3 Text-to-Video**: Transform a text prompt into a cinematic video clip, 4–10 seconds long.
- ✅ **FLUX 3 Image-to-Video**: Animate a static image into a video clip using `images_list`, with motion physically consistent with the source frame.
- ✅ **Native Audio Generation**: `generate_audio=True` produces synchronized voice, sfx, and music from the same generation call.
- ✅ **Flexible Resolutions**: `480p`, `720p`, or `1080p` output.
- ✅ **Flexible Aspect Ratios**: `16:9`, `9:16` (TikTok/Reels/Shorts), `1:1`, `4:3`, `3:4`.
- ✅ **File Upload**: Upload local images directly via `upload_file` for use as Image-to-Video start frames.

---

## 🛠 Installation

### Via Pip (Recommended)
```bash
pip install flux-3-video-api
```

### From Source
```bash
# Clone the FLUX 3 Video API repository
git clone https://github.com/SamurAIGPT/flux-3-video-api.git
cd flux-3-video-api

# Install required dependencies
pip install -r requirements.txt
```

### Configuration
Create a `.env` file in the root directory and add your [MuAPI](https://muapi.ai?utm_source=github&utm_medium=readme&utm_campaign=flux-3-video-api) API key:
```env
MUAPI_API_KEY=your_muapi_api_key_here
```

---

## 🤖 FLUX 3 Video MCP Server

You can use FLUX 3 video generation as an **MCP (Model Context Protocol)** server, so AI models (like Claude Desktop or Cursor) can directly invoke the tools.

### Running the MCP Server
1. Ensure `MUAPI_API_KEY` is set in your environment.
2. Run the server:
   ```bash
   python3 mcp_server.py
   ```
3. To test with the MCP Inspector:
   ```bash
   npx -y @modelcontextprotocol/inspector python3 mcp_server.py
   ```

---

## 💻 Quick Start (Python)

```python
from flux3_video_api import Flux3VideoAPI

# Initialize the FLUX 3 Video client
api = Flux3VideoAPI()

# 1. Generate Video from Text (Text-to-Video)
print("Generating AI video using FLUX 3...")
submission = api.text_to_video(
    prompt="A cinematic slow-motion shot of a cyberpunk city in the rain, neon lights reflecting on puddles",
    aspect_ratio="16:9",
    resolution="720p",
    duration=5,
    generate_audio=True,
)

# 2. Wait for completion
result = api.wait_for_completion(submission["request_id"])
print(f"Success! View your FLUX 3 video here: {result.get('outputs', [result.get('url')])}")
```

```python
# 3. Animate a static image (Image-to-Video)
submission = api.image_to_video(
    prompt="The clouds drift slowly and the water ripples",
    images_list=["https://example.com/landscape.jpg"],
    aspect_ratio="16:9",
    resolution="720p",
    duration=5,
)
result = api.wait_for_completion(submission["request_id"])
print(result.get("outputs", [result.get("url")]))
```

---

## 📡 API Endpoints & Reference

### 1. FLUX 3 Text-to-Video
**Endpoint**: `POST https://api.muapi.ai/api/v1/flux-3-text-to-video`

```bash
curl --location --request POST "https://api.muapi.ai/api/v1/flux-3-text-to-video" \
  --header "Content-Type: application/json" \
  --header "x-api-key: YOUR_API_KEY" \
  --data-raw '{
      "prompt": "A majestic eagle soaring over the snow-capped Himalayas",
      "aspect_ratio": "16:9",
      "resolution": "720p",
      "duration": 5,
      "generate_audio": true
  }'
```

### 2. FLUX 3 Image-to-Video
**Endpoint**: `POST https://api.muapi.ai/api/v1/flux-3-image-to-video`

```bash
curl --location --request POST "https://api.muapi.ai/api/v1/flux-3-image-to-video" \
  --header "Content-Type: application/json" \
  --header "x-api-key: YOUR_API_KEY" \
  --data-raw '{
      "prompt": "The clouds move slowly across the sky",
      "images_list": ["https://example.com/mountain.jpg"],
      "aspect_ratio": "16:9",
      "resolution": "720p",
      "duration": 5,
      "generate_audio": true
  }'
```

---

## 📖 Documentation & Guides

For prompt engineering and advanced use cases across the full FLUX 3 model family (image and video), see [awesome-flux-3-api-prompts](https://github.com/Anil-matcha/awesome-flux-3-api-prompts).

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `text_to_video` | `prompt`, `aspect_ratio`, `resolution`, `duration`, `generate_audio` | Generate a video clip from a text prompt (4-10s), with optional native synchronized audio. |
| `image_to_video` | `prompt`, `images_list`, `aspect_ratio`, `resolution`, `duration`, `generate_audio` | Animate a static image into a video clip. |
| `upload_file` | `file_path` | Upload a local file (image or video) to MuAPI for use in generation tasks. |
| `get_result` | `request_id` | Check task status for a FLUX 3 video generation task. |
| `wait_for_completion` | `request_id`, `poll_interval`, `timeout` | Blocking helper for FLUX 3 video generation tasks. |

---

## 🔗 Official Resources
- **API Provider**: [MuAPI.ai](https://muapi.ai?utm_source=github&utm_medium=readme&utm_campaign=flux-3-video-api)
- **Early Access**: [Get a FLUX 3 API key](https://muapi.ai/flux-3?utm_source=github&utm_medium=readme&utm_campaign=flux-3-video-api)

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Keywords**: FLUX 3 Video API, FLUX 3 Text-to-Video, FLUX 3 Image-to-Video, Black Forest Labs Video AI, FLUX 3 Python SDK, MuAPI, AI Video Generation API, Text-to-Video API, Image-to-Video API, FLUX Video Generator, Native Audio Video Generation, Cinematic AI Video, FLUX 3 API Documentation.
