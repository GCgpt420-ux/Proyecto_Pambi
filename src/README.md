# 📁 Estructura Feature-First (src/)

Esta carpeta implementa la arquitectura feature-first analizada del proyecto paralelo.

## 🎯 Objetivo

Organizar el código por **funcionalidades** en vez de por **tipos de archivos**, mejorando:
- ✅ Escalabilidad
- ✅ Mantenibilidad
- ✅ Reusabilidad
- ✅ Testing

## 📂 Estructura Actual

```
src/
├── lib/
│   └── api/               # API clients organizados por dominio
│       ├── client.ts      # Cliente base Supabase
│       ├── auth.ts        # Operaciones de autenticación
│       ├── exams.ts       # Operaciones de ensayos
│       └── courses.ts     # Operaciones de materias/tópicos
│
├── types/
│   └── index.ts           # Tipos TypeScript compartidos
│
└── hooks/
    └── useAuth.ts         # Hook de autenticación (ejemplo)
```

## 🔄 Migración Progresiva

**Estado actual:** Estructura base creada, código existente intacto.

**Código actual (app/, components/) sigue funcionando igual.**

### Próximos pasos (cuando decidas migrar):

1. **Fase 2: Features individuales**
   ```
   src/features/
   ├── auth/
   │   ├── components/
   │   ├── hooks/
   │   └── views/
   ├── exams/
   └── courses/
   ```

2. **Fase 3: Migrar componentes gradualmente**
   - Mover componentes auth → `src/features/auth/components/`
   - Actualizar imports
   - Verificar funcionamiento

3. **Fase 4: Testing**
   - Agregar tests por feature
   - Implementar Storybook

## 💡 Cómo Usar (Opcional por ahora)

### Ejemplo: Usar el nuevo API client

**Antes (actual):**
```tsx
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data } = await supabase.from('subjects').select('*');
```

**Después (nuevo, opcional):**
```tsx
import { getAllSubjects } from '@/src/lib/api/courses';

const subjects = await getAllSubjects();
```

**Ventajas:**
- ✅ Lógica centralizada
- ✅ Manejo de errores consistente
- ✅ Tipos TypeScript automáticos
- ✅ Más fácil de testear

## 🛡️ Sin Breaking Changes

- ✅ Todo el código en `app/`, `components/`, `lib/` sigue funcionando
- ✅ Puedes usar la nueva estructura opcionalmente
- ✅ Migración incremental cuando estés listo
- ✅ Build pasa sin cambios

## 📚 Referencias

- Ver `ANALISIS_PROYECTO_PARALELO.md` para detalles de arquitectura
- Ver `PLAN_ACCION_MIGRACION.md` para plan completo de migración
