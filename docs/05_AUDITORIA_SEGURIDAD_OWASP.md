# Auditoría de Seguridad OWASP API Top 10 y Pruebas Negativas
**Sección 9 de la Guía: Probar el comportamiento negativo y fundamentos de seguridad**

---

## 1. Lista de Verificación OWASP API Security para Task Manager

| Vulnerabilidad OWASP | Riesgo en Task Manager | Medida de Mitigación Implementada | Evidencia / Prueba Automatizada |
| :--- | :--- | :--- | :--- |
| **API1:2023 - Broken Object Level Authorization (BOLA / IDOR)** | Un usuario malicioso podría leer, modificar o eliminar tareas de otro usuario modificando el `id` en la URL (`/api/v1/tasks/:id`). | Cada consulta a la base de datos se filtra estrictamente por el `ownerId` obtenido del token JWT del usuario solicitante. Las peticiones a IDs ajenos responden 403 Forbidden o 404 Not Found para evitar enumeración. | `tasks.test.js`: *"does not let one user read another user task"* y *"prevents a user from updating another user's task"*. |
| **API2:2023 - Broken Authentication** | Uso de tokens caducados, tokens manipulados o robo de refresh tokens para mantener sesiones no autorizadas. | Tokens de acceso de corta duración (15 min), rotación estricta de refresh tokens (cada refresco genera un nuevo par y revoca el anterior) y detección de reúso de tokens que revoca todas las sesiones activas. | `auth.test.js`: *"rotates refresh token upon refresh request"*, *"logout revokes refresh token"*. |
| **API3:2023 - Broken Object Property-Level Authorization (BOPLA)** | Asignación masiva (Mass Assignment): un cliente envía `ownerId` o campos administrativos en el JSON para transferir tareas o elevar permisos. | El backend ignora campos de propiedad inyectados por el cliente y deriva el `ownerId` exclusivamente de la sesión autenticada en el servidor. | `tasks.test.js`: *"retains server-derived ownership when client attempts to inject an ownerId during update"*. |
| **API4:2023 - Unrestricted Resource Consumption** | Ataques de denegación de servicio (DoS) enviando cuerpos JSON masivos para saturar memoria o ancho de banda. | Middleware `express.json({ limit: '10kb' })` restringe el tamaño máximo del cuerpo HTTP a 10 kilobytes. Peticiones mayores reciben HTTP 413. | `security.test.js`: *"rejects oversized JSON payloads"*. |
| **API5:2023 - Broken Function-Level Authorization** | Acceso a endpoints protegidos sin credenciales o con roles no autorizados. | Middleware `authenticate` protege todas las rutas de `/api/v1/tasks`. Peticiones anónimas reciben 401 Unauthorized inmediato. | `tasks.test.js`: *"rejects task creation without authentication"*. |
| **API6:2023 - Unrestricted Access to Sensitive Business Flows** | Ataques de fuerza bruta sobre el endpoint de inicio de sesión (`/api/v1/auth/login`). | Rate limiter en memoria que limita a 10 intentos por minuto por dirección IP, respondiendo HTTP 429 Too Many Requests. | `security.test.js`: *"rate limits repeated login attempts"*. |
| **API7:2023 - Server-Side Request Forgery (SSRF)** | Envío de URLs externas al servidor para que este las consulte internamente. | La API de Task Manager no acepta URLs upstream controladas por el usuario ni realiza peticiones HTTP externas basadas en input no sanitizado. | Revisión de arquitectura de rutas. |
| **API8:2023 - Security Misconfiguration** | Exposición de trazas de error (stack traces), cabeceras inseguras o CORS desprotegido. | Cabeceras de seguridad activas (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`), manejador global de errores que enmascara trazas internas. | `app.js` (middleware seguro y error handler). |
| **API9:2023 - Improper Inventory Management** | Exposición de versiones antiguas o rutas huérfanas de la API sin control de acceso. | Versionamiento explícito `/api/v1/` y manejador 404 estricto para rutas no registradas o versiones deprecadas. | `app.js` (manejador 404). |
| **API10:2023 - Unsafe Consumption of APIs** | Confianza ciega en servicios de terceros o payloads malformados. | Validación estricta y tipado previo a la persistencia mediante `validateTitle` y `validatePassword`. | `validation.test.js`. |

---

## 2. Ejercicio Práctico 9 (Página 13 de la Guía): Intento de Modificación de `ownerId` (BOPLA)

> **Enunciado de la práctica:** *"En el entorno de pruebas, intenta actualizar una tarea incluyendo el campo ownerId. Verifica que la API lo ignore o lo rechace y mantenga la propiedad derivada del servidor."*

### Metodología de la Prueba
1. El Usuario A (`ownerToken`) crea una tarea legítima con título `"Tarea Original"` e ID asignado por el sistema.
2. Un atacante (o el mismo cliente) envía una petición `PUT /api/v1/tasks/:id` intentando reasignar la propiedad inyectando:
   ```json
   {
     "title": "Actualizado con intento malicioso",
     "ownerId": "attacker-stolen-ownership-id"
   }
   ```
3. Se verifican dos condiciones:
   * **En la respuesta HTTP:** El objeto devuelto no adopta el ID inyectado.
   * **En la base de datos persistida:** Se consulta directamente el registro en `db.findTaskById(taskId)` y se confirma que `ownerId === usuarioA.id`.

### Resultado de Ejecución
```text
PASS tests/tasks.test.js
  Practice Exercise 9: Broken Object Property-Level Authorization (BOPLA)
    √ retains server-derived ownership when client attempts to inject an ownerId during update (29 ms)
```

---

## 3. Pruebas de Inyección SQL y Cross-Site Scripting (XSS)

### Inyección SQL (SQLi)
* **Payload enviado:** `' OR '1'='1` en el campo `title`.
* **Resultado:** La capa de persistencia trata el payload como una cadena literal inofensiva. La tarea se almacena exactamente como `' OR '1'='1'` y al consultarse retorna dicho texto sin alterar la cláusula WHERE de la consulta ni retornar tareas de otros usuarios.

### Cross-Site Scripting (XSS)
* **Payload enviado:** `<script>alert(1)</script>` o `<img src=x onerror=alert('xss')>`.
* **Resultado en Backend:** Se almacena como texto plano seguro.
* **Resultado en Flutter UI:** Los widgets `Text` de Flutter no ejecutan motor HTML ni JavaScript web; renderizan la cadena literalmente en pantalla como glifos de texto ordinario, neutralizando por completo el vector de inyección web.
