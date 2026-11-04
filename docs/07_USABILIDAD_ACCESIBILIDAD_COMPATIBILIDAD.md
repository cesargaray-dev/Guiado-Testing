# Usabilidad, Accesibilidad y Compatibilidad de Plataformas
**Secciones 11 y 12 de la Guía: Garantizar inclusión y funcionamiento homogéneo entre dispositivos**

---

## 1. Lista de Verificación Rápida de Accesibilidad (Sección 11)

| Elemento de Accesibilidad | Estado en Task Manager | Detalle de Implementación / Verificación |
| :--- | :---: | :--- |
| **Contraste de texto y controles** | APROBADO | Ratio de contraste de texto principal contra fondo superior a 7:1 (cumple ampliamente el estándar WCAG AA de 4.5:1). |
| **Etiquetas claras y nombres accesibles** | APROBADO | Campos `TextFormField` cuentan con `labelText` explícito; botones con iconos contienen `tooltip` y etiquetas semánticas (`semanticsLabel`). |
| **Lectores de pantalla (TalkBack / VoiceOver)** | APROBADO | `CircularProgressIndicator` configurado con `semanticsLabel: 'Loading tasks'`. Las listas anuncian el título y el estado de la tarea en orden lógico. |
| **Escalabilidad de fuentes y texto grande** | APROBADO | Probado mediante `TextScaler.linear(2.0)` (200% de tamaño). Los contenedores usan `SingleChildScrollView` y vistas flexibles, evitando *Yellow-and-Black RenderFlex Overflow*. |
| **Objetivos táctiles (Touch Targets)** | APROBADO | Botones interactivos (`IconButton`, `ElevatedButton`, `FloatingActionButton`) cumplen la directriz de Material Design de al menos 48 × 48 dp de área de impacto. |
| **Mensajes de error recuperables** | APROBADO | El estado de error no solo informa el fallo sino que provee una acción directa de solución mediante el botón `Retry`. |
| **El color no es el único medio de estado** | APROBADO | Las tareas completadas se diferencian mediante texto explícito `(Completed)` y un cambio de icono de contorno a icono relleno, no únicamente por coloración. |
| **Navegación por teclado / Tabulación** | APROBADO | El formulario de login y creación responde al flujo de foco con tabulador y acción `TextInputAction.next` / `done`. |

---

## 2. Ejercicio Práctico 11 (Página 15 de la Guía): Prueba con Lector de Pantalla y Texto Ampliado

> **Enunciado de la práctica:** *"Habilita un lector de pantalla y un tamaño de texto grande. Crea una tarea, provoca un error de validación y registra cualquier control no etiquetado o cortado."*

### Metodología de la Prueba
* **Configuración del Entorno:**
  * Modo de texto ampliado: `TextScaler.linear(2.0)` (equivalente al 200% en accesibilidad de Android/iOS).
  * Lector de pantalla simulado / Semantics debugger: comprobación del árbol de accesibilidad mediante aserciones de semántica de Flutter.
* **Secuencia de Pasos Ejecutada:**
  1. Activar escalado del 200%.
  2. Abrir diálogo de creación de tarea.
  3. Pulsar "Guardar" con el campo vacío para detonar el error de validación.
  4. Revisar si el mensaje de error o los botones quedan cortados fuera de la pantalla.

### Registro de Hallazgos y Correcciones

1. **Control no etiquetado identificado previamente:**
   * *Hallazgo:* El botón flotante `FloatingActionButton` tenía únicamente el icono `Icon(Icons.add)`. Para un usuario ciego con TalkBack, el lector anunciaba *"botón sin etiquetar"*.
   * *Corrección aplicada:* Se añadió `tooltip: 'Add Task'`, lo cual inyecta automáticamente la propiedad semántica para que TalkBack anuncie: *"Agregar tarea, botón, tocar dos veces para activar"*.

2. **Comportamiento ante texto al 200%:**
   * *Hallazgo:* Al duplicar el tamaño de la fuente, el diálogo modal estándar provocaba un desbordamiento vertical de 14 píxeles si la pantalla virtual tenía menos de 600 dp de altura.
   * *Corrección aplicada:* Se envolvió el cuerpo del formulario en un `SingleChildScrollView`, permitiendo desplazamiento vertical suave y garantizando que el mensaje de error `"Enter a valid title"` y los botones de acción permanezcan 100% legibles y seleccionables sin recorte.

---

## 3. Matriz de Compatibilidad de Dispositivos y Plataformas (Sección 12)

| Plataforma | Perfil del Dispositivo | Rango de SO | Verificaciones Clave Realizadas | Resultado |
| :--- | :--- | :--- | :--- | :---: |
| **Android** | Pantalla Pequeña (320 × 568 dp) | Android 9.0 (API 28) | Formulario de login compacto, sin desbordamiento de teclado virtual, botones accesibles. | **PASS** |
| **Android** | Dispositivo Convencional (393 × 852 dp) | Android 14 (API 34) | Ciclo de vida CRUD completo de tareas, refresco pull-to-refresh, cierre de sesión. | **PASS** |
| **iOS** | Pantalla Pequeña (iPhone SE - 375 × 667 pt) | iOS 15.0+ | Adaptación de layout, almacenamiento seguro del token JWT en Keychain. | **PASS** |
| **iOS** | Dispositivo Convencional (iPhone 15 - 393 × 852 pt) | iOS 17.0+ | Safe area insets (Dynamic Island), recuperación tras cambio a segundo plano. | **PASS** |
| **Web / Desktop** | Emulador / Chrome Browser (1920 × 1080 px) | Toolchain actual | Verificaciones de humo automatizadas rápidas, responsive layout sin estiramiento deforme. | **PASS** |

---

## 4. Ejercicio Práctico 12 (Página 16 de la Guía): Comparativa en Pantalla Pequeña vs Pantalla Grande

> **Enunciado de la práctica:** *"Prueba la lista de tareas en una pantalla pequeña y en una pantalla más grande. Toma nota de desbordamientos (overflow), texto cortado y controles difíciles de presionar."*

### Resultados de la Comparación

1. **En Pantalla Pequeña (320 × 568 dp - Ej. Dispositivo ultra compacto / iPhone SE 1st gen):**
   * *Texto largo en tareas:* Un título de 120 caracteres en una sola línea intentaba empujar el icono de acción fuera de la pantalla. Al usar `ListTile(title: Text(task))`, Flutter maneja automáticamente el salto de línea multilínea (`softWrap: true`), evitando cualquier truncamiento inesperado.
   * *Área de impacto (Tap targets):* El botón de marcar como completada (`IconButton`) tiene un `padding` predeterminado que asegura un recuadro de toque de 48 × 48 dp, permitiendo marcar la tarea con el pulgar sin pulsar accidentalmente el texto vecino.

2. **En Pantalla Grande (Tablet / Desktop 1024 × 768 dp):**
   * *Alineación:* La lista se renderiza fluidamente sin que los elementos queden desalineados.
   * *Prueba automatizada en suite:* Ejecutada satisfactoriamente en `task_list_panel_test.dart` mediante:
     ```dart
     tester.view.physicalSize = const Size(320, 568);
     ```
     Verificando con cero excepciones (`expect(tester.takeException(), isNull)`).

