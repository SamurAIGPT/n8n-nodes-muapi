import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from 'n8n-workflow';

import { submitTask, pollForResult, MODEL_REGISTRY } from '../../utils/MuapiClient';

// ─── Payload builder (standalone, takes the execute context) ─────────────────

function buildPayload(
  ctx: IExecuteFunctions,
  category: string,
  model: string,
  itemIndex: number,
): Record<string, unknown> {
  const get = (name: string) => ctx.getNodeParameter(name, itemIndex);

  if (category === 'textToImage') {
    const prompt = get('prompt') as string;
    const base: Record<string, unknown> = { prompt };

    if (['flux-dev', 'flux-schnell', 'hidream-fast', 'hidream-dev', 'hidream-full'].includes(model)) {
      base.width = get('width');
      base.height = get('height');
      base.num_images = get('num_images');
    } else if (model === 'gpt4o-t2i') {
      base.num_images = get('num_images');
    } else {
      base.aspect_ratio = get('aspect_ratio');
      if (['flux-kontext-dev', 'flux-kontext-pro', 'flux-kontext-max'].includes(model)) {
        base.num_images = get('num_images');
      }
    }
    if (model === 'qwen-t2i') {
      base.negative_prompt = get('negative_prompt');
    }
    return base;
  }

  if (category === 'imageToImage') {
    if (model === 'flux-kontext-effects') {
      return {
        name: get('name'),
        image_url: get('effects_image_url'),
      };
    }
    const payload: Record<string, unknown> = {
      prompt: get('i2i_prompt'),
      images_list: (get('images_list') as string)
        .split(',')
        .map((u: string) => u.trim())
        .filter(Boolean),
    };
    if (['flux-kontext-dev-i2i', 'flux-kontext-pro-i2i', 'flux-kontext-max-i2i'].includes(model)) {
      payload.aspect_ratio = get('i2i_aspect_ratio');
    }
    return payload;
  }

  if (category === 'textToVideo') {
    const payload: Record<string, unknown> = { prompt: get('t2v_prompt') };
    if (model === 'sora2-t2v') {
      payload.mode = get('sora_mode');
      payload.seconds = get('sora_seconds');
      payload.size = get('sora_size');
    } else if (['wan2.1-t2v', 'wan2.2-t2v'].includes(model)) {
      payload.prompt_optimizer = get('prompt_optimizer');
    } else {
      payload.aspect_ratio = get('t2v_aspect_ratio');
      const excludedFromRes = [
        'veo3', 'veo3-fast', 'minimax-hailuo-std-t2v', 'minimax-hailuo-pro-t2v',
        'hunyuan-t2v', 'pixverse-t2v', 'seedance-v2.0-t2v', 'seedance-2.0-new-t2v'
      ];
      if (!excludedFromRes.includes(model)) {
        payload.resolution = get('t2v_resolution');
        payload.duration = get('t2v_duration');
      }
    }
    return payload;
  }

  if (category === 'imageToVideo') {
    const payload: Record<string, unknown> = { prompt: get('i2v_prompt') };
    if (['veo3-i2v', 'veo3-fast-i2v'].includes(model)) {
      payload.images_list = (get('i2v_images_list') as string)
        .split(',')
        .map((u: string) => u.trim())
        .filter(Boolean);
    } else {
      payload.image_url = get('i2v_image_url');
    }
    const excludedFromFull = [
      'veo3-i2v', 'veo3-fast-i2v', 'wan2.1-i2v', 'wan2.2-i2v', 'midjourney-v7-i2v',
      'sora2-i2v', 'hunyuan-i2v', 'pixverse-i2v', 'seedance-v2.0-i2v',
      'seedance-2.0-new-omni', 'seedance-2.0-new-first-last'
    ];
    if (!excludedFromFull.includes(model)) {
      payload.aspect_ratio = get('i2v_aspect_ratio');
      payload.resolution = get('i2v_resolution');
      payload.duration = get('i2v_duration');
    } else if (['veo3-i2v', 'veo3-fast-i2v', 'runway-i2v', 'kling-v3-pro-i2v', 'kling-v3-std-i2v'].includes(model)) {
      payload.aspect_ratio = get('i2v_aspect_ratio');
    }
    return payload;
  }

  if (category === 'imageEnhance') {
    if (model === 'face-swap-image') {
      return {
        image_url: get('faceswap_image_url'),
        swap_url: get('faceswap_swap_url'),
      };
    }
    if (model === 'object-erase') {
      return {
        image_url: get('erase_image_url'),
        mask_image_url: get('erase_mask_url'),
      };
    }
    if (model === 'product-shot') {
      return {
        image_url: get('product_image_url'),
        scene_description: get('scene_description'),
      };
    }
    if (model === 'anime') {
      return {
        prompt: get('anime_prompt'),
        width: get('anime_width'),
        height: get('anime_height'),
      };
    }
    return { image_url: get('enhance_image_url') };
  }

  if (category === 'videoEdit') {
    if (model === 'wan-effects') {
      return {
        prompt: get('wan_prompt'),
        image_url: get('wan_image_url'),
        name: get('wan_effect_name'),
        aspect_ratio: get('wan_aspect_ratio'),
        quality: get('wan_quality'),
        resolution: get('wan_resolution'),
        duration: get('wan_duration'),
      };
    }
    if (model === 'face-swap-video') {
      return {
        image_url: get('vfaceswap_image_url'),
        video_url: get('vfaceswap_video_url'),
        target_gender: get('vfaceswap_target_gender'),
      };
    }
    if (model === 'dress-change') {
      return {
        model_image_url: get('dress_model_image_url'),
        garment_image_url: get('dress_garment_image_url'),
      };
    }
    if (model === 'ai-clipping') {
      return {
        video_url: get('clip_video_url'),
        num_highlights: get('clip_num_highlights'),
        aspect_ratio: get('clip_aspect_ratio'),
      };
    }
    if (model === 'lipsync') {
      return {
        video_url: get('lipsync_video_url'),
        audio_url: get('lipsync_audio_url'),
      };
    }
  }

  if (category === 'audio') {
    if (model === 'suno-create') {
      return {
        style: get('suno_style'),
        prompt: get('suno_prompt') || undefined,
        model: get('suno_model'),
        instrumental: get('suno_instrumental'),
      };
    }
    if (['suno-remix', 'suno-extend'].includes(model)) {
      const p: Record<string, unknown> = { track_id: get('suno_track_id') };
      if (model === 'suno-remix') {
        p.style = get('suno_remix_style');
      }
      return p;
    }
    if (model === 'mmaudio-t2a') {
      return {
        prompt: get('audio_prompt'),
        duration: get('audio_duration'),
      };
    }
    if (model === 'mmaudio-v2v') {
      return {
        prompt: get('audio_prompt'),
        video_url: get('audio_video_url'),
        duration: get('audio_duration'),
      };
    }
  }

  return {};
}

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: INodePropertyOptions[] = [
  { value: 'textToImage', name: 'Text to Image' },
  { value: 'imageToImage', name: 'Image to Image' },
  { value: 'textToVideo', name: 'Text to Video' },
  { value: 'imageToVideo', name: 'Image to Video' },
  { value: 'imageEnhance', name: 'Image Enhance' },
  { value: 'videoEdit', name: 'Video Edit' },
  { value: 'audio', name: 'Audio' },
];

