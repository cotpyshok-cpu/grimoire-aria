// ===== Модуль мини-игр, боевой магии, гиф-сцен Тоника и Рунных Шифров Гримуара =====
// Без подсказок-спойлеров и с анимациями Тоника для живых квестов от актёров.

const Minigames = (() => {
  const modalEl = document.getElementById('minigameModal');
  const titleEl = document.getElementById('minigameTitle');
  const bodyEl = document.getElementById('minigameBody');
  const closeBtn = document.getElementById('minigameCloseBtn');

  let currentCleanup = null;

  // Нормализация рунного кода (MELARI_ART === melari art === melari-art)
  function normalizeCipher(input) {
    return String(input || '')
      .trim()
      .toUpperCase()
      .replace(/[\s\-]+/g, '_');
  }

  function close() {
    if (typeof currentCleanup === 'function') {
      currentCleanup();
      currentCleanup = null;
    }
    if (modalEl) {
      modalEl.classList.add('hidden');
    }
    if (bodyEl) {
      bodyEl.innerHTML = '';
    }
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (window.AudioEngine) window.AudioEngine.playClick();
      close();
    });
  }

  // Эффект стробоскопа экрана (Огонь Фей / Дребезги / Укус Тоника)
  function triggerScreenStrobe(color = '#00e5ff', flashes = 6) {
    const overlay = document.createElement('div');
    overlay.className = 'strobeOverlay';
    overlay.style.background = color;
    document.body.appendChild(overlay);

    let count = 0;
    const timer = setInterval(() => {
      count++;
      overlay.style.opacity = count % 2 === 1 ? '0.85' : '0.05';
      if (count >= flashes * 2) {
        clearInterval(timer);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
    }, 75);
  }

  // Наказание за неверный выбор или ошибку: Тоник кусает Арию за палец и отнимает 0.5 HP
  function tonikBite(customComment = 'Ай-яй-яй, Ария! Думаешь, я тут просто так сижу?! Не угадала — получай кусь за палец!') {
    if (window.AudioEngine) {
      window.AudioEngine.playError();
      if (typeof window.AudioEngine.vibrate === 'function') {
        window.AudioEngine.vibrate([80, 40, 120]);
      }
    }
    triggerScreenStrobe('#d32f2f', 2);
    let currentHpText = '';
    if (window.App && typeof window.App.damageHP === 'function') {
      window.App.damageHP(0.5);
      if (typeof window.App.getState === 'function') {
        const st = window.App.getState();
        currentHpText = ` (Здоровье: ❤️ ${st.hp}/${st.maxHp} HP)`;
      }
    }
    return `🐀 КУСЬ ЗА ПАЛЕЦ! (−0.5 ❤️ HP)${currentHpText} — Тоник цапнул тебя за палец через экран: «${customComment}»`;
  }

  // Вспомогательный рендер блока ввода обязательного Рунного Шифра (БЕЗ подсказок и БЕЗ спойлеров в placeholder)
  function renderCipherSection(container, cfg) {
    const wrap = document.createElement('div');
    wrap.className = 'cipherTablet';
    wrap.innerHTML = `
      <div class="cipherHeader">🔮 РУННАЯ СКРИЖАЛЬ ШИФРА</div>
      <div class="cipherPrompt">${cfg.prompt || 'Введи рунный шифр, начертанный на полученном артефакте:'}</div>
      <input type="text" class="cipherInput" placeholder="Введи рунный шифр..." autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" />
      <div class="cipherError hidden"></div>
      <div class="cipherActions">
        <button class="pixelBtn cipherSubmitBtn">⚡ Активировать Руну</button>
      </div>
    `;

    const inputEl = wrap.querySelector('.cipherInput');
    const errEl = wrap.querySelector('.cipherError');
    const submitBtn = wrap.querySelector('.cipherSubmitBtn');

    function verify() {
      const val = normalizeCipher(inputEl.value);
      const expected = Array.isArray(cfg.code)
        ? cfg.code.map(normalizeCipher)
        : [normalizeCipher(cfg.code)];

      if (expected.includes(val)) {
        if (window.AudioEngine) window.AudioEngine.playSuccess();
        errEl.classList.add('hidden');
        if (typeof cfg.onSuccess === 'function') cfg.onSuccess();
      } else {
        errEl.textContent = tonikBite('Руна не откликается! Смотри внимательнее на реликвию, а не тыкай наугад!');
        errEl.classList.remove('hidden');
      }
    }

    submitBtn.addEventListener('click', () => {
      if (window.AudioEngine) window.AudioEngine.playClick();
      verify();
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (window.AudioEngine) window.AudioEngine.playClick();
        verify();
      }
    });

    container.appendChild(wrap);
    setTimeout(() => inputEl.focus(), 150);
  }

  // Вспомогательный рендер «ГИФКИ» того, как Тоник сам комично пытается выполнить живой квест от актёров,
  // и кнопки «✅ Выполнила квест от [Имя]», после которой открывается ввод рунного шифра.
  function renderTonikLiveQuestCard(container, cfg) {
    const card = document.createElement('div');
    card.className = 'tonikLiveQuestWrap';
    card.innerHTML = `
      <div class="mgDescription">
        <strong>🎭 ЖИВОЕ ИСПЫТАНИЕ В РЕАЛЬНОСТИ: ${cfg.title}</strong><br>
        ${cfg.subtitle || 'Это испытание проводят живые хранители прямо перед тобой! Пока ты проходишь его в реальности, Тоник внутри Гримуара тоже пытается повторить твой подвиг:'}
      </div>
      <div class="tonikGifBox" data-theme="${cfg.theme || 'default'}">
        <div class="tonikGifBadge">🎞 PIXEL-GIF • ПОПЫТКА ТОНИКА</div>
        <div class="tonikGifStage">
          <div class="tonikSpriteWrap ${cfg.animClass || 'anim-bounce'}">
            <img src="img/portraits/tonik.svg" alt="Тоник" class="tonikGifAvatar" />
            <span class="tonikPropLeft">${cfg.propLeft || '🧀'}</span>
            <span class="tonikPropRight">${cfg.propRight || '✨'}</span>
          </div>
          <div class="tonikParticles">${cfg.particles || '💫 🐾 💥'}</div>
        </div>
        <div class="tonikGifCaption">${cfg.caption}</div>
      </div>
      <div class="tonikCompleteAction">
        <button class="pixelBtn mgFullBtn completeLiveQuestBtn">✅ Выполнила квест от ${cfg.actorGenitive}</button>
      </div>
      <div class="liveCipherMount hidden"></div>
    `;

    const doneBtn = card.querySelector('.completeLiveQuestBtn');
    const cipherMount = card.querySelector('.liveCipherMount');

    doneBtn.addEventListener('click', () => {
      if (window.AudioEngine) window.AudioEngine.playSuccess();
      doneBtn.disabled = true;
      doneBtn.textContent = `✔ Квест от ${cfg.actorGenitive} выполнен!`;
      cipherMount.classList.remove('hidden');
      renderCipherSection(cipherMount, {
        prompt: cfg.cipherPrompt,
        code: cfg.code,
        onSuccess: cfg.onSuccess
      });
    });

    container.appendChild(card);
  }

  // Главная точка запуска мини-игры локации
  function open(loc, callbacks = {}) {
    if (!modalEl || !bodyEl) return;
    close();

    modalEl.classList.remove('hidden');
    titleEl.textContent = loc.minigameTitle || `⚔ ${loc.name}`;
    const gameType = loc.minigameType;

    switch (gameType) {
      case 'runic_disk':
        renderRunicDisk(loc, callbacks);
        break;
      case 'chronicle_sort':
        renderChronicleSort(loc, callbacks);
        break;
      case 'melari_trial':
        renderMelariTrial(loc, callbacks);
        break;
      case 'linar_trial':
        renderLinarTrial(loc, callbacks);
        break;
      case 'kasym_barter':
        renderKasymBarter(loc, callbacks);
        break;
      case 'botanical_garden':
        renderBotanicalGarden(loc, callbacks);
        break;
      case 'coffee_barista':
        renderCoffeeBarista(loc, callbacks);
        break;
      case 'train_departure':
        renderTrainDeparture(loc, callbacks);
        break;
      case 'semaphore_puzzle':
        renderSemaphorePuzzle(loc, callbacks);
        break;
      case 'station_arrival':
        renderStationArrival(loc, callbacks);
        break;
      case 'thief_drop':
        renderThiefDrop(loc, callbacks);
        break;
      case 'parents_morning':
        renderParentsMorning(loc, callbacks);
        break;
      case 'alchemy_lab':
        renderAlchemyLab(loc, callbacks);
        break;
      case 'granite_stronghold':
        renderGraniteStronghold(loc, callbacks);
        break;
      case 'hunters_alley':
        renderHuntersAlley(loc, callbacks);
        break;
      case 'final_altar':
        renderFinalAltar(loc, callbacks);
        break;
      default:
        close();
        if (callbacks.onComplete) callbacks.onComplete();
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. РУНИЧЕСКИЙ ДИСК ПРОРИЦАНИЯ (Старт Акта I — Лесное Святилище в Астане)
  // ---------------------------------------------------------------------------
  function renderRunicDisk(loc, callbacks) {
    const symbols = [
      { id: 'cheese', icon: '🧀', label: 'Сырная Головка' },
      { id: 'feather', icon: '🪶', label: 'Воронье Перо' },
      { id: 'axe', icon: '🪓', label: 'Ржавый Топор' },
      { id: 'crown', icon: '👑', label: 'Венец Королевы Леса' }
    ];
    const selected = new Set();

    bodyEl.innerHTML = `
      <div class="mgDescription">
        <strong>🐀 Загадка Тоника (Астана • Лесное Святилище):</strong><br>
        «Чтобы снять блокировку Гримуара, выбери <strong>два сакральных символа</strong>, связывающих твоего фамильяра и твоё предназначение в Лесу!»
      </div>
      <div class="mgGrid2x2" id="diskGrid"></div>
      <div id="diskFeedback" class="mgFeedback hidden"></div>
      <button id="diskConfirmBtn" class="pixelBtn mgFullBtn">🔓 Снять блокировку Гримуара</button>
    `;

    const grid = bodyEl.querySelector('#diskGrid');
    const feedback = bodyEl.querySelector('#diskFeedback');
    const confirmBtn = bodyEl.querySelector('#diskConfirmBtn');

    function renderButtons() {
      grid.innerHTML = '';
      symbols.forEach(sym => {
        const btn = document.createElement('button');
        const isSel = selected.has(sym.id);
        btn.className = 'mgSymbolCard' + (isSel ? ' selected' : '');
        btn.innerHTML = `<div class="mgSymIcon">${sym.icon}</div><div class="mgSymLabel">${sym.label}</div>`;
        btn.addEventListener('click', () => {
          if (window.AudioEngine) window.AudioEngine.playClick();
          if (selected.has(sym.id)) {
            selected.delete(sym.id);
          } else {
            if (selected.size >= 2) {
              const first = selected.values().next().value;
              selected.delete(first);
            }
            selected.add(sym.id);
          }
          renderButtons();
        });
        grid.appendChild(btn);
      });
    }

    renderButtons();

    confirmBtn.addEventListener('click', () => {
      if (selected.size === 2 && selected.has('cheese') && selected.has('crown')) {
        if (window.AudioEngine) {
          window.AudioEngine.playSuccess();
          window.AudioEngine.playCoin();
        }
        if (window.App) {
          window.App.addGold(1000, 'Тайная казна Хондора');
          window.App.unlockCharacter('tonik');
        }
        close();
        if (callbacks.onComplete) callbacks.onComplete();
      } else {
        feedback.textContent = tonikBite(
          selected.has('feather')
            ? 'ФУ, ТЫ ЗАЧЕМ ТЫКАЕШЬ В ВОРОНЬЕ ПЕРО?! Получай кусь за палец!'
            : 'Не те руны на диске! Думай головой, а то откушу полпальца!'
        );
        feedback.classList.remove('hidden');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 2. СБОРКА РАСКОЛОТОЙ ХРОНИКИ ХОНДОРА (Архивариус Клок)
  // ---------------------------------------------------------------------------
  function renderChronicleSort(loc, callbacks) {
    const items = [
      { id: 3, text: '«Праздник Безликих Лиц»: заманивание и убийство нелюдей людьми ради процветания Хондора и поднятия нежити' },
      { id: 1, text: 'Запретная любовь Человека и Эльфа: 14 священных обещаний вопреки расовым законам' },
      { id: 4, text: 'Разрушение Хондора отрядом Арии и воссоединение душ Человека и Эльфа в посмертии' },
      { id: 2, text: 'Предательство: лишь 3 обещания из 14 исполнены Человеком перед возлюбленным Эльфом' }
    ];

    bodyEl.innerHTML = `
      <div class="mgDescription">
        <strong>⚙️ Архивариус Клок:</strong><br>
        «База данных повреждена! Восстановите хронологическую последовательность четырёх свитков подлинной трагедии Хондора от истоков (1) к финалу кампании (4):»
      </div>
      <div id="sortList" class="mgSortList"></div>
      <div id="sortFeedback" class="mgFeedback hidden"></div>
      <button id="sortCheckBtn" class="pixelBtn mgFullBtn">⚙️ Синхронизировать Хронику Хондора</button>
    `;

    const listEl = bodyEl.querySelector('#sortList');
    const feedback = bodyEl.querySelector('#sortFeedback');
    const checkBtn = bodyEl.querySelector('#sortCheckBtn');

    function renderList() {
      listEl.innerHTML = '';
      items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'mgSortItem';
        row.innerHTML = `
          <span class="mgSortNum">#${idx + 1}</span>
          <span class="mgSortText">${item.text}</span>
          <div class="mgSortBtns">
            <button class="smallBtn upBtn" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="smallBtn downBtn" ${idx === items.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
        `;
        row.querySelector('.upBtn').addEventListener('click', () => {
          if (idx > 0) {
            if (window.AudioEngine) window.AudioEngine.playClick();
            const tmp = items[idx - 1];
            items[idx - 1] = items[idx];
            items[idx] = tmp;
            renderList();
          }
        });
        row.querySelector('.downBtn').addEventListener('click', () => {
          if (idx < items.length - 1) {
            if (window.AudioEngine) window.AudioEngine.playClick();
            const tmp = items[idx + 1];
            items[idx + 1] = items[idx];
            items[idx] = tmp;
            renderList();
          }
        });
        listEl.appendChild(row);
      });
    }

    renderList();

    checkBtn.addEventListener('click', () => {
      const isCorrect = items.every((it, index) => it.id === index + 1);
      if (isCorrect) {
        if (window.AudioEngine) window.AudioEngine.playSuccess();
        if (window.App) {
          window.App.addArtifact('scroll_pact', '📜 Свиток «Четырнадцать Обещаний Хондора»');
          window.App.unlockCharacter('clock');
        }
        close();
        if (callbacks.onComplete) callbacks.onComplete();
      } else {
        feedback.textContent = tonikBite('Ты перепутала порядок хроники Хондора! Вспоминай историю нашего похода!');
        feedback.classList.remove('hidden');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 3. ПРИСТАНИЩЕ МЕЛАРИ (Крупье Валтасар + ГИФ Тоника + Квест от Мелари)
  // ---------------------------------------------------------------------------
  function renderMelariTrial(loc, callbacks) {
    function renderStage1() {
      bodyEl.innerHTML = `
        <div class="mgDescription">
          <strong>🃏 Дуэль с Призрачным Крупье Валтасаром (Эфир Гримуара):</strong><br>
          «Три карты Старших Арканов лежат перед вами: Аркан Клинка, Аркан Чаши и Аркан Маски. Выбери ту карту, что хранит печать вашего союза!»
        </div>
        <div class="mgCardsRow" id="arcaneCards">
          <div class="mgArcaneCard" data-card="blade">
            <div class="mgCardIcon">🗡️</div>
            <div>Аркан I: Клинок</div>
          </div>
          <div class="mgArcaneCard" data-card="chalice" id="chaliceCard">
            <div class="mgCardIcon">🏆</div>
            <div>Аркан II: Чаша</div>
          </div>
          <div class="mgArcaneCard" data-card="mask">
            <div class="mgCardIcon">🎭</div>
            <div>Аркан III: Маска</div>
          </div>
        </div>
        <div id="valtasarMsg" class="mgFeedback hidden"></div>
      `;

      const msgEl = bodyEl.querySelector('#valtasarMsg');

      bodyEl.querySelectorAll('.mgArcaneCard').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
          const type = cardEl.dataset.card;
          if (type === 'chalice') {
            if (window.AudioEngine) window.AudioEngine.playSuccess();
            if (window.App) {
              window.App.addArtifact('jester_ace', '🃏 Шутовской Туз Хондора (+1 Харизма)');
              window.App.unlockCharacter('valtasar');
            }
            renderStage2();
          } else {
            msgEl.textContent = tonikBite('Не та карта Арканов! Не тяни палец к обманке Валтасара!');
            msgEl.classList.remove('hidden');
          }
        });
      });
    }

    function renderStage2() {
      bodyEl.innerHTML = '';
      renderTonikLiveQuestCard(bodyEl, {
        title: 'Испытание Барда Лазурных Огней Мелари',
        actorGenitive: 'Мелари',
        animClass: 'anim-lute-spin',
        propLeft: '🎨',
        propRight: '🪕',
        particles: '🎵 🎨 🐾 🎶',
        caption: '🐀 Тоник пытается выполнить квест Мелари: запутался хвостом в струнах лютни, уронил на себя банку лазурной гуаши и ворчит: «Это всё высокое искусство виновато, я вообще-то старался!»',
        cipherPrompt: 'Введи рунный шифр, полученный от Мелари после прохождения её испытания:',
        code: 'MELARI_ART',
        onSuccess: () => {
          if (window.App) {
            window.App.addArtifact('map_frag_1', '🗺 Фрагмент Карты Хондора №1');
            window.App.unlockCharacter('melari');
          }
          close();
          if (callbacks.onComplete) callbacks.onComplete();
        }
      });
    }

    renderStage1();
  }

  // ---------------------------------------------------------------------------
  // 4. ОБИТЕЛЬ ЛИНАР (Кольца Элодеи + ГИФ Тоника + Квест от Линар)
  // ---------------------------------------------------------------------------
  function renderLinarTrial(loc, callbacks) {
    const rings = [
      { name: '🌍 Кольцо Земли', pos: 1 },
      { name: '🌙 Кольцо Луны', pos: 2 },
      { name: '💧 Кольцо Росы', pos: 3 }
    ];
    const glyphs = ['▲ ЗЕНИТ СВЕТА', '► ВОСТОК', '▼ НАДИР', '◄ ЗАПАД'];

    function renderStage1() {
      bodyEl.innerHTML = `
        <div class="mgDescription">
          <strong>🌱 Дух Реликтовой Лозы Элодея: «Гармонизация Эфирных Спор»</strong><br>
          «Вращай три стихийных кольца, пока все три священных друидических глифа не выстроятся в единый вертикальный луч света!»
        </div>
        <div id="ringsContainer" class="mgRingsBox"></div>
      `;

      const container = bodyEl.querySelector('#ringsContainer');

      function updateRingsUI() {
        container.innerHTML = '';
        rings.forEach((r) => {
          const row = document.createElement('div');
          row.className = 'mgRingRow' + (r.pos === 0 ? ' aligned' : '');
          row.innerHTML = `
            <span class="mgRingTitle">${r.name}</span>
            <button class="pixelBtn ringTurnBtn">${glyphs[r.pos]} ↻</button>
          `;
          row.querySelector('.ringTurnBtn').addEventListener('click', () => {
            if (window.AudioEngine) window.AudioEngine.playClick();
            r.pos = (r.pos + 1) % 4;
            updateRingsUI();
            if (rings.every(ring => ring.pos === 0)) {
              if (window.AudioEngine) window.AudioEngine.playSuccess();
              if (window.App) {
                window.App.addArtifact('star_leaf', '🌿 Звездный Лист Элодеи (Иммунитет к иллюзиям)');
                window.App.unlockCharacter('elodea');
              }
              setTimeout(() => renderStage2(), 450);
            }
          });
          container.appendChild(row);
        });
      }

      updateRingsUI();
    }

    function renderStage2() {
      bodyEl.innerHTML = '';
      renderTonikLiveQuestCard(bodyEl, {
        title: 'Испытание Друидки Круга Луны Линар',
        actorGenitive: 'Линар',
        animClass: 'anim-herb-sneeze',
        propLeft: '🌿',
        propRight: '🌙',
        particles: '🍃 🤧 🌱 ✨',
        caption: '🐀 Тоник пытается пройти квест Линар: завязал себе глаза листом лопуха, сунул нос в мешочек с травами, оглушительно чихнул и пискнул: «АПЧХИ! ЛИНАР — ОБМАНЩИЦА! Ой, почему я опять это крикнул?!»',
        cipherPrompt: 'Введи рунный шифр с артефакта Луны, который вручила тебе друидка Линар:',
        code: 'MOON_LUNAR',
        onSuccess: () => {
          if (window.App) {
            window.App.addArtifact('moon_pendant', '🌙 Кулон Луны Линар');
            window.App.unlockCharacter('linar');
          }
          close();
          if (callbacks.onComplete) callbacks.onComplete();
        }
      });
    }

    renderStage1();
  }

  // ---------------------------------------------------------------------------
  // 5. ТЕНЕВОЙ БАРТЕР КАСЫМИУСА МЕДНОЗВОНА (Астана • Аллея Ветров)
  // ---------------------------------------------------------------------------
  function renderKasymBarter(loc, callbacks) {
    let rubies = 0;
    let sapphires = 0;
    let emeralds = 0;

    bodyEl.innerHTML = `
      <div class="mgDescription">
        <strong>⚒️ Задачка гнома Касымиуса Меднозвона:</strong><br>
        «У меня самоцветы трех видов:<br>
        • <strong>1 Рубин</strong> ценится как 2 Сапфира<br>
        • <strong>1 Сапфир</strong> ценится как <strong>3 Изумруда</strong><br>
        Собери на весах пошлину ровно на <strong>11 Изумрудов</strong>, обязательно использовав все три вида камней!»
      </div>
      <div class="mgGemsBox">
        <div class="mgGemRow">
          <span>♦️ Рубин</span>
          <div class="mgCounterCtrl">
            <button class="smallBtn" id="rDec">−</button>
            <span id="rVal">0</span>
            <button class="smallBtn" id="rInc">+</button>
          </div>
        </div>
        <div class="mgGemRow">
          <span>🔷 Сапфир</span>
          <div class="mgCounterCtrl">
            <button class="smallBtn" id="sDec">−</button>
            <span id="sVal">0</span>
            <button class="smallBtn" id="sInc">+</button>
          </div>
        </div>
        <div class="mgGemRow">
          <span>💚 Изумруд</span>
          <div class="mgCounterCtrl">
            <button class="smallBtn" id="eDec">−</button>
            <span id="eVal">0</span>
            <button class="smallBtn" id="eInc">+</button>
          </div>
        </div>
      </div>
      <div id="barterSum" class="mgFeedback">Выбрано камней: <strong>0 Руб., 0 Сапф., 0 Изумр.</strong></div>
      <button id="barterSubmitBtn" class="pixelBtn mgFullBtn">⚖️ Отвесить камни Касымиусу</button>
    `;

    const rVal = bodyEl.querySelector('#rVal');
    const sVal = bodyEl.querySelector('#sVal');
    const eVal = bodyEl.querySelector('#eVal');
    const sumEl = bodyEl.querySelector('#barterSum');

    function updateUI() {
      rVal.textContent = rubies;
      sVal.textContent = sapphires;
      eVal.textContent = emeralds;
      sumEl.innerHTML = `Выбрано камней: <strong>${rubies} Руб., ${sapphires} Сапф., ${emeralds} Изумр.</strong>`;
    }

    bodyEl.querySelector('#rDec').onclick = () => { if (rubies > 0) rubies--; updateUI(); };
    bodyEl.querySelector('#rInc').onclick = () => { if (rubies < 3) rubies++; updateUI(); };
    bodyEl.querySelector('#sDec').onclick = () => { if (sapphires > 0) sapphires--; updateUI(); };
    bodyEl.querySelector('#sInc').onclick = () => { if (sapphires < 4) sapphires++; updateUI(); };
    bodyEl.querySelector('#eDec').onclick = () => { if (emeralds > 0) emeralds--; updateUI(); };
    bodyEl.querySelector('#eInc').onclick = () => { if (emeralds < 11) emeralds++; updateUI(); };

    bodyEl.querySelector('#barterSubmitBtn').addEventListener('click', () => {
      const total = rubies * 6 + sapphires * 3 + emeralds;
      if (total === 11 && rubies >= 1 && sapphires >= 1 && emeralds >= 1) {
        if (window.AudioEngine) window.AudioEngine.playSuccess();
        if (window.App) {
          window.App.addArtifact('bird_whistle', '🎺 Свисток Защиты от Птиц');
          window.App.unlockCharacter('kasym');
        }
        bodyEl.innerHTML = `
          <div class="mgDescription">
            <strong>🎺 АРТЕФАКТ ПОЛУЧЕН: «Медный Свисток Защиты от Птиц»!</strong><br>
            Тоник надевает крошечный свисток на шею и сияет от гордости: «ВСЁ! ТРЕПЕЩИТЕ, ПЕРНАТЫЕ ТВАРЮГИ! ТЕПЕРЬ У МЕНЯ ПРОТИВОВОРОНЬЕ ПВО!»
          </div>
          <button id="whistleTestBtn" class="pixelBtn mgFullBtn">🎺 ДУНУТЬ В СВИСТОК («ФИ-И-И-ИТЬ!»)</button>
        `;
        bodyEl.querySelector('#whistleTestBtn').addEventListener('click', () => {
          if (window.AudioEngine) window.AudioEngine.playWhistle();
          close();
          if (callbacks.onComplete) callbacks.onComplete();
        });
      } else {
        sumEl.textContent = tonikBite('Не сходится вес на аптекарских весах Касымиуса! Считай камни точнее!');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 6. БОТАНИЧЕСКИЙ САД АСТАНЫ (Суд Королевы Леса + Бой с Вороном и -4 HP)
  // ---------------------------------------------------------------------------
  function renderBotanicalGarden(loc, callbacks) {
    function renderStage1() {
      bodyEl.innerHTML = `
        <div class="mgDescription">
          <strong>🌳 Суд Королевы Леса — Испытание Байтерек-Духа (Астана):</strong><br>
          «Перед тобой стоит юный гоблин-сирота, бежавший из разрушенного Хондора и пойманный на краже хлеба. Каков будет твой приговор, будущая Королева Леса?»
        </div>
        <div class="mgChoicesCol">
          <button class="pixelBtn courtBtn" data-choice="1">Отправить в дозор на дальние рубежи отрабатывать проступок службой</button>
          <button class="pixelBtn courtBtn" data-choice="2">Помиловать, разделить с ним хлеб и принять под защиту свободного Хондора</button>
          <button class="pixelBtn courtBtn" data-choice="3">Передать дело на строгий суд совета старейшин по законам прежних лет</button>
        </div>
        <div id="courtFeedback" class="mgFeedback hidden"></div>
      `;

      const fb = bodyEl.querySelector('#courtFeedback');
      bodyEl.querySelectorAll('.courtBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          const ch = btn.dataset.choice;
          if (ch === '2') {
            if (window.AudioEngine) {
              window.AudioEngine.playSuccess();
              window.AudioEngine.playCoin();
            }
            if (window.App) {
              window.App.addGold(1500, 'Дар Байтерек-Духа');
              window.App.addArtifact('steppe_blessing', '🌳 Благословение Древа (+2 Защита)');
              window.App.unlockCharacter('baiterek');
            }
            renderStage2();
          } else {
            fb.textContent = tonikBite('Эй, ты чего судишь не по законам Леса?! Получай кусь за палец!');
            fb.classList.remove('hidden');
          }
        });
      });
    }

    function renderStage2() {
      let step = 1;
      // Наносим урон от внезапного налета Теневого Ворона на лесной дороге (-4 HP ровно 1 раз)
      if (window.App && typeof window.App.damageHP === 'function' && (!loc || !loc._hpDeltaApplied)) {
        if (loc) loc._hpDeltaApplied = true;
        window.App.damageHP(4);
      }
      const st = (window.App && typeof window.App.getState === 'function') ? window.App.getState() : { hp: 14, maxHp: 18 };

      bodyEl.innerHTML = `
        <div class="mgDescription combatAlert">
          <strong>🐦‍⬛ ЗАСАДА НА ДОРОГЕ: ТЕНЕВОЙ ВОРОН РАНИЛ ОТРЯД (-4 ❤️ HP)!</strong><br>
          «Кар-р-р! Нелюдям не бывать в Хондоре! Когти тени терзают ваши плечи (Здоровье снижено до <strong>${st.hp}/${st.maxHp} HP</strong>)!»<br>
          🐀 Тоник: «А-А-А! ВОРОН! ОН ОПЯТЬ НАПАЛ! АРИЯ, ОСЛЕПИ ЕГО ОГНЁМ ФЕЙ И ДОБЕЙ ПЛЕТЬЮ ТАШИ!»
        </div>
        <div class="mgCombatStatus" id="ravenStatus">Статус Ворона: 🟣 Парит в теневом мороке (Твоё здоровье: ❤️ ${st.hp}/${st.maxHp} HP)</div>
        <div class="mgChoicesCol">
          <button id="spellFaerieBtn" class="pixelBtn">✨ Шаг 1: Кастовать «Огонь Фей» (Faerie Fire)</button>
          <button id="spellWhipBtn" class="pixelBtn secondary" disabled>⚡ Шаг 2: Кастовать «Психическую Плеть Таши»</button>
        </div>
      `;

      const statusEl = bodyEl.querySelector('#ravenStatus');
      const faerieBtn = bodyEl.querySelector('#spellFaerieBtn');
      const whipBtn = bodyEl.querySelector('#spellWhipBtn');

      faerieBtn.addEventListener('click', () => {
        if (step !== 1) return;
        step = 2;
        if (window.AudioEngine) {
          window.AudioEngine.playWhistle();
          window.AudioEngine.playFaerieFire();
          window.AudioEngine.vibrate([100, 50, 200]);
        }
        triggerScreenStrobe('#e040fb', 6);
        statusEl.innerHTML = 'Статус Ворона: ✨ <strong>ОСЛЕПЛЕН И ПОДСВЕЧЕН ОГНЕМ ФЕЙ!</strong>';
        faerieBtn.disabled = true;
        faerieBtn.textContent = '✔ Огонь Фей активирован!';
        whipBtn.disabled = false;
        whipBtn.classList.remove('secondary');
      });

      whipBtn.addEventListener('click', () => {
        if (step !== 2) return;
        if (window.AudioEngine) {
          window.AudioEngine.playShatter();
          window.AudioEngine.vibrate([300, 100, 400]);
        }
        triggerScreenStrobe('#ffffff', 4);
        if (window.App) {
          window.App.addArtifact('raven_feather', '🪶 Перо Теневого Шпиона');
          window.App.unlockCharacter('raven');
        }
        close();
        if (callbacks.onComplete) callbacks.onComplete();
      });
    }

    renderStage1();
  }

  // ---------------------------------------------------------------------------
  // 7. КОФЕЙНЯ JUMPING COFFEE В АСТАНЕ (Вместе с Великим Архивариусом Ильярионом + Депеша Оривии)
  // ---------------------------------------------------------------------------
  function renderCoffeeBarista(loc, callbacks) {
    let goldSpent = false;

    bodyEl.innerHTML = `
      <div class="mgDescription">
        <strong>☕ Мастер Эспрессо (Астана • Jumping Coffee — Вместе с Ильярионом):</strong><br>
        «Приветствую леди Арию и Великого Архивариуса Ильяриона! Спишите <strong>1500 ЗМ</strong> из Казны Героини Леса на горячий кофе для вас двоих перед дорогой, а взамен я передам вам перехваченную аудио-депешу от полуорка Оривии из Караганды!»
      </div>
      <div class="mgChoicesCol">
        <button id="spendCoffeeBtn" class="pixelBtn mgFullBtn">🪙 [Ход Арии]: Потратить 1500 ЗМ из Казны на кофе с Ильярионом</button>
        <button id="ilyaDecryptBtn" class="pixelBtn secondary mgFullBtn" disabled>🔮 [Ход Ильяриона]: Расшифровать звёздным ключом радиограмму Оривии</button>
      </div>
      <div id="coffeeStatus" class="mgFeedback hidden"></div>
      <div id="oriviaAudioBox" class="mgAudioPlayer hidden">
        <div class="mgAudioHeader">📻 ПЕРЕХВАЧЕННАЯ РАДИОГРАММА: ОРИВИЯ • АВАНГАРД В КАРАГАНДЕ</div>
        <div class="mgWaveBars">
          <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="mgAudioTranscript">
          «Так, отставить нежности с дубами и распивание кофеев в Астане! Ария, Великий Архивариус Ильярион, Мелари, подруга моя лучшая, приём! Это Оривия. Я уже в Караганде, прочесала местность. Тени старого Хондора пытаются помешать возрождению города для нелюдей. Но вы прибудете из Астаны глубокой ночью! Поэтому слушай мой боевой приказ: ночью по городу не шататься, не будить спящих гоблинов и тем более не звонить мне среди ночи — полуорку нужен здоровый сон, иначе с утра я кого-нибудь перекушу пополам!<br><br>
          С ночного поезда сразу берете такси и дуете в поместье Лорда-Отца Древнего Корня и Леди-Матушки Серебряных Рос. Ложитесь спать, восстанавливайте раненые в дороге ХП. На двери я оставила воровскую закладку с инструкциями. А утром я лично приду к вам за завтраком и вступлю в ваш активный ударный отряд вместе с тобой и Ильярионом! <strong>50 монет за ночную разведку сейчас, 50 за утренний штурм потом! Конец связи!</strong>»
        </div>
        <button id="finishAct1Btn" class="pixelBtn mgFullBtn">🚂 Принять приказ и вместе с Ильярионом выдвинуться на вокзал Астаны</button>
      </div>
    `;

    const spendBtn = bodyEl.querySelector('#spendCoffeeBtn');
    const decryptBtn = bodyEl.querySelector('#ilyaDecryptBtn');
    const statusEl = bodyEl.querySelector('#coffeeStatus');
    const audioBox = bodyEl.querySelector('#oriviaAudioBox');
    const finishBtn = bodyEl.querySelector('#finishAct1Btn');

    spendBtn.addEventListener('click', () => {
      if (goldSpent) return;
      goldSpent = true;
      if (window.AudioEngine) {
        window.AudioEngine.playCoin();
        window.AudioEngine.playSuccess();
      }
      if (window.App) {
        window.App.spendGold(1500, 'Кофе с Великим Архивариусом Ильярионом у Мастера Эспрессо');
        window.App.unlockCharacter('barista');
        window.App.unlockCharacter('ilya');
      }
      spendBtn.disabled = true;
      spendBtn.textContent = '✔ 1500 ЗМ списано! Великий Архивариус Ильярион заверил транш!';
      statusEl.innerHTML = '🔮 <strong>Великий Архивариус Ильярион:</strong> «Кофе заказан, сестрёнка! Теперь позволь мне снять эфирную печать с радиограммы Оривии!»';
      statusEl.classList.remove('hidden');
      decryptBtn.disabled = false;
      decryptBtn.classList.remove('secondary');
    });

    decryptBtn.addEventListener('click', () => {
      if (!goldSpent) return;
      if (window.AudioEngine) {
        window.AudioEngine.playFaerieFire();
      }
      decryptBtn.disabled = true;
      decryptBtn.textContent = '✔ [Ход Ильяриона]: Звёздная шифровка снята!';
      statusEl.innerHTML = '✨ <strong>Канал открыт!</strong> Слушаем боевую радиограмму Оривии из Караганды:';
      audioBox.classList.remove('hidden');
    });

    finishBtn.addEventListener('click', () => {
      if (window.AudioEngine) window.AudioEngine.playClick();
      close();
      if (callbacks.onComplete) callbacks.onComplete();
    });
  }

  // ---------------------------------------------------------------------------
  // 8. НОЧНОЙ ЭКСПРЕСС «АСТАНА — КАРАГАНДА» И ПАМЯТЬ МЫШИНОЙ МАФИИ
  // ---------------------------------------------------------------------------
  function renderTrainDeparture(loc, callbacks) {
    bodyEl.innerHTML = `
      <div class="mgDescription">
        <strong>🚂 Ночной экспресс «Астана — Караганда» (Тёмная ночь за окном):</strong><br>
        Отряд едет сквозь ночную степь: Ария, Мелари, влюблённо поглядывающая на неё друидка Линар и Великий Архивариус Ильярион. За окном мелькают редкие огни полустанков, а Тоник во сне всхлипывает и напевает мелодию из подвала старой церкви...
      </div>
      <div class="mgChoicesCol">
        <button id="godfatherBtn" class="pixelBtn secondary">🎻 Включить воспоминание Тоника: Похороны Мышиной Мафии («Крёстный Отец»)</button>
        <button id="drinkTeaBtn" class="pixelBtn mgFullBtn">☕ Выпить ночной дорожный чай и продолжить путь в Караганду</button>
      </div>
    `;

    bodyEl.querySelector('#godfatherBtn').addEventListener('click', () => {
      if (window.AudioEngine && typeof window.AudioEngine.playGodfatherTheme === 'function') {
        window.AudioEngine.playGodfatherTheme();
      }
    });

    bodyEl.querySelector('#drinkTeaBtn').addEventListener('click', () => {
      if (window.AudioEngine) window.AudioEngine.playSuccess();
      close();
      if (callbacks.onComplete) callbacks.onComplete();
    });
  }

  // ---------------------------------------------------------------------------
  // 9. СТРЕЛОЧНЫЙ ПЕРЕВОД СУДЕБ (Смотритель Куанышор в ночном поезде)
  // ---------------------------------------------------------------------------
  function renderSemaphorePuzzle(loc, callbacks) {
    bodyEl.innerHTML = `
      <div class="mgDescription">
        <strong>🚂 Призрачный Смотритель Куанышор: «Стрелочный Перевод Судеб»</strong><br>
        «Стрелка заклинила в ночной степи! Чтобы рассеять туман и въехать на перрон Караганды, зажги тот семафор, чей знак хранит несокрушимую опору земли!»
      </div>
      <div class="mgChoicesCol">
        <button class="pixelBtn semBtn" data-sem="red">🔴 Красный Семафор — Знак Пламенного Горна</button>
        <button class="pixelBtn semBtn" data-sem="green">🟢 Зеленый Семафор — Знак Степного Ветра</button>
        <button class="pixelBtn semBtn" data-sem="blue">🔵 Синий Семафор — Знак Каменного Утёса</button>
      </div>
      <div id="semFeedback" class="mgFeedback hidden"></div>
    `;

    const fb = bodyEl.querySelector('#semFeedback');
    bodyEl.querySelectorAll('.semBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.sem === 'blue') {
          if (window.AudioEngine) window.AudioEngine.playSuccess();
          if (window.App) {
            window.App.addArtifact('iron_token', '🎫 Железный Жетон Степного Пути (+1 Стойкость)');
            window.App.unlockCharacter('kuanysh');
          }
          close();
          if (callbacks.onComplete) callbacks.onComplete();
        } else {
          fb.textContent = tonikBite('Куда ты переводишь стрелку?! Мы так в тупик уедем! Кусь за палец!');
          fb.classList.remove('hidden');
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 10. НОЧНОЙ РАЗЪЕЗД НА ВОКЗАЛЕ КАРАГАНДЫ (04:15 утра)
  // ---------------------------------------------------------------------------
  function renderStationArrival(loc, callbacks) {
    let taxi1Sent = false;

    bodyEl.innerHTML = `
      <div class="mgDescription">
        <strong>❄️ Перрон «Караганда-Пассажирская» (04:15 ночи):</strong><br>
        Поезд из Астаны прибыл в ночную Караганду! Действуем строго по плану конспирации:
      </div>
      <div class="mgChoicesCol">
        <button id="taxi1Btn" class="pixelBtn">🚕 Машина №1: Отправить Мелари и Линар отдыхать в карагандинское убежище Линар</button>
        <button id="taxi2Btn" class="pixelBtn secondary" disabled>🚕 Машина №2: Поехать с Великим Архивариусом Ильярионом в поместье Родителей</button>
      </div>
      <div id="stationNote" class="mgFeedback">🔮 Великий Архивариус Ильярион: «Сначала проводим Мелари и Линар в первую карету, затем едем к Лорду-Отцу и Леди-Матушке».</div>
    `;

    const t1 = bodyEl.querySelector('#taxi1Btn');
    const t2 = bodyEl.querySelector('#taxi2Btn');
    const note = bodyEl.querySelector('#stationNote');

    t1.addEventListener('click', () => {
      if (taxi1Sent) return;
      taxi1Sent = true;
      if (window.AudioEngine) window.AudioEngine.playClick();
      t1.disabled = true;
      t1.textContent = '✔ Мелари и Линар уехали отдыхать!';
      t2.disabled = false;
      t2.classList.remove('secondary');
      note.textContent = '🐀 Тоник: «Отлично! Теперь садимся во вторую машину и едем к поместью Старейшин!»';
    });

    t2.addEventListener('click', () => {
      if (!taxi1Sent) return;
      if (window.AudioEngine) window.AudioEngine.playSuccess();
      close();
      if (callbacks.onComplete) callbacks.onComplete();
    });
  }

  // ---------------------------------------------------------------------------
  // 11. ВОРОВСКАЯ ЗАКЛАДКА ОРИВИИ И ТИХИЙ НОЧНОЙ ОТБОЙ (Финал Акта II)
  // ---------------------------------------------------------------------------
  function renderThiefDrop(loc, callbacks) {
    bodyEl.innerHTML = `
      <div class="mgDescription">
        <strong>🗡️ Тайный знак на косяке двери и кожаный кисет Оривии:</strong><br>
        Под ковриком у двери родительского поместья лежит кожаный кисет с сургучной печатью кастета. Введи рунный шифр с закладки Оривии:
      </div>
      <div id="dropCipherMount"></div>
      <div id="leraLetterBox" class="mgLetterScroll hidden"></div>
    `;

    const cipherMount = bodyEl.querySelector('#dropCipherMount');
    const letterBox = bodyEl.querySelector('#leraLetterBox');

    renderCipherSection(cipherMount, {
      prompt: 'Введи рунный шифр, найденный в воровской закладке Оривии:',
      code: 'DROP_LERA',
      onSuccess: () => {
        if (window.App) {
          window.App.addArtifact('thief_pouch', '🗡️ Воровской кисет и письмо Оривии');
          window.App.unlockCharacter('orivia');
        }
        cipherMount.classList.add('hidden');
        letterBox.classList.remove('hidden');
        letterBox.innerHTML = `
          <div class="mgLetterHeader">📜 РУКОПИСНОЕ ПОСЛАНИЕ ОРИВИИ ИЗ КИСЕТА:</div>
          <div class="mgLetterContent">
            «С прибытием на карагандинскую землю, Королева Леса!<br><br>
            Если ты держишь этот кисет в руках — значит, вы с моей лучшей подругой Мелари, колючей друидкой Линар и Великим Архивариусом Ильярионом доехали из Астаны без хвоста.<br>
            На вокзал я ночью не поехала по двум железным причинам: во-первых, у путей рыщут тени старого Хондора, а во-вторых, полуорку требуется восемь часов богатырского сна.<br><br>
            <strong>Инструкция на ближайшие часы:</strong><br>
            1. Тихо заходите в поместье «Забытый Приют».<br>
            2. Знаю, что Мелари и Линар поехали ночевать к Линар (пусть Мелари ещё немного растопит лёд в сердце этой упрямой друидки!). Вы с Ильярионом остаётесь у родителей.<br>
            3. Обнимите Лорда-Отца Древнего Корня и Леди-Матушку Серебряных Рос.<br>
            4. Ложитесь спать до самого утра, а за утренним пиром восстановите раненое в дороге здоровье (до полных 18/18 HP) и пройдите испытание родителей за Первую Печать Древа.<br><br>
            Утром я буду ждать вас во всеоружии! <strong>50 монет за эту ночную разведку сейчас, 50 за утренний штурм потом!</strong><br>
            — Твоя боевая подруга Оривия»
          </div>
          <button id="sleepAct2Btn" class="pixelBtn mgFullBtn">🛌 Тихо войти домой, обнять Родителей и лечь спать до утра (Конец Ночи)</button>
        `;
        letterBox.querySelector('#sleepAct2Btn').addEventListener('click', () => {
          if (window.AudioEngine) window.AudioEngine.playSuccess();
          close();
          if (callbacks.onComplete) callbacks.onComplete();
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 12. УТРЕННИЙ ПИР СТАРЕЙШИН И ПЕЧАТЬ ПЕРВОРОДНОГО ДРЕВА (Акт III, Глава 1)
  // ---------------------------------------------------------------------------
  function renderParentsMorning(loc, callbacks) {
    let feastEaten = false;

    function renderStage1() {
      bodyEl.innerHTML = `
        <div class="mgDescription">
          <strong>🏠 Цифровой НПС №9: Хранитель Кузьмиус — «Завет Родового Порога»</strong><br>
          «Ой-ё-ёй, Ария проснулась! Чтобы Лорд-Отец Древнего Корня доверил тебе Печать Первородного Древа, вспомни главный завет нашего порога: какими словами встречают гостей в Забытом Приюте?»
        </div>
        <div class="mgChoicesCol">
          <button class="pixelBtn kuzyaBtn" data-ans="1">«Чти древние корни — храни тишину у порога!»</button>
          <button class="pixelBtn kuzyaBtn" data-ans="2">«С миром вошел — сытым ушел!»</button>
          <button class="pixelBtn kuzyaBtn" data-ans="3">«Сперва назови свой род — потом проси ночлега!»</button>
        </div>
        <div id="kuzyaFeedback" class="mgFeedback hidden"></div>
      `;

      const fb = bodyEl.querySelector('#kuzyaFeedback');
      bodyEl.querySelectorAll('.kuzyaBtn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.ans === '2') {
            if (window.AudioEngine) window.AudioEngine.playSuccess();
            if (window.App) {
              window.App.addArtifact('hearth_ember', '🔥 Теплый Уголек Очага (+1 защита от холода)');
              window.App.unlockCharacter('kuzya');
            }
            renderStage2();
          } else {
            fb.textContent = tonikBite('Ты что, забыла завет родного дома?! Получай кусь за палец!');
            fb.classList.remove('hidden');
          }
        });
      });
    }

    function renderStage2() {
      const st = (window.App && typeof window.App.getState === 'function') ? window.App.getState() : { hp: 14, maxHp: 18 };
      bodyEl.innerHTML = `
        <div class="mgDescription">
          <strong>🥞 Утренний Пир Фейского Дома (Лорд-Отец Древнего Корня и Леди-Матушка Серебряных Рос):</strong><br>
          После ночной дороги и схватки с Вороном твоё здоровье снижено (<strong>${st.hp} / ${st.maxHp} HP</strong>). Сначала подкрепись за родительским столом, чтобы полностью исцелиться!
        </div>
        <button id="eatFeastBtn" class="pixelBtn mgFullBtn">🥞 Отведать Яств Старейшин и исцелить раны (${st.hp}/${st.maxHp} ➔ ${st.maxHp}/${st.maxHp} ❤️ HP)</button>
        <div id="parentsQuestMount" class="hidden"></div>
      `;

      const eatBtn = bodyEl.querySelector('#eatFeastBtn');
      const questMount = bodyEl.querySelector('#parentsQuestMount');

      eatBtn.addEventListener('click', () => {
        if (feastEaten) return;
        feastEaten = true;
        if (window.AudioEngine) window.AudioEngine.playSuccess();
        if (window.App) {
          window.App.restoreFullHP();
          window.App.addArtifact('elders_satiety', '🍖 Благословение Очага (+1 ко всем проверкам)');
          window.App.unlockCharacter('mama');
        }
        eatBtn.disabled = true;
        eatBtn.textContent = '✔ Здоровье полностью восстановлено (18/18 ❤️ HP)!';
        questMount.classList.remove('hidden');

        renderTonikLiveQuestCard(questMount, {
          title: 'Испытание Лорда-Отца Древнего Корня и Леди-Матушки Серебряных Рос',
          actorGenitive: 'Лорда-Отца и Леди-Матушки',
          animClass: 'anim-cheese-lift',
          propLeft: '🌳',
          propRight: '🧀',
          particles: '🥞 🧀 ✨ 🌿',
          caption: '🐀 Тоник пытается выполнить квест Родителей: взвалил на спину огромный ломоть сыра маасдам в три раза больше себя, пыхтит и пищит: «Я тоже член семьи! Только чур меня воронам больше не бросать!»',
          cipherPrompt: 'Введи рунный шифр Первой Печати Древа, полученной от Лорда-Отца и Леди-Матушки:',
          code: 'SEAL_WOOD',
          onSuccess: () => {
            if (window.App) {
              window.App.unlockSeal('seal_wood');
              window.App.unlockCharacter('papa');
            }
            close();
            if (callbacks.onComplete) callbacks.onComplete();
          }
        });
      });
    }

    renderStage1();
  }

  // ---------------------------------------------------------------------------
  // 13. ЛАБОРАТОРИЯ АЛХИМИКОВ (Гомункул Ртутник + ГИФ Тоника + Квест Алхимиков)
  // ---------------------------------------------------------------------------
  function renderAlchemyLab(loc, callbacks) {
    let hits = 0;
    let gaugePos = 10;
    let gaugeDir = 1;
    let animTimer = null;

    function renderStage1() {
      bodyEl.innerHTML = `
        <div class="mgDescription">
          <strong>🧪 Цифровой НПС №10: Гомункул Ртутник — «Термодинамика Змеевика»</strong><br>
          «Буль-буль! Давление в котлах лаборатории зашкаливает! Нажми <strong>[Стравить пар] 3 раза</strong> ровно в тот момент, когда ртутная стрелка находится в <strong>ЗЕЛЕНОЙ ЗОНЕ</strong>!»
        </div>
        <div class="mgGaugeBar">
          <div class="mgGaugeSafeZone"></div>
          <div class="mgGaugeNeedle" id="gaugeNeedle"></div>
        </div>
        <div id="gaugeStatus" class="mgFeedback">Успешных стабилизаций: <strong>0 / 3</strong></div>
        <button id="ventSteamBtn" class="pixelBtn mgFullBtn">💨 СТРАВИТЬ ПАР!</button>
      `;

      const needle = bodyEl.querySelector('#gaugeNeedle');
      const statusEl = bodyEl.querySelector('#gaugeStatus');
      const ventBtn = bodyEl.querySelector('#ventSteamBtn');

      animTimer = setInterval(() => {
        gaugePos += gaugeDir * 4.5;
        if (gaugePos >= 96) { gaugePos = 96; gaugeDir = -1; }
        if (gaugePos <= 4) { gaugePos = 4; gaugeDir = 1; }
        if (needle) needle.style.left = `${gaugePos}%`;
      }, 35);

      currentCleanup = () => {
        if (animTimer) clearInterval(animTimer);
      };

      ventBtn.addEventListener('click', () => {
        if (gaugePos >= 38 && gaugePos <= 77) {
          hits++;
          if (window.AudioEngine) window.AudioEngine.playSuccess();
          statusEl.innerHTML = `✨ Точно в зеленую зону! Стабилизаций: <strong>${hits} / 3</strong>`;
          if (hits >= 3) {
            clearInterval(animTimer);
            currentCleanup = null;
            if (window.App) {
              window.App.addArtifact('alchemy_resist', '🧪 Алхимическая Стойкость (+2 против ядов)');
              window.App.unlockCharacter('mercury');
            }
            setTimeout(() => renderStage2(), 400);
          }
        } else {
          statusEl.textContent = tonikBite(`Мимо зеленой зоны! Ты мне сейчас усы паром опалишь! (${hits} / 3)`);
        }
      });
    }

    function renderStage2() {
      bodyEl.innerHTML = '';
      renderTonikLiveQuestCard(bodyEl, {
        title: 'Испытание Магистра Альфиэль, Мастера Сергиуса и Чародея Даниэля',
        subtitle: 'Вы проходите это живое испытание вашим активным трио (<strong>Ария, Великий Архивариус Ильярион и Оривия</strong>)! А пока вы дегустируете эликсиры, Тоник внутри Гримуара тоже пытается повторить ваш подвиг:',
        actorGenitive: 'Магистра Альфиэль, Мастера Сергиуса и Чародея Даниэля',
        animClass: 'anim-potion-puff',
        propLeft: '⚗️',
        propRight: '🧪',
        particles: '🫧 💜 💥 🧪',
        caption: '🐀 Тоник пытается выполнить квест в Лаборатории Алхимиков: надел защитные очки на уши, смешал две светящиеся пробирки, устроил фиолетовый «БАБАХ!» и теперь сидит с дымящимися сиреневыми усами!',
        cipherPrompt: 'Введи рунный шифр Второй Печати Эликсира, полученной от Магистра Альфиэль, Мастера Сергиуса и Чародея Даниэля:',
        code: 'SEAL_POTION',
        onSuccess: () => {
          if (window.App) {
            window.App.unlockSeal('seal_potion');
            window.App.unlockCharacter('alfiya');
            window.App.unlockCharacter('sergey');
            window.App.unlockCharacter('danya');
          }
          close();
          if (callbacks.onComplete) callbacks.onComplete();
        }
      });
    }

    renderStage1();
  }

  // ---------------------------------------------------------------------------
  // 14. ОПЛОТ ГРАНИТА (Горгулья + ГИФ Тоника + Квест Стража Виталиуса, Жрицы Оксаниэль и Провидицы Софиэль)
  // ---------------------------------------------------------------------------
  function renderGraniteStronghold(loc, callbacks) {
    const tiles = [
      { label: 'Плита СЗ', rot: 90 },
      { label: 'Плита СВ', rot: 180 },
      { label: 'Плита ЮЗ', rot: 270 },
      { label: 'Плита ЮВ', rot: 90 }
    ];

    function renderStage1() {
      bodyEl.innerHTML = `
        <div class="mgDescription">
          <strong>🗿 Цифровой НПС №11: Горгулья Каменного Свода — «Замковый Камень Гранита»</strong><br>
          «Кр-р-рах! Поверни четыре гранитные плиты так, чтобы все части сошлись в положении <strong>0°</strong>!»
        </div>
        <div class="mgGrid2x2" id="gargoyleGrid"></div>
      `;

      const grid = bodyEl.querySelector('#gargoyleGrid');

      function updateTiles() {
        grid.innerHTML = '';
        tiles.forEach(t => {
          const btn = document.createElement('button');
          const aligned = t.rot === 0;
          btn.className = 'mgSymbolCard' + (aligned ? ' selected' : '');
          btn.innerHTML = `
            <div class="mgSymIcon" style="transform: rotate(${t.rot}deg); transition: transform 0.2s;">🗿</div>
            <div class="mgSymLabel">${t.label}: ${aligned ? '✔ СВЕДЕНА (0°)' : `Повернута (${t.rot}°)`}</div>
          `;
          btn.addEventListener('click', () => {
            if (window.AudioEngine) window.AudioEngine.playClick();
            t.rot = (t.rot + 90) % 360;
            updateTiles();
            if (tiles.every(tile => tile.rot === 0)) {
              if (window.AudioEngine) window.AudioEngine.playSuccess();
              if (window.App) {
                window.App.addArtifact('granite_armor', '🗿 Гранитная Броня (+2 от пси-урона)');
                window.App.unlockCharacter('gargoyle');
              }
              setTimeout(() => renderStage2(), 400);
            }
          });
          grid.appendChild(btn);
        });
      }

      updateTiles();
    }

    function renderStage2() {
      bodyEl.innerHTML = '';
      renderTonikLiveQuestCard(bodyEl, {
        title: 'Экзамен Великого Архивариуса Ильяриона',
        subtitle: 'Каменный ларчик Горгульи открыт, но на нём сияет звёздная печать Архфея! Великий Архивариус Ильярион лично проверяет, крепка ли память Арии о хрониках Хондора:',
        actorGenitive: 'Великого Архивариуса Ильяриона',
        animClass: 'anim-granite-strain',
        propLeft: '📜',
        propRight: '🗿',
        particles: '💎 📜 👑 🪨',
        caption: '🐀 Тоник затаил дыхание в кристалле Гримуара и благоговейно слушает каверзные вопросы Великого Архивариуса Ильяриона, шевеля усами и подсказывая Арии одними губами!',
        cipherPrompt: 'Ответь на 3 вопроса Архивариуса и введи полученный от него рунный шифр Третьей Печати:',
        code: 'SEAL_RUNE',
        onSuccess: () => {
          if (window.App) {
            window.App.unlockSeal('seal_rune');
            window.App.unlockCharacter('vitalik');
            window.App.unlockCharacter('oksana');
            window.App.unlockCharacter('sofa');
            window.App.unlockCharacter('ilya');
          }
          close();
          if (callbacks.onComplete) callbacks.onComplete();
        }
      });
    }

    renderStage1();
  }

  // ---------------------------------------------------------------------------
  // 15. ШЕПЧУЩАЯ АЛЛЕЯ: ТРОЙНОЙ БОЙ (АРИЯ, ИЛЬЯРИОН, ОРИВИЯ) И ТОРГ ОРИВИИ ЗА КЛЮЧ
  // ---------------------------------------------------------------------------
  function renderHuntersAlley(loc, callbacks) {
    let step = 1;

    function renderStage1() {
      bodyEl.innerHTML = `
        <div class="mgDescription combatAlert">
          <strong>🗡️ РАЗГРОМ ТЕНЕВОГО АУКЦИОНА В ШЕПЧУЩЕЙ АЛЛЕЕ:</strong><br>
          Теневой Аукционист Безликого пытается скрыть Кованый Ключ! Проведите тройную комбо-атаку отряда (Ария ➔ Ильярион ➔ Оривия), чтобы сокрушить тени и выбить реликвию!
        </div>
        <div id="huntersStatus" class="mgCombatStatus">Боевая готовность: Тройной ход отряда (Ария ➔ Ильярион ➔ Оривия)!</div>
        <div class="mgChoicesCol">
          <button id="huntFaerieBtn" class="pixelBtn">✨ Шаг 1 [Ход Арии]: Кастовать «Огонь Фей» (Ослепить Аукциониста)</button>
          <button id="huntShatterBtn" class="pixelBtn secondary" disabled>🔮 Шаг 2 [Ход Ильяриона]: Кастовать «Звёздные Дребезги Архфея»</button>
          <button id="huntOriviaBtn" class="pixelBtn secondary" disabled>⚔️ Шаг 3 [Ход Оривии]: Врубить «Ультиматум Теневого Барона» (50 монет сейчас, 50 потом!)</button>
        </div>
      `;

      const statusEl = bodyEl.querySelector('#huntersStatus');
      const b1 = bodyEl.querySelector('#huntFaerieBtn');
      const b2 = bodyEl.querySelector('#huntShatterBtn');
      const b3 = bodyEl.querySelector('#huntOriviaBtn');

      b1.addEventListener('click', () => {
        if (step !== 1) return;
        step = 2;
        if (window.AudioEngine) {
          window.AudioEngine.playFaerieFire();
          window.AudioEngine.vibrate([120, 60, 180]);
        }
        triggerScreenStrobe('#00e5ff', 6);
        statusEl.innerHTML = '✨ Огонь Фей ослепил тени Аукциониста! Ильярион, сокрушай звёздной магией!';
        b1.disabled = true;
        b1.textContent = '✔ [Ход Арии]: Огонь Фей активирован!';
        b2.disabled = false;
        b2.classList.remove('secondary');
      });

      b2.addEventListener('click', () => {
        if (step !== 2) return;
        step = 3;
        if (window.AudioEngine) {
          window.AudioEngine.playShatter();
          window.AudioEngine.vibrate([350, 100, 350]);
        }
        triggerScreenStrobe('#f5cf47', 5);
        statusEl.innerHTML = '🔮 Великий Архивариус Ильярион сотрясает землю Звёздными Дребезгами! Аукционист роняет шкатулку! Оривия, добивай ультиматумом!';
        b2.disabled = true;
        b2.textContent = '✔ [Ход Ильяриона]: Звёздные Дребезги обрушены!';
        b3.disabled = false;
        b3.classList.remove('secondary');
      });

      b3.addEventListener('click', () => {
        if (step !== 3) return;
        step = 4;
        if (window.AudioEngine) {
          window.AudioEngine.playSuccess();
          window.AudioEngine.vibrate([200, 80, 250]);
        }
        triggerScreenStrobe('#ff6f00', 4);
        statusEl.innerHTML = '⚔️ Оривия: «50 монет сейчас, 50 потом — шкатулка наша!»';
        b3.disabled = true;
        b3.textContent = '✔ [Ход Оривии]: Ультиматум принят!';
        setTimeout(() => renderStage2(), 450);
      });
    }

    function renderStage2() {
      bodyEl.innerHTML = '';
      renderTonikLiveQuestCard(bodyEl, {
        title: 'Торг Теневого Барона Оривии (Леры)',
        subtitle: 'Шкатулка Аукциониста разбита, и Оривия ловко подхватывает Кованый Ключ! Но по воровскому кодексу Теневой Барон требует 3 платы за реликвию:',
        actorGenitive: 'Теневого Барона Оривии',
        animClass: 'anim-hunter-bow',
        propLeft: '🗡️',
        propRight: '🗝️',
        particles: '🗡️ 💰 🐾 🗝️',
        caption: '🐀 Тоник в кристалле Гримуара прижал лапки к щекам и в ужасе считает золотые: неужели Оривия действительно отберёт у нас 50 монет сейчас и 50 потом?!',
        cipherPrompt: 'Выполни 3 платы Теневому Барону (камень-ножницы-бумага, похвала полуорку и объятия) и введи шифр Ключа:',
        code: 'KEY_HUNTER',
        onSuccess: () => {
          if (window.App) {
            window.App.unlockSeal('key_hunter');
            window.App.unlockCharacter('auctioneer');
            window.App.unlockCharacter('orivia');
            window.App.unlockCharacter('yana');
            window.App.unlockCharacter('yana_bf');
          }
          close();
          if (callbacks.onComplete) callbacks.onComplete();
        }
      });
    }

    renderStage1();
  }

  // ---------------------------------------------------------------------------
  // 16. АЛТАРЬ ВОЗРОЖДЕНИЯ ХОНДОРА И КОРОЛЕВА ЛЕСА (Финал Акта III)
  // ---------------------------------------------------------------------------
  function renderFinalAltar(loc, callbacks) {
    bodyEl.innerHTML = `
      <div class="mgDescription combatAlert">
        <strong>🎭 ВРАТА ВЕЧНОСТИ — ДВА ВОССОЕДИНЁННЫХ ДУХА БЕЗЛИКИХ (ЧЕЛОВЕК И ЭЛЬФ):</strong><br>
        Перед вашим трио (<strong>Ария, Великий Архивариус Ильярион и Оривия</strong>) парят воссоединенные в посмертии души Человека и Эльфа, чья трагическая любовь и 11 нарушенных обещаний когда-то породили проклятие Хондора.<br>
        Все 4 реликвии собраны: <strong>🌳 Древо • 🧪 Эликсир • 🗿 Гранит • 🗝 Ключ</strong>!
      </div>
      <div id="finalCipherMount"></div>
      <div id="banishRitualBox" class="hidden">
        <div class="mgRelicsCircle">
          <span>🌳</span><span>🧪</span><span>🗿</span><span>🗝</span>
        </div>
        <div class="mgFeedback">🔮 Великий Архивариус Ильярион и ⚔️ Оривия удерживают контур Врат, а 🎭 Мелари и 🌿 Линар смыкают защитный купол! Ария, проведи Ритуал Возрождения Хондора — подари покой душам Человека и Эльфа и открой свободный Хондор для всех нелюдей!</div>
        <button id="banishBossBtn" class="pixelBtn danger mgBanishBtn">👑 ВОЗРОДИТЬ СВОБОДНЫЙ ХОНДОР И СТАТЬ КОРОЛЕВОЙ ЛЕСА 👑</button>
      </div>
    `;

    const cipherMount = bodyEl.querySelector('#finalCipherMount');
    const ritualBox = bodyEl.querySelector('#banishRitualBox');
    const banishBtn = bodyEl.querySelector('#banishBossBtn');

    renderCipherSection(cipherMount, {
      prompt: 'Введи финальный рунный шифр на Вратах Алтаря:',
      code: 'FINAL_BANISH',
      onSuccess: () => {
        cipherMount.classList.add('hidden');
        ritualBox.classList.remove('hidden');
      }
    });

    banishBtn.addEventListener('click', () => {
      if (window.AudioEngine) {
        window.AudioEngine.playBanish();
        window.AudioEngine.vibrate([300, 100, 300, 100, 600]);
      }
      triggerScreenStrobe('#ffd700', 8);
      if (window.App) {
        window.App.unlockCharacter('faceless');
      }
      setTimeout(() => {
        close();
        if (callbacks.onComplete) callbacks.onComplete();
      }, 650);
    });
  }

  return {
    open,
    close,
    normalizeCipher
  };
})();

if (typeof window !== 'undefined') {
  window.Minigames = Minigames;
}
