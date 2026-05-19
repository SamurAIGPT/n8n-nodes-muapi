"""
Generates n8n workflow JSON files mapping each agent skill (from
muapiapp/skills/library/) to a starter MuAPI n8n workflow.

Run:  python3 workflows/_generate_workflows.py
Outputs *.json into the same directory.

Each workflow is importable from n8n via UI → "Import from File".
You'll need an "muapiApi" credential configured separately.
"""

import json
import uuid
from pathlib import Path

OUT_DIR = Path(__file__).parent
MUAPI_TYPE = "n8n-nodes-muapi.muapiPredictor"


def _id() -> str:
    return str(uuid.uuid4())


# ── n8n graph helpers ─────────────────────────────────────────────────────────

def manual_trigger(pos=(240, 300), name="When clicking Test"):
    return {
        "parameters": {},
        "id": _id(),
        "name": name,
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": list(pos),
    }


def muapi_node(parameters, pos, name):
    return {
        "parameters": parameters,
        "id": _id(),
        "name": name,
        "type": MUAPI_TYPE,
        "typeVersion": 1,
        "position": list(pos),
        "credentials": {"muapiApi": {"id": "muapiApi", "name": "MuAPI API"}},
    }


def build_workflow(name: str, nodes_specs: list[dict], links: list[tuple[str, str]]) -> dict:
    """nodes_specs: list of {"name", "params", "pos"}; links: list of (src_name, dst_name)."""
    trigger = manual_trigger()
    nodes = [trigger]
    name_to_node = {trigger["name"]: trigger}
    x = 460
    for spec in nodes_specs:
        node = muapi_node(spec["params"], spec.get("pos", (x, 300)), spec["name"])
        nodes.append(node)
        name_to_node[spec["name"]] = node
        x += 260

    # First MuAPI node is connected from the trigger automatically.
    first = nodes_specs[0]["name"]
    connections: dict = {
        trigger["name"]: {"main": [[{"node": first, "type": "main", "index": 0}]]}
    }
    for src, dst in links:
        connections.setdefault(src, {"main": [[]]})
        connections[src]["main"][0].append({"node": dst, "type": "main", "index": 0})

    return {
        "name": name,
        "nodes": nodes,
        "connections": connections,
        "active": False,
        "settings": {"executionOrder": "v1"},
        "versionId": _id(),
        "id": _id(),
        "meta": {"templateCredsSetupCompleted": False},
        "tags": ["muapi", "starter", "skill"],
    }


def t2i(model, prompt, aspect="1:1"):
    """Text-to-Image params."""
    return {
        "category": "textToImage",
        "model": model,
        "prompt": prompt,
        "aspect_ratio": aspect,
    }


def i2i(model, prompt, image_expr, aspect="1:1"):
    return {
        "category": "imageToImage",
        "model": model,
        "i2i_prompt": prompt,
        "images_list": image_expr,
        "i2i_aspect_ratio": aspect,
    }


def t2v(model, prompt, aspect="16:9", duration=5, resolution="720p"):
    return {
        "category": "textToVideo",
        "model": model,
        "t2v_prompt": prompt,
        "t2v_aspect_ratio": aspect,
        "t2v_duration": duration,
        "t2v_resolution": resolution,
    }


def i2v_url(model, prompt, image_expr, aspect="16:9", duration=5, resolution="720p"):
    return {
        "category": "imageToVideo",
        "model": model,
        "i2v_prompt": prompt,
        "i2v_image_url": image_expr,
        "i2v_aspect_ratio": aspect,
        "i2v_duration": duration,
        "i2v_resolution": resolution,
    }


def i2v_list(model, prompt, image_expr, aspect="16:9", duration=5, resolution="720p"):
    """For models that expect images_list."""
    return {
        "category": "imageToVideo",
        "model": model,
        "i2v_prompt": prompt,
        "i2v_images_list": image_expr,
        "i2v_aspect_ratio": aspect,
        "i2v_duration": duration,
        "i2v_resolution": resolution,
    }


def enhance(model, **extras):
    p = {"category": "imageEnhance", "model": model}
    p.update(extras)
    return p


def vedit(model, **extras):
    p = {"category": "videoEdit", "model": model}
    p.update(extras)
    return p


def audio(model, prompt, **extras):
    p = {
        "category": "audio",
        "model": model,
        "suno_prompt": prompt,
        "audio_prompt": prompt,
    }
    p.update(extras)
    return p


def three_d(model, prompt="", image_expr=""):
    return {
        "category": "imageTo3D",
        "model": model,
        "threeD_prompt": prompt,
        "threeD_images_list": image_expr,
    }


# Expression that pulls the first output URL from the previous node.
PREV_URL = "={{ $json.outputs[0] }}"

# Reusable nano-banana-2 (Gemini-3 style) brief used in many skill examples.
NANO_BRIEF = (
    "Subject: a single product hero shot. Action: floating with subtle rotation. "
    "Context: minimalist studio with seamless cyclorama. Composition: 85mm lens, "
    "f/2.8, centered. Lighting: soft volumetric key from upper-left, gentle rim "
    "light. Style: cinematic, photorealistic, 4K commercial."
)


