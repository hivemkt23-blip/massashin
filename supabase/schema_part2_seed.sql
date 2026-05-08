-- ============================================================
-- PARTE 2: DADOS (rode APÓS a parte 1)
-- ============================================================

-- ZONAS DE ENTREGA
INSERT INTO delivery_zones (radius_km_max, delivery_time_min, delivery_fee) VALUES
  (1.0, 60, 8.00),(2.0, 65, 9.00),(3.0, 65, 11.00),
  (4.0, 70, 12.00),(7.0, 80, 13.00),(10.0, 80, 14.00);

-- CATEGORIAS
INSERT INTO categories (name, slug, display_order) VALUES
  ('Promoção Por Tempo Limitado','promocao',1),
  ('Novidades','novidades',2),
  ('Combinados','combinados',3),
  ('Sashimi de Salmão','sashimi',4),
  ('Sushi / Quentes','sushi-quentes',5),
  ('Sushi / Porções','sushi-porcoes',6),
  ('Temakis','temakis',7),
  ('Pratos Quentes','pratos-quentes',8),
  ('Executivos','executivos',9),
  ('Porções','porcoes',10),
  ('Bebidas','bebidas',11);

-- PROMOÇÕES
INSERT INTO products (category_id,name,description,price,original_price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='promocao'),'Barca Especial + Hot Roll Cortesia','04 Niguiris de Salmão, 04 Hossomakis de Salmão, 04 Uramakis Joe, 04 Uramakis Philadelphia, 04 Uramakis Spicy. Acompanha Hot Roll de cortesia.',130.00,150.00,2,1),
  ((SELECT id FROM categories WHERE slug='promocao'),'Combinado Especial','12 fatias de salmão, 04 uramakis spicy, 04 uramakis Philadelphia, 04 uramakis joe, 08 hot rolls.',160.00,NULL,2,2),
  ((SELECT id FROM categories WHERE slug='promocao'),'Combinado Especial 1','16 Uramakis (4 spicy, 4 joe, 4 philadelphia, 4 flambados), 8 hot rolls, 4 joe e 4 hot joe.',150.00,NULL,2,3),
  ((SELECT id FROM categories WHERE slug='promocao'),'Combinado Especial 2','12 fatias de sashimi de salmão, 12 uramakis (4 etibance, 4 alcapone, 4 Philadelphia), 08 hot roll, 08 hossomaki de salmão.',150.00,170.00,2,4),
  ((SELECT id FROM categories WHERE slug='promocao'),'Combinado Osaka','40 peças: 04 niguiris de salmão, 04 niguiris de camarão, 08 uramakis Philadelphia, 08 uramakis spicy, 08 uramakis joe, 08 hot joe. Acompanha: limão, gengibre, wasabi, 02 hashis, 02 shoyu de 30ml.',195.00,210.00,4,5),
  ((SELECT id FROM categories WHERE slug='promocao'),'Combinado Tokyo','50 peças: 18 fatias de salmão, 08 uramakis joe, 08 uramakis Philadelphia, 08 uramakis spicy, 04 niguiris.',210.00,NULL,4,6);

-- NOVIDADES
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='novidades'),'Uramaki Flambado','Porção com 8 unidades.',49.00,1,1),
  ((SELECT id FROM categories WHERE slug='novidades'),'Combinado 10','6 Fatias de Sashimi de Salmão, 4 Uramakis Joe, 4 Uramakis Philadelphia, 4 Joe Joe.',80.00,1,2),
  ((SELECT id FROM categories WHERE slug='novidades'),'Combinado Hots','08 hot roll, 08 hot uramaki, 1 hot temaki.',60.00,2,3);

