-- Migración: Añadir available_features, available_stations y campos descriptivos a public.business_verticals
-- Fecha: 2026-11-03
-- Objetivo: Permitir tipificación y parametrización de giros comerciales y su hidratación dinámica en Tiers

ALTER TABLE public.business_verticals
  ADD COLUMN IF NOT EXISTS available_features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS available_stations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS catalog_title TEXT,
  ADD COLUMN IF NOT EXISTS catalog_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS action_primary TEXT,
  ADD COLUMN IF NOT EXISTS action_secondary TEXT,
  ADD COLUMN IF NOT EXISTS feedback_question TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Actualización y tipificación de características y estaciones para cada giro comercial

UPDATE public.business_verticals
SET 
  name = 'Restaurante / Gastronomía',
  unit_label = 'Mesa',
  unit_plural = 'Mesas',
  show_kds = true,
  show_floor_staff = true,
  show_hostess = true,
  catalog_title = 'Menú Digital & Pedidos',
  catalog_subtitle = 'Envía tus platillos directo a cocina',
  action_primary = 'Llamar Mesero',
  action_secondary = 'Pedir la Cuenta',
  feedback_question = '¿Cómo estuvo tu experiencia y comida hoy?',
  available_features = '[
    {"id": "direct_redirect", "name": "Enlace Directo a Google Reviews", "description": "Redirección instantánea a Google Reviews sin intermediarios."},
    {"id": "viral_loop", "name": "Bucle Viral de Placas en Mesa ($100 MXN)", "description": "Semillero viral integrado para captar prospectos B2B desde la mesa."},
    {"id": "smart_feedback", "name": "Filtro Inteligente de Reputación (Escudo 1 a 3 Estrellas)", "description": "Calificaciones de 4-5 estrellas van a Google; quejas de 1-3 van a buzón privado con cupones de gerente."},
    {"id": "digital_menu", "name": "Menú Digital & Pedir en Mesa con Carrito", "description": "Menú dinámico con fotos, alérgenos, precios y envío de comandas a estaciones de cocina."},
    {"id": "waiter_call", "name": "Llamador de Meseros & Alerta de Cuenta en Vivo", "description": "Bifurcación de llamados en tiempo real hacia terminales de meseros."},
    {"id": "wifi_portal", "name": "Acceso Wi-Fi en 1-Toque", "description": "Conexión a la red Wi-Fi de comensales sin necesidad de dictar contraseñas."},
    {"id": "social_hub", "name": "Hub de Redes Sociales & Linktree", "description": "Enlaces dinámicos a Instagram, Facebook, TikTok y WhatsApp oficial."},
    {"id": "kds_live", "name": "Despacho a KDS & Tiempos de Preparación", "description": "Pantallas operativas en cocina, barra y postres con alertas por semáforo."},
    {"id": "ads_network", "name": "Red Publicitaria Local ($500 MXN / mes)", "description": "Bolsa publicitaria local y monetización de impresiones en pantallas de mesa."},
    {"id": "analytics_heat", "name": "Analítica Avanzada & Mapa de Calor por Mesa", "description": "Métricas de afluencia, mesas con mayor rotación y tiempos promedio de atención."},
    {"id": "white_label", "name": "Escudo de Marca Blanca (0% Anuncios)", "description": "Elimina toda publicidad externa en las interfaces de la sucursal."}
  ]'::jsonb,
  available_stations = '[
    {"id": "station-gerencia", "name": "Consola Operativa de Gerente & Capitán de Piso", "roleName": "Gerente de Tienda & Capitán de Piso", "description": "Gestión de turnos (60 días), cortes de caja, quejas y cupones."},
    {"id": "station-hostess", "name": "Pantalla de Hostess & Recepción", "roleName": "Hostess & Recepción", "description": "Gestión de mesas, aforo de comensales y alertas de limpieza."},
    {"id": "station-meseros", "name": "Terminal Móvil de Sala para Meseros", "roleName": "Mesero / Garrotero", "description": "Llamadas de cuenta, platos listos de cocina y solicitudes de limpieza."},
    {"id": "station-cocina-caliente", "name": "KDS Cocina Caliente & Parrilla", "roleName": "Cocinero Caliente & Parrillero", "description": "Comandas de cortes, guisados, pastas y freidora."},
    {"id": "station-cocina-fria", "name": "KDS Cocina Fría & Ensaladas", "roleName": "Cocinero Frío", "description": "Ensaladas, entradas frías, ceviches y montaje."},
    {"id": "station-barra", "name": "KDS Barra, Bar & Bebidas", "roleName": "Bartender & Barista", "description": "Coctelería, cervezas, refrescos y bebidas de especialidad."},
    {"id": "station-postres", "name": "KDS Postres & Cafetería", "roleName": "Repostero & Barista de Postres", "description": "Postres, repostería y bebidas calientes."},
    {"id": "station-pickup", "name": "Pantalla de Despacho & Pick Up / Repartidores", "roleName": "Despachador Pick Up", "description": "Entrega de pedidos para llevar, Uber, Didi y Rappi."},
    {"id": "station-turnero", "name": "Turnero Público 4K en Sala", "roleName": "Pantalla Comensales", "description": "Turnos de espera y pedidos listos para recoger en sala."}
  ]'::jsonb
