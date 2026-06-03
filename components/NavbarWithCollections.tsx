import Navbar from '@/components/Navbar'
import { fetchCollectionsVisibleOnSite } from '@/lib/collections'

export default async function NavbarWithCollections() {
  const collections = await fetchCollectionsVisibleOnSite()
  const navCollections = collections.map((item) => ({
    label: item.label,
    href: `/coleccion/${item.slug}`,
    isNew: item.slug === 'descara',
  }))
  return <Navbar collections={navCollections} />
}
