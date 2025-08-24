INSERT INTO categories (name, slug) VALUES
 ('Electronics','electronics'),
 ('Vehicles','vehicles'),
 ('Home & Garden','home-garden'),
 ('Jobs','jobs'),
 ('Services','services')
ON CONFLICT (slug) DO NOTHING;