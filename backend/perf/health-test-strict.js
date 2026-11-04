import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '5s',
  // Practice Exercise 10: Changed threshold to ultra-strict p(95)<0.5ms (or 1ms)
  // which will breach and demonstrate failure reporting in k6
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<0.5'], // Changed threshold: demands p(95) < 0.5ms, which local loopback cannot reliably achieve
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const response = http.get(`${baseUrl}/health`);
  check(response, {
    'health returns 200': (r) => r.status === 200,
  });
  sleep(0.5);
}
