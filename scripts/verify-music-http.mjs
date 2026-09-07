import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const base = process.env.VERIFY_URL || 'http://127.0.0.1:3001';
const copy = JSON.parse(
  readFileSync('scripts/music-site-copy.json', 'utf8')
).en;
const pages = {
  home: '/',
  bass: '/bass-clef-notes/',
  treble: '/treble-clef-notes/',
  chords: '/piano-chords/',
  guide: '/how-to-read-music/',
  lessons: '/piano-lessons/',
  pricing: '/pricing/',
};
const decode = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"');
for (const [key, path] of Object.entries(pages)) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const descriptionTag = html.match(
    /<meta\b[^>]*name="description"[^>]*>/
  )?.[0];
  assert.equal(
    decode(descriptionTag?.match(/content="([^"]*)"/)?.[1] || ''),
    copy[`sf.${key}.description`],
    `Description ${path}`
  );
  assert.equal(
    (html.match(/name="description"/g) || []).length,
    1,
    `Single description ${path}`
  );
  assert.equal(
    decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || ''),
    copy[`sf.${key}.title`].replace('[Brand]', 'Solfeasy'),
    `Title ${path}`
  );
  assert.equal(
    (html.match(/<h1(?:\s|>)/g) || []).length,
    1,
    `Single H1 ${path}`
  );
  assert.ok(
    html.includes(
      copy[`sf.${key}.h1`].replaceAll('&', '&amp;').replaceAll("'", '&#x27;')
    ) || decode(html).includes(copy[`sf.${key}.h1`]),
    `H1 ${path}`
  );
  assert.equal(
    (html.match(/rel="canonical"/g) || []).length,
    1,
    `Single canonical ${path}`
  );
  assert.ok(
    html.includes(`https://solfeasy.com${path}`),
    `Production canonical ${path}`
  );
  assert.ok(
    !html.includes('Ship your SaaS faster'),
    `No template headline ${path}`
  );
  if (['lessons', 'pricing'].includes(key))
    assert.ok(!html.includes('adsbygoogle.js'), `No ads ${path}`);
  console.log(`PASS page ${path}`);
}
for (const path of [
  '/zh/',
  '/zh/piano-chords/',
  '/zh/how-to-read-music/',
  '/refund-policy',
]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  console.log(`PASS locale/legal ${path}`);
}
const sitemap = await (await fetch(base + '/sitemap.xml')).text();
for (const path of Object.values(pages))
  assert.ok(sitemap.includes(`https://solfeasy.com${path}`));
assert.ok(!sitemap.includes('localhost'));
assert.ok(
  (await (await fetch(base + '/robots.txt')).text()).includes(
    'https://solfeasy.com/sitemap.xml'
  )
);
const jar = new Map();
async function api(path, body, origin = base) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0],
      index = pair.indexOf('=');
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
  return { status: response.status, json: await response.json() };
}
assert.equal(
  (await api('/api/music-learning', { action: 'trial' })).status,
  401
);
assert.equal(
  (await api('/api/music-chords', { root: 0, type: 'major', inversion: 3 }))
    .status,
  400
);
assert.equal(
  (
    await api('/api/music-chords', {
      root: 0,
      type: 'major',
      inversion: 0,
      private: true,
    })
  ).status,
  403
);
assert.equal(
  (
    await api(
      '/api/music-practice',
      { action: 'question', clef: 'treble' },
      'https://unrelated.invalid'
    )
  ).status,
  403
);
for (let i = 0; i < 20; i++) {
  const question = (
    await api('/api/music-practice', {
      action: 'question',
      clef: i % 2 ? 'bass' : 'treble',
    })
  ).json.data;
  const grade = await api('/api/music-practice', {
    action: 'grade',
    questionId: question.id,
    answer: question.midi,
  });
  assert.equal(grade.json.data.state.attempts, i + 1);
}
const question = (
  await api('/api/music-practice', { action: 'question', clef: 'treble' })
).json.data;
assert.equal(
  (
    await api('/api/music-practice', {
      action: 'grade',
      questionId: question.id,
      answer: question.midi,
    })
  ).json.message,
  'DAILY_LIMIT'
);
console.log(
  'PASS anonymous quota, cross-clef allowance, origin protection and invalid inputs'
);
const testId = randomUUID();
const signup = await api('/api/auth/sign-up/email', {
  name: 'Local verification',
  email: `verify-${testId}@example.invalid`,
  password: `Test-${randomUUID()}-9!`,
});
assert.equal(signup.status, 200, 'Test account signup');
const status = (await api('/api/music-learning')).json.data;
assert.equal(status.signedIn, true);
assert.equal(status.pro, false);
const trial = await api('/api/music-learning', { action: 'trial' });
assert.equal(trial.status, 200);
const after = (await api('/api/music-learning')).json.data;
assert.equal(after.pro, true);
assert.equal(after.trialUsed, true);
await api('/api/music-learning', { action: 'trial' });
assert.equal(
  (await api('/api/music-learning')).json.data.trialEndsAt,
  after.trialEndsAt
);
assert.equal(
  (
    await api('/api/music-learning', {
      action: 'complete',
      lessonId: 'middle-c',
      notes: [60, 62, 64, 62, 60],
    })
  ).status,
  200
);
assert.ok(
  (await api('/api/music-learning')).json.data.progress.includes('middle-c')
);
assert.equal(
  (
    await api('/api/music-learning', {
      action: 'complete',
      lessonId: 'first-melody',
      notes: [60],
    })
  ).status,
  400
);
assert.equal(
  (await api('/api/music-practice', { action: 'privacy', private: true }))
    .status,
  200
);
const prior = (await api('/api/music-chords')).json.data;
assert.equal(
  (
    await api('/api/music-chords', {
      root: 8,
      type: 'minor7',
      inversion: 2,
      private: false,
    })
  ).status,
  200
);
assert.deepEqual(
  (await api('/api/music-chords')).json.data,
  prior,
  'Server preserves private preference even when client requests public'
);
console.log(
  'PASS authenticated trial, idempotence, lesson validation/progress and server-enforced private chord results'
);
console.log(
  'All HTTP checks passed. Test account and activity are isolated in the verification database.'
);