WHERE slug = 'restaurant';

UPDATE public.business_verticals
SET 
  name = 'Consultorio Dental / Médico',
  unit_label = 'Gabinete / Consultorio',
  unit_plural = 'Consultorios',
  show_kds = false,
  show_floor_staff = false,
  show_hostess = true,
  catalog_title = 'Cuidados Post-Atención & Recetas',
  catalog_subtitle = 'Indicaciones médicas, medicamentos y citas de seguimiento',
  action_primary = 'Asistencia en Recepción',
  action_secondary = 'WhatsApp Urgencias',
  feedback_question = '¿Cómo fue tu atención médica y trato profesional hoy?',
  available_features = '[
    {"id": "direct_redirect", "name": "Enlace Directo a Google Reviews", "description": "Redirección instantánea a Google Reviews para pacientes satisfechos."},
    {"id": "smart_feedback", "name": "Filtro de Reputación Médica (1 a 3 a Dirección Médica)", "description": "Inconformidades canalizadas directamente al director del consultorio con resolución privada."},
    {"id": "post_care_catalog", "name": "Catálogo de Cuidados Post-Procedimiento", "description": "Instrucciones digitales para extracciones, endodoncias o cirugías menores."},
    {"id": "prescription_links", "name": "Recetas & Farmacias de Convenio", "description": "Acceso a farmacias aliadas, descuentos y surtido de receta médica."},
    {"id": "emergency_whatsapp", "name": "WhatsApp Directo de Urgencias Médicas", "description": "Canal prioritario 24/7 para dolores agudos o emergencias dentales."},
    {"id": "next_appointment", "name": "Agendar Próxima Cita en 1-Toque", "description": "Acceso al calendario digital de citas y limpiezas programadas."},
    {"id": "wifi_portal", "name": "Wi-Fi en Sala de Espera sin Clave", "description": "Conexión Wi-Fi de alta velocidad para pacientes y acompañantes."},
    {"id": "social_hub", "name": "Casos Clínicos & Redes Sociales", "description": "Galería de antes y después, certificaciones y consejos de salud bucal/médica."},
    {"id": "waiting_turnero", "name": "Turnero de Sala de Espera Digital", "description": "Turnos de llamado a gabinete médico en pantalla de recepción."},
    {"id": "white_label", "name": "Escudo de Marca Blanca (Clínica Privada)", "description": "Preserva 100% la identidad de la clínica sin anuncios externos."}
  ]'::jsonb,
  available_stations = '[
    {"id": "station-recepcion-medica", "name": "Consola de Recepción, Caja & Citas Médicas", "roleName": "Recepcionista Médico", "description": "Recepción de pacientes, cobro de honorarios y confirmación de citas."},
    {"id": "station-doctor-gabinete", "name": "Terminal de Gabinete para Doctor / Asistente", "roleName": "Médico Especialista / Asistente", "description": "Llamado de pacientes desde sillón dental o consultorio y recetas."},
    {"id": "station-sala-espera-turnero", "name": "Pantalla Turnero en Sala de Espera", "roleName": "Pantalla Pacientes", "description": "Visualización del turno actual e indicaciones de pase al gabinete."}
  ]'::jsonb
WHERE slug = 'dental';

