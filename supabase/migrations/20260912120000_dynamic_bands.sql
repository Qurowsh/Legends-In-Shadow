-- =========================================================
-- Dynamic homepage bands
-- =========================================================

ALTER TABLE public.bands
  ADD COLUMN IF NOT EXISTS quote text,
  ADD COLUMN IF NOT EXISTS genre text,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Public storefront can read bands.
DROP POLICY IF EXISTS "Public can view bands" ON public.bands;
CREATE POLICY "Public can view bands"
ON public.bands
FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can manage bands from the authenticated site/admin UI.
DROP POLICY IF EXISTS "Admins can insert bands" ON public.bands;
CREATE POLICY "Admins can insert bands"
ON public.bands
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update bands" ON public.bands;
CREATE POLICY "Admins can update bands"
ON public.bands
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete bands" ON public.bands;
CREATE POLICY "Admins can delete bands"
ON public.bands
FOR DELETE
TO authenticated
USING (public.is_admin());

-- =========================================================
-- Move the current hard-coded homepage bands into the database.
-- Existing rows are updated by slug; missing rows are inserted.
-- =========================================================

INSERT INTO public.bands (
  name, slug, description, image_url, quote, genre, founded_year, is_featured, sort_order
)
VALUES
  ('Metallica', 'metallica', 'The legendary metal band.', 'Images/14.jpg', 'The music is our sacred ritual.', 'Thrash Metal', 1981, true, 10),
  ('Slayer', 'slayer', 'American thrash metal pioneers.', 'Images/3.jpg', 'Riffs that cut like blades.', 'Thrash Metal', 1981, true, 20),
  ('Death', 'death', 'One of the founders of death metal.', 'Images/13.png', 'The sound of rebellion.', 'Death Metal', 1983, true, 30),
  ('Iron Maiden', 'iron-maiden', 'British heavy metal legends.', 'Images/20.jpg', 'The legends of heavy metal.', 'Heavy Metal', 1980, true, 40),
  ('Black Sabbath', 'black-sabbath', 'Pioneers of heavy metal.', 'Images/4.jpg', 'The pioneers of darkness.', 'Heavy Metal', 1968, true, 50),
  ('Judas Priest', 'judas-priest', 'British heavy metal icons.', 'Images/22.jpeg', 'The metal gods.', 'Heavy Metal', 1969, true, 60),
  ('Pantera', 'pantera', 'Influential groove metal band.', 'Images/5.jpg', 'The groove of aggression.', 'Groove Metal', 1986, true, 70),
  ('Megadeth', 'megadeth', 'American thrash metal titans.', 'Images/16.jpg', 'The thrash titans.', 'Thrash Metal', 1983, true, 80),
  ('Slipknot', 'slipknot', 'Masked extreme metal pioneers.', 'Images/6.jpeg', 'The masked chaos.', 'Nu Metal', 1995, true, 90),
  ('Korn', 'korn', 'Nu metal pioneers.', 'Images/17.jpg', 'The pioneers of nu metal.', 'Nu Metal', 1995, true, 100),
  ('Rammstein', 'rammstein', 'German industrial metal giants.', 'Images/21.jpg', 'The industrial fire.', 'Industrial Metal', 1994, true, 110),
  ('System of a Down', 'system-of-a-down', 'Alternative metal innovators.', 'Images/18.jpg', 'The political metal.', 'Alternative Metal', 1994, true, 120),
  ('Avenged Sevenfold', 'avenged-sevenfold', 'American heavy/alternative metal band.', 'Images/7.jpeg', 'The melodic metal.', 'Alternative Metal', 1999, true, 130),
  ('Tool', 'tool', 'Progressive metal innovators.', 'Images/8.png', 'The progressive metal.', 'Progressive Metal', 1990, true, 140),
  ('Opeth', 'opeth', 'Masters of progressive death metal.', 'Images/19.jpg', 'The masters of progressive death metal.', 'Progressive Death Metal', 1990, true, 150),
  ('Dream Theater', 'dream-theater', 'Progressive metal virtuosos.', 'Images/9.png', 'The virtuosos of progressive metal.', 'Progressive Metal', 1985, true, 160),
  ('Linkin Park', 'linkin-park', 'Nu metal and alternative rock icons.', 'Images/10.jpeg', 'The nu metal revolution.', 'Nu Metal', 1996, true, 170),
  ('Radiohead', 'radiohead', 'English alternative rock pioneers.', 'Images/20.jpg', 'The experimental rockers.', 'Alternative Rock', 1989, true, 180),
  ('Nirvana', 'nirvana', 'Grunge pioneers.', 'Images/11.png', 'The grunge pioneers.', 'Grunge', 1987, true, 190),
  ('Pearl Jam', 'pearl-jam', 'American rock legends.', NULL, 'The voice of a generation.', 'Grunge', 1990, true, 200),
  ('The Beatles', 'the-beatles', 'One of the most influential rock bands.', NULL, 'The legends of rock.', 'Rock', 1960, true, 210),
  ('Queen', 'queen', 'British rock legends.', NULL, 'The champions of rock.', 'Rock', 1970, true, 220),
  ('Led Zeppelin', 'led-zeppelin', 'British rock legends.', NULL, 'The gods of rock.', 'Rock', 1968, true, 230),
  ('AC/DC', 'ac-dc', 'Australian hard rock legends.', NULL, 'The rock legends.', 'Hard Rock', 1973, true, 240),
  ('Guns N'' Roses', 'guns-n-roses', 'American hard rock legends.', 'Images/12.png', 'The rock rebels.', 'Hard Rock', 1985, true, 250),
  ('Foo Fighters', 'foo-fighters', 'American rock band.', NULL, 'The rock survivors.', 'Alternative Rock', 1994, true, 260),
  ('The Rolling Stones', 'the-rolling-stones', 'English rock legends.', NULL, 'The rock legends.', 'Rock', 1962, true, 270),
  ('Deep Purple', 'deep-purple', 'Hard rock pioneers.', NULL, 'The pioneers of hard rock.', 'Hard Rock', 1968, true, 280),
  ('Deftones', 'deftones', 'Alternative metal and rock innovators.', NULL, 'The alternative rockers.', 'Alternative Rock', 1990, true, 290),
  ('The Who', 'the-who', 'British rock legends.', NULL, 'The rock legends.', 'Rock', 1964, true, 300),
  ('The Doors', 'the-doors', 'American psychedelic rock legends.', NULL, 'The psychedelic rockers.', 'Psychedelic Rock', 1965, true, 310),
  ('Rage Against the Machine', 'rage-against-the-machine', 'American alternative metal and rock band.', NULL, 'The anti-establishment rockers.', 'Alternative Rock', 1991, true, 320)
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  quote = EXCLUDED.quote,
  genre = EXCLUDED.genre,
  founded_year = EXCLUDED.founded_year,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;
