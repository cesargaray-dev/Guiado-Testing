# Particiones de Equivalencia y Análisis de Valores Límite
**Sección 8 de la Guía: Selección eficiente de datos de prueba para campos acotados**

---

## 1. Fundamentos Teóricos

* **Particiones de Equivalencia (Equivalence Partitioning - EP):** Técnica de diseño de pruebas de caja negra que divide el dominio de entrada en clases de datos de las cuales se puede asumir razonablemente que el sistema se comportará de manera idéntica. Si un valor de la partición falla o tiene éxito, se asume que todos los demás valores de dicha partición tendrán el mismo resultado.
* **Análisis de Valores Límite (Boundary Value Analysis - BVA):** Técnica complementaria que se enfoca en las fronteras entre particiones válidas e inválidas (justo por debajo del límite, en el límite exacto y justo por encima del límite), dado que la mayor tasa de errores de programación ocurre en los operadores de comparación (`<` vs `<=`, `>` vs `>=`).

---

## 2. Tabla de Particiones y Límites para el Título de la Tarea (1 a 120 caracteres)

| Partición o Límite | Entrada de Ejemplo | Longitud | Clase | Resultado Esperado | Resultado de Ejecución |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Cadena vacía** | `""` | 0 | Inválida | Rechazar (HTTP 400 / TypeError) | Cumplido (Error controlado) |
| **Solo espacios en blanco** | `"   "` | 3 (0 tras trim) | Inválida | Rechazar (HTTP 400 / TypeError) | Cumplido (Error controlado) |
| **Límite inferior exacto** | `"a"` | 1 | Válida | Aceptar | Cumplido (Guardado OK) |
| **Límite inferior + 1** | `"ab"` | 2 | Válida | Aceptar | Cumplido (Guardado OK) |
| **Valor típico nominal** | `"Planificar pruebas"` | 19 | Válida | Aceptar | Cumplido (Guardado OK) |
| **Límite superior - 1** | `"a".repeat(119)` | 119 | Válida | Aceptar | Cumplido (Guardado OK) |
| **Límite superior exacto** | `"a".repeat(120)` | 120 | Válida | Aceptar | Cumplido (Guardado OK) |
| **Límite superior + 1** | `"a".repeat(121)` | 121 | Inválida | Rechazar (HTTP 400 / TypeError) | Cumplido (Error controlado) |
| **Tipo de dato incorrecto** | `title: 42` | N/A | Inválida | Rechazar de forma segura (400) | Cumplido (TypeError atrapado) |
| **Tipo null / undefined** | `title: null` | N/A | Inválida | Rechazar de forma segura (400) | Cumplido (TypeError atrapado) |

---

## 3. Ejercicio Práctico 8 (Página 12 de la Guía): Aplicación al Campo de Contraseña

> **Requerimiento del sistema:** La contraseña debe tener una longitud mínima de 8 caracteres y una longitud máxima de 64 caracteres. No debe ser vacía ni contener únicamente espacios en blanco. Debe tratarse de una cadena de caracteres. Nunca se deben usar contraseñas reales en los entornos de prueba.

### Matriz de Particiones y Valores Límite para Contraseña

| Partición o Límite | Valor de Prueba Sintético | Caracteres | Tipo de Partición | Comportamiento Esperado | Verificación Automatizada |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Cadena vacía** | `""` | 0 | Inválida | Rechazar: `"Password cannot be empty or whitespace."` | `validation.test.js` (PASS) |
| **Espacios en blanco** | `"        "` (8 espacios) | 8 (0 efectivo) | Inválida | Rechazar: `"Password cannot be empty or whitespace."` | `validation.test.js` (PASS) |
| **Límite inferior - 1** | `"Pass123"` | 7 | Inválida | Rechazar: `"Password must be at least 8 characters."` | `validation.test.js` (PASS) |
| **Límite inferior exacto**| `"Pass1234"` | 8 | Válida | Aceptar contraseña | `validation.test.js` (PASS) |
| **Límite inferior + 1** | `"Pass12345"` | 9 | Válida | Aceptar contraseña | `validation.test.js` (PASS) |
| **Valor típico representativo** | `"SuperSecret123!"` | 16 | Válida | Aceptar contraseña | `validation.test.js` (PASS) |
| **Límite superior - 1** | `"P".repeat(63)` | 63 | Válida | Aceptar contraseña | `validation.test.js` (PASS) |
| **Límite superior exacto**| `"P".repeat(64)` | 64 | Válida | Aceptar contraseña | `validation.test.js` (PASS) |
| **Límite superior + 1** | `"P".repeat(65)` | 65 | Inválida | Rechazar: `"Password cannot exceed 64 characters."` | `validation.test.js` (PASS) |
| **Tipo numérico en JSON** | `password: 12345678` | N/A | Inválida | Rechazar de forma segura con TypeError | `validation.test.js` (PASS) |
| **Objeto JSON inyectado** | `password: {"$ne": ""}` | N/A | Inválida | Rechazar con TypeError (previene NoSQL/Type injection) | `validation.test.js` (PASS) |
| **Null en payload** | `password: null` | N/A | Inválida | Rechazar con TypeError | `validation.test.js` (PASS) |

---

## 4. Análisis y Beneficios para el Proceso de Pruebas

1. **Reducción drástica del espacio de pruebas:**
   En lugar de probar infinitas combinaciones de contraseñas de distintas longitudes, BVA y EP reducen el conjunto a 12 casos exactos que cubren el 100% de las rutas condicionales lógicas (`< 8`, `> 64`, `typeof !== 'string'`, `trim()`).

2. **Detección temprana de vulnerabilidades de denegación de servicio:**
   Al acotar el límite superior a 64 caracteres, se protege el servidor de ataques de agotamiento de CPU causados por algoritmos de hashing intensivos (como Bcrypt o Argon2) cuando se envían cadenas de megabytes en el campo de contraseña.

