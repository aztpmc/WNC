/* =========================================================================
   Trade Finance Reference — Incoterms 2020 responsibility matrix
   Which party (buyer, seller, or negotiable) bears each cost/obligation
   under each of the 11 Incoterms® 2020 rules. This is an ORIGINAL table —
   own layout, own column order, own design — built from the underlying,
   non-copyrightable allocation facts (who pays what), cross-checked
   against IncoDocs' "Incoterms 2020 Rules Responsibility Quick Reference
   Guide" (© 2020 IncoSolutions Pty Ltd) as a secondary source, and against
   the rule mechanics already verified elsewhere in this tool. This is not
   a reproduction of that (or any) copyrighted chart's graphic design, and
   this tool has no affiliation with IncoDocs/IncoSolutions Pty Ltd or the
   ICC. Always verify against the official ICC Incoterms® 2020 publication.
   ========================================================================= */

// Read left (seller's end) to right (buyer's end), the order goods and
// costs actually flow in a shipment -- not the source chart's own column
// order, which ran the opposite direction.
export const OBLIGATIONS = [
    { key: 'exportPacking', en: 'Export packaging', ar: 'تعبئة التصدير' },
    { key: 'loadingCharges', en: 'Loading charges (at origin)', ar: 'رسوم التحميل (في المنشأ)' },
    { key: 'deliveryToPort', en: 'Delivery to port/place of shipment', ar: 'التسليم إلى ميناء أو مكان الشحن' },
    { key: 'exportCustoms', en: 'Export duty, taxes & customs clearance', ar: 'رسوم وضرائب التصدير والتخليص الجمركي' },
    { key: 'originTerminal', en: 'Origin terminal charges', ar: 'رسوم محطة المنشأ' },
    { key: 'loadingOnCarriage', en: 'Loading on main carriage', ar: 'التحميل على وسيلة النقل الرئيسية' },
    { key: 'carriageCharges', en: 'Carriage (freight) charges', ar: 'أجرة النقل (الشحن)' },
    { key: 'insurance', en: 'Cargo insurance', ar: 'التأمين على البضاعة' },
    { key: 'destTerminal', en: 'Destination terminal charges', ar: 'رسوم محطة الوجهة' },
    { key: 'deliveryToDest', en: 'Delivery to destination', ar: 'التسليم إلى الوجهة' },
    { key: 'unloading', en: 'Unloading at destination', ar: 'التفريغ في الوجهة' },
    { key: 'importCustoms', en: 'Import duty, taxes & customs clearance', ar: 'رسوم وضرائب الاستيراد والتخليص الجمركي' }
  ];

  var B = 'buyer', S = 'seller', N = 'negotiable';

  // Values per rule, in the OBLIGATIONS order above.
export const MATRIX = {
    EXW: [S, B, B, B, B, B, B, N, B, B, B, B],
    FCA: [S, S, S, S, B, B, B, N, B, B, B, B],
    FAS: [S, S, S, S, S, B, B, N, B, B, B, B],
    FOB: [S, S, S, S, S, S, B, N, B, B, B, B],
    CFR: [S, S, S, S, S, S, S, N, B, B, B, B],
    CIF: [S, S, S, S, S, S, S, { v: S, note: 'cif' }, B, B, B, B],
    CPT: [S, S, S, S, S, S, S, N, S, B, B, B],
    CIP: [S, S, S, S, S, S, S, { v: S, note: 'cip' }, S, B, B, B],
    DAP: [S, S, S, S, S, S, S, N, S, S, B, B],
    DPU: [S, S, S, S, S, S, S, N, S, S, S, B],
    DDP: [S, S, S, S, S, S, S, N, S, S, B, S]
  };

export const TRANSFER_OF_RISK = {
    EXW: { en: 'At buyer’s disposal (seller’s premises)', ar: 'تحت تصرف المشتري (في مقر البائع)' },
    FCA: { en: 'On handover to the buyer’s carrier', ar: 'عند التسليم لناقل المشتري' },
    FAS: { en: 'Alongside the vessel', ar: 'بجانب السفينة' },
    FOB: { en: 'On board the vessel', ar: 'على متن السفينة' },
    CFR: { en: 'On board the vessel', ar: 'على متن السفينة' },
    CIF: { en: 'On board the vessel', ar: 'على متن السفينة' },
    CPT: { en: 'On handover to the first carrier', ar: 'عند التسليم لأول ناقل' },
    CIP: { en: 'On handover to the first carrier', ar: 'عند التسليم لأول ناقل' },
    DAP: { en: 'At the named place, ready for unloading', ar: 'في المكان المحدد، جاهزة للتفريغ' },
    DPU: { en: 'At the named place, after unloading', ar: 'في المكان المحدد، بعد التفريغ' },
    DDP: { en: 'At the named place, ready for unloading', ar: 'في المكان المحدد، جاهزة للتفريغ' }
  };

export const FREIGHT_TERMS = {
    EXW: 'collect', FCA: 'collect', FAS: 'collect', FOB: 'collect',
    CFR: 'prepaid', CIF: 'prepaid', CPT: 'prepaid', CIP: 'prepaid',
    DAP: 'prepaid', DPU: 'prepaid', DDP: 'prepaid'
  };

export const NOTES = {
    cif: { en: 'CIF requires cargo insurance with at least the minimum cover of Institute Cargo Clauses (C) — a number of listed risks, subject to itemized exclusions.',
      ar: 'يشترط CIF تأميناً على البضاعة بحد أدنى تغطية شروط معهد لندن للتأمين الفئة (C) — عدد محدد من المخاطر المدرجة، مع استثناءات مفصلة.' },
    cip: { en: 'CIP requires cargo insurance with at least the minimum cover of Institute Cargo Clauses (A) — all risks, subject to itemized exclusions.',
      ar: 'يشترط CIP تأميناً على البضاعة بحد أدنى تغطية شروط معهد لندن للتأمين الفئة (A) — جميع المخاطر، مع استثناءات مفصلة.' }
  };
