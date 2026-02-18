Here's a comprehensive breakdown for instructing a program to generate prompts for each model:

---

## Prompt Differences: Pony v6, Illustrious, SDXL (base), Juggernaut XL

---

### Architecture Shared by All Four
All four are SDXL-based (1024px native resolution). They all use the dual CLIP text encoders (ViT-L + OpenCLIP ViT-bigG). The raw token limit per CLIP chunk is 75 tokens (77 including BOS/EOS), but A1111/Forge automatically chains chunks in multiples of 75, so in practice prompts can be longer — though adherence degrades after the first chunk. Weight syntax is universally `(tag:1.3)` for increase, `(tag:0.8)` for decrease.

---

### 1. Pony Diffusion V6 XL

**Training data:** Booru imageboards (Danbooru, e621, Derpibooru) — heavily tag-based. Includes pony, furry, anime, cartoon, and some real-art styles.

**Prompt style:** Danbooru/e621 tags, comma-separated. Natural language also works but tags are more reliable and precise.

**Required quality prefix (mandatory):**
```
score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, [your tags]
```
This is a quirk from a training mistake — the model learned the entire string as a quality signal. Using just `score_9` alone has a much weaker effect.

**Special filter tags (use in positive or negative):**
- `source_anime`, `source_pony`, `source_furry`, `source_cartoon` — constrains which training subset to draw from
- `rating_safe`, `rating_questionable`, `rating_explicit` — controls content rating

**Artist tags:** Artist names were removed from training, so artist name tags are ineffective. Use style descriptors instead.

**Negative prompts:** Minimal or none needed by design. Creator states the model was designed to not need negatives. You can use them to steer style (e.g., put `source_pony` in negative to avoid pony-style bleed).

**Tag recognition threshold:** A tag needs ~1,000+ images on the source booru to be reliably recognized; ~3,000+ is safe.

**Token budget:** Keep content tags under ~75 tokens for best adherence. The mandatory quality string eats about 10 tokens, so you have ~65 left.

**Weights:** Standard SDXL syntax `(tag:1.3)`. Don't go above ~1.4.

**Example positive:**
```
score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up, 1girl, red hair, long hair, blue eyes, school uniform, sitting, outdoors, cherry blossoms, source_anime, rating_safe
```

---

### 2. Illustrious XL

**Training data:** Danbooru (up to 2023 in v0.1, up to June 2024 in v1.0+). Pure anime focus. Significantly larger dataset than Pony.

**Prompt style:** Danbooru tags are primary and most reliable. Natural language is increasingly supported (especially v1.0+/v2.0) but pure NLP still reduces quality vs. tags. Hybrid works well: use tags with small descriptive phrases mixed in (e.g., `leaning against wall` instead of `leaning back, against wall`).

**Required quality prefix:**
```
masterpiece, best quality, amazing quality, [optional: very aesthetic, newest]
```
Do NOT use Pony's score tags — they have zero effect on Illustrious.

**Subject tags:** Always specify number of subjects: `1girl`, `2boys`, etc. Use `focus` keyword for emphasis: `vehicle focus`, `animal focus`.

**Negative prompts:** Very important — unlike Pony, Illustrious responds strongly to negatives. A robust negative significantly improves output quality.
```
lowres, bad anatomy, bad hands, extra digits, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, sketch, monochrome, blurry
```

**Rating tags:** `safe`, `sensitive`, `explicit` can be used in front of the subject.

**Tag recognition threshold:** Much more sensitive than Pony — tags with as few as ~100 images on Danbooru are recognized reliably.

**Resolution:** Base resolution is 1536×1536 in v1.0+, not 1024. Lower resolutions work but quality drops.

**Token budget:** Quality tags (~5–8 tokens) + content. Same chunk rules apply. Avoid very long prompts — more words increases chance of ignored tags.

**Weights:** Standard `(tag:1.3)` syntax. Quality tags go at the front, composition modifiers at the end.

**Example positive:**
```
masterpiece, best quality, amazing quality, very aesthetic, newest, 1girl, red hair, long hair, blue eyes, school uniform, sitting, outdoors, cherry blossoms, smile, looking at viewer
```
**Example negative:**
```
lowres, worst quality, bad quality, bad anatomy, bad hands, sketch, jpeg artifacts, watermark, monochrome, blurry
```

---

### 3. SDXL (base / vanilla 1.0)

**Training data:** LAION-2B — broad, diverse, real-world photos, art, illustrations. Not booru-trained.

**Prompt style:** Both natural language sentences and comma-separated keywords work well. SDXL's dual text encoders give it much stronger natural language comprehension than SD 1.5. Descriptive sentences of 5–15 words per segment are effective.

**Quality tags:** No special prefix required, but common boosters help: `8k, highly detailed, sharp focus, professional photography`. Generic boosters like `masterpiece` have less effect here than on booru-trained models.

