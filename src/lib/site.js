/**
 * Single source of truth for identity, contact details and social links.
 *
 * These were previously duplicated across Navbar and Footer, which is how the
 * site ended up advertising two different phone numbers, four WhatsApp links
 * missing their country code, and a Facebook URL with a stray apostrophe glued
 * to the front of it.
 */

// Egyptian mobiles in E.164 (no leading zero, country code 20). WhatsApp will
// not open a chat without this — the old links passed a bare `1210633886`.
const WHATSAPP_E164 = '201210633886';
const PHONE_E164 = '201014848671';

export const site = {
  name: 'المأذون الشرعي',
  fullName: 'الدكتور محمد البحراوي',
  title: 'مأذون شرعي',
  credentials: 'ماجستير العلوم القضائية — باحث دكتوراه في القانون العام',
  url: 'https://almaazoon.com',
  locale: 'ar_EG',

  /**
   * The homepage <title>. Under ~60 characters so Google does not truncate it,
   * and it leads with the words people actually type — without naming a
   * governorate the business does not want to be pinned to.
   */
  defaultTitle: 'مأذون شرعي متنقل | كتب كتاب وتوثيق عقود الزواج',

  description:
    'مأذون شرعي معتمد — كتب كتاب وعقد قران وتوثيق عقود الزواج والطلاق واستخراج قسيمة الزواج. خدمة متنقلة حسب الاتفاق، تخدم مختلف مناطق القاهرة الكبرى.',

  phone: {
    display: '0101 484 8671',
    href: `tel:+${PHONE_E164}`,
  },

  whatsapp: {
    display: '0121 063 3886',
    href: `https://wa.me/${WHATSAPP_E164}`,
  },

  /**
   * A *service-area* business, and deliberately not tied to any governorate.
   *
   * The Ma'zoun is متنقل — he travels to the home, the hall or the office by
   * arrangement. So there is no street address, no map pin, no GPS coordinates
   * and no opening hours anywhere on this site or in its structured data, and no
   * governorate is claimed as the official business location.
   *
   * `exampleAreas` are illustrations of where he has worked, nothing more. They
   * are rendered near the end of the homepage and are never presented as the
   * business's location, never used as the SEO target, and never emitted into the
   * structured data as an official `address`.
   */
  address: {
    country: 'EG',

    /** The broad coverage claim. Not a governorate, and not an address. */
    coverage: 'يخدم مختلف مناطق القاهرة الكبرى',

    /** How the service actually works. */
    serviceNote: 'خدمة متنقلة حسب الاتفاق',

    /** Shown once, as examples only. */
    exampleAreas: [
      'العبور',
      'الشروق',
      'مدينة نصر',
      'التجمع',
      'القاهرة الجديدة',
      'مصر الجديدة',
    ],
  },

  /**
   * The office.
   *
   * Content only — deliberately *not* mirrored into the structured data. The
   * schema in Seo.jsx still declares no `address`, no `geo` and no
   * `openingHoursSpecification`, because the business is متنقل and those claims
   * were removed on purpose. This is the place a visitor can meet him; it is not
   * a claim about where the service is performed, and changing the schema would
   * be an SEO change.
   */
  office: {
    heading: 'عنوان المكتب',
    address: 'العبور - الحي الأول - محور السادات - بجوار مدرسة معاذ بن جبل - بجوار موقف حليم.',
    /** Opens the pin in the Google Maps app or a new tab. */
    mapsUrl:
      'https://www.google.com/maps?q=30.235612869262695,31.46569061279297&z=17&hl=en',
    /** The same pin, as an embeddable frame. No API key required. */
    embedUrl:
      'https://www.google.com/maps?q=30.235612869262695,31.46569061279297&z=17&hl=ar&output=embed',
  },

  social: [
    {
      name: 'واتساب',
      href: `https://wa.me/${WHATSAPP_E164}`,
      icon: 'whatsapp',
    },
    {
      name: 'فيسبوك',
      // The old href was `"'https://www.facebook.com/..."` — the leading
      // apostrophe made it a relative path, so the link 404'd.
      href: 'https://www.facebook.com/Bahrawy111',
      icon: 'facebook',
    },
    {
      name: 'إنستجرام',
      href: 'https://www.instagram.com/mo7amed.elba7rawy',
      icon: 'instagram',
    },
    {
      name: 'تيك توك',
      href: 'https://www.tiktok.com/@mohamedelbahrawy76',
      icon: 'tiktok',
    },
  ],
};

/**
 * Every way to reach the Ma'zoun, in priority order — one tap each, no
 * intermediate page and no "contact us" form standing between the visitor and
 * the call. `tel:` dials, `wa.me` opens WhatsApp, the rest open the profile.
 *
 * `action` is the verb shown under the channel name; `tone` selects the brand
 * treatment in ContactChannels.
 */
