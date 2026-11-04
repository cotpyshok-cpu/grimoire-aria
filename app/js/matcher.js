// ===== Matcher: Офлайн-проверка ответов с "умным" нечётким сравнением =====
// Понимает опечатки (Левенштейн ~34%), перестановку слов, падежи, стоп-слова и частичные фразы.

const Matcher = (() => {
  // Стоп-слова: предлоги, союзы и мусорные частицы (рус + англ)
  const STOP_WORDS = new Set([
    'и', 'в', 'во', 'на', 'с', 'со', 'у', 'от', 'до', 'к', 'ко',
    'по', 'о', 'об', 'обо', 'про', 'под', 'над', 'за', 'из', 'изо',
    'для', 'при', 'через', 'без', 'а', 'но', 'да', 'же', 'ли',
    'это', 'этот', 'эта', 'эти', 'то', 'мой', 'твой', 'наш',
    'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with'
  ]);

  const NUM_WORDS = {
    'ноль': '0', 'один': '1', 'одна': '1', 'одно': '1',
    'два': '2', 'две': '2', 'три': '3', 'четыре': '4',
    'пять': '5', 'шесть': '6', 'семь': '7', 'восемь': '8',
    'девять': '9', 'десять': '10'
  };

  // Нормализация строки
  function normalize(str) {
    if (!str) return '';
    let s = String(str).toLowerCase().trim();
    // Замена ё -> е
    s = s.replace(/ё/g, 'е');
    // Замена словесных чисел на цифры
    s = s.replace(/\b(ноль|один|одна|одно|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять)\b/g, m => NUM_WORDS[m] || m);
    // Удаляем знаки препинания, оставляем только буквы, цифры и пробелы
    s = s.replace(/[^а-яa-z0-9\s]/gi, ' ');
    // Схлопываем лишние пробелы
    return s.replace(/\s+/g, ' ').trim();
  }

  // Получение массива значимых слов (без стоп-слов)
  function getMeaningfulWords(normalizedStr) {
    return normalizedStr
      .split(' ')
      .map(w => w.trim())
      .filter(w => w.length > 0 && !STOP_WORDS.has(w));
  }

  // Расстояние Левенштейна (динамическое программирование)
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prevDiag = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const temp = row[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        row[j] = Math.min(
          row[j] + 1,       // удаление
          row[j - 1] + 1,   // вставка
          prevDiag + cost   // замена
        );
        prevDiag = temp;
      }
    }
    return row[b.length];
  }

  // Проверка схожести одного слова с другим (с допуском ~34% опечаток)
  function isWordSimilar(inputWord, targetWord) {
    if (inputWord === targetWord) return true;
    
    // Проверка на общее основание / префикс (для падежей: например "мостом" и "мост")
    if (targetWord.length >= 4 && inputWord.startsWith(targetWord.slice(0, -1))) return true;
    if (inputWord.length >= 4 && targetWord.startsWith(inputWord.slice(0, -1))) return true;
    
    // Допуск ошибок: 1 ошибка для слов от 3 букв, 2 для 6+ букв, 3 для 9+ букв
    const minLen = Math.min(inputWord.length, targetWord.length);
    if (minLen < 3) return inputWord === targetWord;

    const allowedEdits = Math.max(1, Math.floor(minLen * 0.35));
    return levenshtein(inputWord, targetWord) <= allowedEdits;
  }

  // Проверка совпадения наборов слов (перестановка, частичное вхождение)
  function arePhrasesMatching(inputStr, targetStr) {
    const inputWords = getMeaningfulWords(inputStr);
    const targetWords = getMeaningfulWords(targetStr);

    if (inputWords.length === 0 || targetWords.length === 0) return false;

    // Прямое вхождение подстроки
    const cleanIn = inputWords.join(' ');
    const cleanTgt = targetWords.join(' ');
    if (cleanIn.includes(cleanTgt) || cleanTgt.includes(cleanIn)) return true;

    // Сколько ключевых слов из эталона нашлось во вводе игрока
    let matchedTargetWords = 0;
    for (const tWord of targetWords) {
      const found = inputWords.some(iWord => isWordSimilar(iWord, tWord));
      if (found) matchedTargetWords++;
    }

    // Если найдено подавляющее большинство слов эталона (>= 60% или все при 1-2 словах)
    const matchRatio = matchedTargetWords / targetWords.length;
    if (targetWords.length === 1 && matchedTargetWords === 1) return true;
    if (targetWords.length === 2 && matchedTargetWords >= 1) {
      // Для 2 слов: если совпало хотя бы 1 длинное слово (>= 4 букв)
      return matchedTargetWords === 2 || targetWords.some(w => w.length >= 5 && inputWords.some(iw => isWordSimilar(iw, w)));
    }
    return matchRatio >= 0.6;
  }

  /**
   * Главный метод проверки ответа
   * @param {string} inputText - текст игрока
   * @param {string[]} acceptedAnswers - эталонные варианты
   * @param {object} options - { freeForm: boolean }
   * @returns {{ correct: boolean, closeness: 'exact'|'close'|'far' }}
   */
  function check(inputText, acceptedAnswers = [], options = {}) {
    // Для испытаний с живыми актёрами — принимается любой ответ
    if (options.freeForm || !acceptedAnswers || acceptedAnswers.length === 0) {
      return { correct: true, closeness: 'exact' };
    }

    if (!inputText || !inputText.trim()) {
      return { correct: false, closeness: 'far' };
    }

    const normInput = normalize(inputText);
    if (!normInput) {
      return { correct: false, closeness: 'far' };
    }

    let bestResult = { correct: false, closeness: 'far' };

    for (const ans of acceptedAnswers) {
      const normAns = normalize(ans);
      if (!normAns) continue;

      // 1. Идеальное точное совпадение
      if (normInput === normAns) {
        return { correct: true, closeness: 'exact' };
      }

      // 2. Нечёткое сравнение по словам и фразам
      if (arePhrasesMatching(normInput, normAns)) {
        const d = levenshtein(normInput, normAns);
        const closeness = d <= 2 ? 'exact' : 'close';
        return { correct: true, closeness };
      }
    }

    return bestResult;
  }

  return { check, normalize, levenshtein };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Matcher;
}
