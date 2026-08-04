// lib/constants/patient_reg_form.ts

import type { FormField, FormSection, SupportedLanguage } from "./form-types";
import {
  getAllFields as getAllFieldsFromSections,
  getConsentFields as getConsentFieldsFromSections,
  getDefaultValues as getDefaultValuesFromSections,
  getFieldsWithAgreement as getFieldsWithAgreementFromSections,
  getMasterSignatureField as getMasterSignatureFieldFromSections,
  getSectionById as getSectionByIdFromSections,
  getSignatureField as getSignatureFieldFromSections,
} from "./form-types";

export type { FormField, FormSection, SupportedLanguage } from "./form-types";

// =================================================================
// Shared Options (Nationality, Medical Services, Referral Sources)
// =================================================================
const NATIONALITY_OPTIONS = [
  { value: "TW", label: { en: "Taiwan", mm: "ထိုင်ဝမ်", zh: "台灣" } },
  { value: "MM", label: { en: "Myanmar", mm: "မြန်မာ", zh: "緬甸" } },
  { value: "US", label: { en: "United States", mm: "အမေရိကန်", zh: "美國" } },
  { value: "JP", label: { en: "Japan", mm: "ဂျပန်", zh: "日本" } },
  { value: "KR", label: { en: "South Korea", mm: "တောင်ကိုရီးယား", zh: "韓國" } },
  { value: "SG", label: { en: "Singapore", mm: "စင်ကာပူ", zh: "新加坡" } },
  { value: "MY", label: { en: "Malaysia", mm: "မလေးရှား", zh: "馬來西亞" } },
  { value: "TH", label: { en: "Thailand", mm: "ထိုင်း", zh: "泰國" } },
  { value: "VN", label: { en: "Vietnam", mm: "ဗီယက်နမ်", zh: "越南" } },
  { value: "PH", label: { en: "Philippines", mm: "ဖိလစ်ပိုင်", zh: "菲律賓" } },
  { value: "CN", label: { en: "China", mm: "တရုတ်", zh: "中國" } },
  { value: "HK", label: { en: "Hong Kong", mm: "ဟောင်ကောင်", zh: "香港" } },
  { value: "AU", label: { en: "Australia", mm: "ဩစတြေးလျ", zh: "澳洲" } },
  { value: "GB", label: { en: "United Kingdom", mm: "ယူနိုက်တက်ကင်းဒမ်း", zh: "英國" } },
  { value: "OTHER", label: { en: "Other", mm: "အခြား", zh: "其他" } },
];

// =================================================================
// Medical Services (Categorized for Section C)
// =================================================================
const MEDICAL_SERVICES = [
  {
    category: { en: "Men's Health & Urology", mm: "အမျိုးသားကျန်းမာရေးနှင့် ဆီးလမ်းကြောင်း", zh: "男性健康與泌尿科" },
    items: [
      { value: "erectile_dysfunction", label: { en: "Erectile Dysfunction", mm: "ပန်းသေရောဂါ", zh: "勃起功能障礙" } },
      { value: "testosterone_therapy", label: { en: "Testosterone Therapy (TRT)", mm: "ကျားဟော်မုန်းကုထုံး", zh: "睾固酮治療" } },
      { value: "circumcision", label: { en: "Circumcision", mm: "အရေဖျားလှီးခြင်း", zh: "包皮環切術" } },
      { value: "vasectomy", label: { en: "Vasectomy", mm: "သားကြောဖြတ်ခြင်း", zh: "輸精管結紮術" } },
      { value: "prostate_bladder", label: { en: "Prostate & Bladder Health", mm: "ဆီးကျိတ်နှင့် ဆီးအိမ်ကျန်းမာရေး", zh: "攝護腺與膀胱健康" } },
    ],
  },
  {
    category: { en: "Aesthetic & Anti-Aging", mm: "အလှအပနှင့် အိုမင်းမှုကာကွယ်ခြင်း", zh: "醫美與抗衰老" },
    items: [
      { value: "hair_restoration", label: { en: "Hair Restoration", mm: "ဆံပင်ပြန်လည်ပေါက်ရှင်ခြင်း", zh: "植髮" } },
      { value: "skin_tightening", label: { en: "Skin Tightening (HIFU)", mm: "အရေပြားတင်းရင်းခြင်း", zh: "超音波拉提" } },
      { value: "laser_hair_removal", label: { en: "Laser Hair Removal", mm: "လေဆာဖြင့်မွှေးဖယ်ခြင်း", zh: "雷射除毛" } },
      { value: "body_sculpting", label: { en: "Body Sculpting (BTL EMBODY)", mm: "ကိုယ်ခန္ဓာပုံစံပြုပြင်ခြင်း", zh: "體態雕塑" } },
    ],
  },
  {
    category: { en: "Wellness & Regeneration", mm: "ကျန်းမာရေးနှင့် ပြန်လည်အားဖြည့်ခြင်း", zh: "健康與再生" },
    items: [
      { value: "executive_screening", label: { en: "Executive Health Screening", mm: "အထူးကျန်းမာရေးစစ်ဆေးခြင်း", zh: "高階健檢" } },
      { value: "preventive_medicine", label: { en: "Preventive Medicine", mm: "ကြိုတင်ကာကွယ်ရေးဆေးပညာ", zh: "預防醫學" } },
      { value: "pelvic_floor", label: { en: "Pelvic Floor Therapy (BTL EMSELLA)", mm: "တင်ပါးဆုံကြွက်သားကုထုံး", zh: "骨盆底肌治療" } },
      { value: "sleep_disorders", label: { en: "Sleep Disorders", mm: "အိပ်စက်မှုပြဿနာ", zh: "睡眠障礙" } },
      { value: "chronic_pain", label: { en: "Chronic Pain", mm: "နာတာရှည်နာကျင်မှု", zh: "慢性疼痛" } },
      { value: "cognitive_health", label: { en: "Cognitive Health", mm: "ဦးနှောက်ကျန်းမာရေး", zh: "認知健康" } },
    ],
  },
];

