import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

for (const locale of ['en', 'zh']) {
  const path = `messages/${locale}.json`;
  const messages = JSON.parse(readFileSync(path, 'utf8'));
  for (const file of readdirSync('scripts')
    .filter((file) => /^music-.*-copy\.json$/.test(file))
    .sort()) {
    Object.assign(
      messages,
      JSON.parse(readFileSync(`scripts/${file}`, 'utf8'))[locale]
    );
  }
  messages['common.metadata.title'] = 'Solfeasy';
  messages['common.metadata.description'] =
    locale === 'en'
      ? 'Learn to read music, one note at a time.'
      : '从一个音符开始，轻松学会识谱。';
  writeFileSync(path, JSON.stringify(messages, null, 2) + '\n');
}
