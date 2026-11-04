import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '10s', // 10s is sufficient for local verification
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'], // Expect 95% of requests to complete under 500ms
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

