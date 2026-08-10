/* =========================================================================
   Trade Finance Reference — ISBP 821 topic index
   ICC International Standard Banking Practice for the Examination of
   Documents under UCP 600, 2023 revision, ICC Publication No. 821, in force
   since 1 July 2023 (superseding the 2013 edition, ISBP 745).

   IMPORTANT — SCOPE AND VERIFICATION LIMITATION:
   This is a TOPIC INDEX, not a paragraph-by-paragraph reproduction of ISBP
   821. The topic/section structure below is carried over from the
   well-documented 2013 predecessor (ISBP 745, sections A–Q, ~298
   paragraphs), which multiple secondary sources describe ISBP 821 as
   retaining at the section level while updating specific points (credit
   reference numbers, administrative conditions in credits, abbreviations,
   invoice requirements, and alignment with ICC Opinions issued 2013–2023).
   This environment's network access could not reach the primary ICC
   publication to independently confirm the exact 2023 section list,
   paragraph numbering, or wording. Unable to independently verify the
   ISBP 821 section-by-section structure from a primary source — treat the
   topic groupings below as a general orientation to what ISBP addresses per
   document type, not as a citation of the current official text, and verify
   against the official ICC ISBP 821 publication before relying on this for
   a live presentation.
   ========================================================================= */

export const ISBP821 = [
    { id: 'isbp-general', ref: { en: 'General Principles', ar: 'المبادئ العامة' },
      title: { en: 'General principles of document examination', ar: 'المبادئ العامة لفحص المستندات' },
      summary: { en: 'Cross-document topics that apply to every presentation: abbreviations and how they are read, what counts as a signature, correction of data, language requirements, calculation of dates and figures, and how the presented documents must relate to each other and to the credit. Relates to UCP 600 Articles 2, 3, and 14.',
        ar: 'موضوعات عامة تسري على كل تقديم: الاختصارات وطريقة قراءتها، ما يُعد توقيعاً، تصحيح البيانات، متطلبات اللغة، حساب التواريخ والأرقام، وكيفية ترابط المستندات المقدَّمة فيما بينها ومع الاعتماد. ذات صلة بالمواد 2 و3 و14 من UCP 600.' },
      keywords: { en: ['abbreviations', 'signature', 'correction', 'language'], ar: ['اختصارات', 'توقيع', 'تصحيح'] } },
    { id: 'isbp-drafts', ref: { en: 'Drafts and Maturity', ar: 'الكمبيالات وتاريخ الاستحقاق' },
      title: { en: 'Drafts (bills of exchange) and calculation of maturity date', ar: 'الكمبيالات وحساب تاريخ الاستحقاق' },
      summary: { en: 'How a draft/bill of exchange must be drawn and endorsed, and how to calculate a maturity date expressed as a tenor from a specific event (e.g. "90 days after bill of lading date") when the credit requires deferred payment or acceptance.',
        ar: 'كيفية تحرير الكمبيالة وتظهيرها، وكيفية حساب تاريخ الاستحقاق عند التعبير عنه كمدة زمنية من واقعة محددة (مثل "90 يوماً من تاريخ بوليصة الشحن") عندما يشترط الاعتماد الدفع المؤجل أو القبول.' },
      keywords: { en: ['bill of exchange', 'draft', 'maturity', 'tenor', 'usance'], ar: ['كمبيالة', 'تاريخ الاستحقاق', 'أجل'] } },
    { id: 'isbp-invoices', ref: { en: 'Invoices', ar: 'الفواتير' },
      title: { en: 'Commercial invoices', ar: 'الفواتير التجارية' },
      summary: { en: 'Detailed practice on invoice content beyond UCP 600 Article 18 — description of goods matching the credit, unit price and Incoterm consistency, quantities and amounts, and treatment of trade/early-payment discounts shown on the invoice.',
        ar: 'ممارسات تفصيلية بشأن محتوى الفاتورة تتجاوز المادة 18 من UCP 600، تشمل تطابق وصف البضاعة مع الاعتماد، واتساق سعر الوحدة وشرط التسليم (Incoterm)، والكميات والمبالغ، ومعالجة الخصومات التجارية أو خصومات السداد المبكر الظاهرة في الفاتورة.' },
      keywords: { en: ['commercial invoice', 'description of goods', 'incoterm', 'discount'], ar: ['فاتورة تجارية', 'وصف البضاعة'] } },
    { id: 'isbp-multimodal', ref: { en: 'Multimodal Transport Documents', ar: 'مستندات النقل المتعدد الوسائط' },
      title: { en: 'Transport documents covering at least two modes of transport', ar: 'مستندات النقل المُغطية لوسيلتي نقل على الأقل' },
      summary: { en: 'Practice on multimodal/combined transport documents beyond UCP 600 Article 19 — how carrier, agent, and signatory capacities must be shown, and how "taking in charge", dispatch, and on-board notations are read.',
        ar: 'ممارسات بشأن مستندات النقل المتعدد الوسائط أو المُجمَّع تتجاوز المادة 19 من UCP 600، تشمل كيفية بيان صفة الناقل والوكيل والموقِّع، وكيفية قراءة ملاحظات "الاستلام للشحن" والإرسال والشحن على متن السفينة.' },
      keywords: { en: ['multimodal', 'combined transport', 'taking in charge'], ar: ['نقل متعدد الوسائط'] } },
    { id: 'isbp-bl', ref: { en: 'Bill of Lading', ar: 'بوليصة الشحن البحري' },
      title: { en: 'Marine/ocean bills of lading', ar: 'بوالص الشحن البحري' },
      summary: { en: 'Detailed practice supplementing UCP 600 Article 20 — identifying the carrier and master/agent signature, reading "intended vessel" and on-board notations, transhipment clauses, and consignee/notify-party requirements.',
        ar: 'ممارسات تفصيلية تكمِّل المادة 20 من UCP 600، تشمل تحديد الناقل وتوقيع الربان أو الوكيل، وقراءة ملاحظات "السفينة المزمعة" والشحن على متن السفينة، وشروط الشحن العابر (الترانزيت)، ومتطلبات المرسل إليه وطرف الإخطار.' },
      keywords: { en: ['bill of lading', 'on board', 'transhipment', 'notify party'], ar: ['بوليصة شحن', 'ترانزيت'] } },
    { id: 'isbp-waybill', ref: { en: 'Sea Waybill', ar: 'بوليصة الشحن البحري غير القابلة للتداول' },
      title: { en: 'Non-negotiable sea waybills', ar: 'بوالص الشحن البحري غير القابلة للتداول' },
      summary: { en: 'Practice parallel to the bill of lading section, applied to non-negotiable sea waybills under UCP 600 Article 21.',
        ar: 'ممارسات مماثلة لقسم بوليصة الشحن، تُطبَّق على بوالص الشحن البحري غير القابلة للتداول بموجب المادة 21 من UCP 600.' },
      keywords: { en: ['sea waybill', 'non-negotiable'], ar: ['بوليصة غير قابلة للتداول'] } },
    { id: 'isbp-charter', ref: { en: 'Charter Party Bill of Lading', ar: 'بوليصة الشحن بموجب مشارطة إيجار' },
      title: { en: 'Charter party bills of lading', ar: 'بوالص الشحن بموجب مشارطة إيجار' },
      summary: { en: 'Practice supplementing UCP 600 Article 22, including how master/owner/charterer signature capacity is shown and how "freight payable as per charter party" clauses are treated.',
        ar: 'ممارسات تكمِّل المادة 22 من UCP 600، تشمل كيفية بيان صفة توقيع الربان أو المالك أو المستأجر، ومعالجة شروط "أجرة الشحن تُدفع وفقاً لمشارطة الإيجار".' },
      keywords: { en: ['charter party', 'freight payable'], ar: ['مشارطة إيجار'] } },
    { id: 'isbp-air', ref: { en: 'Air Transport Document', ar: 'مستند النقل الجوي' },
      title: { en: 'Air waybills and air transport documents', ar: 'بوالص الشحن الجوي ومستندات النقل الجوي' },
      summary: { en: 'Practice supplementing UCP 600 Article 23, including how the actual flight date is distinguished from the issuance date, and how consignee/agent details are read.',
        ar: 'ممارسات تكمِّل المادة 23 من UCP 600، تشمل التمييز بين تاريخ الرحلة الفعلي وتاريخ الإصدار، وقراءة بيانات المرسل إليه والوكيل.' },
      keywords: { en: ['air waybill', 'flight date'], ar: ['بوليصة شحن جوي'] } },
    { id: 'isbp-road', ref: { en: 'Road, Rail or Inland Waterway', ar: 'النقل البري والسكك الحديدية والمائي الداخلي' },
      title: { en: 'Road, rail, and inland waterway transport documents', ar: 'مستندات النقل البري والسكك الحديدية والمائي الداخلي' },
      summary: { en: 'Practice supplementing UCP 600 Article 24 for consignment notes and similar documents used in surface transport.',
        ar: 'ممارسات تكمِّل المادة 24 من UCP 600 بشأن سندات الشحن والمستندات المماثلة المستخدمة في النقل البري.' },
      keywords: { en: ['consignment note', 'road transport', 'rail'], ar: ['سند شحن بري'] } },
    { id: 'isbp-insurance', ref: { en: 'Insurance Document', ar: 'مستند التأمين' },
      title: { en: 'Insurance documents and coverage', ar: 'مستندات التأمين والتغطية' },
      summary: { en: 'Detailed practice supplementing UCP 600 Article 28 — who may issue and sign, how the insured risks and percentage of coverage are read, and how the insurance date is checked against the shipment date.',
        ar: 'ممارسات تفصيلية تكمِّل المادة 28 من UCP 600، تشمل الجهات المخوَّلة بالإصدار والتوقيع، وكيفية قراءة المخاطر المؤمَّن عليها ونسبة التغطية، والتحقق من تاريخ التأمين مقابل تاريخ الشحن.' },
      keywords: { en: ['insurance policy', 'certificate of insurance', 'coverage'], ar: ['وثيقة تأمين', 'شهادة تأمين'] } },
    { id: 'isbp-origin', ref: { en: 'Certificate of Origin', ar: 'شهادة المنشأ' },
      title: { en: 'Certificates of origin', ar: 'شهادات المنشأ' },
      summary: { en: 'Practice on who may issue a certificate of origin, consistency of the exporter/consignee and goods description with other documents, and when a chamber of commerce or similar issuer is required.',
        ar: 'ممارسات بشأن الجهات المخوَّلة بإصدار شهادة المنشأ، واتساق بيانات المُصدِّر والمرسل إليه ووصف البضاعة مع بقية المستندات، والحالات التي تُشترط فيها غرفة تجارة أو جهة مماثلة كمُصدر للشهادة.' },
      keywords: { en: ['certificate of origin', 'chamber of commerce'], ar: ['شهادة منشأ', 'غرفة تجارة'] } },
    { id: 'isbp-packing', ref: { en: 'Packing and Weight Lists', ar: 'قوائم التعبئة والوزن' },
      title: { en: 'Packing lists and weight lists', ar: 'قوائم التعبئة وقوائم الوزن' },
      summary: { en: 'Practice on consistency of packing and weight details across the packing/weight list, invoice, and transport document.',
        ar: 'ممارسات بشأن اتساق تفاصيل التعبئة والوزن بين قائمة التعبئة أو الوزن والفاتورة ومستند النقل.' },
      keywords: { en: ['packing list', 'weight list'], ar: ['قائمة تعبئة', 'قائمة وزن'] } },
    { id: 'isbp-beneficiary-cert', ref: { en: "Beneficiary's Certificate", ar: 'شهادة المستفيد' },
      title: { en: "Beneficiary's certificates", ar: 'شهادات المستفيد' },
      summary: { en: 'Practice on how a credit requirement for a beneficiary-issued certificate or statement is satisfied, including signature requirements.',
        ar: 'ممارسات بشأن كيفية الوفاء بشرط الاعتماد المتعلق بشهادة أو بيان صادر من المستفيد، بما في ذلك متطلبات التوقيع.' },
      keywords: { en: ["beneficiary's certificate", 'statement'], ar: ['شهادة المستفيد'] } },
    { id: 'isbp-other-certs', ref: { en: 'Other Certificates', ar: 'شهادات أخرى' },
      title: { en: 'Analysis, inspection, health, phytosanitary and other certificates', ar: 'شهادات التحليل والفحص والصحة والصحة النباتية وغيرها' },
      summary: { en: 'Practice on certificates issued by inspection agencies, health/phytosanitary authorities, and similar independent third parties, including who may sign and how their content must relate to the goods and other documents.',
        ar: 'ممارسات بشأن الشهادات الصادرة عن جهات التفتيش والسلطات الصحية أو الصحة النباتية وأطراف مستقلة مماثلة، بما في ذلك الجهات المخوَّلة بالتوقيع وكيفية ارتباط محتواها بالبضاعة وبقية المستندات.' },
      keywords: { en: ['inspection certificate', 'phytosanitary', 'health certificate'], ar: ['شهادة تفتيش', 'شهادة صحية'] } }
  ];
