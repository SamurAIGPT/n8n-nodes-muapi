import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';

const BASE_URL = 'https://api.muapi.ai/api/v1';

export interface PollOptions {
  maxWaitMs?: number;
  pollIntervalMs?: number;
}

export interface TaskResult {
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputs?: unknown[];
  error?: string;
  [key: string]: unknown;
}

export interface SubmitResponse {
  request_id: string;
  [key: string]: unknown;
}

export interface UploadResponse {
  url: string;
  [key: string]: unknown;
}

function createClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    timeout: 60_000,
  });
}

export async function submitTask(
  endpoint: string,
  params: Record<string, unknown>,
  apiKey: string,
): Promise<SubmitResponse> {
  const client = createClient(apiKey);
  const response: AxiosResponse<SubmitResponse> = await client.post(`/${endpoint}`, params);
  return response.data;
}

export async function getTaskResult(
  requestId: string,
  apiKey: string,
): Promise<TaskResult> {
  const client = createClient(apiKey);
  const response: AxiosResponse<TaskResult> = await client.get(
    `/predictions/${requestId}/result`,
  );
  return response.data;
}

export async function pollForResult(
  requestId: string,
  apiKey: string,
  options: PollOptions = {},
): Promise<TaskResult> {
  const maxWaitMs = options.maxWaitMs ?? 600_000; // 10 minutes
  const pollIntervalMs = options.pollIntervalMs ?? 3_000; // 3 seconds

  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const result = await getTaskResult(requestId, apiKey);

    if (result.status === 'completed') {
      return result;
    }

    if (result.status === 'failed') {
      throw new Error(`Task ${requestId} failed: ${result.error ?? 'Unknown error'}`);
    }

    // Still pending/processing — wait before next poll
    await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `Task ${requestId} did not complete within ${maxWaitMs / 1000}s timeout`,
  );
}

export async function uploadFile(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string,
  apiKey: string,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', fileBuffer, { filename, contentType: mimeType });

  const response: AxiosResponse<UploadResponse> = await axios.post(
    `${BASE_URL}/upload_file`,
    form,
    {
      headers: {
        'x-api-key': apiKey,
        ...form.getHeaders(),
      },
      timeout: 120_000,
    },
  );
  return response.data;
}

export async function getAccountBalance(
  apiKey: string,
): Promise<{ balance: number; currency: string; email: string }> {
  const client = createClient(apiKey);
  const response = await client.get('/account/balance');
  return response.data as { balance: number; currency: string; email: string };
}

// ─── Model registry ──────────────────────────────────────────────────────────

export interface ModelDefinition {
  value: string;
  name: string;
  endpoint: string;
  description: string;
}

