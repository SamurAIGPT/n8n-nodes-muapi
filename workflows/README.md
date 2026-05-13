# MuAPI n8n Example Workflows

Drop-in `*.json` workflows for the MuAPI n8n node. Each example mirrors one of
the agent skills under `muapiapp/skills/library/` and wires the MuAPI node to
the exact model the skill recommends.

## How to use

1. Open n8n → **Workflows** → **Import from File** → pick any `Skill_*.json`.
2. Open the **MuAPI** credential and paste your `x-api-key` from
   [muapi.ai](https://muapi.ai) → Dashboard → API Keys.
3. Edit the example inputs in each node (URLs, prompts) for your use case.
4. Click **Execute Workflow**.

> Image / video chain workflows use n8n expressions like
> `={{ $json.outputs[0] }}` to pass the output of one MuAPI node into the next.
> No extra glue node is needed.

## Visual (image-only)
| Workflow | Skill / model |
|---|---|
| `Skill_NanoBanana.json` | nano-banana-pro (Gemini-3 style brief) |
| `Skill_NanoBanana2.json` | nano-banana-2 (reasoning-driven T2I) |
| `Skill_LogoGenerator.json` | flux-2-pro single-shot logo |
| `Skill_LogoBranding.json` | ideogram-v3 + nano-banana-pro (parallel) |
| `Skill_YouTubeThumbnail.json` | gpt-image-2, high-CTR thumb |
| `Skill_BlogHeader.json` | gpt-image-2 banner 1200×628 |
| `Skill_InstagramPost.json` | nano-banana-2 square hero |
| `Skill_RedNoteCover.json` | seedream-v4.5 RedNote/小红书 |
| `Skill_KeyboardArt.json` | ideogram-v3 keycap art |
| `Skill_AdCreative.json` | nano-banana-pro 4:5 ad |
| `Skill_BrandKit.json` | 3-frame parallel brand kit |
| `Skill_Storyboard.json` | nano-banana-2 × 3 keyframes |
| `Skill_AmazonListing.json` | ai-product-shot + ai-product-photography |
| `Skill_MultiAngleShots.json` | nano-banana-2-edit × 3 angles |
| `Skill_PhotoPackGenerator.json` | `photo-pack` (identity-lock) |
| `Skill_ActionFigure.json` | nano-banana-2-edit collectible |
| `Skill_FashionTryOn.json` | qwen-edit-plus → seedance i2v |
| `Skill_UGCLifestyleTryOn.json` | ai-dress-change → kling-v3-pro i2v |
| `Skill_SelfieWithCelebrity.json` | nano-banana-2-edit → veo3.1 i2v |
| `Skill_FloorPlanRendering.json` | nano-banana-2-edit 2D→3D plan |
| `Skill_InteriorDesign.json` | flux-kontext-pro → kling-v3 i2v |
| `Skill_InteriorVisualizer.json` | gpt-image-2 → nano-banana furnish |
| `Skill_CoupleGrid.json` | qwen-edit-plus 6-cell grid |
| `Skill_Brochure.json` | seedream-v4.5 cover + spread |
| `Skill_UrlToDesign.json` | gpt4o-edit website redesign |
| `Skill_DesignGuide.json` | 3-page brand design system |
| `Skill_SocialPack.json` | nano-banana-2-edit reframe (IG/TT/X) |

## Motion (video chains)
| Workflow | Skill / model |
|---|---|
| `Skill_Seedance2_T2V.json` | seedance-2 text-to-video |
| `Skill_Seedance2_OmniReference.json` | seedance-2.0-omni-reference (3 refs) |
| `Skill_Seedance2_FirstLastFrame.json` | seedance-2 first-last-frame |
| `Skill_CinemaDirector.json` | kling-v3-pro image-to-video |
| `Skill_DroneStyleVideo.json` | veo3.1 aerial drone t2v |
| `Skill_OneShotVideo.json` | veo3.1 i2v continuous single-take |
| `Skill_3DLogoAnimation.json` | nano-banana-2-edit → veo3.1-fast i2v |
| `Skill_AnimalVideoGenerator.json` | animal vlogger nano + veo |
| `Skill_CharacterStoryVideo.json` | nano + flux-kontext + kling chain |
| `Skill_GiantProductShowcase.json` | scale product to building size |
| `Skill_JewelryProductVideo.json` | luxury macro orbit (grok-imagine) |
| `Skill_MusicVideo.json` | keyframe → veo3.1 + suno-create-music |
| `Skill_ProductAdCinematic.json` | nano-banana-2 → kling-v3-std |
| `Skill_ProductShowcaseVideo.json` | seedream-edit-v4.5 → seedance i2v |
| `Skill_ProductVideoAdMaker.json` | flux-2-pro-edit → wan2.5 i2v |
| `Skill_TalkingBabyVideo.json` | wan2.5 baby → grok-imagine i2v |
| `Skill_AiFightScene.json` | gpt-image-2 16-cell board → seedance |
| `Skill_UGCAdsWorkflow.json` | gpt-image-2 UGC scene → veo3.1 |
| `Skill_SocialMediaVideo.json` | imagen4 hero → veo3.1 parallax |

## Edit / clipping
| Workflow | Skill / model |
|---|---|
| `Skill_AiClipping.json` | `ai-clipping` viral 9:16 detection |
| `Skill_YoutubeShorts.json` | `ai-clipping` with `num_highlights` |
| `Skill_ProductCampaign.json` | multi-stage campaign (image + video) |

## 3D
| Workflow | Skill / model |
|---|---|
| `Skill_ImageTo3D_Tripo.json` | tripo3d-p1-image-to-3d (textured asset) |
| `Skill_TextTo3D_Meshy.json` | meshy-6-text-to-3d (game-ready PBR) |

## Regenerating

The `_generate_workflows.py` script is the single source of truth. Edit it to
add new examples and run:

```bash
python3 workflows/_generate_workflows.py
```
