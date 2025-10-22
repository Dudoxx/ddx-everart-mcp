# Image Dimension Testing Results

**Date**: 2025-10-22
**Version**: 1.0.4

## Test Configuration

- **API Key**: Provided and valid
- **Model**: FLUX1.1 (5000) - Standard quality
- **SDK Version**: everart 1.2.2
- **MCP Server**: ddx-everart-mcp v1.0.4

## Tests Performed

### Test 1: Default Dimensions
- **Request**: No height/width specified
- **Expected**: 1024x1024 (default)
- **Actual**: 1024x1024 ✅
- **Status**: PASS

### Test 2: Custom Dimensions (Non-compliant)
- **Request**: 1536x1024
- **Expected**: 1536x1024
- **Actual**: 1024x1024
- **Status**: FAIL - API overrides with default

### Test 3: Custom Dimensions (FLUX-compliant)
- **Request**: 1408x1024 (multiples of 32)
- **Expected**: 1408x1024
- **Actual**: 1024x1024
- **Status**: FAIL - API overrides with default

## Findings

### SDK Implementation ✅
The EverArt SDK (v1.2.2) correctly passes `height` and `width` parameters to the API:

```javascript
// From node_modules/everart/dist/v1/generations.js
if (options?.height) body.height = options.height;
if (options?.width) body.width = options.width;
```

Our MCP server correctly forwards these parameters to the SDK.

### API Behavior ⚠️
The EverArt API appears to ignore custom dimensions for model 5000 (FLUX1.1):
- Always returns 1024x1024 regardless of requested dimensions
- This may be a free tier limitation
- Or specific to certain models

### FLUX Dimension Requirements
According to documentation:
- **Min**: 256x256
- **Max**: 1440x1440
- **Requirement**: Multiples of 32
- **Default**: 1024x768

## Recommendations

### For Users
1. **Use default dimensions** (1024x1024) for reliable results
2. **Test different models** - other models may support custom dimensions
3. **Check API tier** - paid tiers might unlock custom dimensions
4. **Post-processing** - Use image editing tools to resize after generation

### For Implementation
Our implementation is correct:
- ✅ Parameters properly validated (256-2048, multiples of 32 recommended)
- ✅ SDK integration correct
- ✅ All parameters passed through correctly

The limitation appears to be API-side, not implementation-side.

## Next Steps

1. Test with other models (9000, 6000, 7000, 8000)
2. Contact EverArt support to clarify dimension support
3. Document which models support custom dimensions
4. Consider adding API tier detection

## Generated Images

All test images saved to: `/images/everart-*`

- `everart-2025-10-22T09-49-13-329Z.png` - 1024x1024 (default)
- `everart-2025-10-22T09-51-18-975Z.png` - 1024x1024 (requested 1408x1024)

Both images are high quality photorealistic landscapes with excellent detail.
