# Reporte de Rendimiento y Pruebas de Carga con k6
**Sección 10 de la Guía: Comprobar el rendimiento y la carga de forma segura**

---

## 1. Objetivo y Metodología

* **Objetivo:** Medir los tiempos de respuesta, tasa de error y estabilidad del endpoint `/health` bajo una carga sintética controlada.
* **Herramienta:** Grafana k6 v2.3.0.
* **Entorno:** Localhost Node.js/Express en `http://127.0.0.1:3000`.
* **Configuración de carga:** 5 usuarios virtuales concurrentes (VUs) durante 10 segundos, realizando peticiones con intervalo de descanso de 1 segundo entre iteraciones.

---

## 2. Ejecución 1: Prueba de Línea Base (Thresholds Normales)

### Script k6 (`backend/perf/health-test.js`)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Tasa de fallos menor al 1%
    http_req_duration: ['p(95)<500'],  // 95% de las peticiones en menos de 500 ms
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const response = http.get(`${baseUrl}/health`);
  check(response, {
    'health returns 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

### Salida Real de la Ejecución de Línea Base
```text
         /\      Grafana   /‾‾/  
    /\  /  \     |\  __   /  /   
   /  \/    \    | |/ /  /   ‾‾\ 
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/ 

  █ THRESHOLDS 

    http_req_duration
    ✓ 'p(95)<500' p(95)=15.9ms

    http_req_failed
    ✓ 'rate<0.01' rate=0.00%

  █ TOTAL RESULTS 

    checks_total.......: 50      4.977794/s
    checks_succeeded...: 100.00% 50 out of 50
    checks_failed......: 0.00%   0 out of 50

    ✓ health returns 200

    HTTP
    http_req_duration..............: avg=2.83ms min=0s med=1.5ms max=17.72ms p(90)=3.41ms p(95)=15.9ms
    http_req_failed................: 0.00%  0 out of 50
    http_reqs......................: 50     4.977794/s

    EXECUTION
    iteration_duration.............: avg=1s min=1s med=1s max=1.02s p(90)=1s p(95)=1.02s
    iterations.....................: 50     4.977794/s
    vus............................: 5      min=5 max=5

Status: Exit code 0 (PASS)
```

---

## 3. Ejercicio Práctico 10 (Página 14 de la Guía): Modificación de Umbral y Análisis del Reporte

> **Enunciado de la práctica:** *"Ejecuta la verificación de salud contra tu API local. Cambia un umbral, vuelve a ejecutar y explica qué indica el reporte."*

### Umbral Modificado (`backend/perf/health-test-strict.js`)
Se modificó el umbral de latencia a una condición artificialmente estricta:
`http_req_duration: ['p(95)<0.5']` (exigiendo que el 95% de las respuestas tomen menos de medio milisegundo: 0.5 ms).

### Salida Real de la Ejecución con Incumplimiento de Umbral
```text
  █ THRESHOLDS 

    http_req_duration
    ✗ 'p(95)<0.5' p(95)=2.94ms

    http_req_failed
    ✓ 'rate<0.01' rate=0.00%

  █ TOTAL RESULTS 

    checks_total.......: 50      9.94266/s
    checks_succeeded...: 100.00% 50 out of 50
    checks_failed......: 0.00%   0 out of 50

    ✓ health returns 200

    HTTP
    http_req_duration..............: avg=1.77ms  min=870.7µs  med=1.6ms    max=3.81ms   p(90)=2.91ms   p(95)=2.94ms  
    http_req_failed................: 0.00%  0 out of 50
    http_reqs......................: 50     9.94266/s

time="2026-11-04T16:55:26-06:00" level=error msg="thresholds on metrics 'http_req_duration' have been crossed"

Status: Exit code 1 (FAILED)
```

---

## 4. Explicación Detallada de lo que Indica el Reporte

1. **Incumplimiento Visual del Umbral (`✗ 'p(95)<0.5'`):**
   * k6 marca con una `✗` roja el umbral violado. El valor percentil 95 observado fue de **`2.94 ms`**, el cual supera el límite configurado de **`0.5 ms`**.
   * Aunque 2.94 ms es una latencia excepcionalmente rápida para un servidor web Node.js, k6 evalúa de manera estricta y matemática la condición programada.

2. **Diferenciación entre Aserciones (`Checks`) y Umbrales (`Thresholds`):**
   * **Checks (`checks_succeeded: 100.00%`):** El 100% de las peticiones fueron funcionalmente exitosas (respondieron con código HTTP 200 y cuerpo válido). Un check fallido no aborta el proceso con error a menos que esté ligado a un threshold.
   * **Thresholds:** Son los Criterios de Aceptación de Nivel de Servicio (SLA/SLO). Al sobrepasarse el umbral de duración, k6 emitió la alerta `level=error msg="thresholds on metrics 'http_req_duration' have been crossed"` y finalizó con **código de salida 1 (exit code 1)**.

3. **Importancia para Integración Continua (CI/CD):**
   * Debido a que k6 retorna un código de salida distinto de cero (`exit code 1`), cualquier pipeline de CI (como GitHub Actions) detecta automáticamente la degradación de rendimiento y cancela el despliegue a producción antes de que el código afecte a los usuarios reales.