UPDATE public.business_verticals
SET 
  name = 'Barbería / Salón de Belleza',
  unit_label = 'Sillón / Estación',
  unit_plural = 'Sillones',
  show_kds = false,
  show_floor_staff = true,
  show_hostess = true,
  catalog_title = 'Catálogo de Cortes, Barba & Bebidas',
  catalog_subtitle = 'Estilos, bebidas de cortesía y productos de cuidado',
  action_primary = 'Pedir Bebida / Cortesía',
  action_secondary = 'Agendar Próxima Cita',
  feedback_question = '¿Cómo quedó tu corte y estilo hoy?',
  available_features = '[
    {"id": "direct_redirect", "name": "Enlace Directo a Google Reviews", "description": "Redirección a Google Reviews al terminar el corte."},
    {"id": "smart_feedback", "name": "Filtro de Calificación de Servicio (1 a 3 a Gerente)", "description": "Evaluación del barbero o estilista antes de publicar en Google."},
    {"id": "haircut_catalog", "name": "Catálogo Visual de Cortes & Diseños de Barba", "description": "Lookbook interactivo para que el cliente elija su corte en el sillón."},
    {"id": "beverage_courtesy", "name": "Solicitud de Bebida de Cortesía (Café/Cerveza)", "description": "Pedido de amenidad directo a recepción o barra mientras se atiende al cliente."},
    {"id": "appointment_booking", "name": "Agendar Próxima Cita con tu Barbero Favorito", "description": "Reserva recurrente para mantener el corte cada 15 o 30 días."},
    {"id": "grooming_products", "name": "Catálogo de Pomadas, Ceras & Cuidado Facial", "description": "Venta cruzada de productos con cargo al ticket final."},
    {"id": "wifi_portal", "name": "Wi-Fi Rápido en Sillón", "description": "Acceso Wi-Fi para que el cliente disfrute videos o música durante el servicio."},
    {"id": "social_hub", "name": "Instagram del Barbero & Salón", "description": "Etiqueta al negocio y comparte fotos del nuevo look."},
    {"id": "viral_loop", "name": "Semillero de Placas QR para Negocios Amigos", "description": "Intercambio de presencia comercial local con comercios aliados."},
    {"id": "loyalty_stamp", "name": "Tarjeta de Lealtad (Corte #10 Gratis)", "description": "Sellos digitales acumulables por visita escaneando la placa."},
    {"id": "analytics_heat", "name": "Métricas de Ocupación por Sillón & Horas Pico", "description": "Reporte de rotación de clientes y productividad del personal."},
    {"id": "white_label", "name": "Escudo de Marca Blanca (Estilo Exclusivo)", "description": "Experiencia premium sin anuncios de terceros."}
  ]'::jsonb,
  available_stations = '[
    {"id": "station-barber-caja", "name": "Recepción, Caja & Asignación de Turnos", "roleName": "Recepcionista / Cajero", "description": "Cobro de servicios, venta de productos y turnos de espera."},
    {"id": "station-barber-sillon", "name": "Terminal Móvil de Sillón para Barbero/Estilista", "roleName": "Barbero / Estilista", "description": "Recepción de pedidos de cortesías y aviso de servicio concluido."}
  ]'::jsonb
WHERE slug = 'barberia';

UPDATE public.business_verticals
SET 
  name = 'Gimnasio / Fitness & Box',
  unit_label = 'Máquina / Zona',
  unit_plural = 'Equipos & Zonas',
  show_kds = false,
  show_floor_staff = false,
  show_hostess = false,
  catalog_title = 'Guías de Rutinas & Clases',
  catalog_subtitle = 'Videos de técnica y horarios en vivo',
  action_primary = 'Reportar Equipo Averiado',
  action_secondary = 'Conexión Wi-Fi',
  feedback_question = '¿Cómo estuvo tu entrenamiento e instalaciones hoy?',
  available_features = '[
    {"id": "direct_redirect", "name": "Enlace Directo a Google Reviews", "description": "Reseñas de atletas y usuarios del gimnasio."},
    {"id": "smart_feedback", "name": "Buzón de Mantenimiento & Limpieza", "description": "Quejas de orden, higiene o lockers directo al supervisor."},
    {"id": "machine_guide", "name": "Video de Técnica & Músculos Trabajados", "description": "Demostración de postura correcta al escanear la placa de la máquina."},
    {"id": "report_breakdown", "name": "Reporte Inmediato de Polea/Máquina Dañada", "description": "Aviso directo al equipo de mantenimiento con número de estación."},
    {"id": "supplement_store", "name": "Tienda de Proteínas, Shakes & Bebidas Isotónicas", "description": "Catálogo de suplementación para recoger en mostrador."},
    {"id": "class_schedules", "name": "Horario de Clases Grupales (Spinning, Yoga, Box)", "description": "Disponibilidad de cupos y horarios actualizados del día."},
    {"id": "wifi_portal", "name": "Wi-Fi de Alta Velocidad para Spotify/Entreno", "description": "Conexión instantánea para reproducir música sin gastar datos."},
    {"id": "social_hub", "name": "Comunidad & Desafíos Fitness en Redes", "description": "Comparte tus récords y retos de entrenamiento."},
    {"id": "analytics_heat", "name": "Mapa de Calor de Máquinas Más Utilizadas", "description": "Detección de equipos saturados para renovación de piso."},
    {"id": "white_label", "name": "Escudo de Marca Blanca (Centro de Alto Rendimiento)", "description": "Cero publicidad comercial externa en el gimnasio."}
  ]'::jsonb,
  available_stations = '[
    {"id": "station-gym-recepcion", "name": "Mostrador de Recepción & Registro de Acceso", "roleName": "Staff de Mostrador", "description": "Venta de membresías, lockers y cobro de suplementos."},
    {"id": "station-gym-entrenadores", "name": "Terminal de Entrenadores de Piso & Mantenimiento", "roleName": "Entrenador de Piso / Técnico", "description": "Atención a reportes de máquinas y dudas de usuarios."}
  ]'::jsonb