**Negative prompts:** Lighter than SD 1.5 — SDXL already handles quality better. A minimal negative is often sufficient: `worst quality, low quality, blurry, watermark`. No need for the massive negative chains that were common on 1.5.

**Artist tags:** Work reasonably well since LAION includes artist-labeled data.

**Token budget:** Per-chunk limit of 75 tokens. SDXL is more sensitive to weight adjustments than SD 1.5 — keep weights conservative, max ~1.4.

**Ordering:** Earlier tokens carry more weight. Structure as: Subject → Details → Setting → Style → Quality modifiers.

**Weights:** `(keyword:1.1)` is already noticeable. Don't go above 1.4.

**Example positive:**
```
A young woman with red hair sitting outdoors under cherry blossoms, wearing a school uniform, soft natural lighting, highly detailed, sharp focus, cinematic composition
```

---

### 4. Juggernaut XL

**Training data:** Curated photorealistic images, re-captioned with GPT-4 Vision in v10+. Hybrid dataset including some booru tags for NSFW. Focused on photorealism, portraits, and cinematic output.

**Prompt style:** Natural language sentences are primary. Tag/keyword style also works and is recommended by the creator for XI+, but full sentences are the model's strength. The first sentence is the most important and sets the image's foundation.

**Quality/trigger words:** No mandatory prefix chain. Instead, use specific trigger tokens for quality effects:
- `High Resolution` / `High-Resolution Image`
- `Cinematic`
- `Skin Textures` (for portrait skin detail)
- `photorealistic`, `photo`, `real picture`

**Negative prompts:** Start with no negative and add only what you don't want. Light negative is recommended. A common strong negative for photorealism:
```
(worst quality, low quality, normal quality, lowres:1.4), (watermark, signature, text:1.2), blur, morbid, ugly, bad anatomy, bad hands, cgi, 3D, digital art, anime, airbrushed, cartoon
```

**Token budget:** Strongly recommended to stay under 75 tokens for best prompt adherence. Exceeding the first chunk noticeably reduces adherence.

**Weights:** Use sparingly. Apply to primary subject or important objects: `(glowing enchanted axe:1.2)`. Keep max ~1.3.

**Special considerations:** Good at text generation for short phrases (use quotes: `a sign with the text "Peace"`). Struggles with hands/faces at distance (SDXL limitation). Combine tags and sentences rather than using one or the other exclusively for XI+.

**Example positive:**
```
High-Resolution portrait of a young woman with red hair sitting under cherry blossoms outdoors, wearing a school uniform, soft natural lighting, skin textures, cinematic, photorealistic
```

---

## Comparison Summary Table

| Feature | Pony v6 | Illustrious | SDXL Base | Juggernaut XL |
|---|---|---|---|---|
| **Base** | SDXL | SDXL | SDXL | SDXL |
| **Style** | Anime/furry/cartoon | Anime only | Anything / photorealistic | Photorealistic |
| **Prompt style** | Booru tags | Booru tags (+ NLP) | Natural language & tags | Natural language (+ tags) |
| **Quality prefix** | `score_9, score_8_up...` (mandatory chain) | `masterpiece, best quality, amazing quality` | None required; use descriptors | Trigger words like `High Resolution`, `Cinematic` |
| **Negative prompts** | Minimal / optional | Very important, use extensively | Light, optional | Light, add as needed |
| **Artist tags** | ❌ Removed from training | ✅ Works | ✅ Works | ✅ Works |
| **Source/rating filter tags** | ✅ (source_anime, rating_safe, etc.) | ✅ (safe, sensitive, explicit) | ❌ | ❌ |
| **Token limit guidance** | ~65 usable (prefix takes ~10) | ~70 usable | 75 per chunk, chains fine | Stay under 75 strictly |
| **Max weight recommended** | 1.4 | 1.4 | 1.4 | 1.3 |
| **Tag recognition sensitivity** | Need ~1k+ booru images | Need ~100+ booru images | Not booru-based | Not booru-based |
| **Optimal resolution** | 1024px | 1536px | 1024px | 1024px |

---

## Key Rules for Programmatic Prompt Generation

**For Pony v6:** Always prepend the full score string. Use underscore-formatted booru tags (`long_hair` → `long hair` is fine in most UIs, but check). Add source/rating tags to control style. Keep negatives minimal. No artist names.

**For Illustrious:** Prepend `masterpiece, best quality, amazing quality`. Specify subject count (`1girl`). Always include a meaningful negative. Don't use score tags. Tags are more reliable than NLP, but hybrid phrases work.

**For SDXL base:** Use natural language first, tags second. No mandatory prefix. Minimal negative. Early prompt position matters most. Weights are sensitive — keep them low.

**For Juggernaut:** Lead with a strong first sentence describing the image. Use trigger tokens for quality. Stay within 75 tokens. Add negatives only for specific unwanted elements. Mixing tags + short descriptive sentences works best on XI+.