// ─── Helper to build displayOptions "show" for a model ───────────────────────

function showWhen(
  category: string,
  models: string[],
): { show: { category: string[]; model: string[] } } {
  return { show: { category: [category], model: models } };
}

// ─── Shared parameter groups ──────────────────────────────────────────────────

// All models that accept prompt + aspect_ratio
const T2V_ASPECT_MODELS = [
  'veo3', 'veo3-fast', 'runway-t2v',
  'seedance-pro-fast-t2v', 'seedance-v15-pro-t2v',
  'seedance-v2.0-t2v', 'seedance-2.0-new-t2v',
  'minimax-hailuo-std-t2v', 'minimax-hailuo-pro-t2v',
  'kling-v3-pro-t2v', 'kling-v3-std-t2v',
  'hunyuan-t2v', 'pixverse-t2v',
];

const I2V_BASIC_MODELS = [
  'veo3-i2v', 'veo3-fast-i2v', 'runway-i2v',
  'midjourney-v7-i2v', 'hunyuan-i2v', 'pixverse-i2v',
  'kling-v3-pro-i2v', 'kling-v3-std-i2v',
  'seedance-v2.0-i2v', 'seedance-2.0-new-omni', 'seedance-2.0-new-first-last',
];

const KONTEXT_I2I_MODELS = [
  'flux-kontext-dev-i2i', 'flux-kontext-pro-i2i', 'flux-kontext-max-i2i',
];