WHERE slug = 'gym';

UPDATE public.business_verticals
SET 
  name = 'Spa & Bienestar',
  unit_label = 'Cabina / Sillón',
  unit_plural = 'Cabinas',
  show_kds = false,
  show_floor_staff = false,
  show_hostess = true,
  catalog_title = 'Catálogo de Tratamientos & Aromaterapia',
  catalog_subtitle = 'Masajes relajantes, faciales y terapias holísticas',
  action_primary = 'Llamar Terapeuta',
  action_secondary = 'Pagar Servicio',
  feedback_question = '¿Cómo te sentiste con tu tratamiento y relajación hoy?',
  available_features = '[
    {"id": "direct_redirect", "name": "Enlace Directo a Google Reviews", "description": "Calificaciones de 5 estrellas en tratamientos de relajación."},
    {"id": "smart_feedback", "name": "Filtro Privado de Confort & Temperatura", "description": "Comentarios sobre música, aroma o presión del masaje directo a administración."},
    {"id": "treatment_menu", "name": "Catálogo de Masajes, Faciales & Exfoliaciones", "description": "Carta de servicios con duración y beneficios."},
    {"id": "therapist_call", "name": "Llamador Silencioso de Terapeuta", "description": "Aviso cuando el cliente está listo en cabina."},
    {"id": "tea_amenity", "name": "Selección de Infusiones & Té Relajante", "description": "Cortesía post-tratamiento directo a cabina."},
    {"id": "next_session", "name": "Reserva de Próxima Sesión o Paquete Holístico", "description": "Reagendado sencillo antes de salir del spa."},
    {"id": "wifi_portal", "name": "Wi-Fi Modo Zen", "description": "Conexión a internet rápida."},
    {"id": "social_hub", "name": "Instagram & Guías de Autocuidado", "description": "Consejos de meditación y cuidado de la piel."},
    {"id": "analytics_heat", "name": "Horas de Mayor Afluencia & Cabinas Activas", "description": "Monitoreo de ocupación de cabinas de masaje."},
    {"id": "white_label", "name": "Escudo de Marca Blanca (Ambiente Zen Puro)", "description": "Sin distracciones ni anuncios comerciales de terceros."}
  ]'::jsonb,
  available_stations = '[
    {"id": "station-spa-recepcion", "name": "Recepción, Check-In & Spa Manager", "roleName": "Spa Host / Recepcionista", "description": "Asignación de cabinas, venta de productos orgánicos y cobro."},
    {"id": "station-spa-cabina", "name": "Terminal Silenciosa de Terapeuta en Cabina", "roleName": "Terapeuta Holístico", "description": "Aviso de llegada de paciente y confirmación de inicio/fin de terapia."}
  ]'::jsonb
WHERE slug = 'spa';

