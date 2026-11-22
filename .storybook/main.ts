import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async (viteConfig) => {
    // Strip Figma Make server-only plugins that interfere with Storybook's Vite instance
    const ignored = new Set([
      'figma-site-configuration',
      'figma-error-overlay-replay',
      'figma-react-refresh-boundary-fallback',
      'figma-make-kit',
      'figma-linked-package-sourcemaps',
    ])
    viteConfig.plugins = (viteConfig.plugins ?? []).filter((plugin) => {
      if (plugin && typeof plugin === 'object' && 'name' in plugin) {
        return !ignored.has(String(plugin.name))
      }
      return true
    })
    return viteConfig
  },
}

export default config
