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
  // ── TEXT TO IMAGE ───────────────────────────────────────────────────────────
  textToImage: [
    // Flux family
    { value: 'flux-dev', name: 'FLUX Dev', endpoint: 'flux-dev-image', description: 'High quality image generation with FLUX Dev' },
    { value: 'flux-schnell', name: 'FLUX Schnell', endpoint: 'flux-schnell-image', description: 'Fast image generation with FLUX Schnell' },
    { value: 'flux-krea', name: 'FLUX Krea Dev', endpoint: 'flux-krea-dev', description: 'FLUX Krea Dev — aesthetic-tuned variant' },
    { value: 'flux-2-dev', name: 'FLUX 2 Dev', endpoint: 'flux-2-dev', description: 'FLUX 2 Dev' },
    { value: 'flux-2-pro', name: 'FLUX 2 Pro', endpoint: 'flux-2-pro', description: 'FLUX 2 Pro — highest fidelity' },
    { value: 'flux-2-flex', name: 'FLUX 2 Flex', endpoint: 'flux-2-flex', description: 'FLUX 2 Flex' },
    { value: 'flux-2-klein-4b', name: 'FLUX 2 Klein 4B', endpoint: 'flux-2-klein-4b', description: 'FLUX 2 Klein 4B' },
    { value: 'flux-2-klein-9b', name: 'FLUX 2 Klein 9B', endpoint: 'flux-2-klein-9b', description: 'FLUX 2 Klein 9B' },
    { value: 'flux-2-klein-4b-turbo', name: 'FLUX 2 Klein 4B Turbo', endpoint: 'flux-2-klein-4b-turbo', description: 'FLUX 2 Klein 4B Turbo (fast queue)' },
    { value: 'flux-2-klein-9b-turbo', name: 'FLUX 2 Klein 9B Turbo', endpoint: 'flux-2-klein-9b-turbo', description: 'FLUX 2 Klein 9B Turbo' },
    { value: 'flux-kontext-dev', name: 'FLUX Kontext Dev (T2I)', endpoint: 'flux-kontext-dev-t2i', description: 'FLUX Kontext Dev text-to-image' },
    { value: 'flux-kontext-pro', name: 'FLUX Kontext Pro (T2I)', endpoint: 'flux-kontext-pro-t2i', description: 'FLUX Kontext Pro text-to-image' },
    { value: 'flux-kontext-max', name: 'FLUX Kontext Max (T2I)', endpoint: 'flux-kontext-max-t2i', description: 'FLUX Kontext Max text-to-image' },
    // HiDream
    { value: 'hidream-fast', name: 'HiDream Fast', endpoint: 'hidream_i1_fast_image', description: 'HiDream I1 Fast image generation' },
    { value: 'hidream-dev', name: 'HiDream Dev', endpoint: 'hidream_i1_dev_image', description: 'HiDream I1 Dev image generation' },
    { value: 'hidream-full', name: 'HiDream Full', endpoint: 'hidream_i1_full_image', description: 'HiDream I1 Full image generation' },
    // Google
    { value: 'imagen4', name: 'Google Imagen 4', endpoint: 'google-imagen4', description: 'Google Imagen 4 text-to-image' },
    { value: 'imagen4-fast', name: 'Google Imagen 4 Fast', endpoint: 'google-imagen4-fast', description: 'Google Imagen 4 Fast' },
    { value: 'imagen4-ultra', name: 'Google Imagen 4 Ultra', endpoint: 'google-imagen4-ultra', description: 'Google Imagen 4 Ultra — top quality' },
    // OpenAI / GPT-Image
    { value: 'gpt4o-t2i', name: 'GPT-4o', endpoint: 'gpt4o-text-to-image', description: 'GPT-4o image generation' },
    { value: 'gpt-image-1.5', name: 'GPT-Image 1.5', endpoint: 'gpt-image-1.5', description: 'OpenAI GPT-Image 1.5' },
    { value: 'gpt-image-2', name: 'GPT-Image 2', endpoint: 'gpt-image-2-text-to-image', description: 'OpenAI GPT-Image 2 text-to-image' },
    // Midjourney
    { value: 'midjourney-v7-t2i', name: 'Midjourney V7 (T2I)', endpoint: 'midjourney-v7-text-to-image', description: 'Midjourney V7 text-to-image' },
    { value: 'midjourney-v7', name: 'Midjourney V7', endpoint: 'midjourney-v7', description: 'Midjourney V7 native endpoint' },
    { value: 'midjourney-v8', name: 'Midjourney V8', endpoint: 'midjourney-v8', description: 'Midjourney V8' },
    { value: 'midjourney-niji', name: 'Midjourney Niji', endpoint: 'midjourney-niji', description: 'Midjourney Niji (anime-style)' },
    // Bytedance Seedream
    { value: 'seedream-v3', name: 'Seedream V3', endpoint: 'bytedance-seedream-image', description: 'ByteDance Seedream V3 text-to-image' },
    { value: 'seedream-v4', name: 'Seedream V4', endpoint: 'bytedance-seedream-v4', description: 'ByteDance Seedream V4' },
    { value: 'seedream-v4.5', name: 'Seedream V4.5', endpoint: 'bytedance-seedream-v4.5', description: 'ByteDance Seedream V4.5' },
    { value: 'seedream-5', name: 'Seedream 5.0', endpoint: 'seedream-5.0', description: 'Seedream 5.0' },
    // Wan
    { value: 'wan2.1-t2i', name: 'Wan 2.1 (T2I)', endpoint: 'wan2.1-text-to-image', description: 'Wan 2.1 text-to-image' },
    { value: 'wan2.5-t2i', name: 'Wan 2.5 (T2I)', endpoint: 'wan2.5-text-to-image', description: 'Wan 2.5 text-to-image' },
    { value: 'wan2.6-t2i', name: 'Wan 2.6 (T2I)', endpoint: 'wan2.6-text-to-image', description: 'Wan 2.6 text-to-image' },
    { value: 'wan2.7-t2i', name: 'Wan 2.7 (T2I)', endpoint: 'wan2.7-text-to-image', description: 'Wan 2.7 text-to-image' },
    { value: 'wan2.7-t2i-pro', name: 'Wan 2.7 Pro (T2I)', endpoint: 'wan2.7-text-to-image-pro', description: 'Wan 2.7 Pro text-to-image' },
    // Qwen
    { value: 'qwen-image', name: 'Qwen Image', endpoint: 'qwen-image', description: 'Qwen Image text-to-image' },
    { value: 'qwen-2.0', name: 'Qwen Image 2.0', endpoint: 'qwen-image-2.0', description: 'Qwen Image 2.0' },
    { value: 'qwen-2.0-pro', name: 'Qwen Image 2.0 Pro', endpoint: 'qwen-image-2.0-pro', description: 'Qwen Image 2.0 Pro' },
    // Nano-banana (Gemini-3 style)
    { value: 'nano-banana', name: 'Nano-Banana', endpoint: 'nano-banana', description: 'Nano-Banana (Gemini 3 style reasoning-driven)' },
    { value: 'nano-banana-pro', name: 'Nano-Banana Pro', endpoint: 'nano-banana-pro', description: 'Nano-Banana Pro' },
    { value: 'nano-banana-2', name: 'Nano-Banana 2', endpoint: 'nano-banana-2', description: 'Nano-Banana 2' },
    // Kling
    { value: 'kling-o1-t2i', name: 'Kling o1 (T2I)', endpoint: 'kling-o1-text-to-image', description: 'Kling o1 text-to-image' },
    { value: 'kling-o3', name: 'Kling o3', endpoint: 'kling-o3-image', description: 'Kling o3 image' },
    // Hunyuan
    { value: 'hunyuan-image-2.1', name: 'Hunyuan Image 2.1', endpoint: 'hunyuan-image-2.1', description: 'Hunyuan Image 2.1' },
    { value: 'hunyuan-image-3.0', name: 'Hunyuan Image 3.0', endpoint: 'hunyuan-image-3.0', description: 'Hunyuan Image 3.0' },
    // Ideogram
    { value: 'ideogram-v3', name: 'Ideogram V3', endpoint: 'ideogram-v3-t2i', description: 'Ideogram V3 — best-in-class text rendering' },
    // Reve
    { value: 'reve', name: 'Reve', endpoint: 'reve-text-to-image', description: 'Reve text-to-image generation' },
    // Z-Image
    { value: 'z-image-base', name: 'Z-Image Base', endpoint: 'z-image-base', description: 'Z-Image base' },
    { value: 'z-image-turbo', name: 'Z-Image Turbo', endpoint: 'z-image-turbo', description: 'Z-Image Turbo' },
    // Leonardo
    { value: 'leonardo-lucid', name: 'Leonardo Lucid Origin', endpoint: 'leonardoai-lucid-origin', description: 'Leonardo Lucid Origin' },
    { value: 'leonardo-phoenix', name: 'Leonardo Phoenix 1.0', endpoint: 'leonardoai-phoenix-1.0', description: 'Leonardo Phoenix 1.0' },
    // Grok
    { value: 'grok', name: 'Grok Imagine', endpoint: 'grok-imagine-text-to-image', description: 'xAI Grok Imagine text-to-image' },
    { value: 'grok-quality', name: 'Grok Imagine Quality', endpoint: 'grok-imagine-text-to-image-quality', description: 'xAI Grok Imagine — quality preset' },
    // Other base models
    { value: 'chroma', name: 'Chroma', endpoint: 'chroma-image', description: 'Chroma image' },
    { value: 'sdxl', name: 'SDXL', endpoint: 'sdxl-image', description: 'SDXL image' },
    { value: 'perfect-pony', name: 'Perfect Pony XL', endpoint: 'perfect-pony-xl', description: 'Perfect Pony XL — anime/illustrative' },
    { value: 'neta-lumina', name: 'Neta Lumina', endpoint: 'neta-lumina', description: 'Neta Lumina' },
    { value: 'ai-anime', name: 'AI Anime Generator', endpoint: 'ai-anime-generator', description: 'AI Anime generator' },
  ],

  // ── IMAGE TO IMAGE ──────────────────────────────────────────────────────────
  imageToImage: [
    // Flux Kontext
    { value: 'flux-kontext-dev-i2i', name: 'FLUX Kontext Dev (I2I)', endpoint: 'flux-kontext-dev-i2i', description: 'FLUX Kontext Dev image-to-image editing' },
    { value: 'flux-kontext-pro-i2i', name: 'FLUX Kontext Pro (I2I)', endpoint: 'flux-kontext-pro-i2i', description: 'FLUX Kontext Pro image-to-image editing' },
    { value: 'flux-kontext-max-i2i', name: 'FLUX Kontext Max (I2I)', endpoint: 'flux-kontext-max-i2i', description: 'FLUX Kontext Max image-to-image editing' },
    { value: 'flux-kontext-effects', name: 'FLUX Kontext Effects', endpoint: 'flux-kontext-effects', description: 'Apply creative effects to images' },
    // Flux 2 Edit
    { value: 'flux-2-dev-edit', name: 'FLUX 2 Dev Edit', endpoint: 'flux-2-dev-edit', description: 'FLUX 2 Dev edit' },
    { value: 'flux-2-pro-edit', name: 'FLUX 2 Pro Edit', endpoint: 'flux-2-pro-edit', description: 'FLUX 2 Pro edit' },
    { value: 'flux-2-flex-edit', name: 'FLUX 2 Flex Edit', endpoint: 'flux-2-flex-edit', description: 'FLUX 2 Flex edit' },
    { value: 'flux-2-klein-4b-edit', name: 'FLUX 2 Klein 4B Edit', endpoint: 'flux-2-klein-4b-edit', description: 'FLUX 2 Klein 4B edit' },
    { value: 'flux-2-klein-9b-edit', name: 'FLUX 2 Klein 9B Edit', endpoint: 'flux-2-klein-9b-edit', description: 'FLUX 2 Klein 9B edit' },
    // OpenAI / GPT
    { value: 'gpt4o-i2i', name: 'GPT-4o (I2I)', endpoint: 'gpt4o-image-to-image', description: 'GPT-4o image-to-image editing' },
    { value: 'gpt4o-edit', name: 'GPT-4o Edit', endpoint: 'gpt4o-edit', description: 'GPT-4o image editing' },
    { value: 'gpt-image-edit', name: 'GPT-Image 1.5 Edit', endpoint: 'gpt-image-1.5-edit', description: 'OpenAI GPT-Image 1.5 edit' },
    { value: 'gpt-image-2-edit', name: 'GPT-Image 2 (I2I)', endpoint: 'gpt-image-2-image-to-image', description: 'OpenAI GPT-Image 2 image-to-image' },
    // Bytedance
    { value: 'seededit', name: 'SeedEdit V3', endpoint: 'bytedance-seededit-image', description: 'ByteDance SeedEdit V3 image edit' },
    { value: 'seedream-edit-v4', name: 'Seedream V4 Edit', endpoint: 'bytedance-seedream-edit-v4', description: 'ByteDance Seedream V4 edit' },
    { value: 'seedream-edit-v4.5', name: 'Seedream V4.5 Edit', endpoint: 'bytedance-seedream-v4.5-edit', description: 'ByteDance Seedream V4.5 edit' },
    { value: 'seedream-5-edit', name: 'Seedream 5.0 Edit', endpoint: 'seedream-5.0-edit', description: 'Seedream 5.0 edit' },
    // Midjourney
    { value: 'midjourney-v7-i2i', name: 'Midjourney V7 (I2I)', endpoint: 'midjourney-v7-image-to-image', description: 'Midjourney V7 image-to-image' },
    { value: 'midjourney-v7-style', name: 'Midjourney V7 Style Reference', endpoint: 'midjourney-v7-style-reference', description: 'Midjourney V7 style reference' },
    { value: 'midjourney-v7-omni', name: 'Midjourney V7 Omni Reference', endpoint: 'midjourney-v7-omni-reference', description: 'Midjourney V7 omni reference' },
    // Reve
    { value: 'reve-edit', name: 'Reve Edit', endpoint: 'reve-image-edit', description: 'Reve image editing' },
    // Qwen
    { value: 'qwen-edit', name: 'Qwen Image Edit', endpoint: 'qwen-image-edit', description: 'Qwen image edit' },
    { value: 'qwen-edit-2511', name: 'Qwen Edit 2511', endpoint: 'qwen-image-edit-2511', description: 'Qwen image edit 2511' },
    { value: 'qwen-edit-plus', name: 'Qwen Edit Plus', endpoint: 'qwen-image-edit-plus', description: 'Qwen image edit plus' },
    { value: 'qwen-edit-plus-lora', name: 'Qwen Edit Plus + LoRA', endpoint: 'qwen-image-edit-plus-lora', description: 'Qwen image edit plus with LoRA' },
    { value: 'qwen-2.0-edit', name: 'Qwen 2.0 Edit', endpoint: 'qwen-image-2.0-edit', description: 'Qwen Image 2.0 edit' },
    { value: 'qwen-2.0-pro-edit', name: 'Qwen 2.0 Pro Edit', endpoint: 'qwen-image-2.0-pro-edit', description: 'Qwen Image 2.0 Pro edit' },
    // Nano-banana
    { value: 'nano-banana-edit', name: 'Nano-Banana Edit', endpoint: 'nano-banana-edit', description: 'Nano-Banana edit' },
    { value: 'nano-banana-effects', name: 'Nano-Banana Effects', endpoint: 'nano-banana-effects', description: 'Nano-Banana effects' },
    { value: 'nano-banana-2-edit', name: 'Nano-Banana 2 Edit', endpoint: 'nano-banana-2-edit', description: 'Nano-Banana 2 edit' },
    { value: 'nano-banana-pro-edit', name: 'Nano-Banana Pro Edit', endpoint: 'nano-banana-pro-edit', description: 'Nano-Banana Pro edit' },
    // Kling
    { value: 'kling-o1-edit', name: 'Kling o1 Edit', endpoint: 'kling-o1-edit-image', description: 'Kling o1 edit image' },
    { value: 'kling-o3-edit', name: 'Kling o3 Edit', endpoint: 'kling-o3-image-edit', description: 'Kling o3 image edit' },
    // Wan
    { value: 'wan2.5-edit', name: 'Wan 2.5 Edit', endpoint: 'wan2.5-image-edit', description: 'Wan 2.5 image edit' },
    { value: 'wan2.6-edit', name: 'Wan 2.6 Edit', endpoint: 'wan2.6-image-edit', description: 'Wan 2.6 image edit' },
    { value: 'wan2.7-edit', name: 'Wan 2.7 Edit', endpoint: 'wan2.7-image-edit', description: 'Wan 2.7 image edit' },
    { value: 'wan2.7-edit-pro', name: 'Wan 2.7 Edit Pro', endpoint: 'wan2.7-image-edit-pro', description: 'Wan 2.7 Pro image edit' },
    // Ideogram
    { value: 'ideogram-character', name: 'Ideogram Character', endpoint: 'ideogram-character', description: 'Ideogram character reference' },
    { value: 'ideogram-reframe', name: 'Ideogram V3 Reframe', endpoint: 'ideogram-v3-reframe', description: 'Ideogram V3 reframe' },
    // Other
    { value: 'flux-redux', name: 'FLUX Redux', endpoint: 'flux-redux', description: 'FLUX Redux reference' },
    { value: 'flux-pulid', name: 'FLUX PuLID', endpoint: 'flux-pulid', description: 'FLUX PuLID identity' },
    { value: 'grok-i2i', name: 'Grok Imagine (I2I)', endpoint: 'grok-imagine-image-to-image', description: 'xAI Grok image-to-image' },
    { value: 'photo-pack', name: 'Photo Pack', endpoint: 'photo-pack', description: 'Identity-preserving themed photo pack' },
    { value: 'portrait-stylist', name: 'Portrait Stylist', endpoint: 'portrait-stylist', description: 'Portrait stylist' },
    { value: 'minimax-subject-ref', name: 'MiniMax Subject Reference', endpoint: 'minimax-01-subject-reference', description: 'MiniMax 01 subject reference' },
    { value: 'vidu-q2-ref-image', name: 'Vidu Q2 Reference-to-Image', endpoint: 'vidu-q2-reference-to-image', description: 'Vidu Q2 reference-to-image' },
    { value: 'seedance-2-character', name: 'Seedance 2 Character', endpoint: 'seedance-2-character', description: 'Reusable character sheet from reference photos' },
  ],

  // ── TEXT TO VIDEO ───────────────────────────────────────────────────────────
  textToVideo: [
    // Veo
    { value: 'veo3', name: 'Veo 3', endpoint: 'veo3-text-to-video', description: 'Google Veo 3 text-to-video' },
    { value: 'veo3-fast', name: 'Veo 3 Fast', endpoint: 'veo3-fast-text-to-video', description: 'Google Veo 3 Fast text-to-video' },
    { value: 'veo3.1', name: 'Veo 3.1', endpoint: 'veo3.1-text-to-video', description: 'Google Veo 3.1 text-to-video' },
    { value: 'veo3.1-fast', name: 'Veo 3.1 Fast', endpoint: 'veo3.1-fast-text-to-video', description: 'Google Veo 3.1 Fast' },
    { value: 'veo3.1-4k', name: 'Veo 3.1 4K', endpoint: 'veo3.1-4k-video', description: 'Google Veo 3.1 4K' },
    { value: 'veo3.1-lite', name: 'Veo 3.1 Lite', endpoint: 'veo3.1-lite-text-to-video', description: 'Google Veo 3.1 Lite' },
    { value: 'veo4', name: 'Veo 4', endpoint: 'veo-4-text-to-video', description: 'Google Veo 4 text-to-video' },
    // Kling
    { value: 'kling-master-t2v', name: 'Kling V2.1 Master', endpoint: 'kling-v2.1-master-t2v', description: 'Kling V2.1 Master text-to-video' },
    { value: 'kling-v2.5-pro-t2v', name: 'Kling V2.5 Pro', endpoint: 'kling-v2.5-turbo-pro-t2v', description: 'Kling V2.5 Turbo Pro' },
    { value: 'kling-v2.6-pro-t2v', name: 'Kling V2.6 Pro', endpoint: 'kling-v2.6-pro-t2v', description: 'Kling V2.6 Pro' },
    { value: 'kling-v3-pro-t2v', name: 'Kling V3 Pro', endpoint: 'kling-v3.0-pro-text-to-video', description: 'Kling V3 Pro' },
    { value: 'kling-v3-std-t2v', name: 'Kling V3 Standard', endpoint: 'kling-v3.0-standard-text-to-video', description: 'Kling V3 Standard' },
    { value: 'kling-v3-4k-t2v', name: 'Kling V3 4K', endpoint: 'kling-v3.0-4k-text-to-video', description: 'Kling V3 4K' },
    { value: 'kling-v3-omni-pro-t2v', name: 'Kling V3 Omni Pro', endpoint: 'kling-v3.0-omni-pro-text-to-video', description: 'Kling V3 Omni Pro' },
    { value: 'kling-v3-omni-std-t2v', name: 'Kling V3 Omni Standard', endpoint: 'kling-v3.0-omni-standard-text-to-video', description: 'Kling V3 Omni Standard' },
    { value: 'kling-v3-omni-4k-t2v', name: 'Kling V3 Omni 4K', endpoint: 'kling-v3.0-omni-4k-text-to-video', description: 'Kling V3 Omni 4K' },
    { value: 'kling-o1-t2v', name: 'Kling o1', endpoint: 'kling-o1-text-to-video', description: 'Kling o1 text-to-video' },
    // Wan
    { value: 'wan2.1-t2v', name: 'Wan 2.1 (T2V)', endpoint: 'wan2.1-text-to-video', description: 'Wan 2.1 text-to-video' },
    { value: 'wan2.2-t2v', name: 'Wan 2.2 (T2V)', endpoint: 'wan2.2-text-to-video', description: 'Wan 2.2 text-to-video' },
    { value: 'wan2.2-5b-fast-t2v', name: 'Wan 2.2 5B Fast', endpoint: 'wan2.2-5b-fast-t2v', description: 'Wan 2.2 5B Fast' },
    { value: 'wan2.5-t2v', name: 'Wan 2.5 (T2V)', endpoint: 'wan2.5-text-to-video', description: 'Wan 2.5 text-to-video' },
    { value: 'wan2.5-t2v-fast', name: 'Wan 2.5 Fast', endpoint: 'wan2.5-text-to-video-fast', description: 'Wan 2.5 Fast' },
    { value: 'wan2.6-t2v', name: 'Wan 2.6 (T2V)', endpoint: 'wan2.6-text-to-video', description: 'Wan 2.6 text-to-video' },
    { value: 'wan2.7-t2v', name: 'Wan 2.7 (T2V)', endpoint: 'wan2.7-text-to-video', description: 'Wan 2.7 text-to-video' },
    // Seedance
    { value: 'seedance-pro-t2v', name: 'Seedance Pro', endpoint: 'seedance-pro-t2v', description: 'Seedance Pro text-to-video' },
    { value: 'seedance-pro-t2v-fast', name: 'Seedance Pro Fast', endpoint: 'seedance-pro-t2v-fast', description: 'Seedance Pro Fast' },
    { value: 'seedance-lite-t2v', name: 'Seedance Lite', endpoint: 'seedance-lite-t2v', description: 'Seedance Lite' },
    { value: 'seedance-v1.5-pro-t2v', name: 'Seedance V1.5 Pro', endpoint: 'seedance-v1.5-pro-t2v', description: 'Seedance V1.5 Pro' },
    { value: 'seedance-v1.5-pro-t2v-fast', name: 'Seedance V1.5 Pro Fast', endpoint: 'seedance-v1.5-pro-t2v-fast', description: 'Seedance V1.5 Pro Fast' },
    { value: 'seedance-v2.0-t2v', name: 'Seedance V2.0', endpoint: 'seedance-v2.0-t2v', description: 'Seedance V2.0 text-to-video' },
    { value: 'seedance-2-t2v', name: 'Seedance 2 (T2V)', endpoint: 'seedance-2-text-to-video', description: 'Seedance 2 text-to-video' },
    { value: 'seedance-2-t2v-fast', name: 'Seedance 2 Fast (T2V)', endpoint: 'seedance-2-text-to-video-fast', description: 'Seedance 2 Fast' },
    { value: 'seedance-2-vip-t2v', name: 'Seedance 2 VIP (T2V)', endpoint: 'seedance-2-vip-text-to-video', description: 'Seedance 2 VIP' },
    { value: 'seedance-2-vip-t2v-fast', name: 'Seedance 2 VIP Fast (T2V)', endpoint: 'seedance-2-vip-text-to-video-fast', description: 'Seedance 2 VIP Fast' },
    // OpenAI Sora
    { value: 'sora', name: 'OpenAI Sora', endpoint: 'openai-sora', description: 'OpenAI Sora text-to-video' },
    { value: 'sora-2-t2v', name: 'OpenAI Sora 2', endpoint: 'openai-sora-2-text-to-video', description: 'OpenAI Sora 2 text-to-video' },
    { value: 'sora-2-pro-t2v', name: 'OpenAI Sora 2 Pro', endpoint: 'openai-sora-2-pro-text-to-video', description: 'OpenAI Sora 2 Pro' },
    { value: 'sora-2-std-t2v', name: 'OpenAI Sora 2 Standard', endpoint: 'openai-sora-2-standard-text-to-video', description: 'OpenAI Sora 2 Standard' },
    { value: 'sora-2-storyboard', name: 'Sora 2 Storyboard', endpoint: 'openai-sora-2-pro-storyboard', description: 'Sora 2 Pro storyboard' },
    // Hunyuan
    { value: 'hunyuan-t2v', name: 'HunyuanVideo', endpoint: 'hunyuan-text-to-video', description: 'HunyuanVideo' },
    { value: 'hunyuan-fast-t2v', name: 'HunyuanVideo Fast', endpoint: 'hunyuan-fast-text-to-video', description: 'HunyuanVideo Fast' },
    // Runway / Pixverse / Vidu
    { value: 'runway-t2v', name: 'Runway', endpoint: 'runway-text-to-video', description: 'Runway text-to-video' },
    { value: 'pixverse-v4.5-t2v', name: 'PixVerse V4.5', endpoint: 'pixverse-v4.5-t2v', description: 'PixVerse V4.5 text-to-video' },
    { value: 'pixverse-v5-t2v', name: 'PixVerse V5', endpoint: 'pixverse-v5-t2v', description: 'PixVerse V5 text-to-video' },
    { value: 'pixverse-v5.5-t2v', name: 'PixVerse V5.5', endpoint: 'pixverse-v5.5-t2v', description: 'PixVerse V5.5 text-to-video' },
    { value: 'pixverse-v6-t2v', name: 'PixVerse V6', endpoint: 'pixverse-v6-t2v', description: 'PixVerse V6 text-to-video' },
    { value: 'vidu-v2.0-t2v', name: 'Vidu V2.0', endpoint: 'vidu-v2.0-t2v', description: 'Vidu V2.0 text-to-video' },
    { value: 'vidu-q2-pro-t2v', name: 'Vidu Q2 Pro', endpoint: 'vidu-q2-pro-text-to-video', description: 'Vidu Q2 Pro' },
    { value: 'vidu-q2-turbo-t2v', name: 'Vidu Q2 Turbo', endpoint: 'vidu-q2-turbo-text-to-video', description: 'Vidu Q2 Turbo' },
    { value: 'vidu-q3-pro-t2v', name: 'Vidu Q3 Pro', endpoint: 'vidu-q3-pro-text-to-video', description: 'Vidu Q3 Pro' },
    { value: 'vidu-q3-turbo-t2v', name: 'Vidu Q3 Turbo', endpoint: 'vidu-q3-turbo-text-to-video', description: 'Vidu Q3 Turbo' },
    // MiniMax / Hailuo
    { value: 'minimax-hailuo-02-std-t2v', name: 'MiniMax Hailuo 02 Standard', endpoint: 'minimax-hailuo-02-standard-t2v', description: 'MiniMax Hailuo 02 Standard' },
    { value: 'minimax-hailuo-02-pro-t2v', name: 'MiniMax Hailuo 02 Pro', endpoint: 'minimax-hailuo-02-pro-t2v', description: 'MiniMax Hailuo 02 Pro' },
    { value: 'minimax-hailuo-2.3-pro-t2v', name: 'MiniMax Hailuo 2.3 Pro', endpoint: 'minimax-hailuo-2.3-pro-t2v', description: 'MiniMax Hailuo 2.3 Pro' },
    { value: 'minimax-hailuo-2.3-std-t2v', name: 'MiniMax Hailuo 2.3 Standard', endpoint: 'minimax-hailuo-2.3-standard-t2v', description: 'MiniMax Hailuo 2.3 Standard' },
    // LTX-2
    { value: 'ltx-2-pro-t2v', name: 'LTX-2 Pro', endpoint: 'ltx-2-pro-text-to-video', description: 'Lightricks LTX-2 Pro' },
    { value: 'ltx-2-fast-t2v', name: 'LTX-2 Fast', endpoint: 'ltx-2-fast-text-to-video', description: 'Lightricks LTX-2 Fast' },
    { value: 'ltx-2-19b-t2v', name: 'LTX-2 19B', endpoint: 'ltx-2-19b-text-to-video', description: 'Lightricks LTX-2 19B' },
    { value: 'ltx-2.3-t2v', name: 'LTX-2.3', endpoint: 'ltx-2.3-text-to-video', description: 'Lightricks LTX-2.3' },
    // Other
    { value: 'ovi-t2v', name: 'OVI', endpoint: 'ovi-text-to-video', description: 'OVI text-to-video' },
    { value: 'grok-t2v', name: 'Grok Imagine (T2V)', endpoint: 'grok-imagine-text-to-video', description: 'xAI Grok Imagine T2V' },
    { value: 'happy-horse-1080-t2v', name: 'Happy Horse 1080p', endpoint: 'happy-horse-1-text-to-video-1080p', description: 'Happy Horse 1 1080p T2V' },
    { value: 'happy-horse-720-t2v', name: 'Happy Horse 720p', endpoint: 'happy-horse-1-text-to-video-720p', description: 'Happy Horse 1 720p T2V' },
  ],

  // ── IMAGE TO VIDEO ──────────────────────────────────────────────────────────
  imageToVideo: [
    // Veo
    { value: 'veo3-i2v', name: 'Veo 3 (I2V)', endpoint: 'veo3-image-to-video', description: 'Google Veo 3 image-to-video' },
    { value: 'veo3-fast-i2v', name: 'Veo 3 Fast (I2V)', endpoint: 'veo3-fast-image-to-video', description: 'Google Veo 3 Fast image-to-video' },
    { value: 'veo3.1-i2v', name: 'Veo 3.1 (I2V)', endpoint: 'veo3.1-image-to-video', description: 'Google Veo 3.1 image-to-video' },
    { value: 'veo3.1-fast-i2v', name: 'Veo 3.1 Fast (I2V)', endpoint: 'veo3.1-fast-image-to-video', description: 'Google Veo 3.1 Fast' },
    { value: 'veo3.1-ref', name: 'Veo 3.1 Reference', endpoint: 'veo3.1-reference-to-video', description: 'Google Veo 3.1 reference-to-video' },
    { value: 'veo3.1-lite-i2v', name: 'Veo 3.1 Lite (I2V)', endpoint: 'veo3.1-lite-image-to-video', description: 'Google Veo 3.1 Lite' },
    { value: 'veo4-i2v', name: 'Veo 4 (I2V)', endpoint: 'veo-4-image-to-video', description: 'Google Veo 4 image-to-video' },
    // Kling
    { value: 'kling-v2.1-std-i2v', name: 'Kling V2.1 Standard', endpoint: 'kling-v2.1-standard-i2v', description: 'Kling V2.1 Standard I2V' },
    { value: 'kling-v2.1-pro-i2v', name: 'Kling V2.1 Pro', endpoint: 'kling-v2.1-pro-i2v', description: 'Kling V2.1 Pro I2V' },
    { value: 'kling-v2.1-master-i2v', name: 'Kling V2.1 Master', endpoint: 'kling-v2.1-master-i2v', description: 'Kling V2.1 Master I2V' },
    { value: 'kling-v2.5-pro-i2v', name: 'Kling V2.5 Pro', endpoint: 'kling-v2.5-turbo-pro-i2v', description: 'Kling V2.5 Turbo Pro' },
    { value: 'kling-v2.5-std-i2v', name: 'Kling V2.5 Standard', endpoint: 'kling-v2.5-turbo-std-i2v', description: 'Kling V2.5 Turbo Std' },
    { value: 'kling-v2.6-pro-i2v', name: 'Kling V2.6 Pro', endpoint: 'kling-v2.6-pro-i2v', description: 'Kling V2.6 Pro' },
    { value: 'kling-v3-pro-i2v', name: 'Kling V3 Pro (I2V)', endpoint: 'kling-v3.0-pro-image-to-video', description: 'Kling V3 Pro I2V' },
    { value: 'kling-v3-std-i2v', name: 'Kling V3 Standard (I2V)', endpoint: 'kling-v3.0-standard-image-to-video', description: 'Kling V3 Standard I2V' },
    { value: 'kling-v3-4k-i2v', name: 'Kling V3 4K (I2V)', endpoint: 'kling-v3.0-4k-image-to-video', description: 'Kling V3 4K I2V' },
    { value: 'kling-v3-omni-pro-i2v', name: 'Kling V3 Omni Pro (I2V)', endpoint: 'kling-v3.0-omni-pro-image-to-video', description: 'Kling V3 Omni Pro I2V' },
    { value: 'kling-v3-omni-std-i2v', name: 'Kling V3 Omni Standard (I2V)', endpoint: 'kling-v3.0-omni-standard-image-to-video', description: 'Kling V3 Omni Standard I2V' },
    { value: 'kling-v3-omni-4k-i2v', name: 'Kling V3 Omni 4K (I2V)', endpoint: 'kling-v3.0-omni-4k-image-to-video', description: 'Kling V3 Omni 4K I2V' },
    { value: 'kling-o1-i2v', name: 'Kling o1 (I2V)', endpoint: 'kling-o1-image-to-video', description: 'Kling o1 I2V' },
    { value: 'kling-o1-std-i2v', name: 'Kling o1 Standard (I2V)', endpoint: 'kling-o1-standard-image-to-video', description: 'Kling o1 Standard I2V' },
    { value: 'kling-o1-ref', name: 'Kling o1 Reference', endpoint: 'kling-o1-reference-to-video', description: 'Kling o1 reference-to-video' },
    // Wan
    { value: 'wan2.1-i2v', name: 'Wan 2.1 (I2V)', endpoint: 'wan2.1-image-to-video', description: 'Wan 2.1 image-to-video' },
    { value: 'wan2.1-ref', name: 'Wan 2.1 Reference', endpoint: 'wan2.1-reference-video', description: 'Wan 2.1 reference video' },
    { value: 'wan2.2-i2v', name: 'Wan 2.2 (I2V)', endpoint: 'wan2.2-image-to-video', description: 'Wan 2.2 image-to-video' },
    { value: 'wan2.2-spicy-i2v', name: 'Wan 2.2 Spicy', endpoint: 'wan2.2-spicy-image-to-video', description: 'Wan 2.2 Spicy I2V' },
    { value: 'wan2.5-i2v', name: 'Wan 2.5 (I2V)', endpoint: 'wan2.5-image-to-video', description: 'Wan 2.5 image-to-video' },
    { value: 'wan2.5-i2v-fast', name: 'Wan 2.5 Fast (I2V)', endpoint: 'wan2.5-image-to-video-fast', description: 'Wan 2.5 Fast I2V' },
    { value: 'wan2.6-i2v', name: 'Wan 2.6 (I2V)', endpoint: 'wan2.6-image-to-video', description: 'Wan 2.6 image-to-video' },
    { value: 'wan2.7-i2v', name: 'Wan 2.7 (I2V)', endpoint: 'wan2.7-image-to-video', description: 'Wan 2.7 image-to-video' },
    { value: 'wan2.7-ref', name: 'Wan 2.7 Reference', endpoint: 'wan2.7-reference-to-video', description: 'Wan 2.7 reference-to-video' },
    // Seedance
    { value: 'seedance-pro-i2v', name: 'Seedance Pro (I2V)', endpoint: 'seedance-pro-i2v', description: 'Seedance Pro I2V' },
    { value: 'seedance-pro-i2v-fast', name: 'Seedance Pro Fast (I2V)', endpoint: 'seedance-pro-i2v-fast', description: 'Seedance Pro Fast I2V' },
    { value: 'seedance-lite-i2v', name: 'Seedance Lite (I2V)', endpoint: 'seedance-lite-i2v', description: 'Seedance Lite I2V' },
    { value: 'seedance-lite-ref', name: 'Seedance Lite Reference', endpoint: 'seedance-lite-reference-to-video', description: 'Seedance Lite reference-to-video' },
    { value: 'seedance-v1.5-pro-i2v', name: 'Seedance V1.5 Pro (I2V)', endpoint: 'seedance-v1.5-pro-i2v', description: 'Seedance V1.5 Pro I2V' },
    { value: 'seedance-v1.5-pro-i2v-fast', name: 'Seedance V1.5 Pro Fast (I2V)', endpoint: 'seedance-v1.5-pro-i2v-fast', description: 'Seedance V1.5 Pro Fast I2V' },
    { value: 'seedance-v2.0-i2v', name: 'Seedance V2.0 (I2V)', endpoint: 'seedance-v2.0-i2v', description: 'Seedance V2.0 I2V' },
    { value: 'seedance-v2.0-omni-ref', name: 'Seedance V2.0 Omni Reference', endpoint: 'seedance-2.0-omni-reference', description: 'Seedance V2.0 Omni Reference' },
    { value: 'seedance-2.0-new-omni', name: 'Seedance 2.0 New Omni', endpoint: 'seedance-2.0-new-omni', description: 'Seedance 2.0 New Omni I2V' },
    { value: 'seedance-2.0-new-first-last', name: 'Seedance 2.0 First & Last', endpoint: 'seedance-2.0-new-first-last', description: 'Seedance 2.0 first/last frame' },
    { value: 'seedance-2.0-omni-ref', name: 'Seedance 2.0 Omni Reference', endpoint: 'seedance-2.0-omni-reference', description: 'Seedance 2.0 Omni Reference — images, video, audio' },
    { value: 'seedance-2-i2v', name: 'Seedance 2 (I2V)', endpoint: 'seedance-2-image-to-video', description: 'Seedance 2 image-to-video' },
    { value: 'seedance-2-i2v-fast', name: 'Seedance 2 Fast (I2V)', endpoint: 'seedance-2-image-to-video-fast', description: 'Seedance 2 Fast I2V' },
    { value: 'seedance-2-first-last-frame', name: 'Seedance 2 First & Last Frame', endpoint: 'seedance-2-first-last-frame', description: 'Seedance 2 first/last frame' },
    { value: 'seedance-2-vip-i2v', name: 'Seedance 2 VIP (I2V)', endpoint: 'seedance-2-vip-image-to-video', description: 'Seedance 2 VIP I2V' },
    // OpenAI Sora
    { value: 'sora-2-i2v', name: 'OpenAI Sora 2 (I2V)', endpoint: 'openai-sora-2-image-to-video', description: 'OpenAI Sora 2 image-to-video' },
    { value: 'sora-2-pro-i2v', name: 'OpenAI Sora 2 Pro (I2V)', endpoint: 'openai-sora-2-pro-image-to-video', description: 'OpenAI Sora 2 Pro I2V' },
    { value: 'sora-2-std-i2v', name: 'OpenAI Sora 2 Standard (I2V)', endpoint: 'openai-sora-2-standard-image-to-video', description: 'OpenAI Sora 2 Standard I2V' },
    // Pixverse / Vidu / Hunyuan / Runway / Midjourney
    { value: 'pixverse-v4.5-i2v', name: 'PixVerse V4.5 (I2V)', endpoint: 'pixverse-v4.5-i2v', description: 'PixVerse V4.5 I2V' },
    { value: 'pixverse-v5-i2v', name: 'PixVerse V5 (I2V)', endpoint: 'pixverse-v5-i2v', description: 'PixVerse V5 I2V' },
    { value: 'pixverse-v5.5-i2v', name: 'PixVerse V5.5 (I2V)', endpoint: 'pixverse-v5.5-i2v', description: 'PixVerse V5.5 I2V' },
    { value: 'pixverse-v6-i2v', name: 'PixVerse V6 (I2V)', endpoint: 'pixverse-v6-i2v', description: 'PixVerse V6 I2V' },
    { value: 'pixverse-v6-transition', name: 'PixVerse V6 Transition', endpoint: 'pixverse-v6-transition', description: 'PixVerse V6 transition' },
    { value: 'vidu-v2.0-i2v', name: 'Vidu V2.0 (I2V)', endpoint: 'vidu-v2.0-i2v', description: 'Vidu V2.0 I2V' },
    { value: 'vidu-q1-ref', name: 'Vidu Q1 Reference', endpoint: 'vidu-q1-reference', description: 'Vidu Q1 reference' },
    { value: 'vidu-q2-pro-i2v', name: 'Vidu Q2 Pro (I2V)', endpoint: 'vidu-q2-pro-image-to-video', description: 'Vidu Q2 Pro I2V' },
    { value: 'vidu-q2-turbo-i2v', name: 'Vidu Q2 Turbo (I2V)', endpoint: 'vidu-q2-turbo-image-to-video', description: 'Vidu Q2 Turbo I2V' },
    { value: 'vidu-q2-ref', name: 'Vidu Q2 Reference', endpoint: 'vidu-q2-reference', description: 'Vidu Q2 reference' },
    { value: 'vidu-q2-start-end', name: 'Vidu Q2 Start-End', endpoint: 'vidu-q2-pro-start-end-video', description: 'Vidu Q2 Pro start-end video' },
    { value: 'vidu-q3-pro-i2v', name: 'Vidu Q3 Pro (I2V)', endpoint: 'vidu-q3-pro-image-to-video', description: 'Vidu Q3 Pro I2V' },
    { value: 'vidu-q3-turbo-i2v', name: 'Vidu Q3 Turbo (I2V)', endpoint: 'vidu-q3-turbo-image-to-video', description: 'Vidu Q3 Turbo I2V' },
    { value: 'vidu-q3-flf', name: 'Vidu Q3 First-Last Frames', endpoint: 'vidu-q3-pro-first-last-frames', description: 'Vidu Q3 first-last frames' },
    { value: 'hunyuan-i2v', name: 'HunyuanVideo (I2V)', endpoint: 'hunyuan-image-to-video', description: 'HunyuanVideo I2V' },
    { value: 'runway-i2v', name: 'Runway (I2V)', endpoint: 'runway-image-to-video', description: 'Runway I2V' },
    { value: 'runway-act-two-i2v', name: 'Runway Act-Two', endpoint: 'runway-act-two-i2v', description: 'Runway Act-Two I2V' },
    { value: 'midjourney-v7-i2v', name: 'Midjourney V7 (I2V)', endpoint: 'midjourney-v7-image-to-video', description: 'Midjourney V7 I2V' },
    // MiniMax
    { value: 'minimax-hailuo-02-std-i2v', name: 'MiniMax Hailuo 02 Standard (I2V)', endpoint: 'minimax-hailuo-02-standard-i2v', description: 'MiniMax Hailuo 02 Standard I2V' },
    { value: 'minimax-hailuo-02-pro-i2v', name: 'MiniMax Hailuo 02 Pro (I2V)', endpoint: 'minimax-hailuo-02-pro-i2v', description: 'MiniMax Hailuo 02 Pro I2V' },
    { value: 'minimax-hailuo-2.3-pro-i2v', name: 'MiniMax Hailuo 2.3 Pro (I2V)', endpoint: 'minimax-hailuo-2.3-pro-i2v', description: 'MiniMax Hailuo 2.3 Pro I2V' },
    { value: 'minimax-hailuo-2.3-std-i2v', name: 'MiniMax Hailuo 2.3 Standard (I2V)', endpoint: 'minimax-hailuo-2.3-standard-i2v', description: 'MiniMax Hailuo 2.3 Standard I2V' },
    { value: 'minimax-hailuo-2.3-fast', name: 'MiniMax Hailuo 2.3 Fast', endpoint: 'minimax-hailuo-2.3-fast', description: 'MiniMax Hailuo 2.3 Fast' },
    // LTX
    { value: 'ltx-2-pro-i2v', name: 'LTX-2 Pro (I2V)', endpoint: 'ltx-2-pro-image-to-video', description: 'Lightricks LTX-2 Pro I2V' },
    { value: 'ltx-2-fast-i2v', name: 'LTX-2 Fast (I2V)', endpoint: 'ltx-2-fast-image-to-video', description: 'Lightricks LTX-2 Fast I2V' },
    { value: 'ltx-2-19b-i2v', name: 'LTX-2 19B (I2V)', endpoint: 'ltx-2-19b-image-to-video', description: 'Lightricks LTX-2 19B I2V' },
    { value: 'ltx-2.3-i2v', name: 'LTX-2.3 (I2V)', endpoint: 'ltx-2.3-image-to-video', description: 'Lightricks LTX-2.3 I2V' },
    // Other
    { value: 'ovi-i2v', name: 'OVI (I2V)', endpoint: 'ovi-image-to-video', description: 'OVI I2V' },
    { value: 'grok-i2v', name: 'Grok Imagine (I2V)', endpoint: 'grok-imagine-image-to-video', description: 'xAI Grok Imagine I2V' },
    { value: 'leonardo-motion', name: 'Leonardo Motion 2.0', endpoint: 'leonardoai-motion-2.0', description: 'Leonardo Motion 2.0' },
    { value: 'happy-horse-1080-i2v', name: 'Happy Horse 1080p (I2V)', endpoint: 'happy-horse-1-image-to-video-1080p', description: 'Happy Horse 1 1080p I2V' },
    { value: 'happy-horse-720-i2v', name: 'Happy Horse 720p (I2V)', endpoint: 'happy-horse-1-image-to-video-720p', description: 'Happy Horse 1 720p I2V' },
    { value: 'happy-horse-1080-ref', name: 'Happy Horse 1080p Reference', endpoint: 'happy-horse-1-reference-to-video-1080p', description: 'Happy Horse 1 1080p reference' },
    { value: 'infinitetalk-i2v', name: 'InfiniteTalk (I2V)', endpoint: 'infinitetalk-image-to-video', description: 'InfiniteTalk I2V' },
    { value: 'video-effects', name: 'Video Effects', endpoint: 'video-effects', description: 'AI video effects' },
    { value: 'wan-effects', name: 'WAN AI Effects', endpoint: 'generate_wan_ai_effects', description: 'WAN AI effects (covers ai-video-effects/motion-controls/vfx)' },
  ],

  // ── IMAGE ENHANCE ───────────────────────────────────────────────────────────
  imageEnhance: [
    { value: 'upscale', name: 'AI Image Upscale', endpoint: 'ai-image-upscale', description: 'Upscale image resolution with AI' },
    { value: 'topaz-upscale', name: 'Topaz Image Upscale', endpoint: 'topaz-image-upscale', description: 'Topaz Labs image upscaler' },
    { value: 'seedvr2-upscale', name: 'SeedVR2 Upscale', endpoint: 'seedvr2-image-upscale', description: 'SeedVR2 image upscaler' },
    { value: 'bg-remove', name: 'Background Remover', endpoint: 'ai-background-remover', description: 'Remove image background' },
    { value: 'face-swap-image', name: 'Face Swap (Image)', endpoint: 'ai-image-face-swap', description: 'Swap faces in an image' },
    { value: 'skin-enhance', name: 'Skin Enhancer', endpoint: 'ai-skin-enhancer', description: 'Enhance skin in photos' },
    { value: 'colorize', name: 'Photo Colorizer', endpoint: 'ai-color-photo', description: 'Colorize black & white photos' },
    { value: 'ghibli', name: 'Ghibli Style', endpoint: 'ai-ghibli-style', description: 'Convert image to Studio Ghibli style' },
    { value: 'anime', name: 'Anime Generator', endpoint: 'ai-anime-generator', description: 'Generate anime-style image from prompt' },
    { value: 'image-extend', name: 'Image Extender', endpoint: 'ai-image-extension', description: 'Extend image boundaries' },
    { value: 'object-erase', name: 'Object Eraser', endpoint: 'ai-object-eraser', description: 'Erase objects from images using mask' },
    { value: 'product-shot', name: 'Product Shot', endpoint: 'ai-product-shot', description: 'Generate product photography' },
    { value: 'product-photography', name: 'Product Photography', endpoint: 'ai-product-photography', description: 'AI product photography' },
    { value: 'add-watermark', name: 'Add Watermark', endpoint: 'add-image-watermark', description: 'Add a watermark to an image' },
    { value: 'seedance-2-character', name: 'Seedance 2 Character', endpoint: 'seedance-2-character', description: 'Create a reusable character sheet from reference photos' },
  ],

  // ── VIDEO EDIT ──────────────────────────────────────────────────────────────
  videoEdit: [
    { value: 'wan-effects', name: 'Wan AI Effects', endpoint: 'generate_wan_ai_effects', description: 'Apply AI effects to images (WAN model)' },
    { value: 'video-effects', name: 'Video Effects', endpoint: 'video-effects', description: 'Apply video effects' },
    { value: 'image-effects', name: 'Image Effects', endpoint: 'image-effects', description: 'Apply image effects' },
    { value: 'dance-effects', name: 'Dance Effects', endpoint: 'ai-dance-effects', description: 'AI dance effects' },
    { value: 'face-swap-video', name: 'Face Swap (Video)', endpoint: 'ai-video-face-swap', description: 'Swap faces in a video' },
    { value: 'dress-change', name: 'Dress Change', endpoint: 'ai-dress-change', description: 'Change clothing in an image (model + garment)' },
    { value: 'ai-clipping', name: 'AI Clipping', endpoint: 'ai-clipping', description: 'Auto-clip viral 9:16 highlights from a video' },
    { value: 'video-upscale', name: 'AI Video Upscaler', endpoint: 'ai-video-upscaler', description: 'AI video upscaler' },
    { value: 'video-upscale-pro', name: 'AI Video Upscaler Pro', endpoint: 'ai-video-upscaler-pro', description: 'AI video upscaler Pro' },
    { value: 'topaz-video-upscale', name: 'Topaz Video Upscale', endpoint: 'topaz-video-upscale', description: 'Topaz Labs video upscaler' },
    { value: 'video-watermark-remover', name: 'Video Watermark Remover', endpoint: 'video-watermark-remover', description: 'Remove watermark from a video' },
    { value: 'add-video-watermark', name: 'Add Video Watermark', endpoint: 'add-video-watermark', description: 'Add a watermark to a video' },
    { value: 'wan2.2-edit-video', name: 'Wan 2.2 Edit Video', endpoint: 'wan2.2-edit-video', description: 'Wan 2.2 video edit' },
    { value: 'wan2.2-animate', name: 'Wan 2.2 Animate', endpoint: 'wan2.2-animate', description: 'Wan 2.2 animate' },
    { value: 'wan2.7-edit-video', name: 'Wan 2.7 Edit Video', endpoint: 'wan2.7-video-edit', description: 'Wan 2.7 video edit' },
    { value: 'wan2.7-extend-video', name: 'Wan 2.7 Extend Video', endpoint: 'wan2.7-video-extend', description: 'Wan 2.7 video extend' },
    { value: 'kling-o1-video-edit', name: 'Kling o1 Video Edit', endpoint: 'kling-o1-video-edit', description: 'Kling o1 video edit' },
    { value: 'kling-v2.6-motion-control', name: 'Kling V2.6 Motion Control', endpoint: 'kling-v2.6-pro-motion-control', description: 'Kling V2.6 Pro motion control' },
    { value: 'kling-v3-motion-control', name: 'Kling V3 Motion Control', endpoint: 'kling-v3.0-pro-motion-control', description: 'Kling V3 Pro motion control' },
    { value: 'luma-flash-reframe', name: 'Luma Flash Reframe', endpoint: 'luma-flash-reframe', description: 'Luma flash reframe' },
    { value: 'luma-modify-video', name: 'Luma Modify Video', endpoint: 'luma-modify-video', description: 'Luma modify video' },
    { value: 'runway-act-two-v2v', name: 'Runway Act-Two V2V', endpoint: 'runway-act-two-v2v', description: 'Runway Act-Two video-to-video' },
    { value: 'runway-aleph-v2v', name: 'Runway Aleph V2V', endpoint: 'runway-aleph-v2v', description: 'Runway Aleph video-to-video' },
    { value: 'remix-video', name: 'Remix Video', endpoint: 'remix-video', description: 'Remix video' },
    { value: 'mmaudio-v2-v2v', name: 'MMAudio V2 Video-to-Video', endpoint: 'mmaudio-v2/video-to-video', description: 'MMAudio V2 video-to-video' },
    { value: 'heygen-translate', name: 'HeyGen Video Translate', endpoint: 'heygen-video-translate', description: 'HeyGen video translation' },
    { value: 'infinitetalk-v2v', name: 'InfiniteTalk V2V', endpoint: 'infinitetalk-video-to-video', description: 'InfiniteTalk video-to-video' },
    { value: 'ai-captions', name: 'AI Captions', endpoint: 'ai-captions', description: 'AI auto-captions' },
    { value: 'autocrop', name: 'Autocrop', endpoint: 'autocrop', description: 'Smart autocrop' },
    { value: 'video-combiner', name: 'Video Combiner', endpoint: 'video-combiner', description: 'Combine videos' },
    // Lipsync (kept inside videoEdit for backward compat)
    { value: 'lipsync', name: 'Lipsync (Sync)', endpoint: 'sync-lipsync', description: 'Sync lips to audio with sync-lipsync' },
    { value: 'lipsync-latentsync', name: 'Lipsync (LatentSync)', endpoint: 'latentsync-video', description: 'Lipsync via latentsync-video' },
    { value: 'lipsync-creatify', name: 'Lipsync (Creatify)', endpoint: 'creatify-lipsync', description: 'Lipsync via Creatify' },
    { value: 'lipsync-veed', name: 'Lipsync (Veed)', endpoint: 'veed-lipsync', description: 'Lipsync via Veed' },
    { value: 'lipsync-ltx-2', name: 'Lipsync (LTX-2 19B)', endpoint: 'ltx-2-19b-lipsync', description: 'Lipsync via LTX-2 19B' },
    { value: 'lipsync-ltx-2.3', name: 'Lipsync (LTX-2.3)', endpoint: 'ltx-2.3-lipsync', description: 'Lipsync via LTX-2.3' },
    { value: 'lipsync-kling-v1', name: 'Avatar Pro (Kling V1)', endpoint: 'kling-v1-avatar-pro', description: 'Kling V1 avatar pro' },
    { value: 'lipsync-kling-v2', name: 'Avatar Pro (Kling V2)', endpoint: 'kling-v2-avatar-pro', description: 'Kling V2 avatar pro' },
    { value: 'lipsync-wan2.2', name: 'Lipsync (Wan 2.2 Speech)', endpoint: 'wan2.2-speech-to-video', description: 'Wan 2.2 speech-to-video' },
  ],

  // ── AUDIO ───────────────────────────────────────────────────────────────────
  audio: [
    { value: 'suno-create', name: 'Suno Create Music', endpoint: 'suno-create-music', description: 'Create original music with Suno' },
    { value: 'suno-remix', name: 'Suno Remix Music', endpoint: 'suno-remix-music', description: 'Remix an existing Suno track' },
    { value: 'suno-extend', name: 'Suno Extend Music', endpoint: 'suno-extend-music', description: 'Extend a Suno music track' },
    { value: 'suno-add-instrumental', name: 'Suno Add Instrumental', endpoint: 'suno-add-instrumental', description: 'Suno: add instrumental' },
    { value: 'suno-add-vocals', name: 'Suno Add Vocals', endpoint: 'suno-add-vocals', description: 'Suno: add vocals' },
    { value: 'suno-mashup', name: 'Suno Mashup', endpoint: 'suno-generate-mashup', description: 'Suno: generate mashup' },
    { value: 'suno-sounds', name: 'Suno Sounds', endpoint: 'suno-generate-sounds', description: 'Suno: generate sounds' },
    { value: 'mmaudio-t2a', name: 'MMAudio Text-to-Audio', endpoint: 'mmaudio-v2/text-to-audio', description: 'Generate audio from text' },
    { value: 'mmaudio-v2v', name: 'MMAudio Video-to-Audio', endpoint: 'mmaudio-v2/video-to-video', description: 'Generate audio for a video' },
    { value: 'minimax-speech-hd', name: 'MiniMax Speech 2.6 HD', endpoint: 'minimax-speech-2.6-hd', description: 'MiniMax Speech 2.6 HD' },
    { value: 'minimax-speech-turbo', name: 'MiniMax Speech 2.6 Turbo', endpoint: 'minimax-speech-2.6-turbo', description: 'MiniMax Speech 2.6 Turbo' },
    { value: 'minimax-voice-clone', name: 'MiniMax Voice Clone', endpoint: 'minimax-voice-clone', description: 'MiniMax voice clone' },
  ],

  // ── IMAGE / TEXT TO 3D ──────────────────────────────────────────────────────
  imageTo3D: [
    { value: 'meshy-6-text-to-3d', name: 'Meshy 6 Text-to-3D', endpoint: 'meshy-6-text-to-3d', description: 'Meshy 6 text-to-3D' },
    { value: 'meshy-6-image-to-3d', name: 'Meshy 6 Image-to-3D', endpoint: 'meshy-6-image-to-3d', description: 'Meshy 6 image-to-3D' },
    { value: 'meshy-6-multi-image-to-3d', name: 'Meshy 6 Multi-Image-to-3D', endpoint: 'meshy-6-multi-image-to-3d', description: 'Meshy 6 multi-image-to-3D' },
    { value: 'tripo3d-p1-text-to-3d', name: 'Tripo3D P1 Text-to-3D', endpoint: 'tripo3d-p1-text-to-3d', description: 'Tripo3D P1 text-to-3D' },
    { value: 'tripo3d-p1-image-to-3d', name: 'Tripo3D P1 Image-to-3D', endpoint: 'tripo3d-p1-image-to-3d', description: 'Tripo3D P1 image-to-3D' },
    { value: 'tripo3d-h31-text-to-3d', name: 'Tripo3D H31 Text-to-3D', endpoint: 'tripo3d-h31-text-to-3d', description: 'Tripo3D H31 text-to-3D' },
    { value: 'tripo3d-h31-image-to-3d', name: 'Tripo3D H31 Image-to-3D', endpoint: 'tripo3d-h31-image-to-3d', description: 'Tripo3D H31 image-to-3D' },
    { value: 'tripo3d-h31-multiview-to-3d', name: 'Tripo3D H31 Multiview-to-3D', endpoint: 'tripo3d-h31-multiview-to-3d', description: 'Tripo3D H31 multiview-to-3D' },
  ],
};
