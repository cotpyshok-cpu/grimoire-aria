// Generator for 29 RPG pixel-art portraits for "Хроники Хандера: Гримуар Арии"
const fs = require('fs');
const path = require('path');

const portraitsDir = path.join(__dirname, 'img', 'portraits');
fs.mkdirSync(portraitsDir, { recursive: true });

function parseAsciiArt(art, palette, scale = 4, bgOuter = '#140f07', bgInner = '#1c140a') {
  const lines = art.trim().split('\n').map(l => l.trimEnd());
  const height = lines.length;
  const width = Math.max(...lines.map(l => l.length));
  const rects = [];

  for (let y = 0; y < height; y++) {
    const line = lines[y];
    for (let x = 0; x < width; x++) {
      const ch = line[x] || ' ';
      const color = palette[ch];
      if (color && color !== 'none') {
        rects.push(`<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}" fill="${color}" />`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width * scale} ${height * scale}" width="100%" height="100%" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="${bgInner}" />
  ${rects.join('')}
</svg>`;
}

const PORTRAITS = {
  // 1. Ария (Даша) — Фея-Волшебница Прорицания
  aria: {
    palette: {
      'G': '#ffd700', // золотая корона/диадема
      'Y': '#f5cf47', // золотые волосы
      'y': '#d4af37', // тень волос
      'W': '#9be7ff', // крылья феи светлые
      'w': '#5bc0be', // крылья бирюзовые
      'S': '#ffe0bd', // кожа
      's': '#f1c27d', // тень кожи
      'E': '#6e3b14', // карие глаза
      'K': '#1a110b', // ресницы
      'P': '#6a1b9a', // мантия прорицательницы
      'p': '#8e24aa',
      'C': '#00ffff', // звезда прорицания
    },
    art: `
        G   CC   G      
       GGG GGGG GGG     
      YYYYGGGGGGYYYY    
  WW YYYYYYYYYYYYYYYY WW
 WwwWYYYYSSSSSSSSYYYYWwwW
 WwwWYYSSSSSSSSSSSSYYWwwW
  WWWYYSSKESSKESSYYWWW  
  wWWYYSSSESSSESSYYWWw  
   wWYYSSSSSSSSSSYYWw   
    WYYSSSSsSsSSSYYW    
     yYYSSSSSSSSYYy     
    WWyYYSSSSSSYYyWW    
   WwwWPPPPPPPPPPWwwW   
   WwwPPPPpCCpPPPPwwW   
    WWPPPPCCCCPPPPWW    
     PPPPPPCCPPPPPP     
    PPPPPPPPPPPPPPPP    
    PPPPPPPPPPPPPPPP    
`
  },

  // 2. Тоник — Призрачный крыс в шляпе волшебника
  tonik: {
    palette: {
      'H': '#4b2a82',
      'h': '#6a3ca8',
      'G': '#f1c40f',
      'W': '#d9f5ff',
      'w': '#9be0f7',
      'B': '#102a45',
      'C': '#00ffff',
      'P': '#ffb0c0',
      'Y': '#f39c12',
      'O': '#d35400',
    },
    art: `
          hhhh          
         hHHHHh         
        hHHHHHHh        
       hHHHHHHHHh       
      hHHHHHHHHHHh      
     GGGGGGGGGGGGGG     
    hhhGGGGGGGGhhhh     
   PWW  hhhhhh  WWP     
  PPWWw        wWWPP    
  PPWWWWWWWWWWWWWWPP    
   WWWWWWWWWWWWWWWW     
   WWWWKBWWWWKBWWWW     
   WWWWCCWWWWCCWWWW     
    WWWWWWWWWWWWWW      
     WWWWWWWWWWWW       
      WWWWPPWWWW        
      WWWWWWWWWW        
     WWw YYYYYY wWW     
    WWw YYOYYOYY wWW    
    WWw YYYYYYYY wWW    
`
  },

  // 3. Мелари (Юстина) — Тифлинг-Бард
  melari: {
    palette: {
      'H': '#1c2833', // рога
      'G': '#f1c40f', // золотые цепочки на рогах
      'W': '#e5e8e8', // серебряные волосы
      'S': '#5dade2', // лазурная кожа
      's': '#2e86c1',
      'E': '#1b4f72', // сапфировые глаза
      'C': '#8e44ad', // бардовские шелка
      'c': '#9b59b6',
      'R': '#e74c3c', // карта/рубин
      'M': '#ffffff', // игральная карта
    },
    art: `
   HH              HH   
   HHG            GHH   
   HHHH          HHHH   
    HHHHWWWWWWWW HHHH   
     HHWWWWWWWWWW HH    
     WWWWWWWWWWWWWW     
    WWWWSSSSSSSSWWWW    
    WWSSSSSSSSSSSSWW    
    WWSSEsSSSSsESSWW    
    GWSSSSSSSSSSSSWG    
     WWSSSSsSsSSSWW     
     WWSSSSSSSSSSWW     
     CCCCSSSSSSCCCC     
    CCCCCCCCCCCCCCCC    
   CCCCCCcMMMMcCCCCCC   
   CCCCCCcMRRMcCCCCCC   
   CCCCCCcMMMMcCCCCCC   
   CCCCCCCCCCCCCCCCCC   
`
  },

  // 4. Линар (Лина) — Лесной Эльф-Друид Круга Луны
  linar: {
    palette: {
      'H': '#d4ac0d', // светло-русые/золотистые волосы эльфа
      'h': '#b7950b',
      'S': '#fdebd0', // эльфийская кожа
      's': '#f5cba7',
      'E': '#27ae60', // изумрудные глаза
      'G': '#1e8449', // плащ из листьев
      'g': '#2ecc71', // яркая листва
      'W': '#7e5109', // посох ясеня
      'M': '#85c1e9', // кулон луны
    },
    art: `
       HHHHHHHHHH       
      HHHHHHHHHHHH      
     HHHHHggggHHHHH     
    SSHHHSSSSSSHHHSS    
   SSSHSSSSSSSSSSHSSS   
    sSHSSEsSSsESSHSs    
     SHSSSSSSSSSSHS     
      HSSSSsSsSSSH      
      hSSSSSSSSSSh      
     GGGGSSSSSSGGGG     
    GGGGGGSMMSGGGGGG   W
   GGGGGGGGMMGGGGGGGG WW
   GGGGgGGGGGGGGgGGGG WW
   GGGGGGGGGGGGGGGGGG WW
   GGGGGGGGGGGGGGGGGG WW
`
  },

  // 5. Оривия (Лера) — Полуорк Вор-Ассасин
  orivia: {
    palette: {
      'H': '#1c1c1c', // темные волосы/капюшон
      'S': '#7d9c75', // пепельно-оливковая кожа полуорка
      's': '#5e7a57',
      'E': '#f1c40f', // хищные желтые глаза
      'K': '#111111',
      'W': '#ffffff', // клыки
      'A': '#34495e', // тяжелый доспех
      'a': '#5d6d7e', // титановые накладки
      'B': '#bdc3c7', // лезвие тесака
    },
    art: `
       HHHHHHHHHH       
      HHHHHHHHHHHH      
     HHHHSSSSSSHHHH     
     HHHSSSSSSSSHHH     
     HHSKESSKESSHHH     
     HHSSSSSSSSSHHH     
      HSSsSSSSsSSH      
      HSSWSSSSWSSH      
      HSSSSSSSSSSH      
     aaAASSSSSSAAaa     
    aaaAAAAAAAAAaaa    B
   aaaaAAAAAAAAAAaaaa BB
   AAAaAAAAAAAAAAaAAA BB
   AAAAAAAAAAAAAAAAAA BB
   AAAAAAAAAAAAAAAAAA BB
`
  },

  // 6. Великий Архивариус Ильярион — Архфей Звёздного Света (Эладрин Сумерек)
  ilya: {
    palette: {
      'Y': '#ffd700', // звёздный венец Архфея
      'W': '#9be7ff', // эфирные крылья сумеречного света
      'w': '#4dd0e1',
      'H': '#2c3e50', // серебристо-тёмные волосы эладрина
      'S': '#fdebd0', // фейская кожа
      's': '#f5cba7',
      'C': '#00e5ff', // сияющие звёздные глаза и кристалл Гримуара
      'B': '#1a237e', // мантия Великого Архивариуса
      'b': '#3949ab',
    },
    art: `
        Y   CC   Y      
       YYY YYYY YYY     
      HHHHYYYYYYHHHH    
  WW HHHHHHHHHHHHHHHH WW
 WwwWSSHHHSSSSSSHHHSSWwwW
 WwwWSSSHSSSSSSSSSSHSSwwW
  WWW sSHSSCSSSCSSHssWWW
   wW  SHSSSSSSSSSSHS Ww
       HSSSSsSsSSSH     
       HSSSSSSSSSSH     
      BBBBSSSSSSBBBB    
     BBBBBBYYYYBBBBBB   
    BBBBBBBBYYBBBBBBBB  
    BBBBbBCCCCCCBbBBBB  
    BBBBbCCCCCCCCbBBBB  
    BBBBBBCCCCCCBBBBBB  
`
  },

  // 7. Архивариус Клок — Древний Механоид
  clock: {
    palette: {
      'B': '#b87333', // медь
      'b': '#8b4513', // темная бронза
      'G': '#ffd700', // золотые шестеренки
      'C': '#00ffff', // светящийся монокль
      'W': '#dcdcdc', // пар
      'K': '#1b1b1b',
    },
    art: `
   WW    GGGGGG    WW   
  WWW   GbbbbbbG   WWW  
       GBBBBBBBBG       
      GBBBBBBBBBBG      
     GBBGGGGCCCCBBG     
     GBBGKGGCKCCBBG     
     GBBGGGGCCCCBBG     
     GBBBBBbBbBBBBG     
      GBBKKKKKKBBG      
      GBBGGGGGGbbG      
     GGGGbbbbbbGGGG     
    GGBBBBBBBBBBBBGG    
   GGGBBGGGGGGGGBBGGG   
   GGbbbbBBBBBBbbbbGG   
`
  },

  // 8. Валтасар — Призрачный Крупье
  valtasar: {
    palette: {
      'H': '#1a0a2e', // цилиндр
      'G': '#ffd700', // золотая лента/пуговицы
      'W': '#b2ebf2', // эфирное свечение лица
      'w': '#4dd0e1',
      'E': '#ffeb3b', // горящие глаза
      'F': '#2e1a47', // фрак
      'C': '#ffffff', // карты Арканов
      'R': '#e91e63', // масть на карте
    },
    art: `
       HHHHHHHHHH       
       HHHHHHHHHH       
       GGGGGGGGGG       
     HHHHHHHHHHHHHH     
      WWWWWWWWWWWW      
      WWWEwWWwEWWW      
      WWWWWWWWWWWW      
       WWwWWWWwWW       
       WWWWWWWWWW       
     FFFFGGWWGGFFFF     
    FFFFFFGGGGFFFFFF    
   FFFFFFFGFFGFFFFFFF   
   FF CCCC FF CCCC FF   
   FF CRRC FF CRRC FF   
   FF CCCC FF CCCC FF   
`
  },

  // 9. Элодея — Дух Реликтовой Лозы
  elodea: {
    palette: {
      'G': '#2ecc71', // яркая листва
      'g': '#1e8449', // темная лоза
      'C': '#a3e4d7', // светящийся лик
      'E': '#ffffff', // звездные глаза
      'Y': '#f1c40f', // пыльца
      'F': '#ff80ab', // цветы
    },
    art: `
    Y  gGGFGGGFGGg  Y   
      gGGGGGGGGGGGg     
     gGGGCCCCCCCGGGg    
    gGGCCCCCCCCCCGGGg   
  Y gGGCCEECCCEECCGGg Y 
    gGGCCCCCCCCCCCGGg   
     gGGCCCCsCCCCGGg    
     gGGGCCCCCCCGGGg    
    gGGGGGGCCCGGGGGGg   
   gGGGGGYGGGGGYGGGGg   
   gGGGGGGGGGGGGGGGGGg  
    gGGGGFGGGGGFGGGGg   
`
  },

  // 10. Касым Меднозвон — Гном-контрабандист
  kasym: {
    palette: {
      'C': '#5d4037', // кожаная шапка и фартук
      'S': '#f5cba7', // лицо
      'R': '#d35400', // рыжая борода в косичках
      'r': '#e67e22',
      'G': '#ffd700', // золотой свисток
      'E': '#111111',
      'M': '#e74c3c', // рубин
      'B': '#2980b9', // сапфир
    },
    art: `
       CCCCCCCCCC       
      CCCCCCCCCCCC      
     CCCCSSSSSSCCCC     
     CCCSSESSSESSCC     
     CCCSSSSSSSSSSCC    
     RRRRSSSSSSSSRRRR   
    RRRRRRRRRRRRRRRRRR  
    RRRRrRRRRRRRRrRRRR  
    RRR  RRRRRRRR  RRR  
   CCCC  RRRRRRRR  CCCC 
  CCCCCC  RRRRRR  CCCCCC
  CCCCCC GGGGGGGG CCCCCC
  CCCCCMM  GGGG  BBCCCCC
  CCCCCCCCCCCCCCCCCCCCCC
`
  },

  // 11. Байтерек-Дух — Древний Дуб
  baiterek: {
    palette: {
      'G': '#f1c40f', // золотая листва осени
      'g': '#d4ac0d',
      'B': '#5d4037', // кора дуба
      'b': '#3e2723',
      'Y': '#ffeb3b', // янтарные глаза
      'M': '#27ae60', // борода из мха
    },
    art: `
    GGGGGGGGGGGGGGGG    
   GGGGgGGGGGGGGgGGGG   
  GGGGGGGGGGGGGGGGGGGG  
   GGGGBBBBBBBBBGGGGG   
     BBBBbBBBBbBBBB     
     BBBBBBBBBBBBBB     
     BBYYbBBBBbYYBB     
     BBBBBBBBBBBBBB     
     BBBBbBBBBbBBBB     
     MMMMBBBBBBMMMM     
    MMMMMMBBBBMMMMMM    
    MMMMMMMMMMMMMMMM    
     BBBBMMMMMMMMBBBB   
    BBBBBBBBBBBBBBBBBB  
`
  },

  // 12. Теневой Ворон Безликого
  raven: {
    palette: {
      'K': '#0d0d14', // черные перья
      'k': '#1e1b2e', // отлив пера
      'P': '#9c27b0', // фиолетовая аура
      'E': '#e040fb', // горящие фиолетовые глаза
      'G': '#4a4a5a', // клюв
    },
    art: `
   P    KKKKKKKK    P   
  PP   KKKKKKKKKK   PP  
      KKKKkKKkKKKK      
     KKKKKEKKKEKKKK     
     KKKKKEKKKEKKKK     
      KKKKGGGGKKKK      
     KKKKGGGGGGKKKK     
   kKKKKKKGGGGKKKKKKk   
  kKKKKKKKKKKKKKKKKKKk  
 kKKKKKKKKKKKKKKKKKKKKk 
 kKKKKkKKKKKKKKKKkKKKKk 
  kKKK  KKKKKKKK  KKKk  
   P    KKKKKKKK    P   
`
  },

  // 13. Мастер Эспрессо — Бариста-Алхимик
  barista: {
    palette: {
      'H': '#2c1e18', // волосы и берет
      'S': '#f5cba7',
      'K': '#111111', // усы и глаза
      'A': '#4e342e', // кофейный фартук
      'W': '#ffffff', // рубашка и чашка
      'C': '#d7ccc8', // пар кофе
      'G': '#f39c12', // руна кофе
    },
    art: `
       HHHHHHHHHH       
      HHHHHHHHHHHH      
      HHHSSSSSSHHH      
      HHSKSSSSKSHH      
      HHSSSSSSSSHH      
      HHSKKKKKKSHH      
       HSSSSSSSSSH      
     WWAASSSSSSAAWW     
    WWWAAAAAAAAAAWWW    
   WWWWAAAAGGAAAAWWWW C 
   WWWWAAAAGGAAAAWWWWC C
   WWWWAAAAAAAAAAWWWW   
   WWWWAAAAWWWWWWAWWW   
   WWWWAAAAWWWWWWAAAA   
`
  },

  // 14. Куаныш — Призрачный Кондуктор
  kuanysh: {
    palette: {
      'B': '#1b3b5c', // шинель и фуражка
      'G': '#ffd700', // кокарда и пуговицы
      'S': '#82c99b', // призрачно-зеленоватая кожа гоблина
      'E': '#00ffff', // светящиеся глаза
      'Y': '#ffeb3b', // фонарь семафора
    },
    art: `
      BBBBBBBBBBBB      
     BBBBBBGGBBBBBB     
    GGGGGGGGGGGGGGGG    
   SSBBBBBBBBBBBBBBSS   
  SSSSBSSSSSSSSSSBSSSS  
   SSSBSSESSSSESSSBSS   
     SBSSSSSSSSSSBS     
      BSSSSSSSSSS       
     BBBBBBBBBBBBBB     
    BBBBGBBBBBGBBBBB  Y 
   BBBBBGBBBBBGBBBBBBYYY
   BBBBBBBBBBBBBBBBBB Y 
`
  },

  // 15. Домовой Кузя — Хранитель Родового Очага
  kuzya: {
    palette: {
      'W': '#e5e7e9', // пушистая борода и волосы
      'S': '#f5cba7', // доброе лицо
      'R': '#c0392b', // косоворотка
      'Y': '#f39c12', // соломенные волосы/уголек
      'K': '#111111',
    },
    art: `
      YYYYYYYYYYYY      
     YYYYWWWWWWYYYY     
    WWWWSSSSSSSSWWWW    
    WWWSSKSSSSKSSWWW    
    WWWSSSSSSSSSSWWW    
   WWWWWWWWWWWWWWWWWW   
   WWWWWWWWWWWWWWWWWW   
    WWWWWWWWWWWWWWWW    
    RRRRWWWWWWWWRRRR    
   RRRRRRWWWWWWWRRRRR   
   RRRRRRRRYYRRRRRRRR   
   RRRRRRRYYYYRRRRRRR   
`
  },

  // 16. Гомункул Ртутник — Элементаль Ртути
  mercury: {
    palette: {
      'F': '#80deea', // стеклянная колба
      'M': '#cfd8dc', // жидкая ртуть
      'm': '#ffffff', // блик серебра
      'E': '#1a237e', // глазки-бусинки
      'C': '#a1887f', // пробка
    },
    art: `
         CCCCCC         
         FFFFFF         
         FFFFFF         
        FFFFFFFF        
       FFMMMMMMFF       
      FFMMmmmmMMFF      
     FFMMMMMMMMMMFF     
     FFMMEEMMEEMMFF     
     FFMMMMMMMMMMFF     
     FFMMMmmmmMMMFF     
      FFMMMMMMMMFF      
       FFFFFFFFFF       
`
  },

  // 17. Горгулья Каменного Свода
  gargoyle: {
    palette: {
      'G': '#7f8c8d', // серый гранит
      'g': '#566573', // темный камень
      'C': '#00e5ff', // глаза и руна G
      'K': '#1c2833',
    },
    art: `
  gg   GG      GG   gg  
 gGGg  GGG    GGG  gGGg 
 gGGGg GGGGGGGGGG gGGGg 
 gGGGGGGGGGGGGGGGGGGGGg 
 gGGGGGGCCGGGGCCGGGGGGg 
  gGGGGGGGGGGGGGGGGGGg  
  gGGGGGGGKKKKGGGGGGGg  
   gGGGGGGGGGGGGGGGGg   
    gGGGGCCCCCCGGGGg    
    gGGGGCGGGGGGGGg     
    gGGGGCGGCCCGGGg     
    gGGGGCCCCCCGGGg     
`
  },

  // 18. Теневой Аукционист
  auctioneer: {
    palette: {
      'K': '#110a1c', // высокий цилиндр и фрак
      'P': '#8e44ad', // лента
      'M': '#ecf0f1', // белая полумаска
      'E': '#f1c40f', // глаза
      'G': '#d4af37', // трость с черепом
    },
    art: `
        KKKKKKKK        
        KKKKKKKK        
        KKKKKKKK        
        PPPPPPPP        
      KKKKKKKKKKKK      
       MMMMMMMMMM       
       MMEEMMEEMM       
       MMMMKKMMMM       
      KKKKMMMMKKKK      
     KKKKKPPPPKKKKK   G 
    KKKKKKPPPPKKKKKK GGG
    KKKKKKKKKKKKKKKK  G 
`
  },

  // 19. Лорд-Отец — Лесной Архфей Древнего Корня (Владыка Дубовой Короны)
  papa: {
    palette: {
      'G': '#ffd700', // золотая корона ветвей и Печать Древа
      'L': '#2ecc71', // листва первородного древа
      'H': '#7f8c8d', // благородные серебристо-каштановые волосы
      'h': '#8d6e63', // борода лесного владыки
      'S': '#f5cba7', // лицо и острые фейские уши
      'E': '#f39c12', // янтарные глаза Архфея
      'M': '#1e8449', // изумрудный камзол Древнего Корня
      'A': '#5d4037', // дубовый доспех
    },
    art: `
    G  LL  GGGG  LL  G  
     GGLLLGGGGGGLLLGG   
       HHHHHHHHHHHH     
    SS HHHSSSSSSHHH SS  
   SSSHHSSESSSESSHHSSS  
     sHHSSSSSSSSSSHHs   
     HHHHHHHHHHHHHHHH   
     HHHHhhhhhhhhHHHH   
     MMMMhhhhhhhhMMMM   
    MMMMMMhhhhhhMMMMMM  
    MMMMAAAAGGGAAAAMMM  
    MMMMAAAGGGGGAAAMMM  
    MMMMAAAAAAAAAAAAMM  
`
  },

  // 20. Леди-Матушка — Сильфида Лунного Света (Высшая Фея Серебряных Рос)
  mama: {
    palette: {
      'C': '#e5e8e8', // серебряная лунная диадема
      'W': '#b2ebf2', // сияющие крылья сильфиды
      'w': '#4dd0e1',
      'G': '#f5cf47', // золотистые локоны
      'S': '#fdebd0', // нежная кожа и фейские ушки
      's': '#f5cba7',
      'E': '#2980b9', // лучистые глаза
      'B': '#1abc9c', // бирюзовое одеяние Лунных Рос
      'b': '#16a085',
    },
    art: `
        CCCCCCCCCC      
       CCCGGGGGGCCC     
  WW  GGGGGGGGGGGGGG  WW
 WwwWSGGGSSSSSSSSGGGSWwwW
 WwwWSGGSSEsSSsESSGGSWwwW
  WWW GGSSSSSSSSSSGG WWW
   wW GGSSSSsSsSSSGG Ww 
       GSSSSSSSSSSG     
     WWBBBBSSSSSSBBBBWW 
    WwwBBBBBBBBBBBBBBwwW
    BBBBbBBBBBBBBbBBBB  
    BBBBBBBBBBBBBBBBBB  
    BBBBBBBBBBBBBBBBBB  
`
  },

  // 21. Тётя Альфия — Верховный Магистр Зелий
  alfiya: {
    palette: {
      'H': '#4a235a', // высокая прическа
      'S': '#f5cba7',
      'G': '#ffd700', // очки в золотой оправе
      'E': '#111111',
      'A': '#117a65', // изумрудный бархатный фартук
      'P': '#d2b4de', // сиреневая колба
    },
    art: `
       HHHHHHHHHH       
      HHHHHHHHHHHH      
     HHHHSSSSSSHHHH     
     HHSGEGSSGEGSHH     
     HHSGGGSSGGGSHH     
      HSSSSSSSSSSH      
      HSSSSSSSSSSH      
     AAAASSSSSSAAAA     
    AAAAAAAAAAAAAAAA    
   AAAAAAAAPPAAAAAAAA   
   AAAAAAAPPPPAAAAAAA   
   AAAAAAAPPPPAAAAAAA   
`
  },

  // 22. Дядя Сергей — Инженер-Механик Котлов
  sergey: {
    palette: {
      'H': '#5d4037', // волосы
      'S': '#f5cba7',
      'K': '#111111',
      'B': '#2c3e50', // жилет инженера
      'L': '#8d6e63', // кожаные наручи
      'W': '#bdc3c7', // разводной ключ
    },
    art: `
       HHHHHHHHHH       
      HHHHHHHHHHHH      
     HHHSSSSSSSSHHH     
     HHSSKSSSSKSSHH     
     HHSSSSSSSSSSHH     
      HSSsKKKKsSSH      
      HSSSSSSSSSSH      
     BBBBSSSSSSBBBB   WW
    BBBBBBBBBBBBBBBB W W
   LLBBBBBBBBBBBBBBLL WW
   LLBBBBBBBBBBBBBBLL W 
   BBBBBBBBBBBBBBBBBB W 
`
  },

  // 23. Даня — Чародей-Подмастерье
  danya: {
    palette: {
      'P': '#1a1a3a', // звездный колпак и балахон
      'Y': '#ffd700', // звезды
      'H': '#4a3319',
      'S': '#fcd0a1',
      'G': '#f39c12', // очки
      'g': '#00e5ff',
      'R': '#2ecc71', // зеленая пробирка
    },
    art: `
          PPPP          
         PPYPPP         
        PPPPPPPP        
       PPPPYYPPPP       
      HHHHSSSSHHHH      
      HHSSGGSGGSSHH     
      HHSGggSGggSHH     
      HHSSSSSSSSSHH     
       HSSSSSSSSSH      
     PPPPSSSSSSPPPP     
    PPPPPYPPPPYPPPPP  R 
   PPPPPPPPPPPPPPPPPP R 
   PPPPPPPPPPPPPPPPPP R 
`
  },

  // 24. Дядя Виталик — Драконорожденный Страж Гранита
  vitalik: {
    palette: {
      'H': '#34495e', // стальной/гранитный шлем-венец
      'S': '#d5a882', // волевое лицо
      'K': '#111111',
      'A': '#2c3e50', // гранитные латы
      'G': '#d4af37', // золотые наплечники и голова дракона на посохе
      'W': '#6e2c00', // дубовый посох
    },
    art: `
       HHHHHHHHHH       
      HHHHHHHHHHHH      
     HHHSSSSSSSSHHH   GG
     HHSSKSSSSKSSHH  GGG
     HHSSSSSSSSSSHH   W 
      HSSKKKKKKSSH    W 
      HSSSSSSSSSSH    W 
    GGAAASSSSSSAAAGG  W 
   GGGAAAAAAAAAAAAGGG W 
   AAAAAAAAAAAAAAAAAA W 
   AAAAAAAAAAAAAAAAAA W 
`
  },

  // 25. Тётя Оксана — Жрица Рунических Писаний
  oksana: {
    palette: {
      'H': '#6e2c00', // каштановые волосы
      'S': '#fdebd0',
      'K': '#111111',
      'B': '#5b2c6f', // шелковое одеяние жрицы
      'G': '#f1c40f', // руническая вышивка
      'W': '#f5cba7', // свиток
    },
    art: `
       HHHHHHHHHH       
      HHHHHHHHHHHH      
     HHHHSSSSSSHHHH     
     HHSSKSSSSKSSHH     
     HHSSSSSSSSSSHH     
      HSSSSSSSSSSH      
     BBBBSSSSSSBBBB     
    BBBBGGBBBBGGbbbb    
   BBBBBBBBBBBBBBBBBB   
   BBBBWWWWWWWWWWBBBB   
   BBBBWGGGGGGGGWBBBB   
   BBBBWWWWWWWWWWBBBB   
`
  },

  // 26. Маленькая Софа — Юная Провидица Гранита
  sofa: {
    palette: {
      'W': '#f5cf47', // светлые локоны
      'G': '#ffd700', // сверкающая диадема
      'C': '#00e5ff', // самоцвет диадемы и руна
      'S': '#fbe9e7',
      'E': '#5c6bc0',
      'B': '#1a237e', // синяя бархатная мантия со звездами
    },
    art: `
        GGGCCCGGG       
       WWWWWWWWWWW      
      WWWWSSSSSWWWW     
     WWWSSESSSESSWWW    
     WWWSSSSSSSSSWWW    
      WWSSSSsSSSSWW     
     BBBBSSSSSSSBBBB    
    BBBBYBBBBBBBYBBBB   
   BBBBBBBBCCCBBBBBBBB  
   BBBBBBBCCCCCBBBBBBB  
   BBBBBBBBCCCBBBBBBBB  
`
  },

  // 27. Яна — Сестра Даши / Вольная Охотница
  yana: {
    palette: {
      'C': '#1c2024', // темный капюшон и плащ
      'H': '#5d4037', // локоны
      'S': '#f5cba7',
      'E': '#f39c12', // озорные глаза
      'L': '#dfe6e9', // парные кинжалы
      'G': '#f1c40f', // эфес
    },
    art: `
       CCCCCCCCCC       
      CCCCCCCCCCCC      
     CCCHHSSSSHHCCC     
     CCHSSESSSESSHCC    
     CCHSSSSSSSSSHCC    
      CHSSSSsSSSSH      
     CCCCSSSSSSCCCC     
    CCCCCCCCCCCCCCCC    
   L GCCCCCCCCCCCCG L   
  LL GCCCCCCCCCCCCG LL  
  L   CCCCCCCCCCCC   L  
`
  },

  // 28. Парень Яны — Наемник-Варвар
  yana_bf: {
    palette: {
      'H': '#2c1e18', // короткая стрижка
      'S': '#e0b284',
      'K': '#111111',
      'A': '#2e4053', // армейская куртка
      'B': '#17202a', // кованая железная шкатулка
      'G': '#ffd700', // замок шкатулки с Ключом
    },
    art: `
       HHHHHHHHHH       
      HHHHHHHHHHHH      
      HHSSSSSSSSHH      
      HHSKSSSSKSHH      
      HHSSSSSSSSHH      
      HSSsKKKKsSSH      
    AAAAASSSSSSAAAAA    
   AAAAAAAAAAAAAAAAAA   
  AAAAAAAAAAAAAAAAAAAA  
  AAAAABBBBBBBBBBAAAAA  
  AAAAABBBBGGGBBBAAAAA  
  AAAAABBBBBBBBBBAAAAA  
`
  },

  // 29. Два Воссоединившихся Духа (Человек-Советник и Возлюбленный Эльф) — Финальные Боссы Хондора
  faceless: {
    palette: {
      'C': '#0f0c1b',
      'c': '#20183b',
      'M': '#e0e0e0', // маска Человека
      'E': '#a3e4d7', // лик Эльфа
      'K': '#05030a',
      'P': '#9b59b6', // эфирное пламя
      'R': '#e74c3c', // багровая нить 14 клятв
      'G': '#ffd700', // венец эльфа
    },
    art: `
    PPPP          GGG   
   PPcccccc    ccGGGGGc 
  PPcMMMMMMc  cGEEEEEEG 
  PcMMKKMMKMcEGEKKEKKEEG
  PcMMRMMMRMcEGEERRRREEG
  PcMMMMMMMMccEEEEEEEEG 
   PcMMMMMMcRRcEEEEEEG  
   PPccccccRRRRccccccP  
    PPPPPPcRRRRcPPPPP   
   PPPPPPPPcRRcPPPPPPP  
`
  },

  // Совместимость со старыми ссылками
  elders: {
    palette: {
      'H': '#d35400',
      'G': '#f1c40f',
      'S': '#f5cba7',
      'B': '#5d4037',
      'K': '#212121',
    },
    art: `
  GGGGGGG     HHHHHH    
 GGGGGGGGG   HHHHHHHH   
 GGSSSSSSGG HHSSSSSSHH  
 GGSSKSSKGG HHSSKSSKHH  
 GSSSSSSSSG HSSSSSSSS   
  BBBBBBBB   HHHHHHHH   
 BBBBBBBBBB BBBBBBBBBB  
`
  },
  npc: {
    palette: {
      'H': '#4b2a82',
      'W': '#d9f5ff',
      'C': '#00ffff',
    },
    art: `
        HHHHHHHH        
       HHHHHHHHHH       
      WWWWWWWWWWWW      
      WWCCWWWWCCWW      
      WWWWWWWWWWWW      
`
  }
};

let count = 0;
for (const [name, cfg] of Object.entries(PORTRAITS)) {
  const svg = parseAsciiArt(cfg.art, cfg.palette, 4);
  fs.writeFileSync(path.join(portraitsDir, `${name}.svg`), svg, 'utf-8');
  count++;
}

console.log(`Generated ${count} pixel-art SVG portraits in ${portraitsDir}`);