export const contactChannels = [
  {
    tone: 'phone',
    icon: 'phone',
    name: 'اتصال هاتفي',
    action: site.phone.display,
    href: site.phone.href,
    // A tel: link must not open in a new tab — it hands off to the dialer.
    sameTab: true,
  },
  {
    tone: 'whatsapp',
    icon: 'whatsapp',
    name: 'واتساب',
    action: site.whatsapp.display,
    href: site.whatsapp.href,
  },
  {
    tone: 'facebook',
    icon: 'facebook',
    name: 'فيسبوك',
    action: 'تابِع الصفحة',
    href: 'https://www.facebook.com/Bahrawy111',
  },
  {
    tone: 'instagram',
    icon: 'instagram',
    name: 'إنستجرام',
    action: 'تابِع الحساب',
    href: 'https://www.instagram.com/mo7amed.elba7rawy',
  },
];

/** About the Ma'zoun — the credentials the visitor is being asked to trust. */
export const about = {
  title: 'عن المأذون',
  heading: `${site.fullName}`,
  paragraphs: [
    'مأذون شرعي معتمد، يتولّى توثيق عقود الزواج والطلاق والرجعة والتصادق وزواج الأجانب وفق أحكام الشريعة الإسلامية وقانون الأحوال الشخصية المصري.',
    'خلفية أكاديمية وقانونية تجمع بين العلوم الشرعية والقانون العام، بما يضمن أن يكون كل عقد صحيحًا شرعًا وسليمًا قانونًا، وموثّقًا رسميًا في دفاتر المحكمة.',
  ],
  credentials: [
    'ماجستير العلوم القضائية',
    'باحث دكتوراه في القانون العام',
    'توثيق رسمي معتمد بالمحكمة',
  ],
};

/**
 * Trust signals. Deliberately non-numeric: no figure here is invented.
 * Every line states a fact that is verifiable from the credentials above or
 * from the service itself.
 */
export const trustSignals = [
  {
    value: 'موثّق',
    label: 'قيد رسمي بالمحكمة',
    detail: 'يُقيَّد العقد في الدفاتر الرسمية وتُستخرج قسيمة الزواج الموثّقة.',
  },
  {
    value: 'ماجستير',
    label: 'العلوم القضائية',
    detail: 'خلفية شرعية وقانونية تضمن سلامة العقد شرعًا وقانونًا.',
  },
  {
    value: 'متنقل',
    label: 'نطاق الخدمة',
    // No governorate named: the coverage claim stays at metro level, and the
    // example areas live once, near the foot of the homepage.
    detail: `${site.address.coverage}، ${site.address.serviceNote}.`,
  },
  {
    value: 'مباشر',
    label: 'تواصل بلا وسيط',
    detail: 'تتحدث مع المأذون نفسه — هاتفيًا أو عبر واتساب.',
  },
];

/** Why choose us — the differentiators, not generic marketing claims. */
export const whyUs = [
  {
    title: 'عقد صحيح شرعًا وقانونًا',
    body: 'مراجعة كل بند من بنود العقد وشروطه قبل التوقيع، حتى لا يترتب على العقد نزاع لاحق.',
  },
  {
    title: 'توثيق رسمي لا مجرد كتب كتاب',
    body: 'القيد في دفاتر المحكمة واستخراج القسيمة الموثّقة — وهو ما يحفظ حقوق الزوجة كاملة.',
  },
  {
    title: 'وضوح كامل قبل الموعد',
    body: 'تُشرح لك الأوراق المطلوبة والإجراءات والتكلفة قبل الحضور، دون مفاجآت.',
  },
  {
    title: 'خبرة في زواج الأجانب',
    body: 'التنسيق مع وزارة العدل والسفارات والقنصليات لإتمام إجراءات غير المصريين.',
  },
  {
    title: 'الحضور إلى مكان المناسبة',
    body: 'إتمام العقد في المنزل أو القاعة أو المكتب، حسب ما يناسبك داخل نطاق الخدمة.',
  },
  {
    title: 'إجابات شرعية موثّقة',
    body: 'أسئلتك تُجاب عليها ونُشر إجاباتها علنًا في صفحة الأسئلة ليستفيد منها غيرك.',
  },
];

/**
 * The paperwork a couple must bring to the appointment.
 *
 * `n` is the Arabic-Indic ordinal shown in the badge; `text` is the requirement
 * itself. They are stored apart only so the numeral can sit in the badge rather
 * than inside the sentence — the rendered line reads identically to the source.
 *
 * `icon` names a glyph in RequiredDocuments' local icon set.
 */
export const requiredDocuments = [
  { n: '١', icon: 'idCard', text: 'بطاقة الزوج + ثلاث صور منها.' },
  { n: '٢', icon: 'idCardAlt', text: 'بطاقة الزوجة + ثلاث صور منها.' },
  {
    n: '٣',
    icon: 'guardian',
    text: 'بطاقة وكيل الزوجة (الوالد أو الأخ أو العم أو الخال) + صورة منها.',
  },
  { n: '٤', icon: 'photo', text: '٦ صور شخصية لكل من الزوج والزوجة.' },
  { n: '٥', icon: 'health', text: 'شهادة صحية من مستشفى حكومي أو وحدة طب أسرة.' },
  { n: '٦', icon: 'divorce', text: 'إشهاد طلاق رسمي إذا كانت الزوجة مطلقة.' },
  { n: '٧', icon: 'documents', text: 'وثيقة الزواج + شهادة وفاة الزوج إذا كانت الزوجة أرملة.' },
  { n: '٨', icon: 'certificate', text: 'أصل شهادة الميلاد للزوج والزوجة.' },
];

