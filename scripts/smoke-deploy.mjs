#!/usr/bin/env node

const deployUrl = process.env.DEPLOY_URL;

if (!deployUrl) {
  console.error(
    'DEPLOY_URL is required, for example: DEPLOY_URL=https://app.onrender.com',
  );
  process.exit(1);
}

const base = deployUrl.replace(/\/+$/, '');

function ensureOk(response, label) {
  if (!response.ok) {
    throw new Error(
      `${label} failed with ${response.status} ${response.statusText}`,
    );
  }
}

async function getJson(path, label) {
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: 'application/json' },
  });
  ensureOk(response, label);
  return response.json();
}

async function run() {
  console.log(`Smoke testing deployment at ${base}`);

  const pageResponse = await fetch(`${base}/`);
  ensureOk(pageResponse, 'GET /');
  console.log('PASS GET /');

  const health = await getJson('/api/health', 'GET /api/health');
  if (!health?.data) {
    throw new Error('GET /api/health returned unexpected payload');
  }
  console.log('PASS GET /api/health');

  const hello = await getJson('/api/hello', 'GET /api/hello');
  if (typeof hello?.data?.message !== 'string') {
    throw new Error('GET /api/hello returned unexpected payload');
  }
  console.log('PASS GET /api/hello');

  const options = await getJson('/api/auth/options', 'GET /api/auth/options');
  if (typeof options?.data?.oidc !== 'boolean') {
    throw new Error('GET /api/auth/options returned unexpected payload');
  }
  console.log('PASS GET /api/auth/options');

  const meUnauth = await fetch(`${base}/api/me`, {
    headers: { Accept: 'application/json' },
  });
  if (meUnauth.status !== 401) {
    throw new Error(
      `GET /api/me without auth expected 401, got ${meUnauth.status}`,
    );
  }
  console.log('PASS GET /api/me (401 without session)');

  console.log('Smoke test completed successfully.');
}

run().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
