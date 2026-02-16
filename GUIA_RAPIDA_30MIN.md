# ⚡ Guía Rápida: 30 Minutos para Supabase (Presentación Mañana)

## 🎯 Objetivo
Asegurar que cada **topic** tenga **al menos 10 preguntas** para que la app funcione perfectamente en la presentación.

---

## 📋 Checklist (30 minutos)

### ⏱️ Paso 1: Verificar Estado (5 minutos)
```bash
# 1️⃣ Abre Supabase Console
https://app.supabase.com

# 2️⃣ Ve a SQL Editor y ejecuta esto:
```

```sql
SELECT 
    t.name AS topic,
    s.name AS subject,
    COUNT(q.id) AS preguntas,
    CASE WHEN COUNT(q.id) >= 10 THEN '✅' ELSE '❌' END AS status
FROM topics t
LEFT JOIN subjects s ON t.subject_id = s.id
LEFT JOIN questions q ON q.topic_id = t.id
GROUP BY t.id, t.name, s.name
ORDER BY s.name, t.name;
```

**Resultado esperado:**
```
| topic | subject | preguntas | status |
|-------|---------|-----------|--------|
| Álgebra | Matemática | 8 | ❌ |
| Geometría | Matemática | 12 | ✅ |
| Redacción | Lenguaje | 5 | ❌ |
```

**Acción:** Anota cuáles están incompletos (< 10).

---

### ⏱️ Paso 2: Preparar Script (5 minutos)

#### 2️⃣.a - Instalar dotenv (si no lo tienes)
```bash
npm install dotenv
```

#### 2️⃣.b - Obtener Service Role Key

🔑 **En Supabase Console:**
1. Ve a **Settings** (⚙️ arriba a la derecha)
2. Click en **API**
3. Copia el valor en **Service Role Key** (no Copy-public-key)
4. Pégalo en tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_public_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5c...  ← Esto
```

---

### ⏱️ Paso 3: Ejecutar Script (5 minutos)

```bash
# En la raíz de tu proyecto
npx ts-node scripts/seed-questions.ts
```

**Verás output así:**
```
🌱 Iniciando seed de preguntas...

📌 Encontrados 8 topics

[1/8] Topic: "Álgebra"
  📊 Estado: 8/10 preguntas
  ⏳ Agregando 2 preguntas...
  ✅ Agregadas 2 preguntas

[2/8] Topic: "Geometría"
  📊 Estado: 12/10 preguntas
  ✅ Completo (12 preguntas)

...

✨ Total agregadas: 15 preguntas

📈 Verificación final:
   ✅ Álgebra: 10 preguntas
   ✅ Geometría: 12 preguntas
   ...

🎉 ¡Todas los topics tienen al menos 10 preguntas!
```

---

### ⏱️ Paso 4: Testear en la App (10 minutos)

```bash
# Inicia el servidor dev
npm run dev
```

1. 🔐 **Autentica** (login o sign-up)
2. Ve a **Ensayos** → **+ Crear Ensayo**
3. **Crea un ensayo de prueba:**
   - Título: "Prueba Presentación"
   - Selecciona 1-2 topics completos
   - Duración: 60 minutos
   - Cantidad preguntas: 20
   - Click **Crear**

4. **Verifica que:**
   - ✅ Se crea sin errores
   - ✅ Las preguntas se cargan (ven a ensayos y presiona el nuevo)
   - ✅ El timer funciona
   - ✅ Puedes seleccionar respuestas
   - ✅ Las opciones están shufleadas (no siempre la respuesta correcta en mismo lugar)

---

### ⏱️ Paso 5: Verificación Final (5 minutos)

**En Supabase Console:**

```sql
-- Confirmar estado final
SELECT 
    s.name AS subject,
    COUNT(DISTINCT t.id) AS topics,
    COUNT(DISTINCT q.id) AS preguntas_total,
    ROUND(AVG(COUNT(DISTINCT q.id)) OVER (PARTITION BY s.id), 1) AS preguntas_promedio
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN questions q ON q.topic_id = t.id
GROUP BY s.id, s.name
ORDER BY s.name;
```

**Esperado:**
```
| subject | topics | preguntas_total | preguntas_promedio |
|---------|--------|-----------------|-------------------|
| Historia | 3 | 30 | 10 |
| Lenguaje | 5 | 50 | 10 |
| Matemática | 4 | 40 | 10 |
```

---

## 🆘 Si Algo Sale Mal

### ❌ Error: "SUPABASE_SERVICE_ROLE_KEY no definida"
**Solución:**
```bash
# Verifica que .env.local tenga esto:
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY

# Si no aparece, agrégalo manualmente
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR..." >> .env.local
```

### ❌ Error: "Cannot find module 'ts-node'"
**Solución:**
```bash
npm install --save-dev ts-node typescript
npx ts-node scripts/seed-questions.ts
```

### ❌ Las preguntas no aparecen en el ensayo
**Solución:**
```sql
-- Verifica que el topic_id sea correcto
SELECT id, name FROM topics LIMIT 5;

-- Verifica que las preguntas estén linked
SELECT COUNT(*) FROM questions WHERE topic_id = '[TOPIC_UUID_AQUI]';
```

### ❌ Error de conexión a Supabase
**Solución:**
```bash
# Verifica credenciales en .env.local
# URL debe ser: https://[proyecto].supabase.co (sin trailing slash)
# La publishable key comienza con: sb_public_
```

---

## 📊 Resultado Esperado para Mañana

✅ **Cada topic tiene ≥ 10 preguntas**
✅ **La app crea ensayos sin errores**
✅ **Las preguntas se cargan correctamente**
✅ **El timer funciona**
✅ **Puedes responder y cambiar respuestas**

---

## 💡 Pro Tips para la Presentación

1. **Crea un ensayo "demo"** con 10-15 preguntas (rápido de completar, impacta más)
2. **Prueba el flujo completo:**
   - Login → Crear ensayo → Responder preguntas → Ver resultados
3. **Ten abierta la DB** (Supabase Console tab) para mostrar los datos si preguntan
4. **Guarda screenshots** de:
   - Ensayo funcionando
   - Preguntas con timer
   - Resultados

---

## 🎉 ¡Listo!

**Tempo total de preparación: 30 minutos máximo**

Si todo funciona, puedes dormir tranquilo. La presentación irá perfecta. 🚀

---

## 📞 Quick Reference

| Acción | Comando |
|--------|---------|
| Ver estado topics | `npm run dev` → Ensayos → + Crear |
| Ejecutar seed script | `npx ts-node scripts/seed-questions.ts` |
| Ver logs del script | Mira la terminal, dice exactamente qué pasó |
| Verificar preguntas | Supabase Console → SQL Editor → SELECT ... FROM questions |
| Probar ensayo | `npm run dev` → Crear ensayo → Responder |

---

**¿Questions? Este archivo es tu guía. Síguelo step-by-step y estará listo.** ✨
