import sharp from 'sharp';

async function generateScreenshots() {
  const mobileSvg = `
  <svg width="750" height="1334" viewBox="0 0 750 1334" xmlns="http://www.w3.org/2000/svg" font-family="Amiri, DejaVu Sans, sans-serif">
    <rect width="750" height="1334" fill="#FAF6EF"/>
    
    <!-- Top Header -->
    <rect width="750" height="120" fill="#0F172A"/>
    <text x="40" y="60" font-size="28" font-weight="bold" fill="#FFFFFF">L7a4eg AI | لحاذگ 🇲🇷</text>
    <text x="40" y="95" font-size="18" fill="#94A3B8">مساعد الذكاء الاصطناعي الموريتاني الشامل</text>

    <!-- Navigation Tabs Bar -->
    <rect y="120" width="750" height="85" fill="#1E293B"/>
    <rect x="35" y="132" width="180" height="60" rx="14" fill="#0284C7"/>
    <text x="125" y="170" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">محادثة ذكية</text>
    
    <rect x="230" y="132" width="160" height="60" rx="14" fill="#334155"/>
    <text x="310" y="170" font-size="19" fill="#CBD5E1" text-anchor="middle">الحسانية</text>

    <rect x="405" y="132" width="160" height="60" rx="14" fill="#334155"/>
    <text x="485" y="170" font-size="19" fill="#CBD5E1" text-anchor="middle">ترجمة ثلاثية</text>

    <!-- Subbar -->
    <rect y="205" width="750" height="70" fill="#0F172A"/>
    <rect x="35" y="218" width="140" height="44" rx="10" fill="#047857"/>
    <text x="105" y="247" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">السجل (3)</text>
    <rect x="190" y="218" width="270" height="44" rx="10" fill="#0369A1"/>
    <text x="325" y="247" font-size="17" font-weight="bold" fill="#FFFFFF" text-anchor="middle">🇲🇷 مستشار الحسانية (أصيل)</text>

    <!-- Welcome Message Bubble -->
    <g transform="translate(35, 300)">
      <rect width="680" height="230" rx="20" fill="#FFFFFF" stroke="#E2D5BE" stroke-width="2"/>
      <text x="30" y="45" font-size="22" font-weight="bold" fill="#0284C7">لحاذگ (L7a4eg AI) 🇲🇷</text>
      <text x="30" y="90" font-size="19" fill="#334155">مرحباً بك في لحاذگ! مستشارك ومحاورك الحساني الموريتاني الأول.</text>
      <text x="30" y="135" font-size="19" fill="#334155">شحالك؟ ولاباس عليك؟ أهل دارك يخير؟</text>
      <text x="30" y="180" font-size="18" fill="#475569">أنا معك في هذا المجلس للدردشة بلسان البيظان والترجمة الشور الشور. ☕</text>
    </g>

    <!-- User Message Bubble -->
    <g transform="translate(140, 555)">
      <rect width="575" height="90" rx="20" fill="#0284C7"/>
      <text x="30" y="55" font-size="21" font-weight="bold" fill="#FFFFFF">شحالك يا كمي؟ واش معنى الشور الشور؟</text>
    </g>

    <!-- Assistant Response Bubble -->
    <g transform="translate(35, 670)">
      <rect width="680" height="340" rx="20" fill="#FFFFFF" stroke="#E2D5BE" stroke-width="2"/>
      <text x="30" y="45" font-size="22" font-weight="bold" fill="#059669">لحاذگ 🇲🇷</text>
      <text x="30" y="90" font-size="19" fill="#1E293B">وعليكم السلام ورحمة الله وبركاته! مرحبتي بيك يا كمي وسهلاً.</text>
      <text x="30" y="130" font-size="19" fill="#1E293B">أنا يخير ولله الحمد، سحابك الخير والعافية!</text>
      <text x="30" y="180" font-size="19" font-weight="bold" fill="#0369A1">معنى "الشور الشور" في التراث الحساني الموريتاني:</text>
      <text x="30" y="225" font-size="19" fill="#334155">التأني والتروي والحكمة وتجنب العجلة في كل مسعى تجارة أو سفر.</text>
      <text x="30" y="275" font-size="18" font-weight="bold" fill="#B45309">«الشور الشور ما يسبك حد والزربة ما فيها خير» 📜</text>
    </g>

    <!-- Bottom Input Box -->
    <rect y="1190" width="750" height="144" fill="#FFFFFF" stroke="#E2D5BE" stroke-width="2"/>
    <rect x="35" y="1215" width="580" height="90" rx="20" fill="#FAF6EF" stroke="#CBD5E1" stroke-width="1.5"/>
    <text x="60" y="1270" font-size="19" fill="#94A3B8">تحدث بالحسانية، اسأل عن مثل، أو اطلب ترجمة...</text>
    <rect x="635" y="1215" width="80" height="90" rx="20" fill="#0284C7"/>
    <text x="675" y="1270" font-size="32" fill="#FFFFFF" text-anchor="middle">➤</text>
  </svg>
  `;

  await sharp(Buffer.from(mobileSvg)).resize(750, 1334).png().toFile('public/screenshot-mobile.png');

  const desktopSvg = `
  <svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg" font-family="Amiri, DejaVu Sans, sans-serif">
    <rect width="1280" height="800" fill="#FAF6EF"/>
    
    <!-- Top Header -->
    <rect width="1280" height="75" fill="#0F172A"/>
    <text x="40" y="46" font-size="24" font-weight="bold" fill="#FFFFFF">L7a4eg AI | لحاذگ 🇲🇷</text>
    <text x="340" y="46" font-size="16" fill="#94A3B8">مساعد الذكاء الاصطناعي الموريتاني الشامل</text>
    
    <!-- Desktop Tabs -->
    <rect x="750" y="16" width="140" height="44" rx="10" fill="#0284C7"/>
    <text x="820" y="44" font-size="16" font-weight="bold" fill="#FFFFFF" text-anchor="middle">محادثة ذكية</text>
    <rect x="910" y="16" width="140" height="44" rx="10" fill="#1E293B"/>
    <text x="980" y="44" font-size="16" fill="#CBD5E1" text-anchor="middle">الحسانية</text>
    <rect x="1070" y="16" width="140" height="44" rx="10" fill="#1E293B"/>
    <text x="1140" y="44" font-size="16" fill="#CBD5E1" text-anchor="middle">ترجمة ثلاثية</text>

    <!-- Subbar -->
    <rect y="75" width="1280" height="55" fill="#1E293B"/>
    <rect x="40" y="85" width="120" height="36" rx="8" fill="#047857"/>
    <text x="100" y="108" font-size="15" font-weight="bold" fill="#FFFFFF" text-anchor="middle">السجل (5)</text>
    <rect x="180" y="85" width="190" height="36" rx="8" fill="#0284C7"/>
    <text x="275" y="108" font-size="15" font-weight="bold" fill="#FFFFFF" text-anchor="middle">مستشار الحسانية</text>

    <!-- Left: Saved Sessions Sidebar -->
    <g transform="translate(40, 150)">
      <rect width="340" height="580" rx="16" fill="#F4EDE0" stroke="#E2D5BE" stroke-width="2"/>
      <text x="25" y="40" font-size="18" font-weight="bold" fill="#0F172A">سجل المحادثات المحفوظة</text>
      
      <rect x="20" y="60" width="300" height="75" rx="12" fill="#FFFFFF" stroke="#0284C7" stroke-width="2"/>
      <text x="35" y="92" font-size="15" font-weight="bold" fill="#0284C7">شحالك ومعنى الشور الشور</text>
      <text x="35" y="118" font-size="13" fill="#64748B">منذ قليل • 4 رسائل</text>

      <rect x="20" y="145" width="300" height="75" rx="12" fill="#FFFFFF" stroke="#E2D5BE" stroke-width="1"/>
      <text x="35" y="177" font-size="15" font-weight="bold" fill="#334155">ترجمة ثلاثية: عقد بيع وتجارة</text>
      <text x="35" y="203" font-size="13" fill="#64748B">أمس • 8 رسائل</text>

      <rect x="20" y="230" width="300" height="75" rx="12" fill="#FFFFFF" stroke="#E2D5BE" stroke-width="1"/>
      <text x="35" y="262" font-size="15" font-weight="bold" fill="#334155">طقوس أتاي والجيمات الثلاث</text>
      <text x="35" y="288" font-size="13" fill="#64748B">منذ 3 أيام • 6 رسائل</text>
    </g>

    <!-- Right: Active Chat Conversation -->
    <g transform="translate(410, 150)">
      <rect width="830" height="580" rx="16" fill="#FFFFFF" stroke="#E2D5BE" stroke-width="2"/>
      
      <g transform="translate(200, 25)">
        <rect width="600" height="65" rx="16" fill="#0284C7"/>
        <text x="30" y="42" font-size="17" font-weight="bold" fill="#FFFFFF">كيف نسأل بالحسانية والفصحى والفرنسية عن التيفاية؟</text>
      </g>

      <g transform="translate(30, 105)">
        <rect width="770" height="360" rx="16" fill="#FAF6EF" stroke="#E2D5BE" stroke-width="1.5"/>
        <text x="30" y="40" font-size="18" font-weight="bold" fill="#047857">الترجمة الثلاثية الدقيقة من لحاذگ 🇲🇷:</text>
        
        <text x="30" y="85" font-size="16" font-weight="bold" fill="#0284C7">🇲🇷 بالحسانية:</text>
        <text x="140" y="85" font-size="16" fill="#1E293B">"هو لاهي يفتح تيفاية زوينة والشور الشور كل شي يتم."</text>

        <text x="30" y="140" font-size="16" font-weight="bold" fill="#059669">📖 بالعربية الفصحى:</text>
        <text x="180" y="140" font-size="16" fill="#1E293B">"يعتزم إطلاق تجارة واعدة، وبالتأني والتروي سيكتمل كل شيء."</text>

        <text x="30" y="195" font-size="16" font-weight="bold" fill="#0284C7">🇫🇷 بالفرنسية:</text>
        <text x="150" y="195" font-size="16" fill="#1E293B">"Il s'apprête à lancer une bonne affaire, avec patience tout réussira."</text>

        <text x="30" y="260" font-size="15" fill="#B45309">💡 ملاحظة: التيفاية تعني التجارة البسيطة أو الصفقة المباركة في موريتانيا.</text>
      </g>

      <g transform="translate(30, 490)">
        <rect width="770" height="65" rx="14" fill="#FAF6EF" stroke="#CBD5E1" stroke-width="1.5"/>
        <text x="30" y="40" font-size="16" fill="#94A3B8">اكتب رسالتك لـ "لحاذگ" أو تحدث صوتياً...</text>
        <rect x="670" y="12" width="80" height="40" rx="10" fill="#0284C7"/>
        <text x="710" y="37" font-size="15" font-weight="bold" fill="#FFFFFF" text-anchor="middle">إرسال ➤</text>
      </g>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(desktopSvg)).resize(1280, 800).png().toFile('public/screenshot-desktop.png');
  console.log('Screenshots re-rendered properly');
}

generateScreenshots().catch(console.error);