-- COMBINADOS
INSERT INTO products (category_id,name,description,price,original_price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 1','06 fatias de sashimi de salmão, 08 hot rolls, 08 uramakis mistos (4 Philadelphia e 4 alcapone).',69.00,NULL,1,1),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 2','06 fatias de sashimi de salmão, 08 hossomakis, 08 hot rolls.',63.00,NULL,1,2),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 3','8 uramakis misto (4 Philadelphia, 4 alcapone), 8 hot rolls, 4 hot uramakis.',64.80,72.00,1,3),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 4','03 niguiris de salmão, 08 uramakis Philadelphia, 08 hot rolls.',72.00,NULL,1,4),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 5','8 hot rolls, 8 uramakis misto (4 Philadelphia, 4 alcapone), 1 temaki de salmão.',69.00,NULL,1,5),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 6','1 salmão grelhado, 8 hot rolls, 8 uramakis mistos (4 Philadelphia, 4 alcapone).',69.00,NULL,1,6),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 7','12 fatias de salmão, 08 uramakis mistos (4 alcapone, 4 Philadelphia).',71.00,NULL,1,7),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 8','1 hot temaki, 8 uramakis mistos (4 Philadelphia, 4 alcapone).',55.00,NULL,1,8),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 9','06 fatias de salmão, 01 temaki de salmão, 04 uramakis joe, 04 hot joe.',79.00,NULL,1,9),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 11','8 hot rolls, 8 uramakis misto (4 Philadelphia, 4 alcapone), 8 hossomakis de salmão.',62.10,69.00,1,10),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 12','08 uramakis misto (4 alcapone, 4 Philadelphia), 06 fatias de salmão, 01 salmão grelhado.',69.00,NULL,1,11),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 13','12 fatias de salmão, 04 hot joe, 04 uramakis joe.',75.00,NULL,1,12),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 14','8 Uramakis (4 philadelphia e 4 flambados), 6 fatias de sashimi de salmão e 4 joe.',79.00,NULL,1,13),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 15','4 uramakis Philadelphia, 4 hot joe, 8 hot roll, 4 hot uramakis, 4 uramakis joe.',93.00,NULL,1,14),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 16','8 hossomakis de salmão, 4 uramakis Philadelphia, 4 uramakis joe.',53.00,58.00,1,15),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 17','06 fatias de sashimi de salmão, 16 hossomakis mistos (8 salmão e 8 kani kama).',58.00,NULL,1,16),
  ((SELECT id FROM categories WHERE slug='combinados'),'Combinado 18','06 fatias de salmão, 04 hot joe, 04 uramakis joe, 04 hot rolls.',69.00,NULL,1,17);

-- SASHIMI
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='sashimi'),'Sashimi de Salmão','24 fatias de salmão. Acompanha: limão, gengibre, wasabi, hashi, shoyu.',81.00,1,1);

-- SUSHI QUENTES
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='sushi-quentes'),'Hot Joe','Sushi frito com salmão e cream cheese batido. Porção com 8 unidades.',39.00,1,1),
  ((SELECT id FROM categories WHERE slug='sushi-quentes'),'Hot Roll','Salmão com cream cheese. Porção com 8 unidades.',29.00,1,2),
  ((SELECT id FROM categories WHERE slug='sushi-quentes'),'Hot Temaki','1 temaki de salmão frito cortado ao meio.',31.00,1,3),
  ((SELECT id FROM categories WHERE slug='sushi-quentes'),'Hot Uramaki','Salmão com cream cheese. Porção com 8 unidades.',40.00,1,4);

-- SUSHI PORÇÕES
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='sushi-porcoes'),'Hossomakis','Unidade com 8 hossomakis.',24.00,1,1),
  ((SELECT id FROM categories WHERE slug='sushi-porcoes'),'Uramaki Philadelphia','Porção com 8 unidades.',29.00,1,2),
  ((SELECT id FROM categories WHERE slug='sushi-porcoes'),'Uramaki Joe','Salmão grelhado e cream cheese. Porção com 8 unidades.',40.00,1,3),
  ((SELECT id FROM categories WHERE slug='sushi-porcoes'),'Uramaki Spicy','08 unidades de salmão grelhado com cream cheese e geleia de pimenta.',40.00,1,4);

-- TEMAKIS
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='temakis'),'Temaki','Temaki artesanal. Escolha o sabor: salmão ou kani salada.',28.00,1,1);

-- PRATOS QUENTES
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='pratos-quentes'),'Teishoku Karaague','Frango frito com salada. Escolha o acompanhamento.',52.00,1,1),
  ((SELECT id FROM categories WHERE slug='pratos-quentes'),'Yakisoba','Macarrão c/ legumes e carne.',40.00,1,2),
  ((SELECT id FROM categories WHERE slug='pratos-quentes'),'Yakimeshi','Arroz c/ legumes, ovo, presunto e frango.',40.00,1,3),
  ((SELECT id FROM categories WHERE slug='pratos-quentes'),'Misto','Yakisoba e Yakimeshi.',40.00,1,4);

