import catalogRoutes from '@/data/generated/catalog-routes.json'

export function legacyCatalogRedirect(url: URL): URL | null {
  const match = url.pathname.match(/^(?:\/(en|zh))?\/(courses|universities)\/?$/)
  if (!match) return null
  const locale = match[1] === 'zh' ? 'zh' : 'en'
  const prefix = locale === 'zh' ? '/zh' : ''
  const destination = new URL(url)
  if (match[2] === 'courses') {
    const category = url.searchParams.get('category')
    const categories: Record<string, string[]> = catalogRoutes[locale].categories
    if (!category || !Object.hasOwn(categories, category)) return null
    const subcategory = url.searchParams.get('subcategory')
    if (subcategory && !categories[category].includes(subcategory)) return null
    destination.pathname = `${prefix}/courses/${category}${subcategory ? `/${subcategory}` : ''}`
    destination.searchParams.delete('category')
    destination.searchParams.delete('subcategory')
  } else {
    const university = url.searchParams.get('university')
    if (!university || !catalogRoutes[locale].universities.includes(university)) return null
    destination.pathname = `${prefix}/universities/${university}`
    destination.searchParams.delete('university')
  }
  return destination
}
