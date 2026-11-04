// ===== Гримуар Арии: Главный контроллер полной постановки «Хроники Хондора» (Акты I–III, 29 героев, Казна, Смена Дня/Ночи и Летопись с Диалогами) =====

const App = (() => {
  const STORAGE_KEY = 'grimoire_aria_save_v4';
  const DEFAULT_ANSWER_RADIUS = 80;

  const state = {
    currentId: 1,
    completedIds: [],
    gold: 0,
    goldHistory: [],
    hp: 18,
    maxHp: 18,
    unlockedChars: ['aria', 'ilya'],
    unlockedSeals: [],
    artifacts: [],
    dialogHistory: [], // Записанные реплики по главам
    themeMode: 'day', // 'day' | 'night'
    strictGps: true, // По умолчанию ВКЛ (строгий GPS режим), переключается в Летописи
    selectedCity: 'all', // 'all' | 'ast' | 'train' | 'kar'
    playerCoords: null,
    hasUnreadJournal: false,
    hasUnreadChars: false,
    pendingDayBreakLocId: null
  };

  let map = null;
  let playerMarker = null;
  let locMarkersMap = new Map();
  let routePolyline = null;
  let tileLayer = null;
  let lastAccuracy = null;

  function init() {
    loadSavedState();
    applyTheme(state.themeMode, false);
    setupUIEventListeners();
    setupNetworkListeners();
    AudioEngine.init();
    updateStartScreenButtons();
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('grimoire_aria_save_v3');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          state.currentId = saved.currentId || 1;
          state.completedIds = Array.isArray(saved.completedIds) ? saved.completedIds : [];
          state.gold = typeof saved.gold === 'number' ? saved.gold : 0;
          state.goldHistory = Array.isArray(saved.goldHistory) ? saved.goldHistory : [];
          state.hp = typeof saved.hp === 'number' ? saved.hp : 18;
          state.maxHp = typeof saved.maxHp === 'number' ? saved.maxHp : 18;
          state.unlockedChars = Array.isArray(saved.unlockedChars) ? saved.unlockedChars : ['aria', 'ilya'];
          state.unlockedSeals = Array.isArray(saved.unlockedSeals) ? saved.unlockedSeals : [];
          state.artifacts = Array.isArray(saved.artifacts) ? saved.artifacts : [];
          state.dialogHistory = Array.isArray(saved.dialogHistory) ? saved.dialogHistory : [];
          state.themeMode = saved.themeMode || 'day';
          state.strictGps = saved.strictGps !== undefined ? !!saved.strictGps : true;
          state.selectedCity = saved.selectedCity || 'all';
          state.pendingDayBreakLocId = saved.pendingDayBreakLocId || null;
        }
      }
    } catch (e) {
      console.warn('Ошибка чтения сохранения:', e);
    }
  }

  function saveState() {
    try {
      const payload = {
        currentId: state.currentId,
        completedIds: state.completedIds,
        gold: state.gold,
        goldHistory: state.goldHistory,
        hp: state.hp,
        maxHp: state.maxHp,
        unlockedChars: state.unlockedChars,
        unlockedSeals: state.unlockedSeals,
        artifacts: state.artifacts,
        dialogHistory: state.dialogHistory.slice(-400),
        themeMode: state.themeMode,
        strictGps: state.strictGps,
        selectedCity: state.selectedCity,
        pendingDayBreakLocId: state.pendingDayBreakLocId || null,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Ошибка записи сохранения:', e);
    }
  }

  // Управление сменой темы День / Ночь (автоматически на ночном поезде и вручную кнопкой в HUD)
  function applyTheme(mode, persist = true) {
    const normalized = mode === 'night' ? 'night' : 'day';
    state.themeMode = normalized;
    document.body.classList.toggle('theme-night', normalized === 'night');
    document.body.classList.toggle('theme-day', normalized === 'day');

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.innerHTML = normalized === 'night' ? '🌙 Ночь' : '☀️ День';
      themeBtn.title = normalized === 'night'
        ? 'Сейчас включена Ночная тема (Ночной поезд / Сумерки). Нажми для переключения'
        : 'Сейчас включена Дневная тема. Нажми для переключения';
    }

    if (persist) saveState();
  }

  function syncThemeWithLocation(loc) {
    if (!loc) return;
    if (loc.timeOfDay === 'night') {
      applyTheme('night');
    } else if (loc.timeOfDay === 'day') {
      applyTheme('day');
    }
  }

  function updateStartScreenButtons() {
    const resumeBtn = document.getElementById('resumeBtn');
    const resetStartBtn = document.getElementById('resetStartBtn');
    const startBtn = document.getElementById('startBtn');

    if (state.completedIds.length > 0 || state.gold > 0) {
      resumeBtn.textContent = `⚔ ПРОДОЛЖИТЬ (Глава ${getQuestProgressText()}) ⚔`;
      resumeBtn.classList.remove('hidden');
      resetStartBtn.classList.remove('hidden');
      startBtn.textContent = '⚔ НАЧАТЬ СНАЧАЛА ⚔';
    } else {
      resumeBtn.classList.add('hidden');
      resetStartBtn.classList.add('hidden');
      startBtn.textContent = '⚔ ПРОБУДИТЬ ГРИМУАР ⚔';
    }
  }

  // Публичные методы для мини-игр и диалогов
  function addGold(amount, reason = 'Награда') {
    state.gold += amount;
    state.goldHistory.unshift({
      type: 'plus',
      amount,
      reason,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    });
    saveState();
    updateHUD();
  }

  function spendGold(amount, reason = 'Покупка кофе') {
    state.gold = Math.max(0, state.gold - amount);
    state.goldHistory.unshift({
      type: 'minus',
      amount,
      reason,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    });
    saveState();
    updateHUD();
  }

  const DEFEAT_TASKS = [
    'Сделай глоток чая/воды из рук спутника и громко произнеси: <strong>«Тоник — величайший сырный мафиози всех девяти миров!»</strong>',
    'Подойди к спутнику (или сопартийцу), пожалуйся на укусы Тоника и попроси дать тебе "пять", чтобы вернуть боевой дух!',
    'Торжественно пообещай Тонику: <strong>«Клянусь выделить Мышиной Мафии отдельную сырную лавку в возрождённом Хондоре!»</strong>',
    'Спой вместе со спутниками одну строчку любой праздничной или походной песни для восстановления эфира!'
  ];

  function showDefeatModal() {
    const modal = document.getElementById('defeatModal');
    if (!modal) return;

    if (window.AudioEngine) {
      if (typeof window.AudioEngine.playHeartbeatWarning === 'function') {
        window.AudioEngine.playHeartbeatWarning();
      } else {
        window.AudioEngine.playError();
      }
    }

    const taskEl = document.getElementById('defeatTaskText');
    if (taskEl) {
      const randTask = DEFEAT_TASKS[Math.floor(Math.random() * DEFEAT_TASKS.length)];
      taskEl.innerHTML = randTask;
    }

    const reviveBtn = document.getElementById('defeatReviveBtn');
    if (reviveBtn) {
      const currentGold = state.gold || 0;
      const penalty = Math.min(500, currentGold);
      reviveBtn.innerHTML = `💉 [Фант выполнен]: Заплатить ${penalty} ЗМ и ожить (+6 ❤️ HP) ▶`;
      reviveBtn.onclick = () => {
        if (penalty > 0) {
          spendGold(penalty, 'Экстренная сырная реанимация Тоника');
        }
        state.hp = 6;
        saveState();
        updateHUD();
        modal.classList.add('hidden');
        if (window.AudioEngine) {
          window.AudioEngine.playSuccess();
        }
      };
    }

    modal.classList.remove('hidden');
  }

  function damageHP(amount = 4) {
    state.hp = Math.max(0, Math.round((state.hp - amount) * 10) / 10);
    const hpEl = document.getElementById('hpBadge');
    if (hpEl) {
      hpEl.classList.add('hpDamaged');
      setTimeout(() => hpEl.classList.remove('hpDamaged'), 1500);
    }
    saveState();
    updateHUD();

    if (state.hp <= 0) {
      setTimeout(() => {
        showDefeatModal();
      }, 300);
    }
  }

  function restoreFullHP() {
    state.hp = state.maxHp;
    const hpEl = document.getElementById('hpBadge');
    if (hpEl) {
      hpEl.classList.remove('hpDamaged');
      hpEl.classList.add('hpHealed');
      setTimeout(() => hpEl.classList.remove('hpHealed'), 1500);
    }
    saveState();
    updateHUD();
  }

  function logDialogLine(entry) {
    if (!entry || !entry.text) return;
    const loc = getCurrentLocation();
    const locId = loc ? loc.id : state.currentId;
    const last = state.dialogHistory[state.dialogHistory.length - 1];
    if (last && last.locId === locId && last.text === entry.text) {
      return;
    }
    state.dialogHistory.push({
      locId,
      speaker: entry.speaker || '🐀 Тоник',
      portrait: entry.portrait || 'img/portraits/tonik.svg',
      text: entry.text,
      channel: entry.channel || 'digital',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    });
    saveState();
  }

  function addArtifact(id, label) {
    if (!state.artifacts.some(a => a.id === id)) {
      state.artifacts.push({ id, label });
      state.hasUnreadJournal = true;
      saveState();
      updateHUD();
    }
  }

  function unlockSeal(sealId) {
    if (!state.unlockedSeals.includes(sealId)) {
      state.unlockedSeals.push(sealId);
      state.hasUnreadJournal = true;
      saveState();
      updateHUD();
    }
  }

  function unlockCharacter(charId, silent = false) {
    if (!charId) return;
    if (!state.unlockedChars.includes(charId)) {
      state.unlockedChars.push(charId);
      if (!silent) {
        state.hasUnreadChars = true;
      }
      saveState();
      updateHUD();
    }
  }

  function setupUIEventListeners() {
    // Стартовый экран
    document.getElementById('startBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      if (state.completedIds.length > 0) {
        if (confirm('Начать квест с первой главы? Текущий прогресс будет сброшен.')) {
          resetProgress();
          startGame();
        }
      } else {
        startGame();
      }
    });

    document.getElementById('resumeBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      startGame();
    });

    document.getElementById('resetStartBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      if (confirm('Сбросить весь сохранённый прогресс?')) {
        resetProgress();
        updateStartScreenButtons();
      }
    });

    // Кнопки верхнего HUD
    document.getElementById('muteBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      AudioEngine.toggleMute();
    });

    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      applyTheme(state.themeMode === 'night' ? 'day' : 'night');
    });

    document.getElementById('treasuryBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      openTreasury();
    });

    document.getElementById('charsBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      openCharactersModal();
    });

    document.getElementById('journalBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      openJournal();
    });

    document.getElementById('cityToggleBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      toggleCityFilter();
    });

    // Нижний трекер цели
    document.getElementById('manualOpenBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      const loc = getCurrentLocation();
      if (!loc) return;
      if (!isAtLocation(loc)) {
        const d = distanceToLoc(loc);
        Dialog.show([
          d === null
            ? 'Тоник: Строгий режим GPS включён, но спутники молчат! Отключи строгий режим в 📖 Летописи или подойди к точке.'
            : `Тоник: До точки ещё ~${Math.round(d)} м! (Чтобы открыть без ожидания спутника, переключи тумблер GPS в 📖 Летописи).`
        ], { name: '🐀 Тоник', portrait: 'img/portraits/tonik.svg' });
        return;
      }
      openLocation(loc, true);
    });

    // Модалка Казны
    document.getElementById('treasuryCloseBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      document.getElementById('treasuryModal').classList.add('hidden');
    });

    document.querySelectorAll('.spendPresetBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseInt(btn.dataset.amount, 10) || 1000;
        const msgEl = document.getElementById('treasuryMsg');
        if (state.gold < amt) {
          AudioEngine.playError();
          msgEl.textContent = `🐀 Тоник: «В казне сейчас ${state.gold} ЗМ, а нужно ${amt} ЗМ! Пройди ещё одну главу, чтобы пополнить бюджет!»`;
          msgEl.classList.remove('hidden');
          return;
        }
        AudioEngine.playCoin();
        spendGold(amt, amt === 1000 ? 'Утренний раф с соленой карамелью' : 'Карамельный латте и круассан');
        renderTreasuryModalContent();
        msgEl.innerHTML = `✨ <strong>Списано ${amt} ЗМ!</strong> Запрос отправлен Великому Архивариусу Ильяриону! Золотой караван уже мчит на твою карту Kaspi!`;
        msgEl.classList.remove('hidden');
      });
    });

    // Модалка Библиотеки Персонажей
    document.getElementById('charsCloseBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      document.getElementById('charactersModal').classList.add('hidden');
    });

    document.getElementById('charDetailCloseBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      document.getElementById('characterDetailModal').classList.add('hidden');
    });

    document.querySelectorAll('.charTab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        AudioEngine.playClick();
        document.querySelectorAll('.charTab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderCharactersGrid(e.currentTarget.dataset.sec);
      });
    });

    // Модалка Летописи и её 3 главные вкладки (Хроника Пути / История Диалогов / Лор Хондора)
    document.getElementById('journalCloseBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      closeJournal();
    });

    document.querySelectorAll('.journalSectionTab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        AudioEngine.playClick();
        const tabKey = e.currentTarget.dataset.jtab;
        switchJournalSectionTab(tabKey);
      });
    });

    const dialogFilterEl = document.getElementById('dialogChapterFilter');
    if (dialogFilterEl) {
      dialogFilterEl.addEventListener('change', (e) => {
        AudioEngine.playClick();
        renderDialogHistoryTab(e.target.value);
      });
    }

    document.getElementById('recenterMapBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      closeJournal();
      recenterMapToTarget();
    });

    document.getElementById('gpsToggleBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      state.strictGps = !state.strictGps;
      saveState();
      updateGpsToggleUI();
      updateDistanceDisplay(distanceToLoc(getCurrentLocation()));
    });

    document.getElementById('resetProgressBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      if (confirm('ВНИМАНИЕ! Это полностью сбросит пройденные главы, печати и вернёт квест в Гл. 1 (Астана). Продолжить?')) {
        resetProgress();
        closeJournal();
        updateHUD();
        renderMarkers();
        recenterMapToTarget();
      }
    });

    document.querySelectorAll('.cityTab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        AudioEngine.playClick();
        document.querySelectorAll('.cityTab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderJournalEntries(e.currentTarget.dataset.city);
      });
    });

    // Офлайн баннер
    document.getElementById('offlineCloseBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      document.getElementById('offlineBanner').classList.add('hidden');
    });

    // Кнопки на экране Коронации (теперь открываются поверх #finale!)
    document.getElementById('finaleJournalBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      openJournal();
    });

    document.getElementById('finaleCharsBtn').addEventListener('click', () => {
      AudioEngine.playClick();
      openCharactersModal();
    });

    window.addEventListener('resize', () => {
      if (map) map.invalidateSize();
    });
  }

  function setupNetworkListeners() {
    window.addEventListener('offline', () => showOfflineOverlay(true));
    window.addEventListener('online', () => showOfflineOverlay(false));
  }

  function showOfflineOverlay(show) {
    const banner = document.getElementById('offlineBanner');
    if (banner) banner.classList.toggle('hidden', !show);
  }

  function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    AudioEngine.playMusic(QUEST.music);

    if (!map) {
      initMap();
    }

    const currentLoc = getCurrentLocation();
    if (state.pendingDayBreakLocId) {
      applyTheme('night');
    } else {
      syncThemeWithLocation(currentLoc);
    }

    startGeolocation();
    updateHUD();
    renderMarkers();
    recenterMapToTarget();

    // Если игрок закрыл страницу в режиме ночного сна / рубежа дней — возвращаем экран сна
    if (state.pendingDayBreakLocId) {
      const breakLoc = QUEST.locations.find(l => l.id === state.pendingDayBreakLocId);
      if (breakLoc && breakLoc.dayBreakAfter) {
        showDayBreakModal(breakLoc);
        return;
      }
    }

    // Авто-запуск первой главы при первом старте
    if (currentLoc && state.completedIds.length === 0 && !currentLoc._introTriggered) {
      currentLoc._introTriggered = true;
      setTimeout(() => openLocation(currentLoc, true), 500);
    }
  }

  function initMap() {
    if (typeof L === 'undefined') return;
    const targetLoc = getCurrentLocation() || QUEST.locations[0];
    const initialCoords = targetLoc ? targetLoc.coords : QUEST_COORDS.AST_HOME_ARIA;

    map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 5
    }).setView(initialCoords, 15);

    tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 300);
  }

  function startGeolocation() {
    if (!('geolocation' in navigator)) {
      updateDistanceDisplay(null);
      return;
    }

    navigator.geolocation.watchPosition(
      (pos) => onPositionUpdate(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => updateDistanceDisplay(null),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }

  function onPositionUpdate(lat, lng, accuracy) {
    state.playerCoords = [lat, lng];
    lastAccuracy = accuracy || null;

    if (map && typeof L !== 'undefined') {
      if (!playerMarker) {
        const playerIcon = L.divIcon({
          className: '',
          html: '<div class="player-marker" title="Ты здесь"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        playerMarker = L.marker([lat, lng], { icon: playerIcon, zIndexOffset: 1000 }).addTo(map);
      } else {
        playerMarker.setLatLng([lat, lng]);
      }
    }

    const currentLoc = getCurrentLocation();
    if (!currentLoc) return;

    // Для 9 этапа в поезде полностью отключаем проверку и отслеживание по GPS
    if (currentLoc.noGps || currentLoc.id === 9) {
      updateDistanceDisplay(null);
      return;
    }

    const dist = calculateDistance(lat, lng, currentLoc.coords[0], currentLoc.coords[1]);
    updateDistanceDisplay(dist);

    const triggerRadius = currentLoc.radius || 80;
    if (dist <= triggerRadius && !currentLoc._autoOpened && !state.completedIds.includes(currentLoc.id)) {
      currentLoc._autoOpened = true;
      openLocation(currentLoc, true);
    }
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function updateDistanceDisplay(dist) {
    const el = document.getElementById('targetDist');
    if (!el) return;

    const currentLoc = getCurrentLocation();
    if (currentLoc && (currentLoc.noGps || currentLoc.id === 9)) {
      el.textContent = '🚂 В пути в поезде (GPS и интернет не нужны) • Жми «⚡ Я на месте»';
      el.style.color = '#f5cf47';
      return;
    }

    if (!state.strictGps) {
      if (dist !== null && dist !== undefined) {
        const rounded = Math.round(dist);
        el.textContent = `📍 ~${rounded} м • Тест-режим: жми «⚡ Я на месте»`;
      } else {
        el.textContent = '📍 Свободный режим • Жми «⚡ Я на месте» или на маркер';
      }
      el.style.color = '#f5cf47';
      return;
    }

    if (dist === null || dist === undefined) {
      el.textContent = '📍 Поиск спутников GPS...';
      el.style.color = '';
      return;
    }
    const rounded = Math.round(dist);
    if (rounded <= 85) {
      el.textContent = `📍 ~${rounded} м — ТЫ В ЗОНЕ ЦЕЛИ! ✨`;
      el.style.color = '#f5cf47';
    } else {
      el.textContent = `📍 Расстояние по GPS: ~${rounded} м`;
      el.style.color = '';
    }
  }

  function getCurrentLocation() {
    return QUEST.locations.find(l => l.id === state.currentId) || QUEST.locations[0];
  }

  function distanceToLoc(loc) {
    if (!loc || loc.noGps || loc.id === 9 || !state.playerCoords) return null;
    return calculateDistance(
      state.playerCoords[0], state.playerCoords[1],
      loc.coords[0], loc.coords[1]
    );
  }

  function isAtLocation(loc) {
    if (loc && (loc.noGps || loc.id === 9)) return true;
    if (!state.strictGps) return true;
    const d = distanceToLoc(loc);
    if (d === null) return false;
    const answerRadius = loc.radius || DEFAULT_ANSWER_RADIUS;
    const tol = Math.min(lastAccuracy || 0, 60);
    return d <= Math.max(answerRadius, tol);
  }

  function renderMarkers() {
    if (!map) return;

    locMarkersMap.forEach(m => map.removeLayer(m));
    locMarkersMap.clear();
    if (routePolyline) {
      map.removeLayer(routePolyline);
      routePolyline = null;
    }

    const visibleCoords = [];

    QUEST.locations.forEach((loc) => {
      if (state.selectedCity !== 'all' && loc.city !== state.selectedCity) {
        return;
      }

      const isCompleted = state.completedIds.includes(loc.id);
      const isCurrent = loc.id === state.currentId;

      visibleCoords.push(loc.coords);

      const el = document.createElement('div');
      el.className = 'location-marker';
      if (isCompleted) {
        el.className += ' done';
        el.textContent = '✔';
      } else if (isCurrent) {
        el.className += ' next';
        el.textContent = loc.type === 'final' ? '👑' : '⚔';
      } else {
        el.textContent = `${loc.id}`;
      }

      let markerCoords = [...loc.coords];
      if (loc.id === 2 || loc.id === 12) {
        markerCoords = [loc.coords[0] + 0.00022, loc.coords[1] + 0.00028];
      }

      const icon = L.divIcon({
        html: el,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker(markerCoords, { icon, zIndexOffset: isCurrent ? 800 : 100 }).addTo(map);
      marker.bindTooltip(`<strong>${loc.name}</strong><br>${isCompleted ? '✔ Пройдено' : (isCurrent ? '🔥 Текущая цель' : `Акт ${loc.act}`)}`, {
        permanent: false,
        direction: 'top'
      });

      marker.on('click', () => onMarkerClick(loc));
      locMarkersMap.set(loc.id, marker);
    });

    if (visibleCoords.length > 1) {
      routePolyline = L.polyline(visibleCoords, {
        color: '#d4af37',
        weight: 3,
        opacity: 0.55,
        dashArray: '8, 8'
      }).addTo(map);
    }
  }

  function onMarkerClick(loc) {
    if (loc.id === state.currentId) {
      if (!isAtLocation(loc)) {
        const d = distanceToLoc(loc);
        Dialog.show([
          d === null
            ? 'Тоник: Спутники GPS ещё ищут сигнал! (Или отключи строгий режим в 📖 Летописи).'
            : `Тоник: До точки ещё ~${Math.round(d)} м! Подойди ближе или переключи режим GPS в 📖 Летописи.`
        ], { name: '🐀 Тоник', portrait: 'img/portraits/tonik.svg' });
        return;
      }
      openLocation(loc, true);
    } else if (state.completedIds.includes(loc.id)) {
      if (confirm(`Глава «${loc.name}» уже пройдена! Хочешь переиграть эту сцену?`)) {
        openLocation(loc, true);
      }
    } else {
      if (!state.strictGps) {
        if (confirm(`Глава «${loc.name}» идёт дальше по сюжету (сейчас активна Глава ${state.currentId}). Перейти сразу к ней для теста?`)) {
          // Если перескакиваем после Главы 6 (дороги/Ворона), но до Главы 12 (завтрака у родителей) — учитываем ранение с дороги (14/18 HP)
          if (loc.id > 6 && loc.id < 12 && state.hp === state.maxHp) {
            state.hp = 14;
          } else if (loc.id > 12) {
            state.hp = state.maxHp;
          }
          state.currentId = loc.id;
          syncThemeWithLocation(loc);
          saveState();
          updateHUD();
          renderMarkers();
          openLocation(loc, true);
        }
      } else {
        Dialog.show([
          `Тоник: Погоди, Ария! До «${loc.name}» ещё не дошёл черёд. Сначала разберись с текущей главой!`
        ], { name: '🐀 Тоник', portrait: 'img/portraits/tonik.svg' });
      }
    }
  }

  function recenterMapToTarget() {
    if (!map) return;
    const currentLoc = getCurrentLocation();
    if (currentLoc) {
      const zoom = currentLoc.id === 9 ? 9 : 15;
      map.flyTo(currentLoc.coords, zoom, { duration: 1.2 });
    }
  }

  // Полный цикл открытия главы
  function openLocation(loc, force = false) {
    if (!force && !isAtLocation(loc)) {
      return;
    }

    syncThemeWithLocation(loc);

    const startMinigameStep = () => {
      Minigames.open(loc, {
        onComplete: () => {
          afterMinigameSuccess(loc);
        }
      });
    };

    const startLiveIntroStep = () => {
      if (Array.isArray(loc.liveIntro) && loc.liveIntro.length > 0) {
        Dialog.show(loc.liveIntro, {
          name: loc.npcName || '🎭 Живая Сцена',
          portrait: loc.npcPortrait || 'img/portraits/aria.svg',
          phaseLabel: loc.livePhaseLabel || '🎭 ЖИВАЯ СЦЕНА В РЕАЛЬНОСТИ • ДЕЙСТВИЕ НА МЕСТЕ',
          onDone: startMinigameStep
        });
      } else {
        startMinigameStep();
      }
    };

    const startTransitionGateStep = () => {
      if (loc.transitionGate) {
        Dialog.showTransitionGate(loc.transitionGate, startLiveIntroStep);
      } else {
        startLiveIntroStep();
      }
    };

    const tonikLines = loc.tonikIntro || loc.intro || ['Тоник: Мы на месте!'];
    Dialog.show(tonikLines, {
      name: '🐀 Тоник (Воскресший Фамильяр)',
      portrait: 'img/portraits/tonik.svg',
      phaseLabel: loc.tonikPhaseLabel || '📱 ЭФИР ГРИМУАРА • СВЯЗЬ С ТОНИКОМ',
      forceMode: 'digital',
      onDone: startTransitionGateStep
    });
  }

  function afterMinigameSuccess(loc) {
    // Гарантируем, что изменение HP по главе (например, -4 HP после дороги в Гл. 6 или +4 HP в Гл. 12) применилось ровно 1 раз
    if (typeof loc.hpDelta === 'number') {
      if (loc.hpDelta < 0 && !loc._hpDeltaApplied) {
        loc._hpDeltaApplied = true;
        damageHP(Math.abs(loc.hpDelta));
      } else if (loc.hpDelta > 0) {
        restoreFullHP();
      }
    }

    const startTonikOutroStep = () => {
      const tonikOutroLines = loc.tonikOutro || loc.reward || ['Тоник: Блестяще сработано, моя Королева Леса! Двигаемся дальше!'];
      Dialog.show(tonikOutroLines, {
        name: '🐀 Тоник (Воскресший Фамильяр)',
        portrait: 'img/portraits/tonik.svg',
        phaseLabel: '📱 ЭФИР ГРИМУАРА • ИТОГ И СЛЕДУЮЩАЯ ЦЕЛЬ',
        forceMode: 'digital',
        onDone: () => {
          completeLocation(loc);
        }
      });
    };

    const startLiveOutroStep = () => {
      if (Array.isArray(loc.liveOutro) && loc.liveOutro.length > 0) {
        Dialog.show(loc.liveOutro, {
          name: loc.npcName || '🎭 Живая Сцена',
          portrait: loc.npcPortrait || 'img/portraits/aria.svg',
          phaseLabel: loc.livePhaseLabel || '🎭 ЖИВАЯ СЦЕНА В РЕАЛЬНОСТИ • ПРОЩАНИЕ С ГЕРОЯМИ',
          onDone: startTonikOutroStep
        });
      } else {
        startTonikOutroStep();
      }
    };

    if (loc.branchingAfterMinigame) {
      Dialog.showBranching(loc.branchingAfterMinigame, startLiveOutroStep);
    } else {
      startLiveOutroStep();
    }
  }

  function completeLocation(loc) {
    if (!state.completedIds.includes(loc.id)) {
      state.completedIds.push(loc.id);
    }
    state.hasUnreadJournal = true;

    if (loc.type === 'final') {
      // В финале разблокируем всех 29 героев для полной коллекции!
      QUEST.characters.forEach(ch => unlockCharacter(ch.id, true));
      showFinaleScreen(loc);
      saveState();
      updateHUD();
      renderMarkers();
      return;
    }

    const currentIndex = QUEST.locations.findIndex(l => l.id === loc.id);
    const nextLoc = QUEST.locations[currentIndex + 1];

    if (nextLoc) {
      state.currentId = nextLoc.id;
      if (state.selectedCity !== 'all' && nextLoc.city !== state.selectedCity) {
        state.selectedCity = 'all';
      }
      // Если глава завершает день / акт и требует ночного сна или рубежа (Главы 7 и 11)
      if (loc.dayBreakAfter) {
        state.pendingDayBreakLocId = loc.id;
        applyTheme('night');
        saveState();
        updateHUD();
        renderMarkers();
        recenterMapToTarget();
        showDayBreakModal(loc);
        return;
      }
      syncThemeWithLocation(nextLoc);
    }

    saveState();
    updateHUD();
    renderMarkers();
    recenterMapToTarget();
  }

  // Полноэкранное окно разделения дней / режима ночного сна до утра
  function showDayBreakModal(loc) {
    if (!loc || !loc.dayBreakAfter) return;
    const cfg = loc.dayBreakAfter;
    const modal = document.getElementById('dayBreakModal');
    const badgeEl = document.getElementById('dayBreakBadge');
    const titleEl = document.getElementById('dayBreakTitle');
    const zzzEl = document.getElementById('dayBreakZzz');
    const quoteEl = document.getElementById('dayBreakQuote');
    const bodyEl = document.getElementById('dayBreakBody');
    const wakeBtn = document.getElementById('dayBreakWakeBtn');

    if (!modal || !wakeBtn) return;

    badgeEl.textContent = cfg.badge || '🌙 РУБЕЖ ДНЕЙ • НОЧНОЙ ОТБОЙ ДО УТРА';
    titleEl.textContent = cfg.title || 'ПЕРВЫЙ ДЕНЬ ЗАВЕРШЁН — ВРЕМЯ СПАТЬ!';
    zzzEl.textContent = cfg.zzz || '💤 🌙 ⭐ 🧀';
    quoteEl.textContent = cfg.quote || '🐀 Тоник спит до самого утра...';
    bodyEl.innerHTML = cfg.body || '';
    wakeBtn.textContent = cfg.buttonText || '☀️ ДОБРОЕ УТРО! ПРОСНУТЬСЯ И НАЧАТЬ ДЕНЬ 2 ▶';

    modal.classList.remove('hidden');

    wakeBtn.onclick = () => {
      AudioEngine.playSuccess();
      modal.classList.add('hidden');
      state.pendingDayBreakLocId = null;

      const nextLoc = getCurrentLocation();
      syncThemeWithLocation(nextLoc);
      saveState();
      updateHUD();
      renderMarkers();
      recenterMapToTarget();

      if (cfg.id === 'night_sleep_day1') {
        Dialog.show([
          'Тоник: *сладко потягивается и протирает лапками глазки* ДОБРОЕ УТРО, МОЯ БУДУЩАЯ КОРОЛЕВА ЛЕСА! С наступлением Второго Дня!',
          'Тоник: Ох, как же хорошо мы выспались в доме твоих родителей! Посмотри — за окном уже солнечное утро Караганды, а с кухни тянет божественным ароматом горячих оладий Леди-Матушки и жареного мяса Лорда-Отца!',
          'Тоник: Когда умоешься и будешь готова выйти к утреннему семейному пиру — жми «⚡ Я на месте», нас уже встречает Домовой Кузьмиус!'
        ], {
          name: '🐀 Тоник (Утреннее пробуждение • День 2)',
          portrait: 'img/portraits/tonik.svg',
          phaseLabel: '☀️ НАЧАЛО ВТОРОГО ДНЯ • УТРО В РОДОВОМ ОПЛОТЕ',
          forceMode: 'digital'
        });
      }
    };
  }

  // Показ финального экрана Коронации Королевы Леса
  function showFinaleScreen(loc) {
    AudioEngine.playMusic(QUEST.finaleMusic, true);
    AudioEngine.setFinaleMode(true);

    const finaleEl = document.getElementById('finale');
    const textEl = document.getElementById('finaleText');
    const toastsList = document.getElementById('coronationToastsList');

    textEl.textContent = loc.finalText || 'С ДНЁМ РОЖДЕНИЯ, КОРОЛЕВА ЛЕСА АРИЯ!';

    if (toastsList && Array.isArray(QUEST.coronationToasts)) {
      toastsList.innerHTML = '';
      QUEST.coronationToasts.forEach(t => {
        const card = document.createElement('div');
        card.className = 'toastCard';
        card.innerHTML = `
          <img src="${t.portrait}" alt="${t.speaker}" class="toastPortrait">
          <div class="toastContent">
            <div class="toastSpeaker">${t.speaker}</div>
            <div class="toastText">${t.text}</div>
          </div>
        `;
        toastsList.appendChild(card);
      });
    }

    spawnGoldenConfetti();
    finaleEl.classList.remove('hidden');
  }

  function spawnGoldenConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#ffd700', '#f5cf47', '#ff6f00', '#00e5ff', '#e040fb', '#ffffff'];
    for (let i = 0; i < 45; i++) {
      const piece = document.createElement('div');
      piece.className = 'confettiPiece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 3}s`;
      piece.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
      container.appendChild(piece);
    }
  }

  function updateHUD() {
    const currentLoc = getCurrentLocation();

    document.getElementById('questTitle').textContent = QUEST.title;
    const hpEl = document.getElementById('hpBadge');
    hpEl.textContent = `❤️ ${state.hp}/${state.maxHp}`;
    hpEl.classList.toggle('hpLow', state.hp < state.maxHp);

    document.getElementById('goldCount').textContent = state.gold;
    document.getElementById('charsCount').textContent = `${state.unlockedChars.length}/${QUEST.characters.length}`;

    if (currentLoc) {
      const actNames = {
        1: 'Акт I: Сейчас мы в Астане',
        2: 'Акт II: Ночной Поезд в Караганду',
        3: 'Акт III: Караганда'
      };
      const timeIcon = currentLoc.timeOfDay === 'night' ? '🌙 Ночь' : '☀️ День';
      document.getElementById('cityIndicator').textContent = `${actNames[currentLoc.act] || 'Акт I'} • ${timeIcon} • ${getQuestProgressText()}`;
      document.getElementById('targetActLabel').textContent = `${actNames[currentLoc.act]} (${timeIcon}) • Глава ${getQuestProgressText()}:`;
      document.getElementById('targetName').textContent = currentLoc.name;
    }

    document.getElementById('journalBadge').classList.toggle('hidden', !state.hasUnreadJournal);
    document.getElementById('charsBadge').classList.toggle('hidden', !state.hasUnreadChars);

    updateDistanceDisplay(distanceToLoc(currentLoc));
  }

  function getQuestProgressText() {
    const total = QUEST.locations.length;
    const currentIdx = QUEST.locations.findIndex(l => l.id === state.currentId);
    const pos = currentIdx >= 0 ? currentIdx + 1 : 1;
    return `${pos} / ${total}`;
  }

  function toggleCityFilter() {
    const order = ['all', 'ast', 'train', 'kar'];
    const idx = order.indexOf(state.selectedCity);
    state.selectedCity = order[(idx + 1) % order.length];

    const names = {
      all: 'Весь маршрут (Акты I–III)',
      ast: 'Акт I: Астана (Лесное Святилище)',
      train: 'Акт II: Ночной Поезд в Караганду',
      kar: 'Акт III: Караганда (Кланы и Алтарь)'
    };

    Dialog.show([`Тоник: Переключили карту: «${names[state.selectedCity]}».`], {
      name: '🐀 Тоник',
      portrait: 'img/portraits/tonik.svg'
    });

    saveState();
    renderMarkers();

    if (state.selectedCity !== 'all' && QUEST.cities[state.selectedCity] && map) {
      const c = QUEST.cities[state.selectedCity];
      map.flyTo(c.center, c.zoom, { duration: 1.2 });
    } else {
      recenterMapToTarget();
    }
  }

  // ===========================================================================
  // КАЗНА ГЕРОИНИ ЛЕСА
  // ===========================================================================
  function openTreasury() {
    renderTreasuryModalContent();
    document.getElementById('treasuryMsg').classList.add('hidden');
    document.getElementById('treasuryModal').classList.remove('hidden');
  }

  function renderTreasuryModalContent() {
    document.getElementById('treasuryModalGold').textContent = state.gold;
    const listEl = document.getElementById('treasuryHistoryList');
    listEl.innerHTML = '';

    if (state.goldHistory.length === 0) {
      listEl.innerHTML = '<div class="journalEmpty">В казне пока нет записей. Разгадай Рунический Диск в Главе 1, чтобы получить первые 1000 ЗМ!</div>';
      return;
    }

    state.goldHistory.forEach(item => {
      const row = document.createElement('div');
      row.className = 'journalEntry';
      const sign = item.type === 'plus' ? '+' : '−';
      const color = item.type === 'plus' ? '#2ecc71' : '#f5cf47';
      row.innerHTML = `
        <div class="journalEntryTitle">
          <span>${item.reason}</span>
          <span style="color:${color}; font-weight:bold;">${sign}${item.amount} ЗМ</span>
        </div>
        <div style="font-size:16px; color:var(--text-muted);">Время записи: ${item.time}</div>
      `;
      listEl.appendChild(row);
    });
  }

  // ===========================================================================
  // БИБЛИОТЕКА ИЗ 29 ПЕРСОНАЖЕЙ ХОНДОРА
  // ===========================================================================
  function openCharactersModal() {
    state.hasUnreadChars = false;
    updateHUD();
    document.getElementById('charsModalCounter').textContent = `${state.unlockedChars.length}/${QUEST.characters.length}`;
    renderCharactersGrid('all');
    document.getElementById('charactersModal').classList.remove('hidden');
  }

  function renderCharactersGrid(secFilter = 'all') {
    const grid = document.getElementById('charactersGrid');
    grid.innerHTML = '';

    const filtered = QUEST.characters.filter(c => {
      if (!secFilter || secFilter === 'all') return true;
      return String(c.section) === String(secFilter);
    });

    filtered.forEach(ch => {
      const isUnlocked = state.unlockedChars.includes(ch.id) || ch.unlockedByDefault;
      const card = document.createElement('div');
      card.className = 'charGridCard' + (isUnlocked ? ' unlocked' : ' locked');
      card.innerHTML = `
        <div class="charGridPortraitWrap">
          <img src="${ch.portrait}" alt="${ch.name}" class="charGridImg">
          ${!isUnlocked ? '<div class="charLockBadge">🔒</div>' : ''}
        </div>
        <div class="charGridName">${isUnlocked ? ch.name : '??? (Запечатано)'}</div>
        <div class="charGridRole">${isUnlocked ? ch.role : ch.unlockCondition}</div>
      `;
      card.addEventListener('click', () => {
        AudioEngine.playClick();
        openCharacterDetail(ch, isUnlocked);
      });
      grid.appendChild(card);
    });
  }

  function openCharacterDetail(ch, isUnlocked) {
    const modal = document.getElementById('characterDetailModal');
    const nameEl = document.getElementById('charDetailName');
    const bodyEl = document.getElementById('charDetailBody');

    nameEl.textContent = isUnlocked ? ch.name : '🔒 Тайный Персонаж';

    if (!isUnlocked && state.strictGps) {
      bodyEl.innerHTML = `
        <div class="journalEntry">
          <div class="journalEntryTitle">🔒 Досье пока запечатано</div>
          <div class="journalEntryText"><strong>Условие открытия:</strong><br>${ch.unlockCondition}</div>
        </div>
      `;
    } else {
      bodyEl.innerHTML = `
        <div class="charDetailHeaderRow">
          <img src="${ch.portrait}" alt="${ch.name}" class="charDetailPortrait">
          <div class="charDetailMeta">
            <div class="charDetailRole">${ch.role}</div>
            <div class="charDetailStats">📊 ${ch.stats}</div>
            <div class="charDetailUnlock">🔓 ${ch.unlockCondition}</div>
          </div>
        </div>
        <div class="tonikQuote" style="margin: 10px 0; font-size: 20px;">${ch.quote}</div>
        <div class="journalEntry" style="margin-bottom: 10px;">
          <div class="journalEntryTitle">📜 Биография и предыстория:</div>
          <div class="journalEntryText">${ch.bio}</div>
        </div>
        <div class="journalEntry">
          <div class="journalEntryTitle">📱 Запись в Гримуаре Арии:</div>
          <div class="journalEntryText">${ch.grimoireNote}</div>
        </div>
      `;
    }

    modal.classList.remove('hidden');
  }

  // ===========================================================================
  // ПЕРЕДЕЛАННАЯ ЛЕТОПИСЬ ГРИМУАРА (3 ВКЛАДКИ: ХРОНИКА / ИСТОРИЯ ДИАЛОГОВ / ЛОР ХОНДОРА)
  // ===========================================================================
  function openJournal() {
    state.hasUnreadJournal = false;
    updateHUD();
    renderSealsShelf();
    renderArtifactsShelf();
    renderJournalEntries('all');
    populateDialogChapterFilter();
    renderDialogHistoryTab('all');
    renderLoreArticlesTab();
    updateGpsToggleUI();
    document.getElementById('journalModal').classList.remove('hidden');
  }

  function closeJournal() {
    document.getElementById('journalModal').classList.add('hidden');
  }

  function switchJournalSectionTab(tabKey) {
    document.querySelectorAll('.journalSectionTab').forEach(btn => {
      const isAct = btn.dataset.jtab === tabKey;
      btn.classList.toggle('active', isAct);
      btn.classList.toggle('secondary', !isAct);
    });

    document.getElementById('journalTabChronicle').classList.toggle('hidden', tabKey !== 'chronicle');
    document.getElementById('journalTabDialogs').classList.toggle('hidden', tabKey !== 'dialogs');
    document.getElementById('journalTabLore').classList.toggle('hidden', tabKey !== 'lore');
  }

  function populateDialogChapterFilter() {
    const selectEl = document.getElementById('dialogChapterFilter');
    if (!selectEl) return;
    const prevVal = selectEl.value || 'all';
    selectEl.innerHTML = '<option value="all">Все открытые главы (Полная история)</option>';

    QUEST.locations.forEach(loc => {
      const isUnlocked = state.completedIds.includes(loc.id) || loc.id <= state.currentId;
      if (isUnlocked) {
        const opt = document.createElement('option');
        opt.value = String(loc.id);
        opt.textContent = `${loc.name}`;
        selectEl.appendChild(opt);
      }
    });

    if ([...selectEl.options].some(o => o.value === prevVal)) {
      selectEl.value = prevVal;
    }
  }

  // Вкладка 2: Полная читаемая История Диалогов по главам (как с Тоником, так и живые сцены и ветки)
  function renderDialogHistoryTab(chapterFilter = 'all') {
    const container = document.getElementById('dialogHistoryList');
    if (!container) return;
    container.innerHTML = '';

    const accessibleLocs = QUEST.locations.filter(loc => {
      const unlocked = state.completedIds.includes(loc.id) || loc.id <= state.currentId;
      if (!unlocked) return false;
      if (chapterFilter && chapterFilter !== 'all') {
        return String(loc.id) === String(chapterFilter);
      }
      return true;
    });

    if (accessibleLocs.length === 0) {
      container.innerHTML = '<div class="journalEmpty">Диалоги появятся после начала первой главы!</div>';
      return;
    }

    accessibleLocs.forEach(loc => {
      const card = document.createElement('div');
      card.className = 'journalEntry dialogChapterBlock';

      const blocksHtml = [];

      const renderLinesGroup = (title, badgeClass, lines) => {
        if (!Array.isArray(lines) || lines.length === 0) return '';
        const items = lines.map(line => `<div class="dialogTranscriptLine">${line}</div>`).join('');
        return `
          <div class="dialogTranscriptSection ${badgeClass}">
            <div class="dialogTranscriptBadge">${title}</div>
            ${items}
          </div>
        `;
      };

      blocksHtml.push(renderLinesGroup(
        loc.tonikPhaseLabel || '📱 ЭФИР ГРИМУАРА • ДИАЛОГ С ТОНИКОМ',
        'transcript-digital',
        loc.tonikIntro || loc.intro
      ));

      blocksHtml.push(renderLinesGroup(
        loc.livePhaseLabel || '🎭 ЖИВАЯ СЦЕНА В РЕАЛЬНОСТИ',
        'transcript-live',
        loc.liveIntro
      ));

      if (loc.branchingAfterMinigame && Array.isArray(loc.branchingAfterMinigame.options)) {
        const branchLines = [];
        loc.branchingAfterMinigame.options.forEach(opt => {
          branchLines.push(`<strong>💬 Вопрос: «${opt.label}»</strong>`);
          if (Array.isArray(opt.response)) {
            opt.response.forEach(r => branchLines.push(r));
          }
        });
        blocksHtml.push(renderLinesGroup(
          '🌿 ИНТЕРАКТИВНЫЕ ТЕМЫ РАЗГОВОРА',
          'transcript-branch',
          branchLines
        ));
      }

      blocksHtml.push(renderLinesGroup(
        '🎭 ПРОЩАНИЕ НА ЛОКАЦИИ',
        'transcript-live',
        loc.liveOutro
      ));

      blocksHtml.push(renderLinesGroup(
        '📱 ЭФИР ГРИМУАРА • ИТОГ ГЛАВЫ ОТ ТОНИКА',
        'transcript-digital',
        loc.tonikOutro || loc.reward
      ));

      const statusText = state.completedIds.includes(loc.id) ? '✔ Пройдено' : '🔥 Текущая глава';
      card.innerHTML = `
        <div class="journalEntryTitle">
          <span>${loc.name}</span>
          <span style="font-size:16px; color:var(--gold-bright);">${statusText}</span>
        </div>
        <div class="dialogTranscriptBody">
          ${blocksHtml.join('')}
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Вкладка 3: Архив Лора Хондора
  function renderLoreArticlesTab() {
    const container = document.getElementById('loreArticlesList');
    if (!container) return;
    container.innerHTML = '';

    const articles = Array.isArray(QUEST.loreArticles) ? QUEST.loreArticles : [];
    articles.forEach(art => {
      const card = document.createElement('div');
      card.className = 'journalEntry';
      const hasGodfather = art.id === 'lore_tonik_mafia';
      card.innerHTML = `
        <div class="journalEntryTitle">
          <span>${art.title}</span>
          <span style="font-size:16px; color:var(--gold-dim);">${art.badge || 'Лор Хондора'}</span>
        </div>
        <div class="journalEntryText">${art.text}</div>
        ${hasGodfather ? '<button class="pixelBtn secondary playMafiaLoreBtn" style="margin-top:8px;">🎻 Сыграть мелодию Мышиной Мафии («Крёстный Отец»)</button>' : ''}
      `;
      if (hasGodfather) {
        const btn = card.querySelector('.playMafiaLoreBtn');
        if (btn) {
          btn.addEventListener('click', () => {
            if (window.AudioEngine && typeof window.AudioEngine.playGodfatherTheme === 'function') {
              window.AudioEngine.playGodfatherTheme();
            }
          });
        }
      }
      container.appendChild(card);
    });
  }

  function updateGpsToggleUI() {
    const textEl = document.getElementById('gpsModeText');
    const btnEl = document.getElementById('gpsToggleBtn');
    if (!textEl || !btnEl) return;

    if (state.strictGps) {
      textEl.textContent = 'ВКЛ (Строгий режим — открытие точек только по реальным координатам GPS)';
      textEl.style.color = '#ff9900';
      btnEl.textContent = 'Переключить на Свободный (тест)';
    } else {
      textEl.textContent = 'ВЫКЛ (Свободный тест — любая точка открывается кнопкой «⚡ Я на месте»)';
      textEl.style.color = '#2ecc71';
      btnEl.textContent = 'Включить строгий GPS';
    }
  }

  function renderSealsShelf() {
    const container = document.getElementById('sealsList');
    container.innerHTML = '';

    QUEST.seals.forEach(seal => {
      const isUnlocked = state.unlockedSeals.includes(seal.id);
      const el = document.createElement('div');
      el.className = 'sealItem' + (isUnlocked ? ' unlocked' : '');
      el.innerHTML = `${seal.icon} ${isUnlocked ? `<strong>${seal.name}</strong>` : `🔒 ${seal.name} (${seal.holder})`}`;
      container.appendChild(el);
    });
  }

  function renderArtifactsShelf() {
    const container = document.getElementById('artifactsList');
    container.innerHTML = '';

    if (state.artifacts.length === 0) {
      container.innerHTML = '<div style="font-size:17px; color:var(--text-muted);">Пока нет собранных артефактов. Проходи испытания духов Гримуара!</div>';
      return;
    }

    state.artifacts.forEach(art => {
      const el = document.createElement('div');
      el.className = 'sealItem unlocked';
      el.textContent = art.label;
      container.appendChild(el);
    });
  }

  function renderJournalEntries(cityFilter) {
    const container = document.getElementById('journalEntriesList');
    container.innerHTML = '';

    const completedLocations = QUEST.locations.filter(l => state.completedIds.includes(l.id));
    const filtered = completedLocations.filter(loc => {
      if (!cityFilter || cityFilter === 'all') return true;
      return loc.city === cityFilter;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="journalEmpty">В хронике пока нет завершенных глав этого акта.<br>Открой вкладку <strong>«💬 История Диалогов»</strong> или <strong>«🏛 Лор Хондора»</strong> выше, либо нажми «⚡ Я на месте» на карте!</div>';
      return;
    }

    filtered.forEach((loc) => {
      const entry = loc.journalEntry || {
        title: loc.name,
        text: 'Глава успешно пройдена.',
        tonikNote: '«Отличная работа!»'
      };

      const actLabel = loc.act === 1 ? 'Акт I: Астана' : (loc.act === 2 ? 'Акт II: Ночной Поезд' : 'Акт III: Караганда');
      const item = document.createElement('div');
      item.className = 'journalEntry';
      item.innerHTML = `
        <div class="journalEntryTitle">
          <span>Глава ${loc.id}. ${entry.title}</span>
          <span style="font-size: 16px; color: var(--gold-dim);">${actLabel}</span>
        </div>
        <div class="journalEntryText">${entry.text}</div>
        <div class="tonikQuote">${entry.tonikNote}</div>
      `;
      container.appendChild(item);
    });
  }

  function resetProgress() {
    state.currentId = 1;
    state.completedIds = [];
    state.gold = 0;
    state.goldHistory = [];
    state.hp = 18;
    state.maxHp = 18;
    state.unlockedChars = ['aria', 'ilya'];
    state.unlockedSeals = [];
    state.artifacts = [];
    state.dialogHistory = [];
    state.themeMode = 'day';
    state.selectedCity = 'all';
    state.hasUnreadJournal = false;
    state.hasUnreadChars = false;
    state.strictGps = true;
    state.pendingDayBreakLocId = null;
    const dbModal = document.getElementById('dayBreakModal');
    if (dbModal) dbModal.classList.add('hidden');
    QUEST.locations.forEach(l => {
      delete l._introTriggered;
      delete l._autoOpened;
      delete l._hpDeltaApplied;
    });
    applyTheme('day');
    saveState();
    AudioEngine.setFinaleMode(false);
    document.getElementById('finale').classList.add('hidden');
  }

  return {
    init,
    startGame,
    getCurrentLocation,
    openLocation,
    addGold,
    spendGold,
    damageHP,
    restoreFullHP,
    logDialogLine,
    addArtifact,
    unlockSeal,
    unlockCharacter,
    applyTheme,
    getState: () => state
  };
})();

window.App = App;
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
