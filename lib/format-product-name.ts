import { formatProductDisplayName as formatProductDisplayNameJs } from './format-product-name.js'

export function formatProductDisplayName(name: string): string {
  return formatProductDisplayNameJs(name)
}
