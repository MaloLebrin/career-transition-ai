/// <reference path="../adonisrc.ts" />
/// <reference path="../config/inertia.ts" />

import { ErrorBoundary } from '~/components/errors/ErrorBoundary'
import { APP_NAME } from '#shared/constants/app'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp } from '@inertiajs/react'
import { hydrateRoot } from 'react-dom/client'
import './css/app.css'

const appName = import.meta.env.VITE_APP_NAME || APP_NAME

createInertiaApp({
  progress: { color: '#1d6a70' }, // = --color-accent (inertia/css/app.css)

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    hydrateRoot(
      el,
      <ErrorBoundary>
        <App {...props} />
      </ErrorBoundary>
    )
  },
})
