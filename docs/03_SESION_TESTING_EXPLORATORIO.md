# Sesión de Pruebas Exploratorias basada en Charter
**Sección 3 de la Guía: Explorar la aplicación con un objetivo en mente (Charter)**

---

## 1. Misión de la Sesión (Exploratory Charter)

* **Charter:** *"Explorar la creación y edición de tareas en la aplicación Task Manager con foco en detectar problemas de pérdida de datos, condiciones de carrera por pulsaciones repetidas rápidas y degradación ante interrupciones de conectividad de red."*
* **Tiempo asignado (Timebox):** 15 minutos.
* **Tester:** QA Engineer.
* **Entorno:** Flutter Mobile App conectada a API local Node.js/Express en `http://localhost:3000`.

---

## 2. Registro de Sesión (Session Notes Template)

| Tiempo | Acción o Condición | Observación Observable | Seguimiento / Conclusión |
| :---: | :--- | :--- | :--- |
| **00:00** | Inicio de sesión con el usuario de prueba sintético `qa_explorer@example.test`. | La pantalla principal de tareas carga en menos de 300 ms mostrando el listado vacío inicial ("No tasks yet."). | Comportamiento inicial correcto. |
| **00:02** | Creación con **título largo** (150 caracteres, superando el límite establecido de 120 caracteres). | El formulario en la interfaz web/móvil permite ingresar los 150 caracteres, pero al pulsar "Guardar" la API rechaza con HTTP 400 (`Enter a valid title.`). En la UI no había un contador de caracteres ni validación visual previa. | **Mejora:** Agregar indicador `120/120` y bloqueo del campo en el cliente (`maxLength: 120`) para evitar viajes innecesarios al servidor. |
| **00:05** | Creación con **título en blanco** (solo espacios: `"   "`). | La aplicación muestra el mensaje `"Enter a valid title."` en el cuadro de diálogo. El botón de guardar permanece habilitado pero no cierra el modal ni envía la tarea corrupta al servidor. | Comportamiento seguro verificado. |
| **00:08** | **Pulsaciones rápidas y repetidas (Rapid repeated taps)** sobre el botón "Guardar" al crear una nueva tarea válida ("Revisar logs"). | Al hacer 5 taps ultrarrápidos sobre el botón "Guardar" antes de que se complete la primera animación de cierre, se enviaron 2 peticiones paralelas al backend, creando **2 tareas duplicadas idénticas** con el mismo título y distinta clave primaria. | **Hallazgo crítico:** Falta mecanismo de *debounce* o deshabilitación inmediata del botón (`onPressed: _isSubmitting ? null : _submit`) tras el primer tap. |
| **00:11** | Edición de título de tarea seguido de **interrupción breve de conectividad (offline)**. Se desactiva la red justo al pulsar "Guardar". | La aplicación muestra el estado de error en pantalla: `"Network connection failed."` y renderiza el botón de reintento (`Retry`). El texto que el usuario había editado se mantuvo en el controlador del formulario. | Al pulsar `Retry` con la red restablecida, la tarea se guarda satisfactoriamente sin perder lo digitado. Cumple con la resiliencia requerida. |
| **00:14** | Intento de inyección de etiquetas HTML en el título: `<b onmouseover="alert('xss')">Importante</b>`. | La aplicación almacena la cadena tal cual y la renderiza literalmente como texto plano sin ejecutar el script ni formatear HTML. | Cumple con la defensa contra XSS. |
| **00:15** | Finalización del timebox de 15 minutos y consolidación de notas. | Resumen de hallazgos y creación de incidencias en backlog. | Tareas listas para reporte. |

---

## 3. Ejercicio Práctico 3 (Página 5 de la Guía): Lo que Sorprendió durante la Exploración

> **Enunciado de la práctica:** *"Explora la creación y edición de tareas durante 15 minutos. Prueba un título largo, un título en blanco, pulsaciones repetidas rápidas y conectividad interrumpida brevemente. Registra lo que te sorprendió."*

### Aspectos que Sorprendieron y Aprendizajes Clave:

1. **La duplicación de registros por pulsaciones repetidas (Double Submit Race Condition):**
   * *Sorpresa:* Es común asumir que una base de datos o un framework moderno previene duplicaciones instantáneas. Sin embargo, al pulsar repetidamente el botón de guardar sin protección en el cliente (`isLoading: true`), el backend procesa cada solicitud de forma legítima, generando IDs únicos independientes. Esto evidenció la necesidad de implementar una clave de idempotencia (`Idempotency-Key` en headers HTTP) o deshabilitar inmediatamente el botón tras el primer tap en el widget de Flutter.

2. **La resiliencia del botón de Reintento (`Retry`) en el estado de error:**
   * *Sorpresa positiva:* Al implementar el botón de reintento en el estado de error (solicitado en el Ejercicio Práctico 5), la experiencia de usuario ante fallas transitorias de red pasó de ser frustrante a muy fluida. En lugar de requerir que el usuario vuelva a abrir el modal o reescriba el título, un simple tap resolvió el estado de error de forma idempotente.

3. **La discrepancia de límites entre cliente y servidor:**
   * *Sorpresa:* Aunque la API protegía estrictamente el límite de 120 caracteres, el campo de texto móvil permitía escribir indefinidamente. Esto demostró que la validación en backend es indispensable para la seguridad, pero la validación en frontend es crucial para la experiencia de usuario.

