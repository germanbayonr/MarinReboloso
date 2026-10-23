-- Bucket público para las fotos que sube el panel.
-- Sin esta fila, POST /api/admin/products/upload-images responde "Bucket not found"
-- y el producto puede guardarse sin imagen.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');
