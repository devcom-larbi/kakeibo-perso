import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#24365C' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#24365C' } },
  },
  images: ['public/icon.svg'],
})