// =================================================================
// Referral Sources
// =================================================================
const REFERRAL_SOURCES = [
  { value: "referral_partner", label: { en: "Referral Partner", mm: "မိတ်ဖက်လွှဲပြောင်းမှု", zh: "合作夥伴轉介" } },
  { value: "friend_family", label: { en: "Friend / Family", mm: "မိတ်ဆွေ/မိသားစု", zh: "朋友/家人" } },
  { value: "facebook", label: { en: "Facebook", mm: "Facebook", zh: "Facebook" } },
  { value: "instagram", label: { en: "Instagram", mm: "Instagram", zh: "Instagram" } },
  { value: "google_search", label: { en: "Google Search", mm: "Google ရှာဖွေမှု", zh: "Google 搜尋" } },
  { value: "youtube", label: { en: "YouTube", mm: "YouTube", zh: "YouTube" } },
  { value: "website", label: { en: "Website", mm: "ဝက်ဘ်ဆိုဒ်", zh: "網站" } },
  { value: "other", label: { en: "Other", mm: "အခြား", zh: "其他" } },
];

// =================================================================
// Main Form Definition
// =================================================================
export const PATIENT_REGISTRATION_FORM: FormSection[] = [
  // =============================================================
  // SECTION A – PERSONAL INFORMATION
  // =============================================================
  {
    id: "personal_info",
    title: {
      en: "Section A – Personal Information",
      mm: "အပိုင်း A – ကိုယ်ရေးအချက်အလက်",
      zh: "A 部分 – 個人資料",
    },
    description: {
      en: "Please provide your personal details as shown on your passport.",
      mm: "ကျေးဇူးပြု၍ သင့်နိုင်ငံကူးလက်မှတ်ပါ အချက်အလက်များကို ဖြည့်သွင်းပေးပါ။",
      zh: "請提供與護照一致的個人資料。",
    },
    fields: [
      {
        name: "full_name",
        type: "text",
        label: { en: "Full Name (as on passport)", mm: "အမည်အပြည့်အစုံ (နိုင်ငံကူးလက်မှတ်ပါအတိုင်း)", zh: "全名（與護照一致）" },
        placeholder: { en: "Enter your full legal name", mm: "သင့်အမည်အပြည့်အစုံကို ထည့်သွင်းပါ", zh: "請輸入您的法定全名" },
        required: true,
        colSpan: 2,
      },
      {
        name: "preferred_name",
        type: "text",
        label: { en: "Preferred Name", mm: "ခေါ်လိုသောအမည်", zh: "偏好稱呼" },
        placeholder: { en: "What should we call you?", mm: "သင့်ကို မည်သို့ခေါ်ရမည်နည်း။", zh: "我們該如何稱呼您？" },
        colSpan: 1,
      },
      {
        name: "gender",
        type: "select",
        label: { en: "Gender", mm: "ကျား/မ", zh: "性別" },
        required: true,
        options: [
          { value: "male", label: { en: "Male", mm: "ကျား", zh: "男" } },
          { value: "female", label: { en: "Female", mm: "မ", zh: "女" } },
          { value: "other", label: { en: "Other", mm: "အခြား", zh: "其他" } },
          { value: "prefer_not_to_say", label: { en: "Prefer not to say", mm: "မဖြေလိုပါ", zh: "不便透露" } },
        ],
        colSpan: 1,
      },
      {
        name: "date_of_birth",
        type: "date",
        label: { en: "Date of Birth", mm: "မွေးသက္ကရာဇ်", zh: "出生日期" },
        placeholder: { en: "DD/MM/YYYY", mm: "ရက်/လ/နှစ်", zh: "日/月/年" },
        required: true,
        colSpan: 1,
      },
      {
        name: "nationality",
        type: "select",
        label: { en: "Nationality", mm: "နိုင်ငံသား", zh: "國籍" },
        required: true,
        options: NATIONALITY_OPTIONS,
        colSpan: 1,
      },
      {
        name: "passport_number",
        type: "text",
        label: { en: "Passport Number", mm: "နိုင်ငံကူးလက်မှတ်နံပါတ်", zh: "護照號碼" },
        placeholder: { en: "Enter passport number", mm: "နိုင်ငံကူးလက်မှတ်နံပါတ်ထည့်ပါ", zh: "請輸入護照號碼" },
        required: true,
        colSpan: 1,
      },
      {
        name: "passport_expiry",
        type: "date",
        label: { en: "Passport Expiry Date", mm: "နိုင်ငံကူးလက်မှတ် သက်တမ်းကုန်ဆုံးရက်", zh: "護照到期日" },
        placeholder: { en: "DD/MM/YYYY", mm: "ရက်/လ/နှစ်", zh: "日/月/年" },
        colSpan: 1,
      },
      {
        name: "country_of_residence",
        type: "select",
        label: { en: "Country of Residence", mm: "နေထိုင်ရာနိုင်ငံ", zh: "居住國家" },
        required: true,
        options: NATIONALITY_OPTIONS,
        colSpan: 1,
      },
      {
        name: "street_address",
        type: "text",
        label: { en: "Street Address", mm: "လမ်းလိပ်စာ", zh: "街道地址" },
        placeholder: { en: "Street name, building, apartment", mm: "လမ်းအမည်၊ အဆောက်အဦ၊ တိုက်ခန်း", zh: "街道名稱、建築物、公寓" },
        colSpan: 2,
      },
      {
        name: "city",
        type: "text",
        label: { en: "City", mm: "မြို့", zh: "城市" },
        placeholder: { en: "City", mm: "မြို့", zh: "城市" },
        colSpan: 1,
      },
      {
        name: "state_province",
        type: "text",
        label: { en: "State / Province", mm: "ပြည်နယ် / တိုင်း", zh: "州 / 省" },
        placeholder: { en: "State or Province", mm: "ပြည်နယ် သို့မဟုတ် တိုင်း", zh: "州或省" },
        colSpan: 1,
      },
      {
        name: "postal_code",
        type: "text",
        label: { en: "Postal Code", mm: "စာပို့သင်္ကေတ", zh: "郵遞區號" },
        placeholder: { en: "Postal code", mm: "စာပို့သင်္ကေတ", zh: "郵遞區號" },
        colSpan: 1,
      },
      {
        name: "mobile_number",
        type: "tel",
        label: { en: "Mobile Number (with country code)", mm: "မိုဘိုင်းဖုန်းနံပါတ် (နိုင်ငံကုဒ်ပါ)", zh: "手機號碼（含國碼）" },
        placeholder: { en: "+95 912345678", mm: "+95 912345678", zh: "+95 912345678" },
        required: true,
        colSpan: 1,
      },
      {
        name: "whatsapp",
        type: "tel",
        label: { en: "WhatsApp", mm: "WhatsApp", zh: "WhatsApp" },
        placeholder: { en: "+95 912345678", mm: "+95 912345678", zh: "+95 912345678" },
        colSpan: 1,
      },
      {
        name: "line_id",
        type: "text",
        label: { en: "LINE ID (if applicable)", mm: "LINE ID (ရှိပါက)", zh: "LINE ID（如適用）" },
        placeholder: { en: "Your LINE ID", mm: "သင့် LINE ID", zh: "您的 LINE ID" },
        colSpan: 1,
      },
      {
        name: "email",
        type: "email",
        label: { en: "Email Address", mm: "အီးမေးလ်လိပ်စာ", zh: "電子郵件地址" },
        placeholder: { en: "your.email@example.com", mm: "your.email@example.com", zh: "your.email@example.com" },
        required: true,
        colSpan: 2,
      },
    ],
  },

  // =============================================================
  // SECTION B – EMERGENCY CONTACT
  // =============================================================
  {
    id: "emergency_contact",
    title: {
      en: "Section B – Emergency Contact",
      mm: "အပိုင်း B – အရေးပေါ်ဆက်သွယ်ရန်",
      zh: "B 部分 – 緊急聯絡人",
    },
    fields: [
      {
        name: "emergency_name",
        type: "text",
        label: { en: "Full Name", mm: "အမည်အပြည့်အစုံ", zh: "全名" },
        placeholder: { en: "Emergency contact full name", mm: "အရေးပေါ်ဆက်သွယ်ရန် အမည်အပြည့်အစုံ", zh: "緊急聯絡人全名" },
        required: true,
        colSpan: 2,
      },
      {
        name: "emergency_relationship",
        type: "text",
        label: { en: "Relationship", mm: "တော်စပ်ပုံ", zh: "關係" },
        placeholder: { en: "e.g., Spouse, Parent, Sibling", mm: "ဥပမာ - အိမ်ထောင်ဖက်၊ မိဘ၊ မောင်နှမ", zh: "例如：配偶、父母、兄弟姐妹" },
        required: true,
        colSpan: 1,
      },
      {
        name: "emergency_phone",
        type: "tel",
        label: { en: "Phone Number", mm: "ဖုန်းနံပါတ်", zh: "電話號碼" },
        placeholder: { en: "+95 912345678", mm: "+95 912345678", zh: "+95 912345678" },
        required: true,
        colSpan: 1,
      },
      {
        name: "emergency_email",
        type: "email",
        label: { en: "Email", mm: "အီးမေးလ်", zh: "電子郵件" },
        placeholder: { en: "emergency@example.com", mm: "emergency@example.com", zh: "emergency@example.com" },
        colSpan: 2,
      },
    ],
  },

  // =============================================================
  // SECTION C – REQUESTED MEDICAL SERVICE (Category + Sub-services)
  // =============================================================
  {
    id: "medical_service",
    title: {
      en: "Section C – Requested Medical Service",
      mm: "အပိုင်း C – ကုသမှုလိုအပ်ချက်",
      zh: "C 部分 – 需求醫療服務",
    },
    description: {
      en: "Select a category first, then choose the specific service(s) you are interested in.",
      mm: "အမျိုးအစားကို ဦးစွာရွေးပါ၊ ထို့နောက် သင်စိတ်ဝင်စားသော ဝန်ဆောင်မှုကို ရွေးချယ်ပါ။",
      zh: "請先選擇類別，然後選擇您感興趣的具體服務。",
    },
    fields: [
      // Dropdown to select category
      {
        name: "service_category",
        type: "select",
        label: { en: "Select Category", mm: "အမျိုးအစားရွေးပါ", zh: "選擇類別" },
        required: true,
        options: MEDICAL_SERVICES.map((cat) => ({
          value: cat.category.en,
          label: cat.category,
        })),
        colSpan: 3,
      },
      // Dynamic checkbox groups for each category (shown conditionally)
      ...MEDICAL_SERVICES.flatMap((cat) =>
        cat.items.map((item) => ({
          name: "medical_services",
          type: 'checkbox-group' as const,
          label: item.label,
          value: item.label.en,
          conditional: { field: "service_category", value: cat.category.en },
          colSpan: 1,
        }))
      ),
      {
        name: "medical_services_other",
        type: "text",
        label: { en: "Other (please specify)", mm: "အခြား (ကျေးဇူးပြု၍ ဖော်ပြပါ)", zh: "其他（請註明）" },
        placeholder: { en: "Describe other service needed", mm: "အခြားလိုအပ်သော ဝန်ဆောင်မှုကို ဖော်ပြပါ", zh: "請描述其他需求服務" },
        colSpan: 2,
      },
    ],
  },

  // =============================================================
  // SECTION D – HEALTHCARE INFORMATION
  // =============================================================
  {
    id: "healthcare_info",
    title: {
      en: "Section D – Healthcare Information",
      mm: "အပိုင်း D – ကျန်းမာရေးဆိုင်ရာ အချက်အလက်",
      zh: "D 部分 – 醫療資訊",
    },
    fields: [
      {
        name: "previous_treatment",
        type: "radio",
        label: { en: "Have you previously received treatment for this condition?", mm: "ဤရောဂါအတွက် ယခင်က ကုသမှုခံယူဖူးပါသလား။", zh: "您是否曾為此疾病接受過治療？" },
        required: true,
        options: [
          { value: "yes", label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: "no", label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } },
        ],
        colSpan: 2,
      },
      {
        name: "previous_treatment_description",
        type: "textarea",
        label: { en: "If yes, please briefly describe:", mm: "ဟုတ်ကဲ့ဆိုပါက အတိုချုပ်ဖော်ပြပါ။", zh: "若是，請簡述：" },
        placeholder: { en: "Describe previous treatments...", mm: "ယခင်ကုသမှုများကို ဖော်ပြပါ...", zh: "請描述之前的治療..." },
        conditional: { field: "previous_treatment", value: "yes" },
        colSpan: 2,
      },
      {
        name: "under_physician_care",
        type: "radio",
        label: { en: "Are you currently under the care of a physician?", mm: "လက်ရှိတွင် ဆရာဝန်တစ်ဦးဦး၏ ကုသမှုအောက်တွင် ရှိပါသလား။", zh: "您目前是否在醫師的照護下？" },
        required: true,
        options: [
          { value: "yes", label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: "no", label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } },
        ],
        colSpan: 2,
      },
      {
        name: "physician_name",
        type: "text",
        label: { en: "Doctor's Name", mm: "ဆရာဝန်အမည်", zh: "醫師姓名" },
        placeholder: { en: "Name of your current physician", mm: "သင့်လက်ရှိဆရာဝန်၏ အမည်", zh: "您目前醫師的姓名" },
        conditional: { field: "under_physician_care", value: "yes" },
        colSpan: 1,
      },
      {
        name: "physician_country",
        type: "select",
        label: { en: "Country", mm: "နိုင်ငံ", zh: "國家" },
        options: NATIONALITY_OPTIONS,
        conditional: { field: "under_physician_care", value: "yes" },
        colSpan: 1,
      },
    ],
  },

  // =============================================================
  // SECTION E – MEDICAL RECORDS (Checkbox Only – No File Upload)
  // =============================================================
  {
    id: "medical_records",
    title: {
      en: "Section E – Medical Records",
      mm: "အပိုင်း E – ဆေးမှတ်တမ်းများ",
      zh: "E 部分 – 病歷資料",
    },
    description: {
      en: "Please indicate which documents you currently have. Staff may request these later if needed.",
      mm: "သင့်တွင် လက်ရှိရရှိနိုင်သော စာရွက်စာတမ်းများကို ရွေးချယ်ပါ။ လိုအပ်ပါက ဝန်ထမ်းများက နောက်မှတောင်းဆိုနိုင်ပါသည်။",
      zh: "請標示您目前擁有的文件。如有需要，工作人員可能會稍後向您索取。",
    },
    fields: [
      {
        name: "has_medical_reports",
        type: "checkbox-group",
        label: { en: "Medical Reports", mm: "ဆေးစစ်ချက်များ", zh: "醫療報告" },
        value: "true",
        colSpan: 1,
      },
      {
        name: "has_lab_results",
        type: "checkbox-group",
        label: { en: "Laboratory Results", mm: "ဓာတ်ခွဲခန်းရလဒ်များ", zh: "檢驗結果" },
        value: "true",
        colSpan: 1,
      },
      {
        name: "has_imaging",
        type: "checkbox-group",
        label: { en: "Imaging (CT / MRI / Ultrasound / X-ray)", mm: "ဓာတ်မှန် (CT / MRI / အာထရာဆောင်း / X-ray)", zh: "影像（CT / MRI / 超音波 / X光）" },
        value: "true",
        colSpan: 1,
      },
      {
        name: "has_medication_list",
        type: "checkbox-group",
        label: { en: "Medication List", mm: "ဆေးဝါးစာရင်း", zh: "用藥清單" },
        value: "true",
        colSpan: 1,
      },
      {
        name: "has_referral_letter",
        type: "checkbox-group",
        label: { en: "Referral Letter", mm: "လွှဲပြောင်းစာ", zh: "轉診單" },
        value: "true",
        colSpan: 1,
      },
      {
        name: "has_surgical_records",
        type: "checkbox-group",
        label: { en: "Previous Surgical Records", mm: "ယခင်ခွဲစိတ်မှုမှတ်တမ်းများ", zh: "過去手術記錄" },
        value: "true",
        colSpan: 1,
      },
      {
        name: "has_other_medical_docs",
        type: "checkbox-group",
        label: { en: "Other", mm: "အခြား", zh: "其他" },
        value: "true",
        colSpan: 1,
      },
    ],
  },

  // =============================================================
  // SECTION F – TELEMEDICINE CONSULTATION
  // =============================================================
  {
    id: "telemedicine",
    title: {
      en: "Section F – Telemedicine Consultation",
      mm: "အပိုင်း F – အွန်လိုင်းဆေးခန်းပြသခြင်း",
      zh: "F 部分 – 遠距醫療諮詢",
    },
    fields: [
      {
        name: "want_telemedicine",
        type: "radio",
        label: { en: "Would you like to arrange a pre-treatment telemedicine consultation?", mm: "ကုသမှုမစတင်မီ အွန်လိုင်းဆေးပြသလိုပါသလား။", zh: "您是否希望安排治療前的遠距諮詢？" },
        required: true,
        options: [
          { value: "yes", label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: "no", label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } },
        ],
        colSpan: 2,
      },
      {
        name: "telemedicine_language",
        type: "select",
        label: { en: "Preferred language", mm: "နှစ်သက်ရာဘာသာစကား", zh: "偏好語言" },
        conditional: { field: "want_telemedicine", value: "yes" },
        options: [
          { value: "en", label: { en: "English", mm: "အင်္ဂလိပ်", zh: "英文" } },
          { value: "zh", label: { en: "Mandarin", mm: "တရုတ်", zh: "中文" } },
          { value: "mm", label: { en: "Burmese", mm: "မြန်မာ", zh: "緬甸語" } },
          { value: "other", label: { en: "Other", mm: "အခြား", zh: "其他" } },
        ],
        colSpan: 1,
      },
      {
        name: "telemedicine_other_language",
        type: "text",
        label: { en: "Please specify", mm: "ကျေးဇူးပြု၍ ဖော်ပြပါ", zh: "請註明" },
        conditional: { field: "telemedicine_language", value: "other" },
        colSpan: 1,
      },
      {
        name: "preferred_consultation_time",
        type: "text",
        label: { en: "Preferred consultation time", mm: "နှစ်သက်ရာ ဆွေးနွေးချိန်", zh: "偏好的諮詢時間" },
        placeholder: { en: "e.g., Weekdays 10:00 AM - 2:00 PM (Taipei Time)", mm: "ဥပမာ - အလုပ်ရက်များ နံနက် ၁၀ နာရီမှ ညနေ ၂ နာရီအတွင်း (ထိုင်ပေအချိန်)", zh: "例如：平日 10:00 - 14:00（台北時間）" },
        conditional: { field: "want_telemedicine", value: "yes" },
        colSpan: 2,
      },
    ],
  },

  // =============================================================
  // SECTION G – TRAVEL INFORMATION
  // =============================================================
  {
    id: "travel_info",
    title: {
      en: "Section G – Travel Information",
      mm: "အပိုင်း G – ခရီးသွားလာရေး အချက်အလက်",
      zh: "G 部分 – 旅遊資訊",
    },
    fields: [
      {
        name: "preferred_travel_month",
        type: "month",
        label: { en: "Preferred month of travel", mm: "လာရောက်လိုသောလ", zh: "預計旅行月份" },
        placeholder: { en: "YYYY-MM", mm: "YYYY-MM", zh: "YYYY-MM" },
        required: true,
        colSpan: 1,
      },
      {
        name: "estimated_stay",
        type: "text",
        label: { en: "Estimated length of stay", mm: "ခန့်မှန်းတည်းခိုမည့် ရက်အရေအတွက်", zh: "預計停留天數" },
        placeholder: { en: "e.g., 7 days", mm: "ဥပမာ - ၇ ရက်", zh: "例如：7天" },
        required: true,
        colSpan: 1,
      },
      {
        name: "travel_with_companion",
        type: "radio",
        label: { en: "Will you travel with a companion?", mm: "အဖော်နှင့်အတူ လာရောက်မည်လား။", zh: "您是否會與同伴一同前往？" },
        required: true,
        options: [
          { value: "yes", label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: "no", label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } },
        ],
        colSpan: 2,
      },
      {
        name: "companion_count",
        type: "number",
        label: { en: "If yes, how many companions?", mm: "ဟုတ်ကဲ့ဆိုလျှင် အဖော်ဘယ်နှစ်ယောက်ပါမည်နည်း။", zh: "若是，有多少位同伴？" },
        placeholder: { en: "Number of companions", mm: "အဖော်အရေအတွက်", zh: "同伴人數" },
        conditional: { field: "travel_with_companion", value: "yes" },
        colSpan: 1,
      },
      {
        name: "assistance_required",
        type: "checkbox-group",
        label: { en: "Do you require assistance with:", mm: "အောက်ပါအကူအညီများ လိုအပ်ပါသလား။", zh: "您是否需要以下協助：" },
        options: [
          { value: "airport_transfer", label: { en: "Airport Transfer", mm: "လေဆိပ်ကြိုပို့", zh: "機場接送" } },
          { value: "hotel_reservation", label: { en: "Hotel Reservation", mm: "ဟိုတယ်ကြိုတင်ဘွတ်ကင်လုပ်ပေးရန်", zh: "飯店預訂" } },
          { value: "medical_interpreter", label: { en: "Medical Interpreter", mm: "ဆေးဘက်ဆိုင်ရာ စကားပြန်", zh: "醫療口譯" } },
          { value: "local_transportation", label: { en: "Local Transportation", mm: "မြို့တွင်းသွားလာရေး", zh: "當地交通" } },
          { value: "travel_info_only", label: { en: "Travel Information Only", mm: "ခရီးသွားသတင်းအချက်အလက်သာ", zh: "僅旅遊資訊" } },
        ],
        colSpan: 2,
      },
    ],
  },

  // =============================================================
  // SECTION H – REFERRAL INFORMATION
  // =============================================================
  {
    id: "referral_info",
    title: {
      en: "Section H – Referral Information",
      mm: "အပိုင်း H – လွှဲပြောင်းမှုအချက်အလက်",
      zh: "H 部分 – 轉介資訊",
    },
    fields: [
      {
        name: "referral_source",
        type: "select",
        label: { en: "How did you hear about us?", mm: "ကျွန်ုပ်တို့ဆီမှ မည်သို့သိရှိခဲ့သနည်း။", zh: "您如何得知我們？" },
        options: REFERRAL_SOURCES,
        required: true,
        colSpan: 2,
      },
      {
        name: "referral_source_other",
        type: "text",
        label: { en: "Please specify", mm: "ကျေးဇူးပြု၍ ဖော်ပြပါ", zh: "請註明" },
        conditional: { field: "referral_source", value: "other" },
        colSpan: 2,
      },
      {
        name: "partner_name",
        type: "text",
        label: { en: "Partner Name (if referred)", mm: "မိတ်ဖက်အမည် (လွှဲပြောင်းပေးသူရှိပါက)", zh: "合作夥伴名稱（若有轉介）" },
        placeholder: { en: "Name of referral partner", mm: "လွှဲပြောင်းပေးသူ မိတ်ဖက်၏ အမည်", zh: "轉介合作夥伴名稱" },
        colSpan: 2,
      },
      {
        name: "partner_id",
        type: "text",
        label: { en: "Partner ID (if known)", mm: "မိတ်ဖက် ID (သိရှိပါက)", zh: "合作夥伴 ID（若知道）" },
        placeholder: { en: "e.g., ZA1W", mm: "ဥပမာ - ZA1W", zh: "例如：ZA1W" },
        // This will be set as read-only if URL has ?ref=
        colSpan: 1,
      },
    ],
  },

    // =============================================================
  // SECTION I – CONSENT & SIGNATURE (Updated)
  // =============================================================
  {
    id: "consent",
    title: {
      en: "Section I – Consent & Signature",
      mm: "အပိုင်း I – သဘောတူညီချက်နှင့် လက်မှတ်",
      zh: "I 部分 – 同意與簽名",
    },
    description: {
      en: "Please read and agree to the following statements before submitting.",
      mm: "မပို့ဆောင်မီ အောက်ပါကြေညာချက်များကို ဖတ်ရှုပြီး သဘောတူပေးပါ။",
      zh: "提交前請閱讀並同意以下聲明。",
    },
    fields: [
      // =========================================================
      // MASTER SIGNATURE CHECKBOX
      // =========================================================
      {
        name: "use_master_signature",
        type: "checkbox",
        label: {
          en: "☑ Use my Master Signature for all agreements below",
          mm: "☑ အောက်ပါ သဘောတူညီချက်အားလုံးအတွက် ကျွန်ုပ်၏ Master Signature ကို သုံးပါမည်",
          zh: "☑ 對以下所有協議使用我的主簽名",
        },
        required: false,
        colSpan: 2,
      },

      // =========================================================
      // 1. CONFIRM ACCURACY (No PDF, simple checkbox)
      // =========================================================
      {
        name: "consent_info_accurate",
        type: "checkbox",
        label: {
          en: "I confirm that all information provided is accurate and complete.",
          mm: "ကျွန်ုပ်ပေးထားသော အချက်အလက်အားလုံးမှန်ကန်ပြီး ပြည့်စုံကြောင်း အတည်ပြုပါသည်။",
          zh: "我確認所有提供的資料均正確且完整。",
        },
        required: true,
        colSpan: 2,
      },

      // =========================================================
      // 2. TREATMENT UNDERSTANDING (No PDF, simple checkbox)
      //    Combines 3 original questions into one statement
      // =========================================================
      {
        name: "consent_treatment_understanding",
        type: "checkbox",
        label: {
          en: "I understand that submitting this form does not guarantee acceptance for treatment, that medical suitability will be determined by the treating physician, and that all treatment recommendations and medical decisions are made solely by the treating physician.",
          mm: "ဤဖောင်ကိုပေးပို့ခြင်းသည် ကုသမှုလက်ခံရန် အာမခံချက်မဟုတ်ကြောင်း၊ ဆေးဘက်ဆိုင်ရာ သင့်လျော်မှုကို ကုသပေးသော ဆရာဝန်မှ ဆုံးဖြတ်မည်ဖြစ်ကြောင်း၊ ကုသမှုဆိုင်ရာ အကြံပြုချက်များနှင့် ဆေးဘက်ဆိုင်ရာ ဆုံးဖြတ်ချက်များကို ကုသပေးသော ဆရာဝန်မှသာ ချမှတ်ကြောင်း နားလည်ပါသည်။",
          zh: "我了解提交此表格並不保證能接受治療，醫療適宜性將由治療醫師決定，且所有治療建議和醫療決策僅由治療醫師做出。",
        },
        required: true,
        colSpan: 2,
      },

      // =========================================================
      // 3. COMPREHENSIVE CONSENT (With PDF Modal – 4 PDFs)
      //    Combines: Privacy Policy + Data Transfer +
      //    Telemedicine Informed Consent + Booking & Refund Policy
      // =========================================================
      {
        name: "consent_comprehensive",
        type: "checkbox",
        label: {
          en: "I have read and agree to the Privacy & Data Protection Policy, the collection, use, and international transfer of my personal and medical information, the Telemedicine Informed Consent, and the Booking & Refund Policy.",
          mm: "ကျွန်ုပ်၏ ကိုယ်ရေးကိုယ်တာနှင့် ဆေးဘက်ဆိုင်ရာ အချက်အလက်များကို စုဆောင်းခြင်း၊ အသုံးပြုခြင်းနှင့် နိုင်ငံတကာသို့ လွှဲပြောင်းခြင်း၊ Telemedicine Informed Consent နှင့် Booking & Refund Policy တို့ကို ဖတ်ရှုပြီး သဘောတူပါသည်။",
          zh: "我已閱讀並同意隱私與資料保護政策、收集、使用及國際傳輸我的個人和醫療資訊、遠距醫療知情同意書及預約與退款政策。",
        },
        required: true,
        colSpan: 2,
        // Array of PDFs to be shown in the agreement modal
        // UI must display each PDF with its own "I Agree" button
        // Checkbox becomes ticked ONLY after all 4 are agreed
        agreementFiles: [
          "/agreements/privacy_policy_v1.md",
          "/agreements/data_transfer_v1.md",
          "/agreements/telemedicine_informed_consent_v1.md",
          "/agreements/booking_refund_policy_v1.md",
        ],
      },

      // =========================================================
      // SIGNATURE SECTION (Canvas + Name + Date)
      // =========================================================
      {
        name: "signature_name",
        type: "text",
        label: {
          en: "Full Name (as signature)",
          mm: "အမည်အပြည့်အစုံ (လက်မှတ်အနေဖြင့်)",
          zh: "全名（作為簽名）",
        },
        placeholder: {
          en: "Type your full name as signature",
          mm: "လက်မှတ်အဖြစ် အမည်အပြည့်အစုံရိုက်ထည့်ပါ",
          zh: "請輸入全名作為簽名",
        },
        required: true,
        colSpan: 2,
      },
      {
        name: "signature_data",
        type: "signature",
        label: {
          en: "Draw your signature (Canvas)",
          mm: "သင့်လက်မှတ်ကို ရေးဆွဲပါ (Canvas)",
          zh: "繪製您的簽名 (Canvas)",
        },
        required: true,
        colSpan: 2,
        compressWidth: 600,
        compressQuality: 70,
        // If 'use_master_signature' is checked, this signature will be
        // automatically applied to ALL consent checkboxes above.
      },
      {
        name: "consent_date",
        type: "date",
        label: {
          en: "Date",
          mm: "ရက်စွဲ",
          zh: "日期",
        },
        placeholder: {
          en: "DD / MM / YYYY",
          mm: "ရက် / လ / နှစ်",
          zh: "日 / 月 / 年",
        },
        required: true,
      },
    ],
  },
];

// =================================================================
// Export Helper Functions (for AI / UI consumption)
// =================================================================
export const getAllSections = () => PATIENT_REGISTRATION_FORM;
export const getAllFields = (): FormField[] =>
  getAllFieldsFromSections(PATIENT_REGISTRATION_FORM);
export const getSectionById = (id: string) =>
  getSectionByIdFromSections(PATIENT_REGISTRATION_FORM, id);
export const getFieldsWithAgreement = (): FormField[] =>
  getFieldsWithAgreementFromSections(PATIENT_REGISTRATION_FORM);
export const getConsentFields = (): FormField[] =>
  getConsentFieldsFromSections(PATIENT_REGISTRATION_FORM);
export const getSignatureField = (): FormField | undefined =>
  getSignatureFieldFromSections(PATIENT_REGISTRATION_FORM);
export const getMasterSignatureField = (): FormField | undefined =>
  getMasterSignatureFieldFromSections(PATIENT_REGISTRATION_FORM);
export const getDefaultValues = () =>
  getDefaultValuesFromSections(PATIENT_REGISTRATION_FORM);