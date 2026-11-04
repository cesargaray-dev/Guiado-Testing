# Casos de Prueba y Reporte de Defectos (Bug Report)
**Sección 2 de la Guía: Escribir casos de prueba útiles y reportes de error reproducibles**

---

## 1. Plantilla Estándar de Casos de Prueba

| Campo | Descripción |
| :--- | :--- |
| **ID y Título** | Identificador único corto y comportamiento específico bajo prueba. |
| **Precondiciones** | Estado previo requerido de la cuenta, aplicación y base de datos. |
| **Pasos** | Secuencia de acciones numeradas y unívocas. |
| **Datos de Prueba** | Valores sintéticos exactos utilizados. |
| **Resultado Esperado** | Comportamiento observable y verificable esperado. |
| **Resultado Actual** | Lo que realmente ocurrió durante la ejecución. |
| **Entorno** | Dispositivo, SO, versión de la aplicación y compilación del backend. |

---

## 2. Casos de Prueba Ejecutados

### Caso de Prueba TC-01: Creación de Tarea con Título Válido
* **ID y Título:** `TC-01 - Creación exitosa de tarea por usuario autenticado`
* **Precondiciones:**
  1. Base de datos de pruebas inicializada.
  2. Usuario sintético registrado (`tester1@example.test`) con sesión activa.
* **Pasos:**
  1. Enviar petición `POST /api/v1/tasks` con header `Authorization: Bearer <valid_token>`.
  2. Enviar cuerpo JSON: `{"title": "Configurar pipeline CI"}`.
  3. Consultar `GET /api/v1/tasks` con el mismo token.
* **Datos de Prueba:** Título: `"Configurar pipeline CI"`.
* **Resultado Esperado:** Respuesta HTTP 201 con objeto tarea `{ id, title, completed: false, ownerId }`. La tarea aparece en la lista devuelta por GET con código HTTP 200.
* **Resultado Actual:** Pasó (Status 201, persistida con id único y asignada al usuario).
* **Entorno:** Node.js v24.13.0, Express 4.19.2, Windows 11.

---

### Caso de Prueba TC-02: Rechazo de Título con Espacios en Blanco
* **ID y Título:** `TC-02 - Rechazo de tarea con título que contiene únicamente espacios`
* **Precondiciones:** Usuario autenticado con token válido.
* **Pasos:**
  1. Enviar petición `POST /api/v1/tasks` con header `Authorization: Bearer <valid_token>`.
  2. Enviar cuerpo JSON: `{"title": "    "}`.
* **Datos de Prueba:** Título: `"    "` (4 espacios).
* **Resultado Esperado:** Código de respuesta HTTP 400 Bad Request, cuerpo `{ "error": "Enter a valid title." }`. No se almacena ninguna tarea en la base de datos.
* **Resultado Actual:** Pasó (Status 400 devuelto con mensaje exacto).
* **Entorno:** Node.js v24.13.0, Express 4.19.2, Jest 29.7.0.

---

### Caso de Prueba TC-03: Aislamiento Multiusuario (Prevención BOLA)
* **ID y Título:** `TC-03 - Impedir acceso y modificación de tareas de otro usuario`
* **Precondiciones:**
  1. Usuario A (`owner@example.test`) tiene una tarea creada con ID `task-owner-101`.
  2. Usuario B (`stranger@example.test`) ha iniciado sesión con su propio token.
* **Pasos:**
  1. Usuario B envía `GET /api/v1/tasks/task-owner-101` con su token.
  2. Usuario B envía `PUT /api/v1/tasks/task-owner-101` con `{ "title": "Modificado por extraño" }`.
* **Datos de Prueba:** Task ID objetivo: `task-owner-101`. Token de atacante: Usuario B.
* **Resultado Esperado:** La petición GET responde con HTTP 404 (o 403) para evitar enumeración. La petición PUT responde con HTTP 403 Forbidden. El título original permanece inalterado.
* **Resultado Actual:** Pasó (GET respondió 404, PUT respondió 403, datos del Usuario A intactos).
* **Entorno:** Node.js v24.13.0, Supertest 7.0.0.

---

## 3. Ejercicio Práctico 2 (Página 4 de la Guía): Reporte de Defecto (Bug Report)

### Contexto del Defecto
> **Enunciado de la práctica:** *"Escribir un reporte para una tarea que desaparece tras ser marcada como completada. Incluir pasos, resultados esperados y actuales, y una evaluación de severidad/prioridad."*

---

### Reporte de Defecto: BUG-104

| Campo | Contenido |
| :--- | :--- |
| **ID del Defecto** | **BUG-104** |
| **Resumen (Summary)** | La tarea desaparece permanentemente de la vista y del listado activo al ser marcada como completada en lugar de reflejar su estado finalizado con estilo visual tachado. |
| **Entorno (Environment)** | Flutter Mobile App v1.0.0 (Build 12), Android 14 Emulador (API 34) y Web Chrome 124.0. Backend Express v1.0.0. |
| **Precondiciones** | Usuario de prueba con sesión iniciada (`tester@example.test`). Existencia de al menos una tarea pendiente creada ("Revisar informe trimestral"). |
| **Pasos para Reproducir** | 1. Iniciar sesión en la app móvil con credenciales de prueba válidas.<br>2. Navegar a la pantalla principal "Tasks".<br>3. Observar la tarea "Revisar informe trimestral" en la lista con icono de círculo desmarcado.<br>4. Presionar el icono de verificación circular (botón `complete-task-0`).<br>5. Observar la pantalla y refrescar la lista deslizando hacia abajo (pull-to-refresh). |
| **Resultado Esperado** | La tarea debe permanecer visible en la lista, actualizando su icono a un círculo marcado (verde o lleno) y su texto formateado con tachado (strikethrough) o movida a una sección visible colapsable titulada "Completadas", preservando su registro para auditoría del usuario. |
| **Resultado Actual** | La tarea desaparece inmediatamente del listado visible tras el tap. Al refrescar, la tarea no se muestra por ningún lado, generando la percepción en el usuario de haber sido eliminada o perdida irrevocablemente por un error del sistema. |
| **Evidencias (Evidence)** | • Log de red: Petición `PUT /api/v1/tasks/:id` retorna `{ "id": "task-1", "completed": true }` (200 OK).<br>• Causa raíz identificada en UI: El widget `TaskListPanel` aplicaba un filtro `where((task) => !task.completed)` en el renderizado sin proporcionar selector de pestaña ni indicador de filtro activo. |
| **Severidad (Severity)** | **High (Alta)** |
| **Prioridad (Priority)** | **High (Alta)** |

---

### Evaluación y Diferenciación entre Severidad y Prioridad

* **Definición conceptual de la Guía:**
  * **Severidad (Severity):** Describe el **impacto técnico y operativo** del defecto sobre el sistema y el usuario (¿qué tan destructivo es el daño?).
  * **Prioridad (Priority):** Describe la **urgencia de programación o atención** que el equipo de desarrollo debe darle para corregirlo en el ciclo de vida del release (¿qué tan pronto debe quedar resuelto?).

* **Justificación para BUG-104:**
  * **¿Por qué Severidad Alta?** Porque causa una percepción directa de **pérdida de datos**. El usuario completó un trabajo y de repente no tiene confirmación visual de que su tarea existe, lo que destruye la confianza fundamental en el Task Manager.
  * **¿Por qué Prioridad Alta?** Porque marcar una tarea como completada es el **flujo de negocio principal (core flow)** de una aplicación de tareas. Si la versión se libera con este comportamiento sin aviso o filtro visible, el 100% de los usuarios activos reportarán frustración en las primeras interacciones.
