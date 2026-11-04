# Comparativa Arquitectónica: Pruebas con Mocks vs Pruebas de Integración con Base de Datos
**Sección 15 de la Guía: Elección cuidadosa de mocks y mitigación de pruebas intermitentes (Flaky Tests)**

---

## 1. Ejercicio Práctico 15 (Página 18 de la Guía): Análisis Comparativo

> **Enunciado de la práctica:** *"Compara una prueba de cliente de API con mocks frente a una prueba de integración de API utilizando una base de datos de pruebas dedicada. Registra qué detecta cada una y qué no puede detectar cada una."*

Las dos pruebas fueron implementadas y ejecutadas en el repositorio bajo el archivo:
[`backend/tests/mock-vs-integration.test.js`](file:///c:/Users/cesar/Downloads/Guiado%20Testing/backend/tests/mock-vs-integration.test.js)

---

### Matriz Comparativa Detallada

| Criterio de Comparación | Prueba con Mock del Cliente API (`TaskApiClient` mock) | Prueba de Integración con Base de Datos Dedicada (Supertest + DB) |
| :--- | :--- | :--- |
| **Velocidad de Ejecución** | **Ultrarrápida (~2-3 milisegundos)**. Se ejecuta enteramente en memoria del proceso de Node.js sin sockets de red ni I/O. | **Moderada (~11-25 milisegundos)**. Pasa por el pipeline HTTP de Express, serialización JSON y capas de repositorio. |
| **Aislamiento / Dependencias** | 100% aislada. No requiere servidor HTTP activo ni base de datos conectada. | Requiere el servidor de Express y la capa de base de datos dedicada inicializada. |
| **¿Qué DETECTA? (What it catches)** | • Si la clase cliente formatea mal la URL o los headers HTTP (`Authorization: Bearer`).<br>• Si el cliente falla al parsear el objeto JSON devuelto por la API.<br>• Cómo reacciona el cliente ante errores simulados (ej. simular un 500 para verificar que la UI no reviente).<br>• Regresiones directas en la lógica de negocio pura del SDK/cliente. | • Si el token JWT tiene una firma inválida, expiró o fue rechazado por el middleware `authenticate`.<br>• Desajustes reales en los nombres de columnas o campos entre cliente y servidor.<br>• Violaciones de unicidad en la base de datos (ej. código 23505 en PostgreSQL).<br>• Fugas de seguridad BOLA (si un usuario puede leer tareas de otro usuario en consultas reales).<br>• Cabeceras CORS reales y límites de tamaño de payload (10kb). |
| **¿Qué NO PUEDE detectar? (What it CANNOT catch)** | • **Falsos positivos de éxito:** La prueba pasará aunque el backend real haya roto el endpoint o cambiado el esquema.<br>• No valida autenticación real ni expiración de tokens JWT.<br>• No detecta errores de sintaxis en consultas SQL o llaves foráneas.<br>• No detecta incompatibilidades de middleware o encabezados HTTP. | • No detecta errores visuales de renderizado ni desbordamiento de píxeles en dispositivos móviles.<br>• No detecta cómo maneja el sistema operativo móvil la pérdida abrupta de señal o suspensión de la app.<br>• Es más lenta de ejecutar a escala si hay miles de pruebas. |

---

## 2. Cuadro Comparativo de Tipos Comunes de Pruebas (Páginas 18-19 de la Guía)

| Tipo de Prueba | Propósito Principal | Quién la Ejecuta Habitualmente | Herramientas Típicas | Velocidad Relativa |
| :--- | :--- | :--- | :--- | :---: |
| **Unitaria (Unit)** | Verificar una función, validador o clase aislada. | Desarrollador, QA Engineer | Jest, `flutter_test` | **Muy rápida** |
| **Componente / Widget** | Verificar componentes de UI y sus estados (carga, vacío, error, datos). | Desarrollador, QA Engineer | `flutter_test` | **Rápida** |
| **API / Integración** | Verificar rutas, middleware, servicios y persistencia juntos. | Desarrollador, QA Engineer | Supertest, curl, test database | **Media** |
| **Fin a Fin (End-to-end / UI)** | Verificar el viaje completo del usuario a través del sistema. | QA Engineer, Desarrollador | Flutter `integration_test` | **Lenta** |
| **Exploratoria** | Descubrir comportamientos no previstos mediante investigación guiada. | Tester, Desarrollador, Producto | App, notas, herramientas del dispositivo | **Variable** |
| **Seguridad** | Auditar autorización (BOLA/BOPLA), validaciones y resiliencia ante inyecciones. | Tester especializado, Auditor de seguridad | OWASP checklist, Supertest, scanners | **Variable** |
| **Rendimiento / Carga** | Medir tiempos de respuesta y estabilidad bajo carga definida. | Tester de rendimiento, Desarrollador | k6, Locust, JMeter | **Variable** |
| **Accesibilidad / Usabilidad** | Evaluar la facilidad de uso y compatibilidad con tecnologías de asistencia. | Tester, Usuarios, Especialista | Lectores de pantalla, devtools | **Variable** |
| **Compatibilidad** | Verificar comportamiento en diversos dispositivos y versiones de SO. | QA Engineer, Device Lab | Dispositivos reales, emuladores | **Variable** |
| **Humo / Regresión** | Confirmar salud básica tras un build y detectar efectos secundarios no deseados. | Desarrollador, QA Engineer | Suites en CI (GitHub Actions) | **Depende del alcance** |

---

## 3. Principios para Gestionar Pruebas Intermitentes (Flaky Tests)

1. **Nunca simular (mockear) lo que se intenta verificar:**
   Si se está probando una frontera de autorización o control de acceso entre usuarios (BOLA), **jamás** se debe mockear la base de datos o el middleware de sesión, ya que el mock simularía la respuesta que uno mismo escribió, anulando el valor de la prueba.
2. **Controlar el determinismo:**
   Evitar el uso de `sleep()` estáticos o temporizadores arbitrarios. En Flutter, usar `pumpAndSettle()`. En backend, sincronizar mediante promesas `async/await`.
3. **Limpieza estricta de estado (State Isolation):**
   Garantizar que cada prueba configure sus propios datos sintéticos y limpie su estado (`beforeEach(() => db.reset())`) para que el orden de ejecución no altere el resultado.