# ── Skill workflows ──────────────────────────────────────────────────────────

WORKFLOWS = {
    # ── Visual / image-only ──
    "Skill_NanoBanana.json": {
        "name": "MuAPI — Nano-Banana Pro T2I",
        "nodes": [{"name": "NanoBanana", "params": t2i("nano-banana-pro", NANO_BRIEF, "1:1")}],
        "links": [],
    },
    "Skill_NanoBanana2.json": {
        "name": "MuAPI — Nano-Banana 2 T2I",
        "nodes": [{"name": "NanoBanana2", "params": t2i(
            "nano-banana-2",
            "Reasoning brief: a stoic robot barista with exposed copper wiring, "
            "pouring a latte art leaf with mechanical precision, inside a neon-lit "
            "cyberpunk cafe at midnight, 85mm lens, f/1.8, volumetric blue rim light.",
            "3:2"
        )}],
        "links": [],
    },
    "Skill_LogoGenerator.json": {
        "name": "MuAPI — Logo Generator (FLUX 2 Pro)",
        "nodes": [{"name": "Logo", "params": t2i(
            "flux-2-pro",
            "Minimalist geometric logo for a tech startup named 'NORTH'. "
            "Single solid color, flat design, isolated on white, perfectly centered, "
            "negative space hides an upward arrow. Vector style.",
            "1:1"
        )}],
        "links": [],
    },
    "Skill_LogoBranding.json": {
        "name": "MuAPI — Logo + Monogram (Ideogram + Nano-Banana)",
        "nodes": [
            {"name": "Logo", "params": t2i("ideogram-v3",
                "Wordmark logo reading 'AURORA' in clean geometric sans-serif. "
                "Monochromatic deep navy, flat vector, isolated on pure white.",
                "1:1")},
            {"name": "Monogram", "params": t2i("nano-banana-pro",
                "Monogram of the letter 'A' as a geometric lockup, single color, "
                "flat vector, isolated white background, centered, scalable.",
                "1:1"), "pos": (720, 300)},
        ],
        # Both T2I run in parallel from the trigger
        "extra_trigger_targets": ["Monogram"],
        "links": [],
    },
    "Skill_YouTubeThumbnail.json": {
        "name": "MuAPI — YouTube Thumbnail (GPT-Image 2)",
        "nodes": [{"name": "Thumbnail", "params": t2i("gpt-image-2",
            "YouTube thumbnail, 16:9, bold expressive face on the left looking "
            "shocked, large readable text on the right reading 'INSANE RESULT!' in "
            "thick yellow outlined sans, dark vignetted background, high contrast.",
            "16:9")}],
        "links": [],
    },
    "Skill_BlogHeader.json": {
        "name": "MuAPI — Blog Header (GPT-Image 2)",
        "nodes": [{"name": "Header", "params": t2i("gpt-image-2",
            "Professional blog header image, 1200x628, abstract illustration of "
            "data flowing through circuits, deep blue and electric purple palette, "
            "modern flat design with subtle gradients, plenty of negative space.",
            "16:9")}],
        "links": [],
    },
    "Skill_InstagramPost.json": {
        "name": "MuAPI — Instagram Post (Nano-Banana 2)",
        "nodes": [{"name": "IGPost", "params": t2i("nano-banana-2",
            "Aesthetic Instagram post, square 1:1, flat lay of ceramic coffee cup, "
            "fresh croissant, and an open notebook on a beige linen background, "
            "warm morning light from the upper-left, leave breathing room for caption.",
            "1:1")}],
        "links": [],
    },
    "Skill_RedNoteCover.json": {
        "name": "MuAPI — RedNote Cover (Seedream V4.5)",
        "nodes": [{"name": "Cover", "params": t2i("seedream-v4.5",
            "Xiaohongshu/RedNote cover, 3:4 portrait, vibrant lifestyle aesthetic, "
            "girl holding a matcha drink, soft pastel palette, bold Chinese-style "
            "title block at the top with crisp hand-drawn typography.",
            "3:4")}],
        "links": [],
    },
    "Skill_KeyboardArt.json": {
        "name": "MuAPI — Keyboard Keycap Art (Ideogram)",
        "nodes": [{"name": "KeyboardArt", "params": t2i("ideogram-v3",
            "Top-down photograph of pristine mechanical-keyboard keycaps arranged "
            "to spell 'HELLO WORLD' centered on a clean wooden desk, soft natural "
            "light, precisely aligned, real keycap legends.",
            "16:9")}],
        "links": [],
    },
    "Skill_AdCreative.json": {
        "name": "MuAPI — Ad Creative (Nano-Banana Pro)",
        "nodes": [{"name": "AdCreative", "params": t2i("nano-banana-pro",
            "High-converting ad creative, 4:5 portrait, product hero of a "
            "premium skincare bottle on glossy marble, dewdrops, soft natural "
            "highlight, headline space reserved at the top reading 'GLOW DAILY'.",
            "4:5")}],
        "links": [],
    },
    "Skill_BrandKit.json": {
        "name": "MuAPI — Brand Kit (Logo + Palette + Type)",
        "nodes": [
            {"name": "Logo", "params": t2i("nano-banana-pro",
                "Logo concept for 'LUMEN' — minimalist sun + arc mark, single color, "
                "vector flat, isolated on white, centered.", "1:1")},
            {"name": "Palette", "params": t2i("gpt-image-2",
                "Brand color palette moodboard, 5 swatch chips horizontally, hex codes "
                "under each, premium magazine style, soft paper texture.", "16:9"),
                "pos": (720, 300)},
            {"name": "Typography", "params": t2i("nano-banana-pro",
                "Typography pairing sheet — large display sans-serif heading 'LUMEN', "
                "elegant serif subheading beneath, on cream paper, editorial layout.",
                "4:3"), "pos": (980, 300)},
        ],
        "extra_trigger_targets": ["Palette", "Typography"],
        "links": [],
    },
    "Skill_Storyboard.json": {
        "name": "MuAPI — Storyboard (Nano-Banana 2, 3 keyframes)",
        "nodes": [
            {"name": "Frame1", "params": t2i("nano-banana-2",
                "Storyboard frame 1: wide establishing shot of a futuristic city at "
                "sunrise, golden glow, cinematic 2.39:1 letterbox feel.", "16:9")},
            {"name": "Frame2", "params": t2i("nano-banana-2",
                "Storyboard frame 2: medium shot, lone hero in long coat walking "
                "down empty street, neon reflections, same city, same time of day.",
                "16:9"), "pos": (720, 300)},
            {"name": "Frame3", "params": t2i("nano-banana-2",
                "Storyboard frame 3: close-up of the same hero, determined expression, "
                "warm key light from the left, neon bokeh background.", "16:9"),
                "pos": (980, 300)},
        ],
        "extra_trigger_targets": ["Frame2", "Frame3"],
        "links": [],
    },
    "Skill_AmazonListing.json": {
        "name": "MuAPI — Amazon Listing (Hero + Lifestyle)",
        "nodes": [
            {"name": "Hero", "params": enhance("product-shot",
                product_image_url="https://example.com/product.jpg",
                scene_description="Pure white seamless background, soft studio key, gentle floor shadow")},
            {"name": "Lifestyle", "params": enhance("product-photography",
                enhance_image_url="https://example.com/product.jpg"),
                "pos": (720, 300)},
        ],
        "extra_trigger_targets": ["Lifestyle"],
        "links": [],
    },
    "Skill_MultiAngleShots.json": {
        "name": "MuAPI — Multi-Angle Product Shots (3 angles)",
        "nodes": [
            {"name": "Front", "params": i2i("nano-banana-2-edit",
                "Re-render the exact same product from a straight-on front view, "
                "white seamless background, soft studio light.",
                "https://example.com/product.jpg", "1:1")},
            {"name": "Side", "params": i2i("nano-banana-2-edit",
                "Re-render the exact same product from a 90° side profile view, "
                "white seamless background, same lighting.",
                "https://example.com/product.jpg", "1:1"),
                "pos": (720, 300)},
            {"name": "Top", "params": i2i("nano-banana-2-edit",
                "Re-render the exact same product from a top-down bird's-eye view, "
                "white seamless background, same lighting.",
                "https://example.com/product.jpg", "1:1"),
                "pos": (980, 300)},
        ],
        "extra_trigger_targets": ["Side", "Top"],
        "links": [],
    },
    "Skill_PhotoPackGenerator.json": {
        "name": "MuAPI — Photo Pack (Identity-Lock)",
        "nodes": [{"name": "PhotoPack", "params": i2i("photo-pack",
            "Generate a professional LinkedIn-style headshot pack. "
            "Preserve the exact facial identity from the reference image. "
            "Do not modify eye shape, nose, jawline, cheekbones, or face proportions.",
            "https://example.com/face.jpg", "1:1")}],
        "links": [],
    },
    "Skill_ActionFigure.json": {
        "name": "MuAPI — Action Figure Generator",
        "nodes": [{"name": "ActionFigure", "params": i2i("nano-banana-2-edit",
            "Convert the person in the reference image into a 6-inch collectible "
            "action figure on a blister-pack card with logo and tagline. Preserve "
            "the face exactly. Studio product-shot lighting.",
            "https://example.com/person.jpg", "3:4")}],
        "links": [],
    },
    "Skill_FashionTryOn.json": {
        "name": "MuAPI — Fashion Try-On + Animate",
        "nodes": [
            {"name": "TryOn", "params": i2i("qwen-edit-plus",
                "Dress the person in @image1 with the outfit shown in @image2. "
                "Preserve identity and pose. Natural fit and folds, realistic shadows.",
                "https://example.com/person.jpg,https://example.com/outfit.jpg",
                "9:16")},
            {"name": "Animate", "params": i2v_list(
                "seedance-v1.5-pro-i2v",
                "The model takes one elegant turn revealing the outfit. Studio runway feel.",
                PREV_URL, "9:16", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("TryOn", "Animate")],
    },
    "Skill_UGCLifestyleTryOn.json": {
        "name": "MuAPI — UGC Lifestyle Try-On",
        "nodes": [
            {"name": "Dress", "params": vedit("dress-change",
                dress_model_image_url="https://example.com/person.jpg",
                dress_garment_image_url="https://example.com/garment.jpg")},
            {"name": "Animate", "params": i2v_url(
                "kling-v3-pro-i2v",
                "Natural UGC lifestyle clip. Subject smiles at the camera and "
                "casually adjusts the sleeve. Soft handheld feel.",
                PREV_URL, "9:16", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Dress", "Animate")],
    },
    "Skill_SelfieWithCelebrity.json": {
        "name": "MuAPI — Selfie with Celebrity",
        "nodes": [
            {"name": "Selfie", "params": i2i("nano-banana-2-edit",
                "Generate a realistic BTS selfie of the person in @image1 with the "
                "person in @image2, arms-length camera angle, warm event lighting. "
                "Preserve both facial identities exactly.",
                "https://example.com/user.jpg,https://example.com/celeb.jpg",
                "9:16")},
            {"name": "Animate", "params": i2v_url(
                "veo3.1-i2v",
                "Both subjects laugh and turn slightly toward each other. "
                "Subtle handheld motion.",
                PREV_URL, "9:16", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Selfie", "Animate")],
    },
    "Skill_FloorPlanRendering.json": {
        "name": "MuAPI — Floor Plan 2D → 3D",
        "nodes": [{"name": "Render3D", "params": i2i("nano-banana-2-edit",
            "Convert the 2D floor plan in @image1 into a realistic 3D isometric "
            "architectural rendering with furniture, plants, and warm interior light.",
            "https://example.com/plan.jpg", "16:9")}],
        "links": [],
    },
    "Skill_InteriorDesign.json": {
        "name": "MuAPI — Interior Design + Walkthrough",
        "nodes": [
            {"name": "Redesign", "params": i2i("flux-kontext-pro-i2i",
                "Redesign this room in Japandi style — light oak floor, off-white "
                "walls, low linen sofa, large floor lamp, indoor plant. Keep the geometry.",
                "https://example.com/room.jpg", "16:9")},
            {"name": "Walkthrough", "params": i2v_url(
                "kling-v3-pro-i2v",
                "Slow architectural dolly through the redesigned space. Soft daylight.",
                PREV_URL, "16:9", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Redesign", "Walkthrough")],
    },
    "Skill_InteriorVisualizer.json": {
        "name": "MuAPI — Interior Visualizer (Empty → Furnished)",
        "nodes": [
            {"name": "EmptyRoom", "params": t2i("gpt-image-2",
                "Empty modern living room, large window with soft morning light, "
                "matte beige walls, light oak parquet floor, photo-realistic.", "16:9")},
            {"name": "Furnish", "params": i2i("nano-banana-2-edit",
                "Furnish this room: low linen sofa, oak coffee table, soft rug, "
                "indoor plant, floor lamp, framed art on the wall. Preserve geometry.",
                PREV_URL, "16:9"),
                "pos": (720, 300)},
        ],
        "links": [("EmptyRoom", "Furnish")],
    },
    "Skill_CoupleGrid.json": {
        "name": "MuAPI — Couple Grid (Qwen Edit Plus)",
        "nodes": [{"name": "Grid", "params": i2i("qwen-edit-plus",
            "Create a 6-cell grid (2 rows × 3 cols) of the couple in @image1 in "
            "six romantic poses and outfits. Preserve both identities exactly. "
            "Consistent style across cells.",
            "https://example.com/couple.jpg", "1:1")}],
        "links": [],
    },
    "Skill_ColorAnalysisBoard.json": {
        "name": "MuAPI — Color Analysis Board (GPT-Image 2 Edit)",
        "nodes": [{"name": "Board", "params": i2i("gpt-image-2-image-to-image",
            "Create a high-end editorial \"Color Analysis Board\" from this portrait "
            "in a luxury fashion magazine style (Dior / Ralph Lauren aesthetic). "
            "Clean beige/ivory background, warm tones, soft diffused lighting, "
            "ultra-detailed photorealistic, minimal elegant typography, grid-based layout. "
            "Main portrait centered with enhanced natural beauty (same identity). "
            "Panels: Your Best Colors (fabric swatches), Undertone (warm/neutral/cool), "
            "Colors to Avoid, Neutrals that Work, Prints that Flatter, Makeup guide "
            "(eyeshadow/blush/lips/highlighter), You in Your Colors (outfit variations), "
            "Hair colors, Jewelry, Style notes, Capsule wardrobe (outfits/shoes/bags).",
            "https://example.com/portrait.jpg", "16:9")}],
        "links": [],
    },
    "Skill_MultiAngleReshoot.json": {
        "name": "MuAPI — Multi-Angle Reshoot (Fish-eye + Low-angle)",
        "nodes": [
            {"name": "FishEye", "params": i2i("nano-banana-pro-edit",
                "Re-render the exact same scene from @image1 with a fish-eye lens, "
                "dramatic curvature at the edges. Preserve subject identity exactly.",
                "https://example.com/subject.jpg", "1:1")},
            {"name": "LowAngle", "params": i2i("nano-banana-pro-edit",
                "Re-render the exact same scene from @image1 as a low-angle hero shot, "
                "camera looking up at the subject. Preserve identity exactly.",
                "https://example.com/subject.jpg", "1:1"),
                "pos": (720, 300)},
        ],
        "extra_trigger_targets": ["LowAngle"],
        "links": [],
    },
    "Skill_CartoonDance.json": {
        "name": "MuAPI — Cartoon Dance Animation",
        "nodes": [
            {"name": "Toon", "params": i2i("nano-banana-2-edit",
                "Convert the person in @image1 into a Pixar-style 3D stylized character. "
                "Preserve identity (face shape, hair, outfit) exactly. Smooth plastic skin, "
                "soft rounded features, big expressive eyes, cinematic studio lighting, "
                "high-end character sculpting, octane-render quality. Clean studio background.",
                "https://example.com/person.jpg", "9:16")},
            {"name": "Dance", "params": i2v_url(
                "kling-v2.6-std-motion-control",
                "Smooth, fluid 3D character animation. Energetic, lively dance moves with "
                "dynamic motion. Consistent character details, Pixar animation quality.",
                PREV_URL, "9:16", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Toon", "Dance")],
    },
    "Skill_FreezeEffectVideo.json": {
        "name": "MuAPI — Freeze Effect Video (Time-Stop)",
        "nodes": [{"name": "Freeze", "params": i2v_url(
            "seedance-v2.0-i2v",
            "Ultra-realistic, shot on Arri Alexa Mini, 35mm lens, moody sports bar interior "
            "with neon accents, volumetric haze, shallow DOF. The person from @image1 walks "
            "confidently through a packed crowd and snaps their fingers — a spherical "
            "shockwave ripples outward and everything freezes mid-motion: golden arcs of beer "
            "suspended in air, popcorn floating, people locked mid-cheer. Only the subject "
            "moves, tracking backward through the frozen scene, plucks a kernel from midair, "
            "whispers 'perfect', then snaps again — a reverse shockwave resumes motion and "
            "the celebration explodes back to life.",
            "https://example.com/person.jpg", "16:9", 10, "720p")}],
        "links": [],
    },
    "Skill_Brochure.json": {
        "name": "MuAPI — Brochure (Cover + Spread)",
        "nodes": [
            {"name": "Cover", "params": t2i("seedream-v4.5",
                "Brochure cover for a coastal real-estate brand — large hero photo "
                "of an ocean villa at sunset, brand name 'AZURE STAYS' set in elegant "
                "serif at the bottom, premium magazine layout.",
                "3:4")},
            {"name": "Spread", "params": t2i("seedream-v4.5",
                "Brochure inner spread (landscape), two pages, left page: full-bleed "
                "lifestyle photo. Right page: paragraph copy block, headline, three "
                "small spot photos. Same brand palette.",
                "16:9"),
                "pos": (720, 300)},
        ],
        "extra_trigger_targets": ["Spread"],
        "links": [],
    },
    "Skill_UrlToDesign.json": {
        "name": "MuAPI — URL to Design Redesign",
        "nodes": [{"name": "Redesign", "params": i2i("gpt4o-edit",
            "Redesign this website screenshot with modern UI: cleaner hierarchy, "
            "8pt spacing, generous whitespace, modern type, vibrant accent color.",
            "https://example.com/site-screenshot.jpg", "16:9")}],
        "links": [],
    },
    "Skill_DesignGuide.json": {
        "name": "MuAPI — Design Guide (Palette + Type + Components)",
        "nodes": [
            {"name": "Palette", "params": t2i("gpt-image-2",
                "Page 1: color palette page — 5 large swatches with hex codes and "
                "names, premium design-system layout.", "3:2")},
            {"name": "Typography", "params": t2i("nano-banana-pro",
                "Page 2: typography pairings — H1/H2/H3 + body samples, two type "
                "families displayed side-by-side, editorial layout.", "3:2"),
                "pos": (720, 300)},
            {"name": "Components", "params": t2i("nano-banana-pro",
                "Page 3: UI component preview — buttons, input fields, cards, "
                "navbar, all on a soft neutral background.", "3:2"),
                "pos": (980, 300)},
        ],
        "extra_trigger_targets": ["Typography", "Components"],
        "links": [],
    },
    "Skill_SocialPack.json": {
        "name": "MuAPI — Social Pack (IG/TT/X reframe)",
        "nodes": [
            {"name": "Instagram", "params": i2i("nano-banana-2-edit",
                "Reframe to 1:1 Instagram square, preserve subject and brand layout, "
                "extend the background naturally.",
                "https://example.com/hero.jpg", "1:1")},
            {"name": "TikTok", "params": i2i("nano-banana-2-edit",
                "Reframe to 9:16 TikTok vertical, preserve subject, extend background.",
                "https://example.com/hero.jpg", "9:16"),
                "pos": (720, 300)},
            {"name": "Twitter", "params": i2i("nano-banana-2-edit",
                "Reframe to 16:9 Twitter/X landscape, preserve subject, extend background.",
                "https://example.com/hero.jpg", "16:9"),
                "pos": (980, 300)},
        ],
        "extra_trigger_targets": ["TikTok", "Twitter"],
        "links": [],
    },

    # ── Motion / video skills ──
    "Skill_Seedance2_T2V.json": {
        "name": "MuAPI — Seedance 2 Text-to-Video",
        "nodes": [{"name": "T2V", "params": t2v("seedance-2-t2v",
            "Aerial drone push-in over a moonlit desert canyon. Subject: lone "
            "figure on the cliff edge. Lens: 24mm. Move: low-altitude orbital. "
            "Lighting: silver moon key, warm fill from torch.",
            "16:9", 5)}],
        "links": [],
    },
    "Skill_Seedance2_OmniReference.json": {
        "name": "MuAPI — Seedance 2 Omni Reference",
        "nodes": [{"name": "Omni", "params": {
            "category": "imageToVideo",
            "model": "seedance-2.0-omni-ref",
            "i2v_prompt": ("Combine character from @image1, prop from @image2, "
                           "setting from @image3 into a cinematic medium shot."),
            "omni_aspect_ratio": "16:9",
            "omni_duration": 5,
            "omni_images_list": ("https://example.com/img1.jpg,"
                                 "https://example.com/img2.jpg,"
                                 "https://example.com/img3.jpg"),
            "omni_video_files": "",
            "omni_audio_files": "",
        }}],
        "links": [],
    },
    "Skill_Seedance2_FirstLastFrame.json": {
        "name": "MuAPI — Seedance 2 First-Last Frame",
        "nodes": [{"name": "FLF", "params": i2v_list(
            "seedance-2-first-last-frame",
            "Smoothly interpolate between the two frames with naturalistic motion.",
            "https://example.com/first.jpg,https://example.com/last.jpg",
            "16:9", 5, "720p")}],
        "links": [],
    },
    "Skill_CinemaDirector.json": {
        "name": "MuAPI — Cinema Director (Kling V3 Pro)",
        "nodes": [{"name": "Shot", "params": i2v_url(
            "kling-v3-pro-i2v",
            "Director brief: Lens 35mm. Move: slow dolly-in. Subject holds gaze. "
            "Lighting: warm key, cool rim. Atmosphere: rain mist particles.",
            "https://example.com/ref.jpg", "21:9", 5, "720p")}],
        "links": [],
    },
    "Skill_DroneStyleVideo.json": {
        "name": "MuAPI — Drone Style Video (Veo 3.1)",
        "nodes": [{"name": "Drone", "params": t2v(
            "veo3.1",
            "Aerial drone footage. Subject: turquoise coastline with cliffs. "
            "Move: sweeping orbit at 80m altitude. Time: golden hour. "
            "Lens: 24mm wide. Stabilized cinematic feel.",
            "16:9", 8, "1080p")}],
        "links": [],
    },
    "Skill_OneShotVideo.json": {
        "name": "MuAPI — One-Shot Continuous Video (Veo 3.1 I2V)",
        "nodes": [{"name": "OneShot", "params": i2v_url(
            "veo3.1-i2v",
            "Continuous one-shot: camera glides through the doorway, follows "
            "the subject down the corridor, ends on their face in close-up. "
            "No cuts, no edits, single take.",
            "https://example.com/start.jpg", "21:9", 8, "720p")}],
        "links": [],
    },
    "Skill_3DLogoAnimation.json": {
        "name": "MuAPI — 3D Logo Animation (Edit + Veo)",
        "nodes": [
            {"name": "Logo3D", "params": i2i("nano-banana-2-edit",
                "Convert this flat 2D logo into a premium 3D version — beveled edges, "
                "soft metallic shading, on a deep gradient background.",
                "https://example.com/logo2d.png", "16:9")},
            {"name": "Animate", "params": i2v_url(
                "veo3.1-fast-i2v",
                "The 3D logo rotates slowly, sweeping specular highlight passes "
                "across the bevel. Premium product reveal feel.",
                PREV_URL, "16:9", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Logo3D", "Animate")],
    },
    "Skill_AnimalVideoGenerator.json": {
        "name": "MuAPI — Animal Vlogger Video",
        "nodes": [
            {"name": "Character", "params": t2i("nano-banana-pro",
                "Photorealistic anthropomorphic golden retriever in a hoodie, "
                "sitting at a desk like a YouTube vlogger, ring light, microphone.",
                "9:16")},
            {"name": "Animate", "params": i2v_url(
                "veo3.1-fast-i2v",
                "The dog speaks expressively into the microphone, paws gesturing. "
                "Subtle camera bob.",
                PREV_URL, "9:16", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Character", "Animate")],
    },
    "Skill_CharacterStoryVideo.json": {
        "name": "MuAPI — Character Story Video",
        "nodes": [
            {"name": "Character", "params": t2i("nano-banana-pro",
                "Establish the hero character: young explorer in worn leather jacket, "
                "amber eyes, soft natural light. Reference sheet, neutral background.",
                "1:1")},
            {"name": "Scene", "params": i2i("flux-kontext-pro-i2i",
                "Place the same character in scene 1: standing at the edge of a "
                "misty forest at dawn. Preserve identity exactly.",
                PREV_URL, "16:9"),
                "pos": (720, 300)},
            {"name": "Shot", "params": i2v_url(
                "kling-v3-pro-i2v",
                "Camera dollies forward as the character steps into the forest. "
                "Cinematic, naturalistic motion.",
                PREV_URL, "16:9", 5, "720p"),
                "pos": (980, 300)},
        ],
        "links": [("Character", "Scene"), ("Scene", "Shot")],
    },
    "Skill_GiantProductShowcase.json": {
        "name": "MuAPI — Giant Product Showcase",
        "nodes": [
            {"name": "Giant", "params": i2i("nano-banana-2-edit",
                "Re-render the product from @image1 at a colossal building-size scale, "
                "placed in the middle of a busy city plaza, cinematic low-angle shot.",
                "https://example.com/product.jpg", "16:9")},
            {"name": "Animate", "params": i2v_url(
                "veo3.1-fast-i2v",
                "Camera slowly rises tilting up to reveal the full giant product. "
                "City sounds, crowd reactions.",
                PREV_URL, "16:9", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Giant", "Animate")],
    },
    "Skill_JewelryProductVideo.json": {
        "name": "MuAPI — Jewelry Macro Video",
        "nodes": [
            {"name": "Studio", "params": i2i("nano-banana-2-edit",
                "Place the jewelry on black velvet, dramatic spotlight, macro studio "
                "shot, hyper-detailed.",
                "https://example.com/ring.jpg", "16:9")},
            {"name": "Animate", "params": i2v_url(
                "grok-i2v",
                "Slow macro orbit around the jewel, light catches each facet, "
                "luxury commercial feel.",
                PREV_URL, "16:9", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Studio", "Animate")],
    },
    "Skill_MusicVideo.json": {
        "name": "MuAPI — Music Video (Image + Veo + Suno)",
        "nodes": [
            {"name": "Keyframe", "params": t2i("nano-banana-pro",
                "Synthwave city skyline at night, neon horizon, lone figure on rooftop.",
                "16:9")},
            {"name": "Shot", "params": i2v_url(
                "veo3.1-i2v",
                "Slow camera dolly toward the figure as neon lights pulse with the beat.",
                PREV_URL, "16:9", 5, "720p"),
                "pos": (720, 300)},
            {"name": "Music", "params": audio(
                "suno-create",
                "Retro synthwave instrumental, 80 BPM, lush analog pads, driving "
                "arpeggio, cinematic build.",
                suno_style="synthwave", suno_model="chirp-v4", suno_instrumental=True),
                "pos": (980, 300)},
        ],
        "links": [("Keyframe", "Shot")],
        "extra_trigger_targets": ["Music"],
    },
    "Skill_ProductAdCinematic.json": {
        "name": "MuAPI — Product Ad Cinematic",
        "nodes": [
            {"name": "Hero", "params": i2i("nano-banana-2",
                "Cinematic product hero shot — marble surface, sweeping volumetric "
                "light, depth-of-field background, premium commercial look.",
                "https://example.com/product.jpg", "16:9")},
            {"name": "Animate", "params": i2v_url(
                "kling-v3-std-i2v",
                "Cinematic 8s product ad: slow rotate revealing the silhouette, "
                "dramatic backlight bloom, dust particles drifting.",
                PREV_URL, "16:9", 8, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Hero", "Animate")],
    },
    "Skill_ProductShowcaseVideo.json": {
        "name": "MuAPI — Product Showcase Video",
        "nodes": [
            {"name": "Edit", "params": i2i("seedream-edit-v4.5",
                "Surround the product with an explosive splash of its key ingredients "
                "frozen mid-air. High-end commercial macro.",
                "https://example.com/product.jpg", "9:16")},
            {"name": "Animate", "params": i2v_list(
                "seedance-v1.5-pro-i2v-fast",
                "Macro motion: ingredients orbit the product, ending on a centered "
                "hero shot.",
                PREV_URL, "9:16", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Edit", "Animate")],
    },
    "Skill_ProductVideoAdMaker.json": {
        "name": "MuAPI — Product Video Ad Maker",
        "nodes": [
            {"name": "Edit", "params": i2i("flux-2-pro-edit",
                "Re-render the product on a polished black surface with theatrical "
                "rim light. Studio commercial feel.",
                "https://example.com/product.jpg", "16:9")},
            {"name": "Animate", "params": i2v_list(
                "wan2.5-i2v",
                "High-end ad shot: slow camera arc around the product, soft particle "
                "drift, premium commercial tone.",
                PREV_URL, "16:9", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Edit", "Animate")],
    },
    "Skill_TalkingBabyVideo.json": {
        "name": "MuAPI — Talking Baby Video",
        "nodes": [
            {"name": "Baby", "params": t2i("wan2.5-t2i",
                "Photorealistic 1-year-old baby wearing a tiny astronaut costume, "
                "studio backdrop, dramatic key light. Family-friendly.",
                "9:16")},
            {"name": "Animate", "params": i2v_url(
                "grok-i2v",
                "The baby grins and speaks expressively to the camera, hands moving "
                "in cute gestures. Soft handheld feel.",
                PREV_URL, "9:16", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Baby", "Animate")],
    },
    "Skill_AiFightScene.json": {
        "name": "MuAPI — AI Fight Scene",
        "nodes": [
            {"name": "Storyboard", "params": t2i("gpt-image-2",
                "16-cell storyboard grid (4×4) of an action scene: two warriors duel "
                "across a rainy rooftop, each cell a unique cut.",
                "1:1")},
            {"name": "Animate", "params": i2v_list(
                "seedance-v2.0-i2v",
                "Animate the storyboard into a high-cut-density fight sequence, "
                "rapid action, motion blur, impact frames.",
                PREV_URL, "16:9", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Storyboard", "Animate")],
    },
    "Skill_UGCAdsWorkflow.json": {
        "name": "MuAPI — UGC Ad Workflow",
        "nodes": [
            {"name": "Scene", "params": t2i("gpt-image-2",
                "Authentic UGC selfie scene — young woman in cozy kitchen holding a "
                "branded snack bar, natural window light.",
                "9:16")},
            {"name": "Animate", "params": i2v_url(
                "veo3.1-i2v",
                "Subject takes a bite, reacts with genuine delight, talks to camera. "
                "Handheld feel.",
                PREV_URL, "9:16", 8, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Scene", "Animate")],
    },
    "Skill_SocialMediaVideo.json": {
        "name": "MuAPI — Social Media Hero Video",
        "nodes": [
            {"name": "Hero", "params": t2i("imagen4-ultra",
                "Brand-aware social hero frame, vertical 9:16, energetic and "
                "on-brand for a wellness app — sunrise yoga silhouette over ocean.",
                "9:16")},
            {"name": "Animate", "params": i2v_url(
                "veo3.1-i2v",
                "Subtle parallax push-in, waves move, sun rises slightly. "
                "Calm pacing for social.",
                PREV_URL, "9:16", 5, "720p"),
                "pos": (720, 300)},
        ],
        "links": [("Hero", "Animate")],
    },

    # ── Edit / clipping ──
    "Skill_AiClipping.json": {
        "name": "MuAPI — AI Clipping (viral 9:16)",
        "nodes": [{"name": "Clip", "params": vedit(
            "ai-clipping",
            clip_video_url="https://example.com/source.mp4",
            clip_num_highlights=5,
            clip_aspect_ratio="9:16")}],
        "links": [],
    },
    "Skill_YoutubeShorts.json": {
        "name": "MuAPI — YouTube Shorts Auto-Clip",
        "nodes": [{"name": "Shorts", "params": vedit(
            "ai-clipping",
            clip_video_url="https://example.com/long-form.mp4",
            clip_num_highlights=5,
            clip_aspect_ratio="9:16")}],
        "links": [],
    },
    "Skill_ProductCampaign.json": {
        "name": "MuAPI — Product Campaign (Hero + Lifestyle + Video)",
        "nodes": [
            {"name": "HeroShot", "params": enhance(
                "product-shot",
                product_image_url="https://example.com/product.jpg",
                scene_description="Premium hero shot, white seamless, soft studio light")},
            {"name": "Lifestyle", "params": i2i("seedream-edit-v4.5",
                "Place the product in an aspirational lifestyle scene — modern "
                "kitchen counter, morning sunlight, plants in soft focus background.",
                "https://example.com/product.jpg", "16:9"),
                "pos": (720, 300)},
            {"name": "Animate", "params": i2v_url(
                "kling-v3-pro-i2v",
                "Slow cinematic dolly across the lifestyle scene, ending on the "
                "product hero close-up.",
                "={{ $('Lifestyle').first().json.outputs[0] }}",
                "16:9", 5, "720p"),
                "pos": (980, 300)},
        ],
        "extra_trigger_targets": ["Lifestyle"],
        "links": [("Lifestyle", "Animate")],
    },

    # ── 3D skills ──
    "Skill_ImageTo3D_Tripo.json": {
        "name": "MuAPI — Image-to-3D (Tripo3D P1)",
        "nodes": [{"name": "To3D", "params": three_d(
            "tripo3d-p1-image-to-3d",
            "",
            "https://example.com/ref.jpg")}],
        "links": [],
    },
    "Skill_TextTo3D_Meshy.json": {
        "name": "MuAPI — Text-to-3D (Meshy 6)",
        "nodes": [{"name": "To3D", "params": three_d(
            "meshy-6-text-to-3d",
            "A stylized treasure chest, low-poly, fantasy game-ready asset, "
            "wood and brass, PBR textures.",
            "")}],
        "links": [],
    },
}


def main():
    written = []
    for fname, spec in WORKFLOWS.items():
        # Apply extra_trigger_targets — branches off the manual trigger that should
        # also start additional MuAPI nodes (for parallel multi-image workflows).
        wf = build_workflow(spec["name"], spec["nodes"], spec["links"])
        for extra in spec.get("extra_trigger_targets", []):
            trig = wf["nodes"][0]["name"]
            wf["connections"][trig]["main"][0].append(
                {"node": extra, "type": "main", "index": 0}
            )
        path = OUT_DIR / fname
        path.write_text(json.dumps(wf, indent=2))
        written.append(fname)
    print(f"Wrote {len(written)} workflows to {OUT_DIR}")
    for n in written:
        print(f"  - {n}")


if __name__ == "__main__":
    main()