export const requiredDocumentsHeading = {
  title: 'المستندات المطلوبة لعقد الزواج',
  subtitle:
    'يرجى تجهيز المستندات التالية قبل موعد عقد الزواج لتسهيل إنهاء جميع الإجراءات.',
};

/** The highlighted note that closes the checklist. */
export const requiredDocumentsNote =
  'يرجى التأكد من صحة جميع البيانات وإحضار أصول المستندات المطلوبة يوم عقد الزواج.';

/**
 * The primary navigation.
 *
 * `/services` and `/guides` are the two silo hubs, and they sit here rather than
 * only in the footer because header links are the strongest internal links a site
 * has — they appear on every page, and they tell a crawler what the site
 * considers its own main subjects. A hub reachable only from the footer is a hub
 * Google reads as an afterthought.
 */
export const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/services', label: 'الخدمات' },
  { href: '/guides', label: 'الأدلة' },
  { href: '/articles', label: 'الفتاوى' },
  { href: '/questions', label: 'اسأل المأذون' },
];

/**
 * Homepage sections that are also reachable from the navigation.
 *
 * Kept apart from `navLinks` because they are a different kind of link: they point
 * at a *section*, not a page, so they are active only while that section is under
 * the header, and from any other page they navigate home first. `id` is the anchor
 * the scroll-spy observes.
 */
export const sectionLinks = [
  { id: 'documents', href: '/#documents', emoji: '📄', label: 'المستندات المطلوبة' },
  { id: 'location', href: '/#location', emoji: '📍', label: 'عنوان المكتب' },
];

/** Services offered — drives the homepage services grid. */
export const services = [
  {
    title: 'توثيق عقد الزواج',
    description: 'إتمام وتوثيق عقد الزواج رسميًا في المحكمة، مع استخراج قسيمة الزواج الموثّقة.',
  },
  {
    title: 'الطلاق والرجعة',
    description: 'توثيق إشهادات الطلاق والرجعة وفق أحكام الشريعة والقانون المصري.',
  },
  {
    title: 'زواج الأجانب',
    description: 'إجراءات زواج غير المصريين والتنسيق مع وزارة العدل والسفارات والقنصليات.',
  },
  {
    title: 'التصادق وإثبات الزواج',
    description: 'توثيق عقود التصادق وإثبات العلاقة الزوجية بالطرق الشرعية والقانونية.',
  },
];

/** The six FAQs that were already hard-coded into the questions page. */
export const faqs = [
  {
    question: 'ما هي شروط صحة الزواج؟',
    answer:
      'أن تكون الزوجة غير محرَّمة على من يريد الزواج بها بأي سبب من أسباب التحريم، وأن يحضر عقد الزواج شاهدان.',
  },
  {
    question: 'ما الذي يصلح أن يكون مهرًا؟',
    answer:
      'يكون المهر من الذهب أو الفضة، مضروبَين أو غير مضروبَين. ويصلح أن يكون مهرًا كل شيء معلوم له قيمة مالية، من عقار أو منقول، سواء كان مكيالًا أو موزونًا أو حيوانًا، أو من منافع الأعيان مثل المنازل والأراضي — كل ما له قيمة مالية.',
  },
  {
    question: 'ما النتائج المترتبة على عدم توثيق عقد الزواج؟',
    answer:
      'يترتب على ذلك عدم حصول الزوجة على أي حقوق ناشئة عن عقد الزواج، فيما عدا إثبات النسب للأطفال.',
  },
  {
    question: 'ما هي إجراءات توثيق عقد الزواج في مصر؟',
    answer:
      'يقوم المأذون بتوثيق عقد الزواج في المحكمة في الدفاتر المُعدّة لذلك، ويحصل الزوجان بعدها على صور رسمية موثّقة من قسيمة الزواج. كما يمنح المأذون الزوجين شهادة تفيد بحدوث الزواج، حتى يتسنّى لهما قضاء شهر العسل في الفنادق بذلك الإثبات الشرعي.',
  },
  {
    question: 'كيف يمكن الحصول على شهادة زواج مميكنة؟',
    answer:
      'يتم التوجّه بصورة من قسيمة الزواج إلى السجل المدني المميكن لاستصدار شهادة الزواج المميكنة.',
  },
  {
    question: 'هل يمكن وضع شروط في عقد الزواج؟',
    answer:
      'نعم، يمكن وضع شروط على الزوج في عقد الزواج، مثل اشتراط عدم الزواج بأخرى، أو اشتراط عمل الزوجة بعد الزواج أو احتفاظها بعملها.',
  },
];