UPDATE public.business_verticals
SET 
  name = 'Cafetería & Repostería',
  unit_label = 'Mesa / Barra',
  unit_plural = 'Mesas & Barra',
  show_kds = true,
  show_floor_staff = true,
  show_hostess = false,
  catalog_title = 'Carta de Café de Especialidad & Panadería',
  catalog_subtitle = 'Granos selectos, métodos de extracción y pan recién horneado',
  action_primary = 'Llamar Barista',
  action_secondary = 'Pedir la Cuenta',
  feedback_question = '¿Qué te pareció tu café y postre hoy?',
  available_features = '[
    {"id": "direct_redirect", "name": "Enlace Directo a Google Reviews", "description": "Redirección rápida para amantes del buen café."},
    {"id": "smart_feedback", "name": "Filtro de Calidad de Café & Temperatura", "description": "Opiniones sobre extracción y sabor canalizadas al barista líder."},
    {"id": "coffee_menu", "name": "Menú de Especialidad con Métodos (V60, Chemex, Aeropress)", "description": "Explicación de notas de cata y maridaje con panadería."},
    {"id": "digital_order", "name": "Pedir desde Mesa o Barra con Carrito", "description": "Comanda enviada a pantalla de barista sin hacer fila en caja."},
    {"id": "barista_call", "name": "Llamar Barista / Solicitar Agua de Cortesía", "description": "Atención rápida a comensales en mesa o barra."},
    {"id": "wifi_portal", "name": "Wi-Fi para Home Office & Estudiantes", "description": "Conexión estable en 1-toque ideal para coworking."},
    {"id": "social_hub", "name": "Comunidad de Café & Instagram", "description": "Fotos del arte latte y promociones de la semana."},
    {"id": "kds_barista", "name": "KDS de Barista & Barra de Bebidas", "description": "Secuencia cronológica de cafés y pedidos en tiempo real."},
    {"id": "white_label", "name": "Escudo de Marca Blanca (Café de Autor)", "description": "Experiencia limpia sin anuncios invasivos."}
  ]'::jsonb,
  available_stations = '[
    {"id": "station-cafe-barista", "name": "KDS Barista & Barra de Café", "roleName": "Barista", "description": "Preparación de espressos, lattes y métodos artesanales."},
    {"id": "station-cafe-reposteria", "name": "KDS Repostería & Panadería", "roleName": "Panadero / Repostero", "description": "Horneado, calentado y emplatado de piezas dulces y saladas."},
    {"id": "station-cafe-caja", "name": "Caja & Mostrador de Entrega Pick Up", "roleName": "Cajero", "description": "Cobro en mostrador y llamado de comensales."}
  ]'::jsonb
WHERE slug = 'cafeteria';

UPDATE public.business_verticals
SET 
  name = 'Comercio General / Retail',
  unit_label = 'Punto de Atención',
  unit_plural = 'Puntos de Atención',
  show_kds = false,
  show_floor_staff = false,
  show_hostess = false,
  catalog_title = 'Catálogo de Productos & Promociones',
  catalog_subtitle = 'Consulta existencias, ofertas del mes y contacto directo',
  action_primary = 'Solicitar Asesoría',
  action_secondary = 'Contacto WhatsApp',
  feedback_question = '¿Cómo calificarías nuestra atención y productos hoy?',
  available_features = '[
    {"id": "direct_redirect", "name": "Enlace Directo a Google Reviews", "description": "Reseñas inmediatas de compradores en punto de venta."},
    {"id": "smart_feedback", "name": "Buzón de Atención al Cliente & Garantías", "description": "Reclamos o dudas canalizadas al responsable de tienda."},
    {"id": "digital_catalog", "name": "Catálogo Digital de Ofertas & Temporada", "description": "Folleto interactivo sin papel con promociones vigentes."},
    {"id": "whatsapp_sales", "name": "WhatsApp de Ventas & Dudas de Producto", "description": "Asistencia personalizada con un vendedor de tienda."},
    {"id": "wifi_portal", "name": "Wi-Fi para Clientes", "description": "Conexión a internet en piso de venta."},
    {"id": "social_hub", "name": "Redes Sociales & Novedades", "description": "Canales de TikTok, Instagram y catálogo web."},
    {"id": "analytics_heat", "name": "Analítica de Tráfico en Tienda", "description": "Conteo de escaneos y secciones de tienda con mayor interés."},
    {"id": "white_label", "name": "Escudo de Marca Blanca (Comercio Exclusivo)", "description": "Cero publicidad externa en el negocio."}
  ]'::jsonb,
  available_stations = '[
    {"id": "station-retail-mostrador", "name": "Mostrador Principal de Atención & Caja", "roleName": "Asesor de Tienda / Cajero", "description": "Cobro de mercancía, devoluciones y resolución de garantías."}
  ]'::jsonb
WHERE slug = 'general';

