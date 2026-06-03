-- Imágenes de portada alineadas con el diseño original de la web
update public.collections set
  homepage_order = 1,
  hero_image_left = 'https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur(1).jpg',
  hero_image_right = 'https://marebo.b-cdn.net/Colecciones/II%20DROP%20Jaipur/Pendientes%20Coral%20Jaipur.PNG',
  visible_on_homepage = true,
  visible_on_site = true,
  updated_at = now()
where slug = 'jaipur';

update public.collections set
  homepage_order = 2,
  hero_image_left = 'https://marebo.b-cdn.net/Colecciones/Drop%20_Descara%CC%81_/Pendientes%20Descara%20Pasion%202.jpg',
  visible_on_homepage = true,
  visible_on_site = true,
  updated_at = now()
where slug = 'descara';

-- Banners inferiores: URLs distintas a las de ficha de colección (portada original)
update public.collections set
  homepage_order = 3,
  hero_image_left = 'https://marebo.b-cdn.net/Colecciones/Corales/Pendientes%20Coralia%20Sky%202.JPG',
  visible_on_homepage = true,
  updated_at = now()
where slug = 'corales';

update public.collections set
  homepage_order = 4,
  hero_image_left = 'https://marebo.b-cdn.net/Colecciones/MAREBO/Flor%20MAREBO%20Dore.jpg',
  visible_on_homepage = true,
  updated_at = now()
where slug = 'marebo';

update public.collections set
  homepage_order = 5,
  hero_image_left = 'https://marebo.b-cdn.net/Colecciones/Filipa/Pendientes-Linaje-Carmesi%202.png',
  visible_on_homepage = true,
  updated_at = now()
where slug = 'filipa';
