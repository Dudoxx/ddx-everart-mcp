# EverArt Model Specifications

**Last Updated**: 2025-10-22
**Source**: Research from official documentation and community testing

## Public Models Available

| Model ID | Name | Parameters | Specialty |
|----------|------|------------|-----------|
| 5000 | FLUX1.1 [pro] | 12B | General purpose, standard quality |
| 9000 | FLUX1.1 [pro] (ultra) | 12B | General purpose, ultra quality |
| 6000 | SD 3.5 Large | 8B | Stable Diffusion, versatile |
| 7000 | Recraft V3 - Realistic | 20B | Photorealistic images |
| 8000 | Recraft V3 - Vector | 20B | Vector graphics (SVG) |

## Dimension Specifications

### FLUX Models (5000, 9000)
- **Min Size**: 256×256
- **Max Size**: 1440×1440
- **Requirement**: Dimensions must be multiples of 32
- **Default**: 1024×768
- **Supported Aspect Ratios**: Various (1:1, 4:3, 16:9, etc.)

**Recommended Sizes**:
```
Square:
- 512×512 (0.26 MP)
- 768×768 (0.59 MP)
- 1024×1024 (1.05 MP) ✅ Default
- 1152×1152 (1.33 MP)

Landscape (16:9):
- 768×432
- 1024×576
- 1152×648
- 1280×720
- 1408×792

Portrait (9:16):
- 432×768
- 576×1024
- 648×1152
- 720×1280

Standard (4:3):
- 768×576
- 1024×768 ✅ Recommended
- 1152×864
```

### SD 3.5 Large (6000)
- **Recommended Resolution**: ~1 megapixel total
- **Requirement**: Dimensions divisible by 64
- **Default**: 1024×1024
- **Sweet Spot**: 768×768 to 1152×1152

**Recommended Sizes**:
```
Square:
- 768×768 (0.59 MP) ✅ Best for stage 1
- 1024×1024 (1.05 MP) ✅ Default
- 1152×1152 (1.33 MP)

Portrait (2:3):
- 576×864 (0.50 MP) ✅ Good for portraits
- 768×1152 (0.88 MP)

Landscape (3:2):
- 864×576
- 1152×768

Custom:
- 800×1152 (0.92 MP)
- 960×1088 (1.04 MP)
```

### Recraft V3 (7000, 8000)
- **Parameters**: 20 billion (largest model)
- **Aspect Ratios**: 1:1 to 16:9
- **Specialty**:
  - 7000: Photorealistic with excellent skin texture
  - 8000: Vector graphics (SVG only)

**Recommended Sizes**:
```
Square (1:1):
- 1024×1024 ✅ Default

Social Media:
- 1080×1080 (Instagram square)
- 1080×1350 (Instagram portrait)
- 1200×630 (Facebook/LinkedIn)

Widescreen (16:9):
- 1920×1080 (Full HD)
- 1280×720 (HD)
- 1024×576

Portrait (9:16):
- 1080×1920 (Instagram/TikTok stories)
- 720×1280

Professional:
- 1200×1800 (2:3 portrait)
- 1600×1200 (4:3 standard)
```

## Format Support

| Model | PNG | JPEG | WebP | SVG |
|-------|-----|------|------|-----|
| 5000 | ✅ | ✅ | ✅ | ❌ |
| 9000 | ✅ | ✅ | ✅ | ❌ |
| 6000 | ✅ | ✅ | ✅ | ❌ |
| 7000 | ✅ | ✅ | ✅ | ❌ |
| 8000 | ✅ | ✅ | ✅ | ✅ |

**Note**: SVG format is ONLY available with model 8000 (Recraft V3 - Vector)

## Generation Types

All models support:
- **txt2img**: Text-to-image generation
- **img2img**: Image-to-image transformation (requires image URL)

## Best Practices

### For General Use
1. Start with **1024×1024** (works for all models)
2. Use **multiples of 32** for FLUX models
3. Use **multiples of 64** for SD 3.5 Large
4. Keep total pixels around **1 megapixel** for best quality

### For Specific Use Cases

**Portraits**:
- SD 3.5: 576×864 or 768×1152
- Recraft V3: 1080×1350

**Landscapes**:
- FLUX: 1408×792 or 1280×720
- SD 3.5: 1152×768

**Social Media**:
- Square: 1080×1080
- Story: 1080×1920
- Post: 1200×630

**Printing**:
- SD 3.5 Large: Generate at 768×768, upscale to 1152×1152
- Recraft V3: 1600×1200 or higher

### Model Selection Guide

**Choose FLUX 5000** when:
- General purpose images needed
- Standard quality acceptable
- Fast generation desired

**Choose FLUX 9000** when:
- Highest quality required
- Professional outputs needed
- Complex scenes

**Choose SD 3.5 Large (6000)** when:
- Versatile, balanced outputs
- Good detail at medium res
- Portrait photography style

**Choose Recraft V3 Realistic (7000)** when:
- Photorealistic human portraits
- Accurate skin textures
- Natural lighting required
- Highest parameter count needed

**Choose Recraft V3 Vector (8000)** when:
- Vector graphics needed (SVG)
- Logos, icons, illustrations
- Scalable graphics required

## Known Limitations

### API Behavior
⚠️ **Important**: Based on testing with model 5000, the EverArt API may override custom dimensions and return 1024×1024 regardless of requested size. This appears to be:
- Free tier limitation
- Model-specific behavior
- Account-specific setting

**Recommendation**: Always check actual image dimensions after generation using:
```bash
sips -g pixelWidth -g pixelHeight image.png
```

### Testing Needed
Further testing required to confirm which models respect custom dimensions:
- [ ] Model 9000 (FLUX ultra)
- [ ] Model 6000 (SD 3.5)
- [ ] Model 7000 (Recraft Realistic)
- [ ] Model 8000 (Recraft Vector)

## References

- FLUX Documentation: https://docs.aimlapi.com/api-references/image-models/flux
- SD 3.5 Guide: https://sandner.art/stable-diffusion-35-large-what-you-need-to-know/
- Recraft V3 Analysis: https://blog.segmind.com/new-to-recraft-v3-heres-what-you-need-to-know/
- EverArt SDK: https://github.com/newcompute-ai/everart-node-sdk
