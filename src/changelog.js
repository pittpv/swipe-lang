/**
 * User-facing update history. Newest first.
 * On each release: add an entry here and bump package.json version to match.
 */
export const CHANGELOG = [
  {
    version: '0.5.0',
    date: '2026-09-10',
    items: [
      'Турецкий, английский и испанский — язык выбирается при старте и в настройках',
      'Произношение и формы глагола подстраиваются под выбранный язык',
      'На главной — три словаря, у каждого своё число слов',
      'Страница «Что нового» с историей обновлений',
    ],
  },
  {
    version: '0.4.2',
    date: '2026-09-08',
    items: ['Светлая, тёмная и системная тема'],
  },
  {
    version: '0.4.1',
    date: '2026-09-04',
    items: [
      'Статистика открывается без скачка вёрстки',
      'После копирования пригласительной ссылки — короткое подтверждение',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-09-04',
    items: ['Имя в онбординге: на главной приложение обращается к вам по имени'],
  },
  {
    version: '0.3.0',
    date: '2026-09-03',
    items: ['Заставка при запуске приложения'],
  },
  {
    version: '0.2.2',
    date: '2026-08-26',
    items: ['Примеры и формы глагола в карточке слова'],
  },
];

const SEEN_KEY = 'langapp.changelogVersion';

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export function latestChangelogVersion() {
  return CHANGELOG[0]?.version ?? '';
}

export function hasUnseenChangelog() {
  const latest = latestChangelogVersion();
  if (!latest) return false;
  try {
    return localStorage.getItem(SEEN_KEY) !== latest;
  } catch {
    return false;
  }
}

export function markChangelogSeen() {
  const latest = latestChangelogVersion();
  if (!latest) return;
  try {
    localStorage.setItem(SEEN_KEY, latest);
  } catch {
    /* private mode */
  }
}

export function formatChangelogDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!match) return String(iso || '');
  const day = Number(match[3]);
  const month = Number(match[2]) - 1;
  const year = match[1];
  const monthName = MONTHS_RU[month];
  if (!monthName) return String(iso);
  return `${day} ${monthName} ${year}`;
}
