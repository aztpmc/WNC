/* =========================================================================
   Trade Finance Reference — Incoterms 2020 data
   11 rules published by the ICC, effective 1 January 2020. Content below is
   an original plain-language summary of publicly known rule mechanics
   (delivery point, risk transfer, cost split, mode of transport), not a
   reproduction of ICC's copyrighted rule text. Verify against the official
   ICC Incoterms 2020 publication before relying on this for a live
   transaction or contract drafting.
   ========================================================================= */

export const INCOTERMS = [
    {
      id: 'inc-exw', source: 'incoterms', ref: 'EXW', number: 1,
      group: { en: 'Any mode of transport', ar: 'أي وسيلة نقل' },
      title: { en: 'Ex Works', ar: 'تسليم في المصنع' },
      summary: {
        en: 'The seller’s only obligation is to make the goods available at their own premises (factory, warehouse). The buyer bears all cost and risk from that point on, including loading, export clearance, and the entire carriage. This places the maximum obligation on the buyer and the minimum on the seller.',
        ar: 'لا يلتزم البائع سوى بوضع البضاعة تحت تصرف المشتري في مقره (المصنع أو المستودع). يتحمل المشتري كل التكلفة والمخاطر من تلك اللحظة، بما في ذلك التحميل والتخليص الجمركي للتصدير وكامل عملية النقل. هذا الشرط يضع أقصى الالتزامات على المشتري وأدناها على البائع.'
      },
      keywords: { en: ['ex works', 'factory', 'minimum seller obligation', 'seller premises'], ar: ['تسليم المصنع', 'أقل التزام على البائع'] }
    },
    {
      id: 'inc-fca', source: 'incoterms', ref: 'FCA', number: 2,
      group: { en: 'Any mode of transport', ar: 'أي وسيلة نقل' },
      title: { en: 'Free Carrier', ar: 'التسليم للناقل' },
      summary: {
        en: 'The seller delivers the goods, cleared for export, to a carrier or another person nominated by the buyer at a named place. Risk transfers at that named place. FCA is the rule the ICC recommends over FOB when goods are containerized rather than loaded directly onto a vessel.',
        ar: 'يسلم البائع البضاعة، بعد تخليصها جمركياً للتصدير، إلى الناقل أو إلى شخص آخر يعينه المشتري في مكان محدد، وتنتقل المخاطر عند ذلك المكان. توصي غرفة التجارة الدولية باستخدام FCA بدلاً من FOB عندما تكون البضاعة معبأة في حاويات ولا تُحمَّل مباشرة على ظهر السفينة.'
      },
      keywords: { en: ['free carrier', 'container', 'named place', 'export clearance'], ar: ['حرية الناقل', 'حاويات'] }
    },
    {
      id: 'inc-cpt', source: 'incoterms', ref: 'CPT', number: 3,
      group: { en: 'Any mode of transport', ar: 'أي وسيلة نقل' },
      title: { en: 'Carriage Paid To', ar: 'النقل مدفوع إلى' },
      summary: {
        en: 'The seller pays for carriage to a named destination, but risk transfers to the buyer as soon as the goods are handed to the first carrier — not at the destination. Cost and risk transfer at different points, which is the key thing to watch with this rule.',
        ar: 'يدفع البائع أجرة النقل إلى وجهة محددة، لكن المخاطر تنتقل إلى المشتري بمجرد تسليم البضاعة إلى أول ناقل، وليس عند الوجهة النهائية. تنتقل التكلفة والمخاطر عند نقطتين مختلفتين، وهذه هي النقطة الجوهرية التي يجب الانتباه إليها في هذا الشرط.'
      },
      keywords: { en: ['carriage paid to', 'first carrier', 'named destination'], ar: ['النقل مدفوع', 'أول ناقل'] }
    },
    {
      id: 'inc-cip', source: 'incoterms', ref: 'CIP', number: 4,
      group: { en: 'Any mode of transport', ar: 'أي وسيلة نقل' },
      title: { en: 'Carriage and Insurance Paid To', ar: 'النقل والتأمين مدفوعان إلى' },
      summary: {
        en: 'Same delivery and risk-transfer mechanics as CPT, but the seller must also procure cargo insurance for the buyer. Incoterms 2020 raised the required insurance level for CIP to Institute Cargo Clauses (A) — the widest cover — unlike CIF, which still only requires the minimum cover (C).',
        ar: 'آلية التسليم وانتقال المخاطر مطابقة لشرط CPT، إلا أن البائع ملزم أيضاً بتأمين البضاعة لصالح المشتري. رفعت نسخة Incoterms 2020 مستوى التغطية التأمينية المطلوبة في CIP إلى شروط معهد لندن للتأمين على البضائع الفئة (A) وهي الأوسع تغطية، بخلاف شرط CIF الذي لا يزال يتطلب الحد الأدنى من التغطية (C).'
      },
      keywords: { en: ['carriage and insurance', 'institute cargo clauses A', 'insurance cover'], ar: ['التأمين على البضائع', 'الفئة أ'] }
    },
    {
      id: 'inc-dap', source: 'incoterms', ref: 'DAP', number: 5,
      group: { en: 'Any mode of transport', ar: 'أي وسيلة نقل' },
      title: { en: 'Delivered at Place', ar: 'التسليم في المكان المحدد' },
      summary: {
        en: 'The seller delivers when the goods are placed at the buyer’s disposal at the named destination, ready for unloading, with the seller bearing all cost and risk of the carriage to get there. Import clearance and duties remain the buyer’s responsibility.',
        ar: 'يتم التسليم عندما تُوضع البضاعة تحت تصرف المشتري في الوجهة المحددة جاهزة للتفريغ، ويتحمل البائع كل تكلفة ومخاطر النقل حتى الوصول إلى تلك الوجهة. يبقى التخليص الجمركي للاستيراد والرسوم الجمركية على عاتق المشتري.'
      },
      keywords: { en: ['delivered at place', 'named destination', 'ready for unloading'], ar: ['التسليم في المكان'] }
    },
    {
      id: 'inc-dpu', source: 'incoterms', ref: 'DPU', number: 6,
      group: { en: 'Any mode of transport', ar: 'أي وسيلة نقل' },
      title: { en: 'Delivered at Place Unloaded', ar: 'التسليم في المكان مُفرَّغاً' },
      summary: {
        en: 'The only Incoterms 2020 rule that requires the seller to unload the goods at the named destination — the successor to the 2010 rule DAT (Delivered at Terminal), renamed and broadened to any place, not just a terminal. Import clearance remains the buyer’s responsibility.',
        ar: 'الشرط الوحيد في نسخة Incoterms 2020 الذي يُلزم البائع بتفريغ البضاعة في الوجهة المحددة، وهو الشرط الذي حل محل DAT (التسليم في المحطة) من نسخة 2010 بعد إعادة تسميته وتوسيع نطاقه ليشمل أي مكان وليس فقط المحطات. يبقى التخليص الجمركي للاستيراد على عاتق المشتري.'
      },
      keywords: { en: ['delivered at place unloaded', 'formerly DAT', 'unloading obligation'], ar: ['التسليم مفرغاً', 'محطة'] }
    },
    {
      id: 'inc-ddp', source: 'incoterms', ref: 'DDP', number: 7,
      group: { en: 'Any mode of transport', ar: 'أي وسيلة نقل' },
      title: { en: 'Delivered Duty Paid', ar: 'التسليم مع دفع الرسوم الجمركية' },
      summary: {
        en: 'Places the maximum obligation on the seller: delivery at the named destination, with the seller also clearing the goods for import and paying any import duty and tax. The mirror image of EXW.',
        ar: 'يضع أقصى الالتزامات على عاتق البائع: التسليم في الوجهة المحددة، مع تولي البائع أيضاً التخليص الجمركي للاستيراد ودفع أي رسوم أو ضرائب استيراد. وهو الشرط المقابل تماماً لشرط EXW.'
      },
      keywords: { en: ['delivered duty paid', 'maximum seller obligation', 'import duty'], ar: ['رسوم جمركية', 'أقصى التزام على البائع'] }
    },
    {
      id: 'inc-fas', source: 'incoterms', ref: 'FAS', number: 8,
      group: { en: 'Sea and inland waterway transport', ar: 'النقل البحري والنهري' },
      title: { en: 'Free Alongside Ship', ar: 'التسليم بجانب السفينة' },
      summary: {
        en: 'The seller delivers when the goods are placed alongside the vessel nominated by the buyer at the named port of shipment. Risk transfers at that point; the buyer handles loading onward. Only appropriate for bulk/break-bulk cargo, not containerized goods.',
        ar: 'يتم التسليم عندما تُوضع البضاعة بجانب السفينة التي يعينها المشتري في ميناء الشحن المحدد، وتنتقل المخاطر عند تلك النقطة، ويتولى المشتري عملية التحميل على متن السفينة. لا يُستخدم هذا الشرط إلا مع البضائع السائبة أو غير المعبأة في حاويات.'
      },
      keywords: { en: ['free alongside ship', 'bulk cargo', 'port of shipment'], ar: ['بجانب السفينة', 'بضائع سائبة'] }
    },
    {
      id: 'inc-fob', source: 'incoterms', ref: 'FOB', number: 9,
      group: { en: 'Sea and inland waterway transport', ar: 'النقل البحري والنهري' },
      title: { en: 'Free on Board', ar: 'التسليم ظهر السفينة' },
      summary: {
        en: 'The seller delivers the goods on board the vessel nominated by the buyer; risk transfers once the goods are on board. Widely misused for containerized cargo, where FCA is the technically correct rule — the ICC explicitly discourages FOB for container shipments.',
        ar: 'يسلم البائع البضاعة على متن السفينة التي يعينها المشتري، وتنتقل المخاطر بمجرد وضع البضاعة على متن السفينة. يُساء استخدام هذا الشرط كثيراً مع البضائع المعبأة في حاويات، حيث يُعد شرط FCA هو الصحيح فنياً في تلك الحالة، وتنصح غرفة التجارة الدولية صراحة بعدم استخدام FOB لشحنات الحاويات.'
      },
      keywords: { en: ['free on board', 'on board vessel', 'container misuse'], ar: ['ظهر السفينة', 'حاويات'] }
    },
    {
      id: 'inc-cfr', source: 'incoterms', ref: 'CFR', number: 10,
      group: { en: 'Sea and inland waterway transport', ar: 'النقل البحري والنهري' },
      title: { en: 'Cost and Freight', ar: 'التكلفة وأجرة الشحن' },
      summary: {
        en: 'The seller pays the cost and freight to bring the goods to the named port of destination, but risk transfers to the buyer once the goods are on board the vessel at the port of shipment — the sea-freight counterpart to CPT.',
        ar: 'يدفع البائع تكلفة وأجرة الشحن لإيصال البضاعة إلى ميناء الوجهة المحدد، لكن المخاطر تنتقل إلى المشتري بمجرد وضع البضاعة على متن السفينة في ميناء الشحن، وهو النظير البحري لشرط CPT.'
      },
      keywords: { en: ['cost and freight', 'port of destination', 'on board risk transfer'], ar: ['التكلفة والشحن'] }
    },
    {
      id: 'inc-cif', source: 'incoterms', ref: 'CIF', number: 11,
      group: { en: 'Sea and inland waterway transport', ar: 'النقل البحري والنهري' },
      title: { en: 'Cost, Insurance and Freight', ar: 'التكلفة والتأمين وأجرة الشحن' },
      summary: {
        en: 'Same mechanics as CFR, plus the seller must procure cargo insurance for the buyer. Unlike CIP, Incoterms 2020 kept CIF’s minimum required insurance level at Institute Cargo Clauses (C), reflecting its continued use in bulk commodity trades where buyers often arrange their own additional cover.',
        ar: 'آلية مطابقة لشرط CFR، إلا أن البائع ملزم أيضاً بتأمين البضاعة لصالح المشتري. وخلافاً لشرط CIP، أبقت نسخة Incoterms 2020 الحد الأدنى للتغطية التأمينية المطلوبة في CIF عند شروط معهد لندن للتأمين الفئة (C)، بما يعكس استمرار استخدامه في تجارة السلع السائبة حيث كثيراً ما يرتب المشترون تغطية تأمينية إضافية خاصة بهم.'
      },
      keywords: { en: ['cost insurance and freight', 'institute cargo clauses C', 'bulk commodities'], ar: ['التأمين والشحن', 'الفئة ج'] }
    }
  ];