export const MODEL_REGISTRY: Record<string, ModelDefinition[]> = {
  textToImage: [
    { value: 'flux-dev', name: 'FLUX Dev', endpoint: 'flux-dev-image', description: 'High quality image generation with FLUX Dev' },
    { value: 'flux-schnell', name: 'FLUX Schnell', endpoint: 'flux-schnell-image', description: 'Fast image generation with FLUX Schnell' },
    { value: 'flux-kontext-dev', name: 'FLUX Kontext Dev (T2I)', endpoint: 'flux-kontext-dev-t2i', description: 'FLUX Kontext Dev text-to-image' },
    { value: 'flux-kontext-pro', name: 'FLUX Kontext Pro (T2I)', endpoint: 'flux-kontext-pro-t2i', description: 'FLUX Kontext Pro text-to-image' },
    { value: 'flux-kontext-max', name: 'FLUX Kontext Max (T2I)', endpoint: 'flux-kontext-max-t2i', description: 'FLUX Kontext Max text-to-image' },
    { value: 'hidream-fast', name: 'HiDream Fast', endpoint: 'hidream_i1_fast_image', description: 'HiDream I1 Fast image generation' },
    { value: 'hidream-dev', name: 'HiDream Dev', endpoint: 'hidream_i1_dev_image', description: 'HiDream I1 Dev image generation' },
    { value: 'hidream-full', name: 'HiDream Full', endpoint: 'hidream_i1_full_image', description: 'HiDream I1 Full image generation' },
    { value: 'reve', name: 'Reve', endpoint: 'reve-text-to-image', description: 'Reve text-to-image generation' },
    { value: 'gpt4o-t2i', name: 'GPT-4o', endpoint: 'gpt4o-text-to-image', description: 'GPT-4o image generation' },
    { value: 'midjourney-v7', name: 'Midjourney V7', endpoint: 'midjourney-v7-text-to-image', description: 'Midjourney V7 text-to-image' },
    { value: 'wan2.1-t2i', name: 'Wan 2.1 (T2I)', endpoint: 'wan2.1-text-to-image', description: 'Wan 2.1 text-to-image' },
    { value: 'seedream-3', name: 'Seedream 3', endpoint: 'seedream-3-text-to-image', description: 'Seedream 3 text-to-image' },
    { value: 'seedream-4', name: 'Seedream 4', endpoint: 'seedream-4-text-to-image', description: 'Seedream 4 text-to-image' },
    { value: 'qwen-t2i', name: 'Qwen T2I', endpoint: 'qwen-text-to-image', description: 'Qwen text-to-image generation' },
  ],
  imageToImage: [
    { value: 'flux-kontext-dev-i2i', name: 'FLUX Kontext Dev (I2I)', endpoint: 'flux-kontext-dev-i2i', description: 'FLUX Kontext Dev image-to-image editing' },
    { value: 'flux-kontext-pro-i2i', name: 'FLUX Kontext Pro (I2I)', endpoint: 'flux-kontext-pro-i2i', description: 'FLUX Kontext Pro image-to-image editing' },
    { value: 'flux-kontext-max-i2i', name: 'FLUX Kontext Max (I2I)', endpoint: 'flux-kontext-max-i2i', description: 'FLUX Kontext Max image-to-image editing' },
    { value: 'flux-kontext-effects', name: 'FLUX Kontext Effects', endpoint: 'flux-kontext-effects', description: 'Apply creative effects to images' },
    { value: 'gpt4o-i2i', name: 'GPT-4o (I2I)', endpoint: 'gpt4o-image-to-image', description: 'GPT-4o image-to-image editing' },
    { value: 'gpt4o-edit', name: 'GPT-4o Edit', endpoint: 'gpt4o-edit', description: 'GPT-4o image editing with instructions' },
    { value: 'reve-edit', name: 'Reve Edit', endpoint: 'reve-image-edit', description: 'Reve image editing' },
    { value: 'midjourney-v7-i2i', name: 'Midjourney V7 (I2I)', endpoint: 'midjourney-v7-image-to-image', description: 'Midjourney V7 image-to-image' },
    { value: 'midjourney-v7-style', name: 'Midjourney V7 Style Reference', endpoint: 'midjourney-v7-style-reference', description: 'Midjourney V7 style reference' },
    { value: 'midjourney-v7-omni', name: 'Midjourney V7 Omni Reference', endpoint: 'midjourney-v7-omni-reference', description: 'Midjourney V7 omni reference' },
    { value: 'seededit', name: 'SeedEdit', endpoint: 'seededit-image-edit', description: 'SeedEdit image editing' },
    { value: 'qwen-edit', name: 'Qwen Edit', endpoint: 'qwen-image-edit', description: 'Qwen image editing' },
  ],
  textToVideo: [
    { value: 'veo3', name: 'Veo 3', endpoint: 'veo3-text-to-video', description: 'Google Veo 3 text-to-video' },
    { value: 'veo3-fast', name: 'Veo 3 Fast', endpoint: 'veo3-fast-text-to-video', description: 'Google Veo 3 Fast text-to-video' },
    { value: 'wan2.1-t2v', name: 'Wan 2.1 (T2V)', endpoint: 'wan2.1-text-to-video', description: 'Wan 2.1 text-to-video' },
    { value: 'wan2.2-t2v', name: 'Wan 2.2 (T2V)', endpoint: 'wan2.2-text-to-video', description: 'Wan 2.2 text-to-video' },
    { value: 'runway-t2v', name: 'Runway', endpoint: 'runway-text-to-video', description: 'Runway text-to-video' },
    { value: 'kling-v3-pro-t2v', name: 'Kling V3 Pro', endpoint: 'kling-v3-pro-text-to-video', description: 'Kling V3 Pro text-to-video' },
    { value: 'kling-v3-std-t2v', name: 'Kling V3 Standard', endpoint: 'kling-v3-standard-text-to-video', description: 'Kling V3 Standard text-to-video' },
    { value: 'seedance-pro-fast-t2v', name: 'Seedance Pro Fast', endpoint: 'seedance-pro-fast-text-to-video', description: 'Seedance Pro Fast text-to-video' },
    { value: 'seedance-v15-pro-t2v', name: 'Seedance V1.5 Pro', endpoint: 'seedance-v15-pro-text-to-video', description: 'Seedance V1.5 Pro text-to-video' },
    { value: 'seedance-v2.0-t2v', name: 'Seedance 2.0 (T2V)', endpoint: 'seedance-v2.0-t2v', description: 'Seedance 2.0 text-to-video' },
    { value: 'seedance-2.0-new-t2v', name: 'Seedance 2.0 New (T2V)', endpoint: 'seedance-2.0-new-t2v', description: 'Seedance 2.0 New text-to-video' },
    { value: 'minimax-hailuo-std-t2v', name: 'MiniMax Hailuo Standard', endpoint: 'minimax-hailuo-02-std-text-to-video', description: 'MiniMax Hailuo 02 Standard text-to-video' },
    { value: 'minimax-hailuo-pro-t2v', name: 'MiniMax Hailuo Pro', endpoint: 'minimax-hailuo-02-pro-text-to-video', description: 'MiniMax Hailuo 02 Pro text-to-video' },
    { value: 'hunyuan-t2v', name: 'HunyuanVideo', endpoint: 'hunyuan-text-to-video', description: 'HunyuanVideo text-to-video' },
    { value: 'pixverse-t2v', name: 'PixVerse', endpoint: 'pixverse-text-to-video', description: 'PixVerse text-to-video' },
    { value: 'sora2-t2v', name: 'Sora 2', endpoint: 'sora2-standard-text-to-video', description: 'OpenAI Sora 2 text-to-video' },
  ],
  imageToVideo: [
    { value: 'veo3-i2v', name: 'Veo 3 (I2V)', endpoint: 'veo3-image-to-video', description: 'Google Veo 3 image-to-video' },
    { value: 'veo3-fast-i2v', name: 'Veo 3 Fast (I2V)', endpoint: 'veo3-fast-image-to-video', description: 'Google Veo 3 Fast image-to-video' },
    { value: 'wan2.1-i2v', name: 'Wan 2.1 (I2V)', endpoint: 'wan2.1-image-to-video', description: 'Wan 2.1 image-to-video' },
    { value: 'wan2.2-i2v', name: 'Wan 2.2 (I2V)', endpoint: 'wan2.2-image-to-video', description: 'Wan 2.2 image-to-video' },
    { value: 'runway-i2v', name: 'Runway (I2V)', endpoint: 'runway-image-to-video', description: 'Runway image-to-video' },
    { value: 'kling-v3-pro-i2v', name: 'Kling V3 Pro (I2V)', endpoint: 'kling-v3-pro-image-to-video', description: 'Kling V3 Pro image-to-video' },
    { value: 'kling-v3-std-i2v', name: 'Kling V3 Standard (I2V)', endpoint: 'kling-v3-standard-image-to-video', description: 'Kling V3 Standard image-to-video' },
    { value: 'seedance-pro-fast-i2v', name: 'Seedance Pro Fast (I2V)', endpoint: 'seedance-pro-fast-image-to-video', description: 'Seedance Pro Fast image-to-video' },
    { value: 'seedance-v15-pro-i2v', name: 'Seedance V1.5 Pro (I2V)', endpoint: 'seedance-v15-pro-image-to-video', description: 'Seedance V1.5 Pro image-to-video' },
    { value: 'seedance-v2.0-i2v', name: 'Seedance 2.0 (I2V)', endpoint: 'seedance-v2.0-i2v', description: 'Seedance 2.0 image-to-video' },
    { value: 'seedance-2.0-new-omni', name: 'Seedance 2.0 New Omni', endpoint: 'seedance-2.0-new-omni', description: 'Seedance 2.0 New Omni image-to-video' },
    { value: 'seedance-2.0-new-first-last', name: 'Seedance 2.0 New First & Last', endpoint: 'seedance-2.0-new-first-last', description: 'Seedance 2.0 New First & Last image-to-video' },
    { value: 'midjourney-v7-i2v', name: 'Midjourney V7 (I2V)', endpoint: 'midjourney-v7-image-to-video', description: 'Midjourney V7 image-to-video' },
    { value: 'hunyuan-i2v', name: 'HunyuanVideo (I2V)', endpoint: 'hunyuan-image-to-video', description: 'HunyuanVideo image-to-video' },
    { value: 'pixverse-i2v', name: 'PixVerse (I2V)', endpoint: 'pixverse-image-to-video', description: 'PixVerse image-to-video' },
    { value: 'sora2-i2v', name: 'Sora 2 (I2V)', endpoint: 'sora2-standard-image-to-video', description: 'OpenAI Sora 2 image-to-video' },
  ],
  imageEnhance: [
    { value: 'upscale', name: 'AI Image Upscale', endpoint: 'ai-image-upscale', description: 'Upscale image resolution with AI' },
    { value: 'bg-remove', name: 'Background Remover', endpoint: 'ai-background-remover', description: 'Remove image background' },
    { value: 'face-swap-image', name: 'Face Swap (Image)', endpoint: 'ai-image-face-swap', description: 'Swap faces in an image' },
    { value: 'skin-enhance', name: 'Skin Enhancer', endpoint: 'ai-skin-enhancer', description: 'Enhance skin in photos' },
    { value: 'colorize', name: 'Photo Colorizer', endpoint: 'ai-color-photo', description: 'Colorize black & white photos' },
    { value: 'ghibli', name: 'Ghibli Style', endpoint: 'ai-ghibli-style', description: 'Convert image to Studio Ghibli style' },
    { value: 'anime', name: 'Anime Generator', endpoint: 'ai-anime-generator', description: 'Generate anime-style image from prompt' },
    { value: 'image-extend', name: 'Image Extender', endpoint: 'ai-image-extension', description: 'Extend image boundaries' },
    { value: 'object-erase', name: 'Object Eraser', endpoint: 'ai-object-eraser', description: 'Erase objects from images using mask' },
    { value: 'product-shot', name: 'Product Shot', endpoint: 'ai-product-shot', description: 'Generate product photography' },
  ],
  videoEdit: [
    { value: 'wan-effects', name: 'Wan AI Effects', endpoint: 'generate_wan_ai_effects', description: 'Apply AI effects to images (WAN model)' },
    { value: 'face-swap-video', name: 'Face Swap (Video)', endpoint: 'ai-video-face-swap', description: 'Swap faces in a video' },
    { value: 'dress-change', name: 'Dress Change', endpoint: 'ai-dress-change', description: 'Change clothing in an image' },
    { value: 'ai-clipping', name: 'AI Clipping', endpoint: 'ai-clipping', description: 'Auto-clip highlights from a video' },
    { value: 'lipsync', name: 'Lipsync', endpoint: 'sync-lipsync', description: 'Sync lips to audio' },
  ],
  audio: [
    { value: 'suno-create', name: 'Suno Create Music', endpoint: 'suno-create-music', description: 'Create original music with Suno' },
    { value: 'suno-remix', name: 'Suno Remix Music', endpoint: 'suno-remix-music', description: 'Remix an existing Suno track' },
    { value: 'suno-extend', name: 'Suno Extend Music', endpoint: 'suno-extend-music', description: 'Extend a Suno music track' },
    { value: 'mmaudio-t2a', name: 'MMAudio Text-to-Audio', endpoint: 'mmaudio-v2/text-to-audio', description: 'Generate audio from text' },
    { value: 'mmaudio-v2v', name: 'MMAudio Video-to-Audio', endpoint: 'mmaudio-v2/video-to-video', description: 'Generate audio for a video' },
  ],
};