-- EXECUTIVOS
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='executivos'),'Executivo Karaague','04 uramakis Philadelphia, 04 uramakis etibance, 2 fatias de frango empanado.',38.00,1,1),
  ((SELECT id FROM categories WHERE slug='executivos'),'Executivo Salmão','04 uramakis Philadelphia, 04 uramakis etibance (salmão grelhado), 1 salmão grelhado.',42.00,1,2),
  ((SELECT id FROM categories WHERE slug='executivos'),'Executivo Tilápia','04 uramakis Philadelphia, 04 uramakis etibance, 02 fatias de tilápia empanadas.',39.00,1,3);

-- PORÇÕES
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='porcoes'),'Isca de Peixe','Filé de tilápia empanado (400 gramas).',59.00,2,1),
  ((SELECT id FROM categories WHERE slug='porcoes'),'Salmão Grelhado','Meia posta de salmão (100 gramas).',20.00,1,2),
  ((SELECT id FROM categories WHERE slug='porcoes'),'Karaague','Porção c/ 10 pedaços de frango empanado.',53.00,2,3),
  ((SELECT id FROM categories WHERE slug='porcoes'),'Guioza','Porção c/ 06 unidades - carne bovina e legumes.',30.00,1,4);

-- BEBIDAS
INSERT INTO products (category_id,name,description,price,serves,display_order) VALUES
  ((SELECT id FROM categories WHERE slug='bebidas'),'Água Mineral Crystal com Gás 500ml','Garrafa 500ml com gás.',5.50,1,1),
  ((SELECT id FROM categories WHERE slug='bebidas'),'Água Mineral Crystal Sem Gás 500ml','Garrafa 500ml sem gás.',5.50,1,2),
  ((SELECT id FROM categories WHERE slug='bebidas'),'Água Tônica Schweppes 350ml','Lata 350ml.',8.00,1,3),
  ((SELECT id FROM categories WHERE slug='bebidas'),'Chá Ice Tea Leão Limão 450ml','Garrafa 450ml.',8.00,1,4);

-- OPÇÕES: Temaki - Sabores
INSERT INTO option_groups (product_id,name,required,min_selections,max_selections,display_order)
SELECT id,'Sabores',true,1,1,1 FROM products WHERE name='Temaki';

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Temaki de Salmão','Salmão cortado em cubos e cream cheese',0,1
FROM option_groups g JOIN products p ON g.product_id=p.id WHERE p.name='Temaki' AND g.name='Sabores';

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Temaki de Kani Salada','Salada com maionese, alface, kani e pepino',0,2
FROM option_groups g JOIN products p ON g.product_id=p.id WHERE p.name='Temaki' AND g.name='Sabores';

-- OPÇÕES: Teishoku - Acompanhamento
INSERT INTO option_groups (product_id,name,required,min_selections,max_selections,display_order)
SELECT id,'Opções',true,1,1,1 FROM products WHERE name='Teishoku Karaague';

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Yakisoba','Macarrão c/ legumes e carne',0,1
FROM option_groups g JOIN products p ON g.product_id=p.id WHERE p.name='Teishoku Karaague' AND g.name='Opções';

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Yakimeshi','Arroz c/ legumes, ovo, presunto e frango',0,2
FROM option_groups g JOIN products p ON g.product_id=p.id WHERE p.name='Teishoku Karaague' AND g.name='Opções';

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Misto','Yakisoba e yakimeshi',0,3
FROM option_groups g JOIN products p ON g.product_id=p.id WHERE p.name='Teishoku Karaague' AND g.name='Opções';

-- OPÇÕES: Adicionais (Temaki e Teishoku)
INSERT INTO option_groups (product_id,name,required,min_selections,max_selections,display_order)
SELECT id,'Adicionais',false,0,10,2 FROM products WHERE name IN ('Temaki','Teishoku Karaague');

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Shoyu','Molho de soja',1.50,1
FROM option_groups g WHERE g.name='Adicionais';

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Tarê 30ml','Molho agridoce',5.00,2
FROM option_groups g WHERE g.name='Adicionais';

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Hashi','Palitinhos',0.50,3
FROM option_groups g WHERE g.name='Adicionais';

INSERT INTO option_items (group_id,name,description,price_add,display_order)
SELECT g.id,'Suporte Hashi','Adaptador',1.00,4
FROM option_groups g WHERE g.name='Adicionais';
