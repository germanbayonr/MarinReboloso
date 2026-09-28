/**
 * Migraciones del repo (orden cronológico). Deben estar aplicadas en el proyecto Supabase de producción
 * (ref. nwpjxibuaxclzogatfcl en next.config / CSP).
 */
export const REPO_MIGRATION_FILES = [
  '20250331120000_customers_auth_products_in_stock.sql',
  '20250401120000_handle_new_customer_first_last_dni.sql',
  '20250402120000_customers_shipping_address.sql',
  '20250404120000_customers_drop_dni_add_shipping.sql',
  '20250405140000_admin_core_products_orders.sql',
  '20250603120000_collections_table.sql',
  '20250603140000_collections_homepage_visibility.sql',
  '20250603150000_collections_portada_images.sql',
  '20250604120000_products_variants.sql',
  '20260402120000_orders_total_amount.sql',
  '20260402140000_orders_shipping_columns.sql',
  '20260403120000_products_is_active.sql',
  '20260403140000_orders_tracking_carrier.sql',
  '20260404120000_ensure_orders_packlink_tracking.sql',
  '20260406120000_ensure_products_is_active.sql',
  '20260407120000_products_is_active_catalog_comment.sql',
  '20260408120000_ensure_products_is_active_idempotent.sql',
  '20260427114500_create_promotions.sql',
  '20260923160000_orders_customer_phone.sql',
] as const

export type MigrationProbeId =
  | 'products.has_variants'
  | 'products.variants'
  | 'products.is_active'
  | 'orders.customer_phone'
  | 'orders.total_amount'
  | 'collections.table'
  | 'promotions.table'
  | 'customers.email'

export const MIGRATION_PROBES: { id: MigrationProbeId; migrationFile: string; description: string }[] = [
  {
    id: 'products.has_variants',
    migrationFile: '20250604120000_products_variants.sql',
    description: 'Columnas has_variants y variants en products',
  },
  {
    id: 'products.is_active',
    migrationFile: '20260403120000_products_is_active.sql',
    description: 'Columna is_active en products',
  },
  {
    id: 'orders.customer_phone',
    migrationFile: '20260923160000_orders_customer_phone.sql',
    description: 'Columna customer_phone en orders',
  },
  {
    id: 'orders.total_amount',
    migrationFile: '20260402120000_orders_total_amount.sql',
    description: 'Columna total_amount en orders',
  },
  {
    id: 'collections.table',
    migrationFile: '20250603120000_collections_table.sql',
    description: 'Tabla collections',
  },
  {
    id: 'promotions.table',
    migrationFile: '20260427114500_create_promotions.sql',
    description: 'Tabla promotions',
  },
  {
    id: 'customers.email',
    migrationFile: '20250405140000_admin_core_products_orders.sql',
    description: 'Columna email en customers (panel admin)',
  },
]
