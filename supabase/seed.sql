-- ==============================================================================
-- DATOS SEMILLA DE PRUEBA (SEED DATA)
-- ==============================================================================

-- 1. Insertar Organización Demo
INSERT INTO organizations (id, name, owner_name, owner_email, owner_phone)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Grupo Gastronómico Gourmet',
    'Carlos Mendoza',
    'carlos@grupogourmet.com',
    '+525512345678'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Restaurantes Demo (Tiers 1, 2 y 3)
INSERT INTO restaurants (id, organization_id, brand_name, branch_name, slug, name, google_review_url, logo_url, tier, is_ad_free, brand_color, links, manager_phone)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'La Parrilla Argentina',
    'Sucursal Centro',
    'parrilla-centro',
    'La Parrilla Argentina - Centro',
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80',
    1, -- Tier 1: Directo con banner
    false,
    '#dc2626',
    '[]'::jsonb,
    '+525598765431'
),
(
    '22222222-2222-2222-2222-222222222222',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Tacos El Pastorcito',
    'Sucursal Norte',
    'tacos-pastorcito-norte',
    'Tacos El Pastorcito - Norte',
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&auto=format&fit=crop&q=80',
    2, -- Tier 2: Filtro de reputación
    false,
    '#ea580c',
    '[]'::jsonb,
    '+525598765432'
),
(
    '33333333-3333-3333-3333-333333333333',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Café Macchiato & Bistro',
    'Sucursal Polanco',
    'cafe-macchiato-polanco',
    'Café Macchiato & Bistro',
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80',
    3, -- Tier 3: Filtro + Linktree
    true, -- Ad-free (Marca blanca)
    '#7c3aed',
    '[
        {"id": "1", "title": "Menú Digital & Postres", "url": "https://ejemplo.com/menu", "icon": "menu"},
        {"id": "2", "title": "Síguenos en Instagram", "url": "https://instagram.com", "icon": "instagram"},
        {"id": "3", "title": "Conectar a Wi-Fi Clientes", "url": "WIFI:S:CafeClientes;T:WPA;P:cafe1234;;", "icon": "wifi"},
        {"id": "4", "title": "Reservaciones por WhatsApp", "url": "https://wa.me/525512345678?text=Hola,%20quiero%20reservar", "icon": "whatsapp"}
    ]'::jsonb,
    '+525598765433'
) ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Anuncios Demo para la Red Publicitaria
INSERT INTO ads (id, title, advertiser_name, banner_url, destination_url, placement_type, target_type)
VALUES 
(
    '44444444-4444-4444-4444-444444444444',
    '20% de Descuento en tu Limpieza Dental',
    'Clínica DentalPro',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
    'https://ejemplo.com/dentalpro',
    'bottom_banner',
    'all'
),
(
    '55555555-5555-5555-5555-555555555555',
    'Semana de Prueba Gratis en IronFit Gym',
    'IronFit Gym & Fitness',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    'https://ejemplo.com/ironfit',
    'bottom_banner',
    'all'
) ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Tags NFC Demo
INSERT INTO tags (id, tag_code, restaurant_id, table_identifier, scan_count)
VALUES 
('66666666-6666-6666-6666-666666666661', 'NFC-001', '11111111-1111-1111-1111-111111111111', 'Mesa 1 (Centro)', 12),
('66666666-6666-6666-6666-666666666662', 'NFC-002', '22222222-2222-2222-2222-222222222222', 'Mesa 4 (Terraza)', 28),
('66666666-6666-6666-6666-666666666663', 'NFC-003', '33333333-3333-3333-3333-333333333333', 'Mesa Barra 2', 45),
('66666666-6666-6666-6666-666666666664', 'NFC-DEMO', '22222222-2222-2222-2222-222222222222', 'Mesa de Demostración', 99)
ON CONFLICT (id) DO NOTHING;

-- 5. Insertar Feedback de Muestra (Quejas resguardadas privadamente)
INSERT INTO feedback (restaurant_id, tag_code, rating, customer_name, customer_phone, comments, status)
VALUES 
(
    '22222222-2222-2222-2222-222222222222',
    'NFC-002',
    2,
    'Raúl Sánchez',
    '+525544332211',
    'La carne al pastor estaba fría y tardaron 25 minutos en traer las bebidas.',
    'new'
),
(
    '22222222-2222-2222-2222-222222222222',
    'NFC-002',
    3,
    'Mariana López',
    '+525588776655',
    'El mesero fue muy amable pero la música estaba excesivamente alta.',
    'reviewed'
);
