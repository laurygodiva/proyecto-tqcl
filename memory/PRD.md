# Te Quiero Con Locura — PRD

App móvil gamificada para parejas (Laury & Danny), neón estilo arcade, sincronizada entre 2 iPhones vía MongoDB.

## MVP entregado
- **Pantalla de carga** con logo flotante, barra animada y botón ACCEDER.
- **Selección de jugador**: cards de Laury y Danny con datos (edad, signo, habilidades) que se expanden al seleccionar.
- **Login**: contraseña simple por personaje (`laury123` / `danny123`) con shake en error.
- **Dashboard sincronizado**:
  - Avatar del jugador + barra de XP "Nivel de Vínculo" + botón ❤️ para añadir experiencia con 9 actividades (Piropos +15 ... Pasión +300).
  - Contador de tiempo juntos (años / meses / días / horas) desde fecha configurable.
  - Logo central.
  - Dos cards de personaje con avatar editable (sólo el propio), burbuja de estado editable (emoji + texto).
  - Botones MISIONES y CREAR misión (sólo creas misiones para tu pareja).
  - Sistema de misiones con 4 rarezas (Común +10, Rara +25, Épica +50, Legendaria +100). Completar misión otorga XP.
  - Línea de distancia con corazones por ubicación. Si coinciden, aparece "Estamos Juntos ♥" y cada toque suma +1 XP con animación.
- **Sincronización**: polling cada 4s sobre `/api/state` (único documento `couple_state` en MongoDB).
- **Persistencia de sesión** con `expo-secure-store`.

## Endpoints backend
- `GET /api/users` lista jugadores + opciones de avatar
- `POST /api/auth/login` login con userId + password
- `GET /api/state` estado completo
- `PATCH /api/state` actualizar campos (bubbles, avatars, locations, missions, etc.)
- `POST /api/state/xp` añadir XP
- `POST /api/state/missions/create` | `/complete` | `/delete`
- `POST /api/state/reset` reiniciar estado

## Stack
- Frontend: Expo Router + React Native + Reanimated + expo-linear-gradient + Ionicons
- Backend: FastAPI + Motor (MongoDB async)

## Roadmap futuro (siguientes iteraciones)
- Logros con desbloqueables, monedas e inventario de items
- Minijuegos (memorama, ruleta de citas, trivia)
- Calendario y fechas importantes
- Chat privado y notas/diario compartido
- Notificaciones push reales (al deployar a iOS)
- Personalización de actividades y dates
