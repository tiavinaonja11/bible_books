export type Testament = 'OT' | 'NT';

export interface BookInfo {
  book: number;
  en: string;
  fr: string;
  testament: Testament;
}

export const BOOKS: BookInfo[] = [
  { book: 1,  en: 'Genesis',          fr: 'Genèse',                testament: 'OT' },
  { book: 2,  en: 'Exodus',           fr: 'Exode',                 testament: 'OT' },
  { book: 3,  en: 'Leviticus',        fr: 'Lévitique',             testament: 'OT' },
  { book: 4,  en: 'Numbers',          fr: 'Nombres',               testament: 'OT' },
  { book: 5,  en: 'Deuteronomy',      fr: 'Deutéronome',           testament: 'OT' },
  { book: 6,  en: 'Joshua',           fr: 'Josué',                 testament: 'OT' },
  { book: 7,  en: 'Judges',           fr: 'Juges',                 testament: 'OT' },
  { book: 8,  en: 'Ruth',             fr: 'Ruth',                  testament: 'OT' },
  { book: 9,  en: '1 Samuel',         fr: '1 Samuel',              testament: 'OT' },
  { book: 10, en: '2 Samuel',         fr: '2 Samuel',              testament: 'OT' },
  { book: 11, en: '1 Kings',          fr: '1 Rois',                testament: 'OT' },
  { book: 12, en: '2 Kings',          fr: '2 Rois',                testament: 'OT' },
  { book: 13, en: '1 Chronicles',     fr: '1 Chroniques',          testament: 'OT' },
  { book: 14, en: '2 Chronicles',     fr: '2 Chroniques',          testament: 'OT' },
  { book: 15, en: 'Ezra',             fr: 'Esdras',                testament: 'OT' },
  { book: 16, en: 'Nehemiah',         fr: 'Néhémie',               testament: 'OT' },
  { book: 17, en: 'Esther',           fr: 'Esther',                testament: 'OT' },
  { book: 18, en: 'Job',              fr: 'Job',                   testament: 'OT' },
  { book: 19, en: 'Psalms',           fr: 'Psaumes',               testament: 'OT' },
  { book: 20, en: 'Proverbs',         fr: 'Proverbes',             testament: 'OT' },
  { book: 21, en: 'Ecclesiastes',     fr: 'Ecclésiaste',           testament: 'OT' },
  { book: 22, en: 'Song of Solomon',  fr: 'Cantique des Cantiques', testament: 'OT' },
  { book: 23, en: 'Isaiah',           fr: 'Ésaïe',                 testament: 'OT' },
  { book: 24, en: 'Jeremiah',         fr: 'Jérémie',               testament: 'OT' },
  { book: 25, en: 'Lamentations',     fr: 'Lamentations',          testament: 'OT' },
  { book: 26, en: 'Ezekiel',          fr: 'Ézéchiel',              testament: 'OT' },
  { book: 27, en: 'Daniel',           fr: 'Daniel',                testament: 'OT' },
  { book: 28, en: 'Hosea',            fr: 'Osée',                  testament: 'OT' },
  { book: 29, en: 'Joel',             fr: 'Joël',                  testament: 'OT' },
  { book: 30, en: 'Amos',             fr: 'Amos',                  testament: 'OT' },
  { book: 31, en: 'Obadiah',          fr: 'Abdias',                testament: 'OT' },
  { book: 32, en: 'Jonah',            fr: 'Jonas',                 testament: 'OT' },
  { book: 33, en: 'Micah',            fr: 'Michée',                testament: 'OT' },
  { book: 34, en: 'Nahum',            fr: 'Nahoum',                testament: 'OT' },
  { book: 35, en: 'Habakkuk',         fr: 'Habacuc',               testament: 'OT' },
  { book: 36, en: 'Zephaniah',        fr: 'Sophonie',              testament: 'OT' },
  { book: 37, en: 'Haggai',           fr: 'Aggée',                 testament: 'OT' },
  { book: 38, en: 'Zechariah',        fr: 'Zacharie',              testament: 'OT' },
  { book: 39, en: 'Malachi',          fr: 'Malachie',              testament: 'OT' },
  { book: 40, en: 'Matthew',          fr: 'Matthieu',              testament: 'NT' },
  { book: 41, en: 'Mark',             fr: 'Marc',                  testament: 'NT' },
  { book: 42, en: 'Luke',             fr: 'Luc',                   testament: 'NT' },
  { book: 43, en: 'John',             fr: 'Jean',                  testament: 'NT' },
  { book: 44, en: 'Acts',             fr: 'Actes',                 testament: 'NT' },
  { book: 45, en: 'Romans',           fr: 'Romains',               testament: 'NT' },
  { book: 46, en: '1 Corinthians',    fr: '1 Corinthiens',         testament: 'NT' },
  { book: 47, en: '2 Corinthians',    fr: '2 Corinthiens',         testament: 'NT' },
  { book: 48, en: 'Galatians',        fr: 'Galates',               testament: 'NT' },
  { book: 49, en: 'Ephesians',        fr: 'Éphésiens',             testament: 'NT' },
  { book: 50, en: 'Philippians',      fr: 'Philippiens',           testament: 'NT' },
  { book: 51, en: 'Colossians',       fr: 'Colossiens',            testament: 'NT' },
  { book: 52, en: '1 Thessalonians',  fr: '1 Thessaloniciens',     testament: 'NT' },
  { book: 53, en: '2 Thessalonians',  fr: '2 Thessaloniciens',     testament: 'NT' },
  { book: 54, en: '1 Timothy',        fr: '1 Timothée',            testament: 'NT' },
  { book: 55, en: '2 Timothy',        fr: '2 Timothée',            testament: 'NT' },
  { book: 56, en: 'Titus',            fr: 'Tite',                  testament: 'NT' },
  { book: 57, en: 'Philemon',         fr: 'Philémon',              testament: 'NT' },
  { book: 58, en: 'Hebrews',          fr: 'Hébreux',               testament: 'NT' },
  { book: 59, en: 'James',            fr: 'Jacques',               testament: 'NT' },
  { book: 60, en: '1 Peter',          fr: '1 Pierre',              testament: 'NT' },
  { book: 61, en: '2 Peter',          fr: '2 Pierre',              testament: 'NT' },
  { book: 62, en: '1 John',           fr: '1 Jean',                testament: 'NT' },
  { book: 63, en: '2 John',           fr: '2 Jean',                testament: 'NT' },
  { book: 64, en: '3 John',           fr: '3 Jean',                testament: 'NT' },
  { book: 65, en: 'Jude',             fr: 'Jude',                  testament: 'NT' },
  { book: 66, en: 'Revelation',       fr: 'Apocalypse',            testament: 'NT' },
];

export const getBookName = (bookNum: number, lang: 'en' | 'fr'): string => {
  const book = BOOKS.find(b => b.book === bookNum);
  return book ? book[lang] : '';
};