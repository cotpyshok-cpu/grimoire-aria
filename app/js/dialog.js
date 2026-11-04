// ===== Многоголосый диалоговый движок с разделением «📱 ЭФИР ГРИМУАРА (Тоник/Духи)» и «🎭 ЖИВАЯ СЦЕНА (Реальные люди)» =====
// Публичный API:
//   Dialog.show(lines, { name, portrait, phaseLabel, forceMode, onDone })
//   Dialog.showBranching(branchConfig, onAllDone)
//   Dialog.showTransitionGate(gateConfig, onContinue)

const Dialog = (() => {
  const box = document.getElementById('dialogBox');
  const modeBannerEl = document.getElementById('dialogModeBanner');
  const nameEl = document.getElementById('dialogName');
  const textEl = document.getElementById('dialogText');
  const nextEl = document.getElementById('dialogNext');
  const portEl = document.getElementById('portrait');

  const transModal = document.getElementById('sceneTransitionModal');
  const transBadge = document.getElementById('transitionBadge');
  const transTitle = document.getElementById('transitionTitle');
  const transText = document.getElementById('transitionText');
  const transBtn = document.getElementById('transitionContinueBtn');

  let queue = [];
  let isTyping = false;
  let fullCurrentText = '';
  let charIndex = 0;
  let typeTimer = null;
  let onDoneCallback = null;
  let defaultName = '🐀 Тоник';
  let defaultPortrait = 'img/portraits/tonik.svg';
  let currentPhaseLabel = null;
  let currentForceMode = null; // 'digital' | 'live' | null
  let choicesContainer = null;
  let inChoiceMode = false;
  let transCallback = null;
  const CHAR_SPEED_MS = 20;

  // Словарь говорящих с явной привязкой к каналу:
  // channel: 'digital' — 📱 Эфир Гримуара (Тоник и цифровые духи смартфона)
  // channel: 'live'    — 🎭 Живая сцена в реальности (реальные друзья и родные)
  const SPEAKER_MAP = [
    // Цифровой эфир Гримуара
    { prefixes: ['Тоник:', 'Тоник ['], name: '🐀 Тоник (Воскресший Фамильяр)', portrait: 'img/portraits/tonik.svg', charId: 'tonik', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • СВЯЗЬ С ТОНИКОМ' },
    { prefixes: ['Клок:', 'Архивариус Клок:'], name: '⚙️ Архивариус Клок (Дух Гримуара)', portrait: 'img/portraits/clock.svg', charId: 'clock', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №1' },
    { prefixes: ['Валтасар:', 'Крупье Валтасар:'], name: '🃏 Крупье Валтасар (Дух Гримуара)', portrait: 'img/portraits/valtasar.svg', charId: 'valtasar', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №2' },
    { prefixes: ['Элодея:', 'Дух Лозы Элодея:'], name: '🌱 Дух Лозы Элодея (Дух Гримуара)', portrait: 'img/portraits/elodea.svg', charId: 'elodea', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №3' },
    { prefixes: ['Касым:', 'Касымиус:', 'Касымиус Меднозвон:', 'Касым Меднозвон:'], name: '⚒️ Касымиус Меднозвон (Дух Гримуара)', portrait: 'img/portraits/kasym.svg', charId: 'kasym', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №4' },
    { prefixes: ['Байтерек-Дух:'], name: '🌳 Байтерек-Дух (Дух Гримуара)', portrait: 'img/portraits/baiterek.svg', charId: 'baiterek', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №5' },
    { prefixes: ['Ворон:', 'Теневой Ворон:'], name: '🐦‍⬛ Теневой Ворон (Фантом в Гримуаре)', portrait: 'img/portraits/raven.svg', charId: 'raven', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ БОЙ №6' },
    { prefixes: ['Мастер Эспрессо:'], name: '☕ Мастер Эспрессо (Связной Гримуара)', portrait: 'img/portraits/barista.svg', charId: 'barista', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №7' },
    { prefixes: ['Куаныш:', 'Смотритель Куанышор:', 'Кондуктор Куаныш:'], name: '🚂 Смотритель Куанышор (Дух Путей)', portrait: 'img/portraits/kuanysh.svg', charId: 'kuanysh', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №8' },
    { prefixes: ['Кузя:', 'Хранитель Кузьмиус:', 'Домовой Кузя:'], name: '🏠 Хранитель Кузьмиус (Дух Очага)', portrait: 'img/portraits/kuzya.svg', charId: 'kuzya', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №9' },
    { prefixes: ['Ртутник:', 'Гомункул Ртутник:'], name: '🧪 Гомункул Ртутник (Дух Колбы)', portrait: 'img/portraits/mercury.svg', charId: 'mercury', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №10' },
    { prefixes: ['Горгулья:', 'Горгулья Свода:'], name: '🗿 Горгулья Каменного Свода', portrait: 'img/portraits/gargoyle.svg', charId: 'gargoyle', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №11' },
    { prefixes: ['Аукционист:', 'Теневой Аукционист:'], name: '🎩 Теневой Аукционист (Эфир)', portrait: 'img/portraits/auctioneer.svg', charId: 'auctioneer', channel: 'digital', badge: '📱 ЭФИР ГРИМУАРА • ЦИФРОВОЙ НПС №12' },

    // Живые персонажи в реальности
    { prefixes: ['Ария:', 'Ария ['], name: '🧚‍♀️ Ария (Героиня Леса)', portrait: 'img/portraits/aria.svg', charId: 'aria', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ТВОЯ РЕПЛИКА' },
    { prefixes: ['Мелари:', 'Мелари ['], name: '🎭 Мелари (Бард Лазурных Огней)', portrait: 'img/portraits/melari.svg', charId: 'melari', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА В САЛОНЕ МЕЛАРИ' },
    { prefixes: ['Линар:', 'Линар ['], name: '🌿 Линар (Друидка Круга Луны)', portrait: 'img/portraits/linar.svg', charId: 'linar', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА В ОРАНЖЕРЕЕ ЛИНАР' },
    { prefixes: ['Оривия:', 'Оривия ['], name: '⚔️ Оривия (Теневой Барон)', portrait: 'img/portraits/orivia.svg', charId: 'orivia', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • АВАНГАРД ОТРЯДА' },
    { prefixes: ['Илья:', 'Ильярион:', 'Великий Архивариус Ильярион:', 'Илья ['], name: '🔮 Великий Архивариус Ильярион (Вживую)', portrait: 'img/portraits/ilya.svg', charId: 'ilya', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • АРХФЕЙ ЗВЁЗДНОГО СВЕТА' },
    { prefixes: ['Папа:', 'Лорд-Отец Древнего Корня:', 'Папа-Дворф:'], name: '🛡️ Лорд-Отец Древнего Корня (Вживую)', portrait: 'img/portraits/papa.svg', charId: 'papa', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ФЕЙСКОЕ ПОМЕСТЬЕ РОДИТЕЛЕЙ' },
    { prefixes: ['Мама:', 'Леди-Матушка Серебряных Рос:', 'Мама-Эльф:'], name: '✨ Леди-Матушка Серебряных Рос (Вживую)', portrait: 'img/portraits/mama.svg', charId: 'mama', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ФЕЙСКОЕ ПОМЕСТЬЕ РОДИТЕЛЕЙ' },
    { prefixes: ['Тётя Альфия:', 'Тетя Альфия:', 'Магистр Альфиэль:'], name: '⚗️ Магистр Альфиэль (Вживую)', portrait: 'img/portraits/alfiya.svg', charId: 'alfiya', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ЛАБОРАТОРИЯ АЛХИМИКОВ' },
    { prefixes: ['Дядя Сергей:', 'Мастер Сергиус:'], name: '🔧 Мастер Сергиус (Вживую)', portrait: 'img/portraits/sergey.svg', charId: 'sergey', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ЛАБОРАТОРИЯ АЛХИМИКОВ' },
    { prefixes: ['Даня:', 'Чародей Даня:', 'Чародей Даниэль:'], name: '🌟 Чародей Даниэль (Вживую)', portrait: 'img/portraits/danya.svg', charId: 'danya', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ЛАБОРАТОРИЯ АЛХИМИКОВ' },
    { prefixes: ['Дядя Виталик:', 'Страж Виталиус:'], name: '🐉 Страж Виталиус (Вживую)', portrait: 'img/portraits/vitalik.svg', charId: 'vitalik', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ОПЛОТ ГРАНИТА' },
    { prefixes: ['Тётя Оксана:', 'Тетя Оксана:', 'Жрица Оксаниэль:'], name: '📜 Жрица Оксаниэль (Вживую)', portrait: 'img/portraits/oksana.svg', charId: 'oksana', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ОПЛОТ ГРАНИТА' },
    { prefixes: ['Софа:', 'Маленькая Софа:', 'Провидица Софиэль:'], name: '👑 Провидица Софиэль (Вживую)', portrait: 'img/portraits/sofa.svg', charId: 'sofa', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ОПЛОТ ГРАНИТА' },
    { prefixes: ['Яна:', 'Сестра Яна:', 'Охотница Яниэль:'], name: '🗡️ Охотница Яниэль (Вживую)', portrait: 'img/portraits/yana.svg', charId: 'yana', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ШЕПЧУЩАЯ АЛЛЕЯ' },
    { prefixes: ['Парень Яны:', 'Наемник:', 'Сэр Волкозар:'], name: '🪓 Сэр Волкозар (Спутник Яниэль — Вживую)', portrait: 'img/portraits/yana_bf.svg', charId: 'yana_bf', channel: 'live', badge: '🎭 ЖИВАЯ СЦЕНА • ШЕПЧУЩАЯ АЛЛЕЯ' },
    { prefixes: ['Безликий:', 'Дух Безликого:', 'Два Духа Безликих (Человек и Эльф):', 'Два Духа Безликих:'], name: '🎭 Два Духа Безликих (Человек и Эльф)', portrait: 'img/portraits/faceless.svg', charId: 'faceless', channel: 'digital', badge: '⚡ АЛТАРЬ ВЕЧНОСТИ • ФИНАЛ ХОНДОРА' }
  ];

  function applyBoxMode(channel, badgeText) {
    const effectiveChannel = currentForceMode || channel || 'digital';
    box.classList.toggle('mode-digital', effectiveChannel === 'digital');
    box.classList.toggle('mode-live', effectiveChannel === 'live');

    if (modeBannerEl) {
      modeBannerEl.textContent = currentPhaseLabel || badgeText || (
        effectiveChannel === 'digital'
          ? '📱 ЭФИР ГРИМУАРА • СВЯЗЬ С ТОНИКОМ'
          : '🎭 ЖИВАЯ СЦЕНА В РЕАЛЬНОСТИ • ДЕЙСТВИЕ НА МЕСТЕ'
      );
    }
  }

  function parseSpeakerFromLine(rawLine) {
    if (!rawLine || typeof rawLine !== 'string') {
      return { name: defaultName, portrait: defaultPortrait, text: String(rawLine || ''), channel: 'digital', badge: null };
    }
    const trimmed = rawLine.trim();
    for (const entry of SPEAKER_MAP) {
      for (const prefix of entry.prefixes) {
        if (trimmed.startsWith(prefix)) {
          let cleanText = trimmed.slice(prefix.length).trim();
          if (prefix.endsWith('[')) {
            const colonIdx = trimmed.indexOf(':');
            if (colonIdx !== -1) {
              cleanText = trimmed.slice(colonIdx + 1).trim();
            }
          }
          if (entry.charId && window.App && typeof window.App.unlockCharacter === 'function') {
            window.App.unlockCharacter(entry.charId, true);
          }
          return {
            name: entry.name,
            portrait: entry.portrait || defaultPortrait,
            text: cleanText,
            channel: entry.channel,
            badge: entry.badge
          };
        }
      }
    }
    if (trimmed.startsWith('📜 ')) {
      return {
        name: '📜 Хроника Сцены',
        portrait: defaultPortrait,
        text: trimmed.slice(2).trim(),
        channel: currentForceMode || 'live',
        badge: currentPhaseLabel || '📜 ОПИСАНИЕ СЦЕНЫ'
      };
    }
    return {
      name: defaultName,
      portrait: defaultPortrait,
      text: trimmed,
      channel: currentForceMode || 'digital',
      badge: currentPhaseLabel
    };
  }

  function setPortrait(portraitPath) {
    const src = portraitPath || 'img/portraits/tonik.svg';
    portEl.style.backgroundImage = `url('${src}')`;
  }

  function clearChoicesUI() {
    inChoiceMode = false;
    if (choicesContainer && choicesContainer.parentNode) {
      choicesContainer.parentNode.removeChild(choicesContainer);
    }
    choicesContainer = null;
    nextEl.style.display = '';
  }

  function show(lines, opts = {}) {
    clearChoicesUI();
    if (!lines || (Array.isArray(lines) && lines.length === 0)) {
      if (opts.onDone) opts.onDone();
      return;
    }

    queue = Array.isArray(lines) ? [...lines] : [lines];
    defaultName = opts.name || '🐀 Тоник';
    defaultPortrait = opts.portrait || 'img/portraits/tonik.svg';
    currentPhaseLabel = opts.phaseLabel || null;
    currentForceMode = opts.forceMode || null;

    onDoneCallback = opts.onDone || null;
    box.classList.remove('hidden');
    box.classList.add('active');

    displayNextLine();
  }

  function displayNextLine() {
    if (inChoiceMode) return;

    if (isTyping) {
      finishLineInstant();
      return;
    }

    if (queue.length === 0) {
      closeDialog();
      return;
    }

    const rawLine = queue.shift();
    const parsed = parseSpeakerFromLine(rawLine);

    // Записываем реплику в историю диалогов Летописи
    if (window.App && typeof window.App.logDialogLine === 'function') {
      window.App.logDialogLine({
        speaker: parsed.name,
        portrait: parsed.portrait,
        text: parsed.text,
        channel: currentForceMode || parsed.channel || 'digital'
      });
    }

    // Пасхалка: если в реплике поминают Мышиную Мафию и музыку из Крестного Отца — играем мелодию!
    if (
      window.AudioEngine &&
      typeof window.AudioEngine.playGodfatherTheme === 'function' &&
      (parsed.text.includes('Крестного Отца') || parsed.text.includes('мышиная мафия') || parsed.text.includes('Мышиная Мафия'))
    ) {
      window.AudioEngine.playGodfatherTheme();
    }

    applyBoxMode(parsed.channel, parsed.badge);
    nameEl.textContent = parsed.name;
    setPortrait(parsed.portrait);
    fullCurrentText = parsed.text;
    charIndex = 0;
    textEl.textContent = '';
    isTyping = true;
    nextEl.style.visibility = 'hidden';
    nextEl.textContent = queue.length === 0 ? '▼ завершить блок' : '▼ далее';

    clearInterval(typeTimer);

    typeTimer = setInterval(() => {
      if (fullCurrentText.startsWith('...') && charIndex < 3) {
        charIndex = 3;
      }
      charIndex++;
      textEl.textContent = fullCurrentText.slice(0, charIndex);

      if (window.AudioEngine && typeof window.AudioEngine.playTextBlip === 'function' && charIndex % 2 === 0) {
        window.AudioEngine.playTextBlip();
      }

      if (charIndex >= fullCurrentText.length) {
        finishLineInstant();
      }
    }, CHAR_SPEED_MS);
  }

  function finishLineInstant() {
    clearInterval(typeTimer);
    textEl.textContent = fullCurrentText;
    isTyping = false;
    nextEl.style.visibility = 'visible';
    nextEl.textContent = queue.length === 0 ? '▼ завершить блок' : '▼ далее';
  }

  // Экран-разделитель между диалогом с Тоником в пути и живой сценой в квартире/на локации
  function showTransitionGate(gateConfig, onContinue) {
    if (!gateConfig || !transModal) {
      if (onContinue) onContinue();
      return;
    }

    closeDialog();
    transBadge.textContent = gateConfig.badge || '🚪 ПЕРЕХОД ОТ ЭФИРА ТОНИКА К ЖИВОЙ СЦЕНЕ';
    transTitle.textContent = gateConfig.title || 'Живая встреча с героями';
    transText.innerHTML = gateConfig.text || 'Брифинг Тоника завершён. Когда войдёшь внутрь и встретишься с героями вживую — нажми кнопку ниже!';
    transBtn.textContent = gateConfig.buttonText || '🚪 Я внутри! Начать живую сцену ▶';

    transCallback = onContinue || null;
    transModal.classList.remove('hidden');
  }

  if (transBtn) {
    transBtn.addEventListener('click', () => {
      if (window.AudioEngine) window.AudioEngine.playClick();
      transModal.classList.add('hidden');
      if (transCallback) {
        const cb = transCallback;
        transCallback = null;
        cb();
      }
    });
  }

  // Ветвящаяся интерактивная новелла (без пометок «Ветка 1/2»)
  function showBranching(branchConfig, onAllDone) {
    if (!branchConfig || !Array.isArray(branchConfig.options)) {
      if (onAllDone) onAllDone();
      return;
    }

    const visited = new Set();

    function renderMenu() {
      clearInterval(typeTimer);
      isTyping = false;
      inChoiceMode = true;
      box.classList.remove('hidden');
      box.classList.add('active');

      const isDigital = branchConfig.mode !== 'live';
      currentForceMode = isDigital ? 'digital' : 'live';
      currentPhaseLabel = branchConfig.phaseLabel || (isDigital
        ? '📱 ЭФИР ГРИМУАРА • ИНТЕРАКТИВНЫЙ ДИАЛОГ С ТОНИКОМ'
        : '🎭 ЖИВАЯ СЦЕНА • ВЫБОР РЕПЛИКИ АРИИ');

      applyBoxMode(currentForceMode, currentPhaseLabel);
      nameEl.textContent = branchConfig.speakerName || '🐀 Тоник';
      setPortrait(branchConfig.portrait || 'img/portraits/tonik.svg');
      textEl.textContent = branchConfig.prompt || 'О чем поговорим?';
      nextEl.style.display = 'none';

      if (choicesContainer && choicesContainer.parentNode) {
        choicesContainer.parentNode.removeChild(choicesContainer);
      }
      choicesContainer = document.createElement('div');
      choicesContainer.className = 'dialogChoicesList';

      branchConfig.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        const isVisited = visited.has(idx);
        btn.className = 'dialogChoiceBtn' + (isVisited ? ' visited' : '');
        // Убираем любые префиксы вида "Ветка 1:" если вдруг встретятся
        const cleanLabel = String(opt.label || '').replace(/^Ветка\s*\d+\s*[:.—-]\s*/i, '');
        btn.innerHTML = `${isVisited ? '✔ ' : '💬 '}${cleanLabel}`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.AudioEngine) window.AudioEngine.playClick();
          visited.add(idx);

          if (typeof opt.onSelect === 'function') {
            opt.onSelect();
          }

          clearChoicesUI();
          show(opt.response, {
            name: branchConfig.speakerName || '🐀 Тоник',
            portrait: branchConfig.portrait || 'img/portraits/tonik.svg',
            phaseLabel: currentPhaseLabel,
            forceMode: currentForceMode,
            onDone: () => {
              if (branchConfig.singleChoice) {
                if (onAllDone) onAllDone();
              } else {
                renderMenu();
              }
            }
          });
        });
        choicesContainer.appendChild(btn);
      });

      const finishBtn = document.createElement('button');
      finishBtn.className = 'dialogChoiceBtn finishBranchBtn';
      finishBtn.innerHTML = visited.size > 0
        ? `⚔ Завершить беседу и продолжить (${visited.size}/${branchConfig.options.length} тем) ▶`
        : `⚔ Пропустить беседу и идти дальше ▶`;
      finishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.AudioEngine) window.AudioEngine.playClick();
        clearChoicesUI();
        closeDialog();
        if (onAllDone) onAllDone();
      });
      choicesContainer.appendChild(finishBtn);

      box.appendChild(choicesContainer);
    }

    renderMenu();
  }

  function closeDialog() {
    clearInterval(typeTimer);
    clearChoicesUI();
    isTyping = false;
    currentPhaseLabel = null;
    currentForceMode = null;
    box.classList.remove('active');
    box.classList.add('hidden');
    if (onDoneCallback) {
      const cb = onDoneCallback;
      onDoneCallback = null;
      cb();
    }
  }

  box.addEventListener('click', (e) => {
    if (inChoiceMode) return;
    e.stopPropagation();
    displayNextLine();
  });

  return {
    show,
    showBranching,
    showTransitionGate,
    close: closeDialog
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dialog;
}
