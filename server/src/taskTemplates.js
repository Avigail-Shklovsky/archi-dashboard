// Default to-do lists per project type, project category and level of detailing.
// A project receives level 0 (general) plus its level and every level below it,
// for each category selected. Edit this file to add the remaining lists.

export const PROJECT_TYPES = ['פנים', 'חוץ'];

// Project types that use categories ("שם הפרויקט")
export const TYPES_WITH_CATEGORIES = ['פנים'];

export const PROJECT_CATEGORIES = ['תכנון', 'שטחים', 'בתי חולים'];

// Level 0 is general and always included, so it is not offered as a choice
export const DETAIL_LEVELS = [
  { value: 1, label: 'רמת פירוט 1' },
  { value: 2, label: 'רמת פירוט 2' },
  { value: 3, label: 'רמת פירוט 3' },
];
export const GENERAL_LEVEL = { value: 0, label: 'כללי (רמת פירוט 0)' };

export const SOFTWARE_OPTIONS = [
  'Revit', 'ArchiCAD', 'AutoCAD', 'SketchUp', 'Rhino', 'Vectorworks', '3ds Max', 'Blender',
];

// TEMPLATES[type][category][level] = list of task titles.
// TEMPLATES[type][ALL] holds tasks for every project of that type, whatever categories it has.
const ALL = '*';
const TEMPLATES = {
  'פנים': {
    'תכנון': {
      0: [
        'שימת לב לכיווני פתיחה של דלתות',
        'בחדרי ממ"ד להוסיף אביזרי ממ"ד',
      ],
      1: [
        'מידות',
        'קירות',
        'סניטרים',
        'פתחים',
        'ניקוזים',
        'גבהי חלונות ופתחים',
        'סידור גיליון - חלוקה לקומות, שם הפרויקט, קנ"מ ולוגו (+תרשים)',
      ],
      2: [
        'חזיתות',
        'סימון אבנים',
        'מפלסים',
        'טופוגרפיה צמודה',
        'הנמכות תקרה',
        'גבהים תקרות בטון וגבהים הנמכות',
        'שמות חדרים',
        'נישות - גובה התחלה וסוף',
        'ארונות חשמל ותקשורת וכדו\'',
        'להוסיף גם שטחים',
      ],
      3: [
        'חתכים',
        'פתחים',
        'גבהים פתחים',
        'לתת הרבה מפלסים',
        'ארונות חשמל, תקשורת וכדו\'',
        'חלוקה לבטון / גבס',
        'מידות',
        'ניקוזים',
        'שמות חדרים',
        'סימון תקרות, הנמכות וקורות + גבהים',
        'התאמה בין מפלסי התוכנית למפלסי החתכים',
        'טופוגרפיה צמודה כולל מפלסים',
        'גיליון - שם הפרויקט, קנ"מ, שם התוכניות והלוגו למטה - בלבד!',
      ],
    },
    'שטחים': {
      1: [
        'קונטור מבנה ללא קירות - צבוע בצבע',
        'חלוקה בין מבנה / תוספות בנייה / מרפסות / חצר',
        'מידות ללא קו',
        'טבלה בצד הגיליון של חלוקה לשטחים וסה"כ',
        'גיליון - חלוקה לקומות, שם הפרויקט, קנ"מ + תרשים סביבה + לוגו',
      ],
      2: [
        'התאמה לתשריט',
      ],
    },
    'בתי חולים': {},
  },
  'חוץ': {
    [ALL]: {
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

export function templateTasksFor(type, categories, detailLevel) {
  const tasks = [];
  for (const category of [ALL, ...categories]) {
    const byLevel = TEMPLATES[type]?.[category] || {};
    for (let level = 0; level <= detailLevel; level++) {
      (byLevel[level] || []).forEach((title, i) => {
        tasks.push({
          title,
          level,
          category: category === ALL ? null : category,
          templateKey: `${type}:${category}:${level}:${i}`,
          done: false,
        });
      });
    }
  }
  return tasks;
}

// After a type/category/level change: add newly relevant template tasks and drop
// template tasks that no longer apply - unless they were already completed.
// Tasks the user added manually are never touched.
export function syncTasks(currentTasks, type, categories, detailLevel) {
  const desired = templateTasksFor(type, categories, detailLevel);
  const desiredKeys = new Set(desired.map((t) => t.templateKey));
  const kept = currentTasks.filter((t) => !t.templateKey || t.done || desiredKeys.has(t.templateKey));
  const keptKeys = new Set(kept.map((t) => t.templateKey).filter(Boolean));
  const added = desired.filter((t) => !keptKeys.has(t.templateKey));
  const order = (t) => t.level ?? Infinity;
  return [...kept, ...added].sort((a, b) => order(a) - order(b));
}
