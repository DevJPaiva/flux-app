import { useEffect } from 'react'
import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Tema do Flux (Dark / Light)',
      toolbar: {
        title: 'Tema',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Escuro (Dark)', icon: 'moon' },
          { value: 'light', title: 'Claro (Light)', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'dark'
      useEffect(() => {
        document.documentElement.dataset.theme = theme
      }, [theme])
      return (
        <div
          style={{
            minHeight: '100%',
            padding: '24px',
            background: 'var(--eg-bg)',
            color: 'var(--eg-text)',
            fontFamily: 'var(--eg-font-body)',
          }}
        >
          <Story />
        </div>
      )
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
  },
}

export default preview
