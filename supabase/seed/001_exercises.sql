insert into public.exercises
  (name, category, primary_muscles, secondary_muscles, equipment, instructions, safety_notes)
values
  (
    'Sentadilla',
    'strength',
    array['cuadriceps', 'gluteos'],
    array['isquiotibiales', 'core'],
    'barra o peso corporal',
    'Mantener el torso firme, bajar con control y empujar el piso al subir.',
    'Evitar dolor agudo en rodillas o espalda. Ajustar rango y carga.'
  ),
  (
    'Press de banca',
    'strength',
    array['pecho'],
    array['triceps', 'hombro anterior'],
    'barra o mancuernas',
    'Escapulas estables, pies firmes, bajar la barra con control y empujar sin perder posicion.',
    'Usar spotter o seguros con cargas altas.'
  ),
  (
    'Peso muerto rumano',
    'strength',
    array['isquiotibiales', 'gluteos'],
    array['espalda baja', 'core'],
    'barra o mancuernas',
    'Bisagra de cadera, espalda neutra y recorrido controlado hasta sentir estiramiento.',
    'No redondear la espalda ni perseguir rango a costa de tecnica.'
  ),
  (
    'Jalon al pecho',
    'strength',
    array['dorsal ancho'],
    array['biceps', 'trapecio medio'],
    'polea',
    'Tirar los codos hacia abajo, mantener pecho alto y controlar la subida.',
    'No tirar detras de la nuca si genera molestia.'
  ),
  (
    'Prensa de piernas',
    'strength',
    array['cuadriceps', 'gluteos'],
    array['isquiotibiales'],
    'maquina',
    'Pies estables, bajar con control y empujar sin bloquear rodillas.',
    'Evitar despegar la pelvis del respaldo.'
  )
on conflict do nothing;
