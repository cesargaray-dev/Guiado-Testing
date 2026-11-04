# Suite de Pruebas de Humo (Smoke) y Lista de Regresión
**Sección 13 de la Guía: Verificaciones rápidas de salud y gestión de datos de prueba**

---

## 1. Suite de Pruebas de Humo (Smoke Test Suite)

La suite de humo se ejecuta inmediatamente después de cada despliegue o compilación nueva en un entorno de integración. Su objetivo es confirmar la viabilidad básica del sistema en menos de 60 segundos.

| Paso | Acción de Verificación | Criterio de Aceptación (PASS/FAIL) | Tipo de Ejecución |
| :---: | :--- | :--- | :---: |
| **SMK-01** | **Arranque de la App:** La aplicación móvil/web abre sin pantalla blanca ni excepciones en consola. | La pantalla de Login se renderiza con campos de email, password y botón de acción. | Automatizado (CI) |
| **SMK-02** | **Autenticación (Login):** Iniciar sesión con usuario de prueba sintético. | Se genera el token JWT y se navega inmediatamente a la vista de "Tasks". | Automatizado (CI) |
| **SMK-03** | **Carga del Listado:** La lista de tareas carga desde la API sin estado de error. | Muestra el estado vacío ("No tasks yet.") o las tareas previamente asociadas. | Automatizado (CI) |
| **SMK-04** | **Creación Rápida:** Crear una tarea con el título `"Smoke check"`. | La tarea aparece en la lista visualmente en menos de 1 segundo. | Automatizado (CI) |
| **SMK-05** | **Cierre de Sesión:** Pulsar el botón de Logout. | La sesión se destruye en el servidor y la interfaz regresa a la pantalla de Login. | Automatizado (CI) |

---

## 2. Ejercicio Práctico 13 (Página 16 de la Guía): Lista de Verificación de Regresión Completa

> **Enunciado de la práctica:** *"Elabora una lista de verificación de regresión para la creación, edición, completado, eliminación y acceso cruzado entre usuarios."*

### Lista de Chequeo de Regresión (Regression Checklist)

| Módulo | ID | Caso de Verificación | Pasos Resumidos | Resultado Esperado | Estado |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **Creación** | **REG-01** | Creación con caracteres especiales y emojis | Crear tarea con `"Prueba de UTF-8: 🚀 #1 & <OK>"` | La tarea se guarda y muestra los glifos correctamente sin alteración. | **PASS** |
| **Creación** | **REG-02** | Espacios en extremos (Trim automático) | Enviar `"   Título con espacios   "` | El backend elimina los espacios iniciales/finales y almacena `"Título con espacios"`. | **PASS** |
| **Creación** | **REG-03** | Rechazo por longitud mayor a 120 caracteres | Enviar cadena de 121 caracteres | HTTP 400 con `"Enter a valid title."`. | **PASS** |
| **Edición** | **REG-04** | Actualización de título existente | Modificar el título de `"Tarea 1"` a `"Tarea 1 Modificada"` | La API retorna 200 OK y el listado actualiza el texto inmediatamente. | **PASS** |
| **Edición** | **REG-05** | Intento de guardar título vacío en edición | Enviar cuerpo `{ "title": "" }` en `PUT /api/v1/tasks/:id` | Retorna HTTP 400 Bad Request; el título anterior se mantiene intacto. | **PASS** |
| **Completado** | **REG-06** | Marcar tarea como completada | Pulsar botón de completar en tarea pendiente | Estado `completed: true`, icono marcado y texto actualizado con `(Completed)`. | **PASS** |
| **Completado** | **REG-07** | Desmarcar tarea completada (Toggle reversa) | Pulsar nuevamente botón de completar | El estado regresa a `completed: false` sin inconsistencias de datos. | **PASS** |
| **Eliminación** | **REG-08** | Eliminación exitosa de tarea propia | Enviar petición `DELETE /api/v1/tasks/:id` | Retorna HTTP 204 No Content; la tarea desaparece de la base de datos y de la vista. | **PASS** |
| **Eliminación** | **REG-09** | Intento de eliminación repetida (Idempotencia) | Reenviar `DELETE` sobre el ID recién borrado | Retorna HTTP 404 Not Found de forma controlada. | **PASS** |
| **Acceso Cruzado** | **REG-10** | Lectura no autorizada de tarea ajena (BOLA) | Usuario B consulta `GET /api/v1/tasks/:idUsuarioA` | Retorna HTTP 404 Not Found (no revela existencia de la tarea). | **PASS** |
| **Acceso Cruzado** | **REG-11** | Modificación no autorizada de tarea ajena | Usuario B envía `PUT /api/v1/tasks/:idUsuarioA` | Retorna HTTP 403 Forbidden; los datos de la tarea permanecen intactos. | **PASS** |
| **Acceso Cruzado** | **REG-12** | Eliminación no autorizada de tarea ajena | Usuario B envía `DELETE /api/v1/tasks/:idUsuarioA` | Retorna HTTP 403 Forbidden; la tarea del Usuario A no se elimina. | **PASS** |
| **Acceso Cruzado** | **REG-13** | Inyección de `ownerId` en actualización (BOPLA) | Usuario envía `{ "title": "X", "ownerId": "hacker" }` | La API retiene la propiedad derivada del servidor (`ownerId === usuarioLogueado`). | **PASS** |

---

## 3. Estrategia y Gestión de Datos de Prueba (Test Data Management)

1. **Datos Sintéticos y Desechables:**
   * Toda cuenta generada en pruebas unitarias y de integración utiliza correos con sufijo `@example.test` o identificadores efímeros generados con marcas de tiempo (`testuser_${Date.now()}@example.test`).
   * **Regla estricta:** Ningún dato personal, contraseña real de producción ni token activo se incluye en scripts o evidencias de prueba.

2. **Aislamiento y Limpieza Automática (Database Reset):**
   * En cada bloque de ejecución (`beforeEach` en Jest), se invoca `db.reset()`, garantizando que ningún caso de prueba contamine el estado o las llaves foráneas del siguiente.
   * La base de datos de pruebas es totalmente independiente del entorno de desarrollo o producción.