const BASIC_IMAGE_MODELS = ['flux-dev', 'flux-schnell', 'hidream-fast', 'hidream-dev', 'hidream-full'];

export class MuapiPredictor implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MuAPI',
    name: 'muapiPredictor',
    icon: 'file:muapi-logo.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["category"] + " — " + $parameter["model"]}}',
    description: 'Generate images, videos, and audio with MuAPI generative media AI',
    defaults: {
      name: 'MuAPI',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'muapiApi',
        required: true,
      },
    ],
    properties: [
      // ── Category ───────────────────────────────────────────────────────────
      {
        displayName: 'Category',
        name: 'category',
        type: 'options',
        noDataExpression: true,
        options: CATEGORY_OPTIONS,
        default: 'textToImage',
        description: 'Type of generative task',
      },

      // ── Model ──────────────────────────────────────────────────────────────
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        typeOptions: {
          loadOptionsDependsOn: ['category'],
          loadOptionsMethod: 'getModelsForCategory',
        },
        default: '',
        required: true,
        description: 'AI model to use for generation',
      },

      // ══════════════════════════════════════════════════════════════════════
      // TEXT TO IMAGE PARAMETERS
      // ══════════════════════════════════════════════════════════════════════

      // prompt — shared across most T2I models
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
        required: true,
        description: 'Text description of the image to generate',
        displayOptions: {
          show: {
            category: ['textToImage'],
          },
        },
      },

      // width / height — for pixel-based models
      {
        displayName: 'Width',
        name: 'width',
        type: 'number',
        default: 1024,
        description: 'Image width in pixels',
        displayOptions: showWhen('textToImage', BASIC_IMAGE_MODELS),
      },
      {
        displayName: 'Height',
        name: 'height',
        type: 'number',
        default: 1024,
        description: 'Image height in pixels',
        displayOptions: showWhen('textToImage', BASIC_IMAGE_MODELS),
      },

      // aspect_ratio — for kontext/reve/midjourney/wan/seedream
      {
        displayName: 'Aspect Ratio',
        name: 'aspect_ratio',
        type: 'options',
        options: [
          { value: '1:1', name: '1:1 (Square)' },
          { value: '16:9', name: '16:9 (Landscape)' },
          { value: '9:16', name: '9:16 (Portrait)' },
          { value: '4:3', name: '4:3' },
          { value: '3:4', name: '3:4' },
          { value: '3:2', name: '3:2' },
          { value: '2:3', name: '2:3' },
          { value: '21:9', name: '21:9 (Ultrawide)' },
          { value: '9:21', name: '9:21' },
        ],
        default: '1:1',
        description: 'Aspect ratio of the output image',
        displayOptions: showWhen('textToImage', [
          'flux-kontext-dev', 'flux-kontext-pro', 'flux-kontext-max',
          'midjourney-v7', 'reve', 'wan2.1-t2i',
          'seedream-3', 'seedream-4', 'qwen-t2i', 'gpt4o-t2i',
        ]),
      },

      // num_images
      {
        displayName: 'Number of Images',
        name: 'num_images',
        type: 'options',
        options: [
          { value: 1, name: '1' },
          { value: 2, name: '2' },
          { value: 3, name: '3' },
          { value: 4, name: '4' },
        ],
        default: 1,
        description: 'Number of images to generate',
        displayOptions: showWhen('textToImage', [
          ...BASIC_IMAGE_MODELS,
          'flux-kontext-dev', 'flux-kontext-pro', 'flux-kontext-max',
          'gpt4o-t2i', 'hidream-fast', 'hidream-dev', 'hidream-full',
        ]),
      },

      // negative_prompt — for some models
      {
        displayName: 'Negative Prompt',
        name: 'negative_prompt',
        type: 'string',
        typeOptions: { rows: 2 },
        default: '',
        description: 'What to avoid in the generated image',
        displayOptions: showWhen('textToImage', ['qwen-t2i']),
      },

      // ══════════════════════════════════════════════════════════════════════
      // IMAGE TO IMAGE PARAMETERS
      // ══════════════════════════════════════════════════════════════════════

      {
        displayName: 'Prompt',
        name: 'i2i_prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
        required: true,
        description: 'Text instruction for image editing',
        displayOptions: {
          show: {
            category: ['imageToImage'],
          },
        },
      },

      // images_list — for kontext i2i models (comma-separated URLs)
      {
        displayName: 'Input Image URL(s)',
        name: 'images_list',
        type: 'string',
        default: '',
        required: true,
        description: 'URL(s) of input images. For multiple images separate with commas.',
        displayOptions: showWhen('imageToImage', [
          ...KONTEXT_I2I_MODELS,
          'gpt4o-i2i', 'gpt4o-edit', 'midjourney-v7-i2i',
          'midjourney-v7-style', 'midjourney-v7-omni', 'reve-edit',
          'seededit', 'qwen-edit',
        ]),
      },

      // aspect_ratio for i2i
      {
        displayName: 'Aspect Ratio',
        name: 'i2i_aspect_ratio',
        type: 'options',
        options: [
          { value: '1:1', name: '1:1 (Square)' },
          { value: '16:9', name: '16:9 (Landscape)' },
          { value: '9:16', name: '9:16 (Portrait)' },
          { value: '4:3', name: '4:3' },
          { value: '3:4', name: '3:4' },
          { value: '3:2', name: '3:2' },
          { value: '2:3', name: '2:3' },
          { value: '21:9', name: '21:9 (Ultrawide)' },
          { value: '9:21', name: '9:21' },
        ],
        default: '1:1',
        description: 'Aspect ratio of the output image',
        displayOptions: showWhen('imageToImage', KONTEXT_I2I_MODELS),
      },

      // effect — for flux-kontext-effects
      {
        displayName: 'Effect Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        description: 'Name of the effect to apply (e.g. "ghiblify", "anime")',
        displayOptions: showWhen('imageToImage', ['flux-kontext-effects']),
      },
      {
        displayName: 'Image URL',
        name: 'effects_image_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the image to apply the effect to',
        displayOptions: showWhen('imageToImage', ['flux-kontext-effects']),
      },

      // ══════════════════════════════════════════════════════════════════════
      // TEXT TO VIDEO PARAMETERS
      // ══════════════════════════════════════════════════════════════════════

      {
        displayName: 'Prompt',
        name: 't2v_prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
        required: true,
        description: 'Text description of the video to generate',
        displayOptions: {
          show: {
            category: ['textToVideo'],
          },
        },
      },

      {
        displayName: 'Aspect Ratio',
        name: 't2v_aspect_ratio',
        type: 'options',
        options: [
          { value: '16:9', name: '16:9 (Landscape)' },
          { value: '9:16', name: '9:16 (Portrait)' },
          { value: '1:1', name: '1:1 (Square)' },
          { value: '4:3', name: '4:3' },
          { value: '3:4', name: '3:4' },
          { value: '21:9', name: '21:9 (Ultrawide)' },
        ],
        default: '16:9',
        description: 'Aspect ratio of the output video',
        displayOptions: showWhen('textToVideo', T2V_ASPECT_MODELS),
      },

      {
        displayName: 'Resolution',
        name: 't2v_resolution',
        type: 'options',
        options: [
          { value: '480p', name: '480p' },
          { value: '720p', name: '720p' },
          { value: '1080p', name: '1080p' },
        ],
        default: '720p',
        description: 'Video resolution',
        displayOptions: showWhen('textToVideo', [
          'runway-t2v', 'seedance-pro-fast-t2v', 'seedance-v15-pro-t2v',
          'kling-v3-pro-t2v', 'kling-v3-std-t2v',
        ]),
      },

      {
        displayName: 'Duration (seconds)',
        name: 't2v_duration',
        type: 'number',
        default: 5,
        description: 'Video duration in seconds',
        displayOptions: showWhen('textToVideo', [
          'runway-t2v', 'seedance-pro-fast-t2v', 'seedance-v15-pro-t2v',
          'kling-v3-pro-t2v', 'kling-v3-std-t2v',
        ]),
      },

      // Sora 2 specific
      {
        displayName: 'Mode',
        name: 'sora_mode',
        type: 'options',
        options: [
          { value: 'stable', name: 'Stable' },
          { value: 'budget', name: 'Budget' },
        ],
        default: 'stable',
        displayOptions: showWhen('textToVideo', ['sora2-t2v']),
      },
      {
        displayName: 'Seconds',
        name: 'sora_seconds',
        type: 'options',
        options: [
          { value: '10', name: '10s' },
          { value: '15', name: '15s' },
        ],
        default: '10',
        displayOptions: showWhen('textToVideo', ['sora2-t2v']),
      },
      {
        displayName: 'Size',
        name: 'sora_size',
        type: 'options',
        options: [
          { value: '720x1280', name: '720x1280 (Portrait)' },
          { value: '1280x720', name: '1280x720 (Landscape)' },
        ],
        default: '720x1280',
        displayOptions: showWhen('textToVideo', ['sora2-t2v']),
      },

      // wan2.1/wan2.2 t2v
      {
        displayName: 'Prompt Optimizer',
        name: 'prompt_optimizer',
        type: 'boolean',
        default: true,
        description: 'Whether to use prompt optimization',
        displayOptions: showWhen('textToVideo', ['wan2.1-t2v', 'wan2.2-t2v']),
      },

      // ══════════════════════════════════════════════════════════════════════
      // IMAGE TO VIDEO PARAMETERS
      // ══════════════════════════════════════════════════════════════════════

      {
        displayName: 'Prompt',
        name: 'i2v_prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
        required: true,
        description: 'Text description to guide video generation',
        displayOptions: {
          show: {
            category: ['imageToVideo'],
          },
        },
      },

      {
        displayName: 'Image URL',
        name: 'i2v_image_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the input image',
        displayOptions: {
          show: {
            category: ['imageToVideo'],
            model: [...I2V_BASIC_MODELS, 'seedance-pro-fast-i2v', 'seedance-v15-pro-i2v', 'wan2.1-i2v', 'wan2.2-i2v', 'sora2-i2v'],
          },
        },
      },

      // images_list for veo3 i2v (1-2 images)
      {
        displayName: 'Image URL(s)',
        name: 'i2v_images_list',
        type: 'string',
        default: '',
        required: true,
        description: 'URL(s) of input images, comma-separated (1-2 images)',
        displayOptions: showWhen('imageToVideo', ['veo3-i2v', 'veo3-fast-i2v']),
      },

      {
        displayName: 'Aspect Ratio',
        name: 'i2v_aspect_ratio',
        type: 'options',
        options: [
          { value: '16:9', name: '16:9 (Landscape)' },
          { value: '9:16', name: '9:16 (Portrait)' },
          { value: '1:1', name: '1:1 (Square)' },
          { value: '4:3', name: '4:3' },
          { value: '3:4', name: '3:4' },
        ],
        default: '16:9',
        description: 'Aspect ratio of the output video',
        displayOptions: showWhen('imageToVideo', [
          ...I2V_BASIC_MODELS, 'seedance-pro-fast-i2v', 'seedance-v15-pro-i2v',
        ]),
      },

      {
        displayName: 'Resolution',
        name: 'i2v_resolution',
        type: 'options',
        options: [
          { value: '480p', name: '480p' },
          { value: '720p', name: '720p' },
          { value: '1080p', name: '1080p' },
        ],
        default: '720p',
        description: 'Video resolution',
        displayOptions: showWhen('imageToVideo', [
          'runway-i2v', 'seedance-pro-fast-i2v', 'seedance-v15-pro-i2v',
          'kling-v3-pro-i2v', 'kling-v3-std-i2v',
        ]),
      },

      {
        displayName: 'Duration (seconds)',
        name: 'i2v_duration',
        type: 'number',
        default: 5,
        description: 'Video duration in seconds',
        displayOptions: showWhen('imageToVideo', [
          'runway-i2v', 'seedance-pro-fast-i2v', 'seedance-v15-pro-i2v',
          'kling-v3-pro-i2v', 'kling-v3-std-i2v',
        ]),
      },

      // ══════════════════════════════════════════════════════════════════════
      // IMAGE ENHANCE PARAMETERS
      // ══════════════════════════════════════════════════════════════════════

      {
        displayName: 'Image URL',
        name: 'enhance_image_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the image to enhance',
        displayOptions: showWhen('imageEnhance', [
          'upscale', 'bg-remove', 'skin-enhance', 'colorize',
          'ghibli', 'image-extend',
        ]),
      },

      // face-swap-image needs target + swap image
      {
        displayName: 'Target Image URL',
        name: 'faceswap_image_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the image where the face will be swapped',
        displayOptions: showWhen('imageEnhance', ['face-swap-image']),
      },
      {
        displayName: 'Face Image URL (Source)',
        name: 'faceswap_swap_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the image with the source face',
        displayOptions: showWhen('imageEnhance', ['face-swap-image']),
      },

      // object-erase needs image + mask
      {
        displayName: 'Image URL',
        name: 'erase_image_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the image to process',
        displayOptions: showWhen('imageEnhance', ['object-erase']),
      },
      {
        displayName: 'Mask Image URL',
        name: 'erase_mask_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the mask image indicating the area to erase',
        displayOptions: showWhen('imageEnhance', ['object-erase']),
      },

      // product-shot needs scene_description + image
      {
        displayName: 'Product Image URL',
        name: 'product_image_url',
        type: 'string',
        default: '',
        required: true,
        displayOptions: showWhen('imageEnhance', ['product-shot']),
      },
      {
        displayName: 'Scene Description',
        name: 'scene_description',
        type: 'string',
        typeOptions: { rows: 2 },
        default: '',
        required: true,
        description: 'Describe the scene for the product shot',
        displayOptions: showWhen('imageEnhance', ['product-shot']),
      },

      // anime-generator needs prompt + dimensions
      {
        displayName: 'Prompt',
        name: 'anime_prompt',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
        required: true,
        displayOptions: showWhen('imageEnhance', ['anime']),
      },
      {
        displayName: 'Width',
        name: 'anime_width',
        type: 'number',
        default: 1024,
        displayOptions: showWhen('imageEnhance', ['anime']),
      },
      {
        displayName: 'Height',
        name: 'anime_height',
        type: 'number',
        default: 1024,
        displayOptions: showWhen('imageEnhance', ['anime']),
      },

      // ══════════════════════════════════════════════════════════════════════
      // VIDEO EDIT PARAMETERS
      // ══════════════════════════════════════════════════════════════════════

      // wan-effects
      {
        displayName: 'Prompt',
        name: 'wan_prompt',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
        required: true,
        description: 'Effect description prompt',
        displayOptions: showWhen('videoEdit', ['wan-effects']),
      },
      {
        displayName: 'Image URL',
        name: 'wan_image_url',
        type: 'string',
        default: '',
        required: true,
        displayOptions: showWhen('videoEdit', ['wan-effects']),
      },
      {
        displayName: 'Effect Name',
        name: 'wan_effect_name',
        type: 'string',
        default: '',
        required: true,
        description: 'Name of the WAN effect to apply',
        displayOptions: showWhen('videoEdit', ['wan-effects']),
      },
      {
        displayName: 'Aspect Ratio',
        name: 'wan_aspect_ratio',
        type: 'options',
        options: [
          { value: '16:9', name: '16:9' },
          { value: '9:16', name: '9:16' },
          { value: '1:1', name: '1:1' },
        ],
        default: '16:9',
        displayOptions: showWhen('videoEdit', ['wan-effects']),
      },
      {
        displayName: 'Quality',
        name: 'wan_quality',
        type: 'options',
        options: [
          { value: 'medium', name: 'Medium' },
          { value: 'high', name: 'High' },
        ],
        default: 'medium',
        displayOptions: showWhen('videoEdit', ['wan-effects']),
      },
      {
        displayName: 'Resolution',
        name: 'wan_resolution',
        type: 'options',
        options: [
          { value: '480p', name: '480p' },
          { value: '720p', name: '720p' },
        ],
        default: '480p',
        displayOptions: showWhen('videoEdit', ['wan-effects']),
      },
      {
        displayName: 'Duration (seconds)',
        name: 'wan_duration',
        type: 'options',
        options: [
          { value: 5, name: '5s' },
          { value: 10, name: '10s' },
        ],
        default: 5,
        displayOptions: showWhen('videoEdit', ['wan-effects']),
      },

      // face-swap-video
      {
        displayName: 'Face Image URL',
        name: 'vfaceswap_image_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the source face image',
        displayOptions: showWhen('videoEdit', ['face-swap-video']),
      },
      {
        displayName: 'Video URL',
        name: 'vfaceswap_video_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the target video',
        displayOptions: showWhen('videoEdit', ['face-swap-video']),
      },
      {
        displayName: 'Target Gender',
        name: 'vfaceswap_target_gender',
        type: 'options',
        options: [
          { value: 'All', name: 'All' },
          { value: 'Female', name: 'Female' },
          { value: 'Male', name: 'Male' },
        ],
        default: 'All',
        displayOptions: showWhen('videoEdit', ['face-swap-video']),
      },

      // dress-change
      {
        displayName: 'Model Image URL',
        name: 'dress_model_image_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the person image',
        displayOptions: showWhen('videoEdit', ['dress-change']),
      },
      {
        displayName: 'Garment Image URL',
        name: 'dress_garment_image_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the clothing/garment image',
        displayOptions: showWhen('videoEdit', ['dress-change']),
      },

      // ai-clipping
      {
        displayName: 'Video URL',
        name: 'clip_video_url',
        type: 'string',
        default: '',
        required: true,
        displayOptions: showWhen('videoEdit', ['ai-clipping']),
      },
      {
        displayName: 'Number of Highlights',
        name: 'clip_num_highlights',
        type: 'number',
        default: 3,
        displayOptions: showWhen('videoEdit', ['ai-clipping']),
      },
      {
        displayName: 'Output Aspect Ratio',
        name: 'clip_aspect_ratio',
        type: 'options',
        options: [
          { value: '9:16', name: '9:16' },
          { value: '1:1', name: '1:1' },
          { value: '4:5', name: '4:5' },
        ],
        default: '9:16',
        displayOptions: showWhen('videoEdit', ['ai-clipping']),
      },

      // lipsync
      {
        displayName: 'Video URL',
        name: 'lipsync_video_url',
        type: 'string',
        default: '',
        required: true,
        displayOptions: showWhen('videoEdit', ['lipsync']),
      },
      {
        displayName: 'Audio URL',
        name: 'lipsync_audio_url',
        type: 'string',
        default: '',
        required: true,
        displayOptions: showWhen('videoEdit', ['lipsync']),
      },

      // ══════════════════════════════════════════════════════════════════════
      // AUDIO PARAMETERS
      // ══════════════════════════════════════════════════════════════════════

      // suno-create
      {
        displayName: 'Style',
        name: 'suno_style',
        type: 'string',
        default: '',
        required: true,
        description: 'Musical style or genre (e.g. "upbeat pop", "acoustic guitar")',
        displayOptions: showWhen('audio', ['suno-create']),
      },
      {
        displayName: 'Lyrics Prompt',
        name: 'suno_prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
        description: 'Lyrics or prompt for the song (leave empty for instrumental)',
        displayOptions: showWhen('audio', ['suno-create']),
      },
      {
        displayName: 'Suno Model Version',
        name: 'suno_model',
        type: 'options',
        options: [
          { value: 'V5', name: 'V5 (Latest)' },
          { value: 'V4_5PLUS', name: 'V4.5+' },
          { value: 'V4_5', name: 'V4.5' },
          { value: 'V4', name: 'V4' },
          { value: 'V3_5', name: 'V3.5' },
        ],
        default: 'V5',
        displayOptions: showWhen('audio', ['suno-create']),
      },
      {
        displayName: 'Instrumental',
        name: 'suno_instrumental',
        type: 'boolean',
        default: true,
        description: 'Whether to generate instrumental music (no vocals)',
        displayOptions: showWhen('audio', ['suno-create']),
      },

      // suno-remix / suno-extend
      {
        displayName: 'Track ID',
        name: 'suno_track_id',
        type: 'string',
        default: '',
        required: true,
        description: 'Suno track ID to remix or extend',
        displayOptions: showWhen('audio', ['suno-remix', 'suno-extend']),
      },
      {
        displayName: 'Style',
        name: 'suno_remix_style',
        type: 'string',
        default: '',
        description: 'New style for the remix',
        displayOptions: showWhen('audio', ['suno-remix']),
      },

      // mmaudio-t2a
      {
        displayName: 'Prompt',
        name: 'audio_prompt',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
        required: true,
        description: 'Text description of the audio to generate',
        displayOptions: showWhen('audio', ['mmaudio-t2a', 'mmaudio-v2v']),
      },
      {
        displayName: 'Duration (seconds)',
        name: 'audio_duration',
        type: 'number',
        default: 8,
        description: 'Duration of audio in seconds (1-30)',
        displayOptions: showWhen('audio', ['mmaudio-t2a', 'mmaudio-v2v']),
      },
      {
        displayName: 'Video URL',
        name: 'audio_video_url',
        type: 'string',
        default: '',
        required: true,
        description: 'URL of the video to generate audio for',
        displayOptions: showWhen('audio', ['mmaudio-v2v']),
      },

      // ══════════════════════════════════════════════════════════════════════
      // POLLING OPTIONS
      // ══════════════════════════════════════════════════════════════════════

      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Max Wait Time (seconds)',
            name: 'maxWaitSeconds',
            type: 'number',
            default: 600,
            description: 'Maximum time in seconds to wait for the task to complete',
          },
          {
            displayName: 'Poll Interval (seconds)',
            name: 'pollIntervalSeconds',
            type: 'number',
            default: 3,
            description: 'How often to poll for results',
          },
          {
            displayName: 'Return Request ID Only',
            name: 'returnRequestIdOnly',
            type: 'boolean',
            default: false,
            description: 'Whether to return the request_id immediately without waiting for completion',
          },
        ],
      },
    ],
  };

  methods = {
    loadOptions: {
      async getModelsForCategory(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const category = this.getCurrentNodeParameter('category') as string;
        const models = MODEL_REGISTRY[category] ?? [];
        return models.map((m) => ({
          value: m.value,
          name: m.name,
          description: m.description,
        }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const credentials = await this.getCredentials('muapiApi');
    const apiKey = credentials.apiKey as string;
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const category = this.getNodeParameter('category', i) as string;
      const model = this.getNodeParameter('model', i) as string;
      const options = this.getNodeParameter('options', i) as {
        maxWaitSeconds?: number;
        pollIntervalSeconds?: number;
        returnRequestIdOnly?: boolean;
      };

      const maxWaitMs = (options.maxWaitSeconds ?? 600) * 1000;
      const pollIntervalMs = (options.pollIntervalSeconds ?? 3) * 1000;
      const returnRequestIdOnly = options.returnRequestIdOnly ?? false;

      // Find model definition
      const modelDef = (MODEL_REGISTRY[category] ?? []).find((m) => m.value === model);
      if (!modelDef) {
        throw new NodeOperationError(
          this.getNode(),
          `Unknown model "${model}" for category "${category}"`,
          { itemIndex: i },
        );
      }

      // Build request payload
      const payload = buildPayload(this, category, model, i);

      try {
        const submitResponse = await submitTask(modelDef.endpoint, payload, apiKey);

        if (!submitResponse.request_id) {
          throw new NodeOperationError(
            this.getNode(),
            'API did not return a request_id',
            { itemIndex: i },
          );
        }

        if (returnRequestIdOnly) {
          returnData.push({
            json: {
              request_id: submitResponse.request_id,
              status: 'submitted',
              model,
              category,
              endpoint: modelDef.endpoint,
            },
          });
          continue;
        }

        // Poll until complete
        const result = await pollForResult(submitResponse.request_id, apiKey, {
          maxWaitMs,
          pollIntervalMs,
        });

        returnData.push({
          json: {
            ...result,
            model,
            category,
            endpoint: modelDef.endpoint,
          },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
              model,
              category,
              endpoint: modelDef.endpoint,
            },
            pairedItem: i,
          });
        } else {
          throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
        }
      }
    }

    return [returnData];
  }
}
