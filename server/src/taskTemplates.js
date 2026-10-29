// Default to-do lists per project type, project category and level of detailing.
// Every project gets the general tasks (level 0) and, by its software, the submission tasks.
// On top of that, per project name:
// - תכנון אדריכלי: the drawings picked (any of levels 1-7, not cumulative)
// - שטחים: the level chosen and every level below it (cumulative)
// - חוץ (no project names): the level chosen and every level below it

export const PROJECT_TYPES = ['פנים', 'חוץ'];

// Project types that use categories ("שם הפרויקט")
export const TYPES_WITH_CATEGORIES = ['פנים'];

export const PROJECT_CATEGORIES = ['תכנון אדריכלי', 'שטחים'];

const named = (names) => names.map((name, i) => ({ value: i + 1, name, label: `רמת פירוט ${i + 1} - ${name}` }));

// The levels of each project name. `pick`: any combination is chosen; otherwise one level, cumulative.
export const CATEGORY_LEVELS = {
  'תכנון אדריכלי': {
    pick: true,
    levels: named(['תוכנית תנוחה', 'חתכים', 'חזיתות', 'חזיתות לשימור', 'צנרת', 'חשמל', 'תאורה']),
  },
  'שטחים': {
    pick: false,
    levels: named(['תוכנית פרטנית', 'תוכנית כוללנית', 'תוכנית רגילה', 'שטחים + היתרים']),
  },
};

// חוץ projects have no project names: a single cumulative level
export const DETAIL_LEVELS = [
  { value: 1, label: 'רמת פירוט 1' },
  { value: 2, label: 'רמת פירוט 2' },
  { value: 3, label: 'רמת פירוט 3' },
];
export const GENERAL_LEVEL = { value: 0, label: 'כללי (בכל רמת פירוט)' };
export const SUBMIT_LEVEL = { value: 99, label: 'הגשת הפרויקט' };

