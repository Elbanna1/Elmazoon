/**
 * The topical map.
 *
 * A silo is not a category label — it is a claim about what this site is an
 * authority on, and every page must sit inside exactly one of them. Six silos,
 * each one a subject a person could plausibly spend a whole search session
 * inside, and between them they cover the whole of a ma'zoun's professional
 * surface. Nothing here exists to hold a keyword; if a silo could not support a
 * hub page a reader would actually read, it should not be a silo.
 *
 * Internal linking is derived from this structure rather than hand-maintained:
 * every page links up to its silo hub, the hub links down to every page in it,
 * and pages link across to their declared `related`. That is what makes the link
 * graph a lattice instead of a list, and it is the single largest thing standing
 * between a 20-page site and a site Google reads as a subject-matter authority.
 */

export const silos = {
  marriage: {
    id: 'marriage',
    title: 'الزواج وعقد القران',
    short: 'الزواج',
    description:
      'أركان عقد الزواج وشروط صحته، والولاية والشهود، وما يُشترط لصحة العقد شرعًا وقانونًا.',
  },

  documentation: {
    id: 'documentation',
    title: 'توثيق الزواج',
    short: 'التوثيق',
    description:
      'إجراءات توثيق عقد الزواج في المحكمة، والأوراق المطلوبة، واستخراج قسيمة الزواج وشهادة الزواج المميكنة.',
  },

  rights: {
    id: 'rights',
    title: 'الحقوق والمهر',
    short: 'الحقوق',
    description:
      'المهر والشبكة والمؤخر وقائمة المنقولات، وحقوق الزوجة وحقوق الزوج، والشروط التي تُكتب في العقد.',
  },

  divorce: {
    id: 'divorce',
    title: 'الطلاق والرجعة',
    short: 'الطلاق',
    description:
      'أحكام الطلاق وأنواعه، وتوثيق إشهاد الطلاق، والرجعة وشروطها، والعدة ومدتها.',
  },

  foreigners: {
    id: 'foreigners',
    title: 'زواج الأجانب',
    short: 'زواج الأجانب',
    description:
      'إجراءات زواج غير المصريين في مصر، والتنسيق مع وزارة العدل والسفارات، والأوراق المطلوبة.',
  },

  proof: {
    id: 'proof',
    title: 'إثبات الزواج والتصادق',
    short: 'الإثبات',
    description:
      'إثبات العلاقة الزوجية، وعقود التصادق، والزواج العرفي وما يترتب عليه من آثار.',
  },
};

export const siloList = Object.values(silos);
