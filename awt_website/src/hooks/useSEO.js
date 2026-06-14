import { useEffect } from 'react'

const defaultSeo = {
  title: 'AWT Lectures | Advanced Web Technologies',
  description: 'Learn Advanced Web Technologies with interactive lectures, practical labs, real code examples, and progress tracking.',
  image: '/pwa-512x512.svg',
  type: 'website',
  robots: 'index, follow'
}

function upsertMeta(selector, attribute, value) {
  if (!value) return

  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    const name = selector.match(/\[name="([^"]+)"\]/)?.[1]
    const property = selector.match(/\[property="([^"]+)"\]/)?.[1]
    if (name) element.setAttribute('name', name)
    if (property) element.setAttribute('property', property)
    document.head.appendChild(element)
  }

  element.setAttribute(attribute, value)
}

function upsertCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

export function useSEO(options = {}) {
  useEffect(() => {
    const seo = { ...defaultSeo, ...options }
    const canonical = seo.canonical || window.location.href.split('#')[0]
    const imageUrl = new URL(seo.image, window.location.origin).href

    document.title = seo.title
    upsertCanonical(canonical)
    upsertMeta('meta[name="description"]', 'content', seo.description)
    upsertMeta('meta[name="robots"]', 'content', seo.robots)
    upsertMeta('meta[name="theme-color"]', 'content', '#020b16')
    upsertMeta('meta[property="og:title"]', 'content', seo.title)
    upsertMeta('meta[property="og:description"]', 'content', seo.description)
    upsertMeta('meta[property="og:type"]', 'content', seo.type)
    upsertMeta('meta[property="og:url"]', 'content', canonical)
    upsertMeta('meta[property="og:image"]', 'content', imageUrl)
    upsertMeta('meta[property="og:site_name"]', 'content', 'AWT Lectures')
    upsertMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', 'content', seo.title)
    upsertMeta('meta[name="twitter:description"]', 'content', seo.description)
    upsertMeta('meta[name="twitter:image"]', 'content', imageUrl)
  }, [options.title, options.description, options.canonical, options.image, options.type, options.robots])
}