export const PRIORITIES = [
  { value: 'low', label: 'נמוכה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'high', label: 'גבוהה' },
];

export const STATUSES = [
  { value: 'open', label: 'בעבודה' },
  { value: 'submitted', label: 'הוגש' },
];

export const SOFTWARE_OPTIONS = [
  'Revit', 'ArchiCAD', 'AutoCAD', 'SketchUp', 'Rhino', 'Vectorworks', '3ds Max', 'Blender',
];

// TEMPLATES[type][category][level] = list of task titles.
// TEMPLATES[type][ALL] holds tasks for every project of that type, whatever categories it has.
const ALL = '*';

const GENERAL = [
  'גיליון',
  'גוש + חלקה',
  'כתובת',
  '(תת חלקה)',
  'תאריך מדידה',
  'שם מזמין',
  'תרשים סביבה',
];

// Shared by every level of שטחים, followed by what each level adds
const AREAS_BASE = [
  'שרטוט קירות + דיוק',
  'קירות חיצוניים יושבים אותו דבר',
  'חישוב מרפסות בנפרד',
  'התאמה לתשריט',
  'קירות משותפים - חצי',
  'טבלת שטחים בגיליון: שטח דירה, שטח מרפסת A, שטח מרפסת B',
  'חישוב סה"כ',
];

const TEMPLATES = {
  'פנים': {
    [ALL]: { 0: GENERAL },
    'תכנון אדריכלי': {
      1: [
        'שרטוט קירות + דיוק קירות',
        'שיוך הקיר לפי סוג נמוך / חומר',
        'דלתות - הזזה / כיס / ציר',
        'חלונות - קיפ / ציר / הזזה',
        'גבהים לפתחים',
        'קורות',
        'תקרות / הנמכות',
        'גבהי תקרות + קורות',
        'מפלסים + גובה תקרה בכל חלל',
        'שמות חללים',
        'ניקוזים',
        'הטצ\'ים (hatch)',
        'סניטרים',
        'ריהוט קבוע (א. חשמל / שיש)',
      ],
      2: [
        'מפלסים',
        'סימון שם החתך ע"ג התוכנית',
        'התאמת המפלסים עם התוכנית',
        'במרוסק כיוון פתיחת דלתות',
      ],
      3: [
        'מפלסים',
        'כיתוב חומרים',
        'סימון חזק / חלש, קרוב / רחוק',
        'התאמת המפלסים עם התוכנית',
        'במרוסק כיוון פתיחת דלתות',
      ],
      4: [
        'חלוקות גודל אמיתי אבן',
        'מסגרת חלונות',
        'במרוסק סימון תקרות / רצפות / קירות צדדיים',
        'מפלסים',
        'כיתוב חומרים',
        'סימון רצפת חוץ צמודה למבנה + מפלסים',
        'במרוסק כיוון פתיחת דלתות',
        'סימון חזק / חלש, קרוב / רחוק',
        'סימון צנרת',
        'סימון מזגנים',
        'התאמת המפלסים עם התוכנית',
      ],
      5: [
        'חלוקה לצבעים לפי סוג צנרת',
        'גובה התחלה וסוף צינור',
        'סימון חיבור צינור לתקרה / לקיר',
        'מקרא בגיליון',
      ],
      6: [
        'סימון שקעים + מפסקים',
        'גבהים',
        'מקרא בגיליון',
      ],
      7: [
        'תקרות + הנמכות',
        'גבהים',
        'סוגי תאורה',
        'ספרינקלרים',
        'גלאי עשן',
        'רמקולים',
        'מיזוג',
      ],
    },
    'שטחים': {
      1: [...AREAS_BASE, 'דירה בכל גיליון + הנתונים של אותה דירה בלבד', 'כלול בתשריט / אינו'],
      2: [...AREAS_BASE, 'כל הדירות בטבלה כוללת', 'כלול בתשריט / אינו'],
      3: [...AREAS_BASE, 'סימון קירות פנים בבהיר'],
      4: [...AREAS_BASE, 'השוואה מול היתרים', 'סימון כלול בהיתר / אינו'],
    },
  },
  'חוץ': {
    [ALL]: {
      0: GENERAL.filter((t) => t !== 'תרשים סביבה'), // already in the level 1 list
      1: [
        'תוכנית מדידה',
        'קווי גובה',
        'בלוקים קבועים',
        'גובה מבנה',
        'גובה מתאר כללי גגות',
        'התאמה לשכבות',
        'תרשים סביבה',
        'יצירת גיליון - כמבוקש',
      ],
    },
  },
};

// What to send when submitting, by the project's software (the same for every project type)
const PDF_FIRST = 'לצרף במייל את ה-PDF ראשון, כדי שלא יישלח כקישור';
const SUBMIT_FILES = {
  revit: ['צפיין + קובץ רוויט + PDF', PDF_FIRST],
  autocad: ['קובץ ZIP + PDF', PDF_FIRST],
};

function softwareKey(software) {
  const s = (software || '').toLowerCase();
  if (s.includes('revit') || s.includes('רוויט')) return 'revit';
  if (s.includes('autocad') || s.includes('אוטוקאד')) return 'autocad';
  return null;
}

const range = (n) => Array.from({ length: Math.max(0, n || 0) }, (_, i) => i + 1);

// The levels of a project name (null for חוץ) that are part of the project
export function levelsFor(project, category) {
  if (category === 'תכנון אדריכלי') return [...(project.drawings || [])].sort((a, b) => a - b);
  if (category === 'שטחים') return range(project.areaLevel);
  return range(project.detailLevel);
}

// Short text for lists and emails, e.g. "תכנון אדריכלי: תוכנית תנוחה, חתכים · שטחים: רמת פירוט 2 - תוכנית כוללנית"
export function levelSummary(project) {
  if (!TYPES_WITH_CATEGORIES.includes(project.type)) {
    return DETAIL_LEVELS.find((l) => l.value === project.detailLevel)?.label || '';
  }
  return project.categories
    .map((category) => {
      const { pick, levels } = CATEGORY_LEVELS[category] || {};
      if (!levels) return null;
      const chosen = pick ? levelsFor(project, category) : [project.areaLevel];
      const names = chosen.map((v) => levels.find((l) => l.value === v)).filter(Boolean).map((l) => (pick ? l.name : l.label));
      return names.length ? `${category}: ${names.join(', ')}` : null;
    })
    .filter(Boolean)
    .join(' · ');
}

// project: { type, categories, drawings, areaLevel, detailLevel, software }
export function templateTasksFor(project) {
  const tasks = [];
  const add = (title, level, category, templateKey) => tasks.push({ title, level, category, templateKey, done: false });
  const categories = TYPES_WITH_CATEGORIES.includes(project.type) ? project.categories : [];
  const byType = TEMPLATES[project.type] || {};

  (byType[ALL]?.[GENERAL_LEVEL.value] || []).forEach((title, i) => add(title, 0, null, `${project.type}:${ALL}:0:${i}`));
  const groups = categories.length ? categories : [ALL];
  for (const category of groups) {
    const byLevel = byType[category] || {};
    for (const level of levelsFor(project, category === ALL ? null : category)) {
      (byLevel[level] || []).forEach((title, i) => {
        add(title, level, category === ALL ? null : category, `${project.type}:${category}:${level}:${i}`);
      });
    }
  }
  const key = softwareKey(project.software);
  (SUBMIT_FILES[key] || []).forEach((title, i) => add(title, SUBMIT_LEVEL.value, null, `submit:${key}:${i}`));
  return tasks;
}

// Where a task added by hand may be placed in this project
export function isValidPlace(project, level, category) {
  if (level === GENERAL_LEVEL.value || level === SUBMIT_LEVEL.value) return category === null;
  if (TYPES_WITH_CATEGORIES.includes(project.type)) {
    return project.categories.includes(category) && levelsFor(project, category).includes(level);
  }
  return category === null && levelsFor(project, null).includes(level);
}

// After a type/category/level/software change: add newly relevant template tasks and drop
// template tasks that no longer apply - unless they were already completed.
// Tasks the user added manually are never removed.
export function syncTasks(currentTasks, project) {
  const desired = templateTasksFor(project);
  const desiredKeys = new Set(desired.map((t) => t.templateKey));
  const kept = currentTasks
    .filter((t) => !t.templateKey || t.done || desiredKeys.has(t.templateKey))
    // A manual task whose place no longer exists (its project name or level was removed, or the type
    // changed) goes back to "משימות נוספות"
    .map((t) => (t.templateKey || t.level === null || isValidPlace(project, t.level, t.category) ? t : { ...t, level: null, category: null }));
  const keptKeys = new Set(kept.map((t) => t.templateKey).filter(Boolean));
  const added = desired.filter((t) => !keptKeys.has(t.templateKey));
  return [...kept, ...added];
}
