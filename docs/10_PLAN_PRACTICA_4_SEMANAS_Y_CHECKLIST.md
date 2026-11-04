# Lista de Habilidades del Tester y Plan de Práctica de 4 Semanas
**Páginas 20-22 de la Guía: Cumplimiento integral del programa de aprendizaje**

---

## 1. Lista de Verificación de Habilidades del Tester (Tester Skills Checklist)

Todas las habilidades requeridas por la guía fueron practicadas, demostradas y validadas con código y documentación en este proyecto:

- [x] **Convertir requisitos en criterios de aceptación observables:**
  * *Evidencia:* Documentado en `docs/01_PLAN_DE_PRUEBAS.md` con los 3 criterios del requerimiento de creación de tareas (éxito típico, entrada inválida y frontera de permisos).
- [x] **Escribir casos de prueba reproducibles y reportes de error claros:**
  * *Evidencia:* Casos `TC-01`, `TC-02`, `TC-03` y reporte de defecto `BUG-104` con análisis de severidad y prioridad en `docs/02_CASOS_DE_PRUEBA_Y_BUG_REPORT.md`.
- [x] **Explorar con un charter enfocado y tomar notas útiles:**
  * *Evidencia:* Sesión de 15 minutos documentada en `docs/03_SESION_TESTING_EXPLORATORIO.md` con hallazgos de condiciones de carrera y reconexión offline.
- [x] **Elegir entradas límite y casos negativos representativos:**
  * *Evidencia:* Tablas de límites y particiones para título y contraseña en `docs/04_TABLA_PARTICIONES_Y_LIMITES.md` y suite `validation.test.js`.
- [x] **Comprender la diferencia entre autenticación y autorización:**
  * *Evidencia:* Pruebas de tokens 401 (Autenticación) vs pruebas BOLA/BOPLA 403 (Autorización) en `tasks.test.js` y `docs/05_AUDITORIA_SEGURIDAD_OWASP.md`.
- [x] **Probar respuestas de API y estados de la aplicación de forma independiente:**
  * *Evidencia:* Pruebas de API aisladas en Supertest (`tasks.test.js`) y pruebas de estados de widgets aislados (`loading`, `empty`, `error`, `data`) en `task_list_panel_test.dart`.
- [x] **Proteger credenciales y datos personales en evidencias de prueba:**
  * *Evidencia:* Uso estricto de cuentas sintéticas (`@example.test`) y tokens de prueba locales. Ningún dato sensible expuesto en logs.
- [x] **Comunicar el riesgo y la incertidumbre con claridad:**
  * *Evidencia:* Evaluación de impacto, severidad alta y riesgos mitigados documentados en los planes de prueba y bug reports.
- [x] **Usar la automatización donde ahorra esfuerzo repetible:**
  * *Evidencia:* Pipeline de CI en `.github/workflows/tests.yml` que ejecuta automáticamente 34 pruebas backend y 13 pruebas Flutter en cada push y PR.
- [x] **Solicitar permiso y definir el alcance antes de pruebas de seguridad o carga:**
  * *Evidencia:* Pruebas k6 ejecutadas exclusivamente en entorno local seguro (`http://127.0.0.1:3000`), respetando las pautas de scope de la guía.

---

## 2. Plan de Práctica de Cuatro Semanas (Four-Week Practice Plan)

| Semana | Enfoque Principal | Entregable Práctico Requerido | Estado en el Repositorio | Archivos / Evidencias Asociadas |
| :---: | :--- | :--- | :---: | :--- |
| **Semana 1** | Mentalidad, planes, casos de prueba y pruebas exploratorias | Un plan de pruebas, 3 casos de prueba y un reporte exploratorio. | **100% COMPLETADO** | • `docs/01_PLAN_DE_PRUEBAS.md`<br>• `docs/02_CASOS_DE_PRUEBA_Y_BUG_REPORT.md`<br>• `docs/03_SESION_TESTING_EXPLORATORIO.md` |
| **Semana 2** | Pruebas unitarias, de widgets, API e integración | Pruebas para validación de título, estados de tarea y propiedad (ownership). | **100% COMPLETADO** | • `backend/tests/validation.test.js`<br>• `backend/tests/tasks.test.js`<br>• `mobile/test/task_test.dart`<br>• `mobile/test/task_list_panel_test.dart` |
| **Semana 3** | End-to-end, valores límite, seguridad y accesibilidad | Un viaje de usuario completo, tabla de valores límite y notas de seguridad/accesibilidad. | **100% COMPLETADO** | • `mobile/test/user_journey_test.dart`<br>• `docs/04_TABLA_PARTICIONES_Y_LIMITES.md`<br>• `docs/05_AUDITORIA_SEGURIDAD_OWASP.md`<br>• `docs/07_USABILIDAD_ACCESIBILIDAD_COMPATIBILIDAD.md` |
| **Semana 4** | Rendimiento, compatibilidad, regresión y CI | Ejecución local de k6, matriz de dispositivos, checklist de regresión y workflow de CI. | **100% COMPLETADO** | • `backend/perf/health-test.js`<br>• `docs/06_REPORTE_RENDIMIENTO_K6.md`<br>• `docs/08_LISTA_SMOKE_Y_REGRESION.md`<br>• `.github/workflows/tests.yml`<br>• `EVIDENCIAS/` |

---

## 3. Errores Comunes Identificados y Cómo se Evitaron

1. **Probar únicamente el "Happy Path":**
   * *Mitigación:* Se implementaron pruebas exhaustivas de títulos vacíos, campos sobredimensionados, tipos erróneos y tokens manipulados.
2. **Escribir resultados esperados vagos como "funciona correctamente":**
   * *Mitigación:* Cada aserción valida códigos de estado HTTP precisos (201, 400, 401, 403, 404), mensajes de error exactos y estados observables de widgets.
3. **Tratar una prueba aprobada como prueba absoluta de que el sistema es seguro:**
   * *Mitigación:* Se aplicó el enfoque de capas (defense-in-depth), auditando OWASP API Top 10 con escenarios negativos directos.
4. **Probar autorización (ownership) con una sola cuenta:**
   * *Mitigación:* Cada prueba BOLA genera dinámicamente dos cuentas independientes (Usuario Propietario y Usuario Extraño) para validar la frontera de aislamiento.
5. **Depender de code coverage como métrica única de calidad:**
   * *Mitigación:* Aunque el coverage del backend supera el 85%, la suite se reforzó con pruebas de límites BVA, pruebas de carga k6 y pruebas exploratorias humanas.

