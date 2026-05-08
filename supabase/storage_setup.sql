-- Cole este SQL no Supabase para habilitar o Storage de imagens dos produtos

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Permite leitura pública das imagens
CREATE POLICY "public_read_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Permite o admin fazer upload (qualquer request autenticado ou anon com service role)
CREATE POLICY "admin_upload_images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "admin_delete_images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
