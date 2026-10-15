import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:8082").replace(/\/$/, "");
const USER_ID = (__ENV.USER_ID || "").trim();
const AUTH_TOKEN = (__ENV.AUTH_TOKEN || "").trim();
const TARGET_VUS = Math.max(1, Number(__ENV.VUS || 5));
const HOLD_DURATION = __ENV.HOLD_DURATION || "30s";

const headers = {
  Accept: "application/json",
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

export const options = {
  stages: [
    { duration: __ENV.RAMP_DURATION || "15s", target: TARGET_VUS },
    { duration: HOLD_DURATION, target: TARGET_VUS },
    { duration: __ENV.COOLDOWN_DURATION || "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
    checks: ["rate>0.95"],
  },
};

function getAndCheck(path, description) {
  const response = http.get(`${BASE_URL}${path}`, {
    headers,
    tags: { endpoint: description },
  });

  check(response, {
    [`${description} returns 2xx`]: (result) =>
      result.status >= 200 && result.status < 300,
  });
}

export default function () {
  // Read-only route. It covers the PMS -> Unified Security Master call as well.
  getAndCheck("/api/security/get-all-security-info", "security_master_list");

  if (USER_ID) {
    getAndCheck(`/api/portfolio/count-portfolio/${encodeURIComponent(USER_ID)}`, "portfolio_count");
    getAndCheck(`/api/portfolio/count-active/${encodeURIComponent(USER_ID)}`, "active_portfolio_count");
    getAndCheck(`/api/portfolio/remaining-total/${encodeURIComponent(USER_ID)}`, "portfolio_remaining_total");
  }

  sleep(Number(__ENV.THINK_TIME_SECONDS || 1));
}
