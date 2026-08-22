// lib/constants/agent_reg_form.ts

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
const COUNTRY_OPTIONS = [
  { value: "Taiwan", label: { en: "Taiwan", mm: "ထိုင်ဝမ်", zh: "台灣" } },
  { value: "Myanmar", label: { en: "Myanmar", mm: "မြန်မာ", zh: "緬甸" } },
  { value: "United States", label: { en: "United States", mm: "အမေရိကန်", zh: "美國" } },
  { value: "Singapore", label: { en: "Singapore", mm: "စင်ကာပူ", zh: "新加坡" } },
  { value: "Malaysia", label: { en: "Malaysia", mm: "မလေးရှား", zh: "馬來西亞" } },
  { value: "Thailand", label: { en: "Thailand", mm: "ထိုင်း", zh: "泰國" } },
  { value: "Vietnam", label: { en: "Vietnam", mm: "ဗီယက်နမ်", zh: "越南" } },
  { value: "Philippines", label: { en: "Philippines", mm: "ဖိလစ်ပိုင်", zh: "菲律賓" } },
  { value: "Indonesia", label: { en: "Indonesia", mm: "အင်ဒိုနီးရှား", zh: "印尼" } },
  { value: "Japan", label: { en: "Japan", mm: "ဂျပန်", zh: "日本" } },
  { value: "South Korea", label: { en: "South Korea", mm: "တောင်ကိုရီးယား", zh: "韓國" } },
  { value: "China", label: { en: "China", mm: "တရုတ်", zh: "中國" } },
  { value: "Hong Kong", label: { en: "Hong Kong", mm: "ဟောင်ကောင်", zh: "香港" } },
  { value: "India", label: { en: "India", mm: "အိန္ဒိယ", zh: "印度" } },
  { value: "Australia", label: { en: "Australia", mm: "ဩစတြေးလျ", zh: "澳洲" } },
  { value: "Canada", label: { en: "Canada", mm: "ကနေဒါ", zh: "加拿大" } },
  { value: "United Kingdom", label: { en: "United Kingdom", mm: "ယူနိုက်တက်ကင်းဒမ်း", zh: "英國" } },
  { value: "United Arab Emirates", label: { en: "United Arab Emirates", mm: "ယူအေအီး", zh: "阿拉伯聯合大公國" } },
  { value: "Other", label: { en: "Other", mm: "အခြား", zh: "其他" } },
];

// =================================================================
// Patient Origin Countries (Multi-select)
// =================================================================
const PATIENT_ORIGIN_COUNTRIES = [
  { value: "United States", label: { en: "United States", mm: "အမေရိကန်", zh: "美國" } },
  { value: "Myanmar", label: { en: "Myanmar", mm: "မြန်မာ", zh: "緬甸" } },
  { value: "Canada", label: { en: "Canada", mm: "ကနေဒါ", zh: "加拿大" } },
  { value: "Australia", label: { en: "Australia", mm: "ဩစတြေးလျ", zh: "澳洲" } },
  { value: "Singapore", label: { en: "Singapore", mm: "စင်ကာပူ", zh: "新加坡" } },
  { value: "Malaysia", label: { en: "Malaysia", mm: "မလေးရှား", zh: "馬來西亞" } },
  { value: "Thailand", label: { en: "Thailand", mm: "ထိုင်း", zh: "泰國" } },
  { value: "Vietnam", label: { en: "Vietnam", mm: "ဗီယက်နမ်", zh: "越南" } },
  { value: "Philippines", label: { en: "Philippines", mm: "ဖိလစ်ပိုင်", zh: "菲律賓" } },
  { value: "Indonesia", label: { en: "Indonesia", mm: "အင်ဒိုနီးရှား", zh: "印尼" } },
  { value: "Japan", label: { en: "Japan", mm: "ဂျပန်", zh: "日本" } },
  { value: "South Korea", label: { en: "South Korea", mm: "တောင်ကိုရီးယား", zh: "韓國" } },
  { value: "China", label: { en: "China", mm: "တရုတ်", zh: "中國" } },
  { value: "Hong Kong", label: { en: "Hong Kong", mm: "ဟောင်ကောင်", zh: "香港" } },
  { value: "India", label: { en: "India", mm: "အိန္ဒိယ", zh: "印度" } },
  { value: "United Kingdom", label: { en: "United Kingdom", mm: "ယူနိုက်တက်ကင်းဒမ်း", zh: "英國" } },
  { value: "Other", label: { en: "Other", mm: "အခြား", zh: "其他" } },
];

// =================================================================
// Business Type Options
// =================================================================
const BUSINESS_TYPES = [
  { value: "medical_clinic", label: { en: "Medical Clinic", mm: "ဆေးခန်း", zh: "診所" } },
  { value: "hospital", label: { en: "Hospital", mm: "ဆေးရုံ", zh: "醫院" } },
  { value: "medical_tourism_agency", label: { en: "Medical Tourism Agency", mm: "ဆေးခရီးသွားအေဂျင်စီ", zh: "醫療旅遊機構" } },
  { value: "travel_agency", label: { en: "Travel Agency", mm: "ခရီးသွားအေဂျင်စီ", zh: "旅行社" } },
  { value: "insurance_broker", label: { en: "Insurance Broker", mm: "အာမခံပွဲစား", zh: "保險經紀人" } },
  { value: "corporate_wellness", label: { en: "Corporate Wellness Provider", mm: "ကော်ပိုရိတ်ကျန်းမာရေးဝန်ဆောင်မှု", zh: "企業健康服務提供者" } },
  { value: "aesthetic_clinic", label: { en: "Aesthetic Clinic", mm: "အလှအပဆေးခန်း", zh: "醫美診所" } },
  { value: "healthcare_consultant", label: { en: "Healthcare Consultant", mm: "ကျန်းမာရေးအတိုင်ပင်ခံ", zh: "醫療顧問" } },
  { value: "community_org", label: { en: "Community Organization", mm: "လူမှုအဖွဲ့အစည်း", zh: "社區組織" } },
  { value: "health_influencer", label: { en: "Health & Wellness Influencer", mm: "ကျန်းမာရေးဆိုင်ရာ Influencer", zh: "健康與保健影響者" } },
  { value: "other", label: { en: "Other", mm: "အခြား", zh: "其他" } },
];

// =================================================================
// Medical Services for Referral
// =================================================================
const REFERRAL_MEDICAL_SERVICES = [
  { value: "mens_health_urology", label: { en: "Men's Health & Urology", mm: "အမျိုးသားကျန်းမာရေးနှင့် ဆီးလမ်းကြောင်း", zh: "男性健康與泌尿科" } },
  { value: "executive_screening", label: { en: "Executive Health Screening", mm: "အထူးကျန်းမာရေးစစ်ဆေးခြင်း", zh: "高階健檢" } },
  { value: "medical_aesthetics", label: { en: "Medical Aesthetics", mm: "ဆေးဘက်ဆိုင်ရာအလှအပ", zh: "醫美" } },
  { value: "hair_restoration", label: { en: "Hair Restoration", mm: "ဆံပင်ပြန်လည်ပေါက်ရှင်ခြင်း", zh: "植髮" } },
  { value: "womens_health", label: { en: "Women's Health", mm: "အမျိုးသမီးကျန်းမာရေး", zh: "女性健康" } },
  { value: "neurology_wellness", label: { en: "Neurology & Wellness", mm: "အာရုံကြောနှင့်ကျန်းမာရေး", zh: "神經學與健康" } },
  { value: "preventive_medicine", label: { en: "Preventive Medicine", mm: "ကြိုတင်ကာကွယ်ရေးဆေးပညာ", zh: "預防醫學" } },
  { value: "other", label: { en: "Other", mm: "အခြား", zh: "其他" } },
];

// =================================================================
// Supporting Document Types (Checkbox Only - No File Upload)
// =================================================================
const SUPPORTING_DOCUMENTS = [
  { value: "business_registration", label: { en: "Business Registration Certificate", mm: "လုပ်ငန်းမှတ်ပုံတင်လက်မှတ်", zh: "商業登記證" } },
  { value: "professional_license", label: { en: "Professional License", mm: "ပရော်ဖက်ရှင်နယ်လိုင်စင်", zh: "專業執照" } },
  { value: "company_profile", label: { en: "Company Profile", mm: "ကုမ္ပဏီအကျဉ်းချုပ်", zh: "公司簡介" } },
  { value: "business_card", label: { en: "Business Card", mm: "စီးပွားရေးကတ်", zh: "名片" } },
  { value: "government_id", label: { en: "Government-issued Identification", mm: "အစိုးရမှထုတ်ပေးသော ID", zh: "政府簽發的身份證明" } },
  { value: "other", label: { en: "Other Supporting Documents", mm: "အခြားအထောက်အထားများ", zh: "其他證明文件" } },
];

// =================================================================
// Commission Tier Options (Informational)
// =================================================================
const COMMISSION_TIERS = [
  { value: "tier_1_5", label: { en: "1-5 cases (5%)", mm: "၁-၅ ယောက် (၅%)", zh: "1-5 例 (5%)" } },
  { value: "tier_6_10", label: { en: "6-10 cases (6%)", mm: "၆-၁၀ ယောက် (၆%)", zh: "6-10 例 (6%)" } },
  { value: "tier_11_20", label: { en: "11-20 cases (7%)", mm: "၁၁-၂၀ ယောက် (၇%)", zh: "11-20 例 (7%)" } },
  { value: "tier_20_plus", label: { en: ">20 cases (8%)", mm: "၂၀ ကျော် (၈%)", zh: ">20 例 (8%)" } },
];

// =================================================================
// Agent Registration Form Definition
// =================================================================
export const AGENT_REGISTRATION_FORM: FormSection[] = [
  // =============================================================
  // SECTION A – APPLICANT INFORMATION
  // =============================================================
  {
    id: "applicant_info",
    title: {
      en: "Section A – Applicant Information",
      mm: "အပိုင်း A – လျှောက်ထားသူအချက်အလက်",
      zh: "A 部分 – 申請人資料",
    },
    fields: [
      {
        name: "full_name",
        type: "text",
        label: { en: "Full Name", mm: "အမည်အပြည့်အစုံ", zh: "全名" },
        placeholder: { en: "Enter your full name", mm: "သင့်အမည်အပြည့်အစုံကို ထည့်သွင်းပါ", zh: "請輸入您的全名" },
        required: true,
        colSpan: 2,
      },
      {
        name: "company_name",
        type: "text",
        label: { en: "Company / Organization (if applicable)", mm: "ကုမ္ပဏီ / အဖွဲ့အစည်း (ရှိပါက)", zh: "公司 / 組織（如適用）" },
        placeholder: { en: "Name of your company or organization", mm: "သင့်ကုမ္ပဏီ သို့မဟုတ် အဖွဲ့အစည်းအမည်", zh: "您的公司或組織名稱" },
        colSpan: 2,
      },
      {
        name: "date_of_birth",
        type: "date",
        label: { en: "Date of Birth", mm: "မွေးသက္ကရာဇ်", zh: "出生日期" },
        required: true,
      },
      {
        name: "country_of_residence",
        type: "select",
        label: { en: "Country of Residence", mm: "နေထိုင်ရာနိုင်ငံ", zh: "居住國家" },
        required: true,
        options: COUNTRY_OPTIONS,
      },
      {
        name: "business_address",
        type: "text",
        label: { en: "Contact Address", mm: "ဆက်သွယ်ရန်လိပ်စာ", zh: "聯絡地址" },
        placeholder: { en: "Full contact address", mm: "ဆက်သွယ်ရန်လိပ်စာအပြည့်အစုံ", zh: "完整聯絡地址" },
        required: true,
        colSpan: 2,
      },
      {
        name: "mobile_number",
        type: "tel",
        label: { en: "Mobile Number", mm: "မိုဘိုင်းဖုန်းနံပါတ်", zh: "手機號碼" },
        placeholder: { en: "912 345 678", mm: "912 345 678", zh: "912 345 678" },
        required: true,
      },
      {
        name: "whatsapp",
        type: "tel",
        label: { en: "WhatsApp", mm: "WhatsApp", zh: "WhatsApp" },
        placeholder: { en: "912 345 678", mm: "912 345 678", zh: "912 345 678" },
      },
      {
        name: "line_id",
        type: "text",
        label: { en: "LINE ID (if applicable)", mm: "LINE ID (ရှိပါက)", zh: "LINE ID（如適用）" },
        placeholder: { en: "Your LINE ID", mm: "သင့် LINE ID", zh: "您的 LINE ID" },
      },
      {
        name: "email",
        type: "email",
        label: { en: "Email Address", mm: "အီးမေးလ်လိပ်စာ", zh: "電子郵件地址" },
        placeholder: { en: "your.email@example.com", mm: "your.email@example.com", zh: "your.email@example.com" },
        required: true,
        colSpan: 2,
      },
      {
        name: "heading_social",
        type: "heading",
        label: { en: "Website / Social Media Links", mm: "ဝက်ဘ်ဆိုဒ် / လူမှုကွန်ရက်လင့်ခ်များ", zh: "網站 / 社群媒體連結" },
        colSpan: 3,
      },
      {
        name: "website",
        type: "url",
        label: { en: "Website", mm: "ဝက်ဘ်ဆိုဒ်", zh: "網站" },
        placeholder: { en: "https://www.example.com", mm: "https://www.example.com", zh: "https://www.example.com" },
        colSpan: 2,
      },
      {
        name: "social_facebook",
        type: "url",
        label: { en: "Facebook", mm: "Facebook", zh: "Facebook" },
        placeholder: { en: "https://facebook.com/yourpage", mm: "https://facebook.com/yourpage", zh: "https://facebook.com/yourpage" },
      },
      {
        name: "social_instagram",
        type: "url",
        label: { en: "Instagram", mm: "Instagram", zh: "Instagram" },
        placeholder: { en: "https://instagram.com/yourprofile", mm: "https://instagram.com/yourprofile", zh: "https://instagram.com/yourprofile" },
      },
      {
        name: "social_linkedin",
        type: "url",
        label: { en: "LinkedIn", mm: "LinkedIn", zh: "LinkedIn" },
        placeholder: { en: "https://linkedin.com/in/yourprofile", mm: "https://linkedin.com/in/yourprofile", zh: "https://linkedin.com/in/yourprofile" },
      },
      {
        name: "social_other",
        type: "url",
        label: { en: "Other", mm: "အခြား", zh: "其他" },
        placeholder: { en: "https://...", mm: "https://...", zh: "https://..." },
      },
    ],
  },

  // =============================================================
  // SECTION B – BUSINESS PROFILE
  // =============================================================
  {
    id: "business_profile",
    title: {
      en: "Section B – Business Profile",
      mm: "အပိုင်း B – လုပ်ငန်းအကျဉ်းချုပ်",
      zh: "B 部分 – 業務簡介",
    },
    fields: [
      {
        name: "business_type",
        type: "checkbox-group",
        label: { en: "Which best describes your business?", mm: "သင့်လုပ်ငန်းကို အကောင်းဆုံးဖော်ပြမည့်အချက်", zh: "哪一項最能描述您的業務？" },
        required: true,
        options: BUSINESS_TYPES,
        colSpan: 2,
      },
      {
        name: "business_type_other",
        type: "text",
        label: { en: "Other (please specify)", mm: "အခြား (ကျေးဇူးပြု၍ ဖော်ပြပါ)", zh: "其他（請註明）" },
        placeholder: { en: "Describe your business", mm: "သင့်လုပ်ငန်းကို ဖော်ပြပါ", zh: "請描述您的業務" },
        conditional: { field: "business_type", value: "other" },
        colSpan: 2,
      },
      {
        name: "years_in_business",
        type: "radio",
        label: { en: "Years in Business", mm: "လုပ်ငန်းသက်တမ်း", zh: "經營年資" },
        required: true,
        options: [
          { value: "less_than_1", label: { en: "Less than 1 year", mm: "၁ နှစ်အောက်", zh: "不到 1 年" } },
          { value: "1_to_3", label: { en: "1–3 years", mm: "၁-၃ နှစ်", zh: "1-3 年" } },
          { value: "4_to_7", label: { en: "4–7 years", mm: "၄-၇ နှစ်", zh: "4-7 年" } },
          { value: "more_than_7", label: { en: "More than 7 years", mm: "၇ နှစ်အထက်", zh: "7 年以上" } },
        ],
      },
      {
        name: "monthly_clients",
        type: "radio",
        label: { en: "Approximately how many healthcare-related clients do you serve each month?", mm: "တစ်လလျှင် ကျန်းမာရေးဆိုင်ရာ ဖောက်သည် ခန့်မှန်းခြေ မည်မျှရှိပါသလဲ။", zh: "您每月大約服務多少位醫療相關客戶？" },
        required: true,
        options: [
          { value: "1_to_10", label: { en: "1–10", mm: "၁-၁၀", zh: "1-10" } },
          { value: "11_to_30", label: { en: "11–30", mm: "၁၁-၃၀", zh: "11-30" } },
          { value: "31_to_50", label: { en: "31–50", mm: "၃၁-၅၀", zh: "31-50" } },
          { value: "51_to_100", label: { en: "51–100", mm: "၅၁-၁၀၀", zh: "51-100" } },
          { value: "more_than_100", label: { en: "More than 100", mm: "၁၀၀ အထက်", zh: "超過 100" } },
        ],
      },
    ],
  },

  // =============================================================
  // SECTION C – REFERRAL INFORMATION
  // =============================================================
  {
    id: "referral_info",
    title: {
      en: "Section C – Referral Information",
      mm: "အပိုင်း C – လွှဲပြောင်းမှုအချက်အလက်",
      zh: "C 部分 – 轉介資訊",
    },
    fields: [
      {
        name: "referral_services",
        type: "checkbox-group",
        label: { en: "Which medical services are you most interested in referring to? (Select all that apply)", mm: "မည်သည့်ဆေးဝါးကုသမှုများကို လွှဲပြောင်းရန် စိတ်ဝင်စားဆုံးဖြစ်ပါသလဲ။ (သက်ဆိုင်ရာအားလုံးရွေးပါ)", zh: "您最有興趣轉介哪些醫療服務？（可複選）" },
        required: true,
        options: REFERRAL_MEDICAL_SERVICES,
        colSpan: 2,
      },
      {
        name: "referral_services_other",
        type: "text",
        label: { en: "Other (please specify)", mm: "အခြား (ကျေးဇူးပြု၍ ဖော်ပြပါ)", zh: "其他（請註明）" },
        placeholder: { en: "Describe other services", mm: "အခြားဝန်ဆောင်မှုများကို ဖော်ပြပါ", zh: "請描述其他服務" },
        conditional: { field: "referral_services", value: "other" },
        colSpan: 2,
      },
      {
        name: "patient_origin_countries",
        type: "checkbox-group",
        label: { en: "Which countries are your patients primarily from?", mm: "သင့်လူနာအများစု၏ မူရင်းနိုင်ငံများ", zh: "您的病患主要來自哪些國家？" },
        required: true,
        options: PATIENT_ORIGIN_COUNTRIES,
        colSpan: 2,
      },
      {
        name: "patient_origin_other",
        type: "text",
        label: { en: "Other (please specify)", mm: "အခြား (ကျေးဇူးပြု၍ ဖော်ပြပါ)", zh: "其他（請註明）" },
        conditional: { field: "patient_origin_countries", value: "Other" },
      },
      {
        name: "estimated_monthly_referrals",
        type: "radio",
        label: { en: "Estimated Patient Referrals per Month", mm: "တစ်လလျှင် ခန့်မှန်းလူနာလွှဲပြောင်းမှု", zh: "每月預估病患轉介數" },
        required: true,
        options: [
          { value: "1_to_5", label: { en: "1–5", mm: "၁-၅", zh: "1-5" } },
          { value: "6_to_10", label: { en: "6–10", mm: "၆-၁၀", zh: "6-10" } },
          { value: "11_to_20", label: { en: "11–20", mm: "၁၁-၂၀", zh: "11-20" } },
          { value: "more_than_20", label: { en: "More than 20", mm: "၂၀ အထက်", zh: "超過 20" } },
        ],
      },
    ],
  },

  // =============================================================
  // SECTION D – PROFESSIONAL STANDARDS (Consent with PDF Modal)
  // =============================================================
  {
    id: "professional_standards",
    title: {
      en: "Section D – Professional Standards",
      mm: "အပိုင်း D – ပရော်ဖက်ရှင်နယ်စံနှုန်းများ",
      zh: "D 部分 – 專業標準",
    },
    description: {
      en: "Please confirm the following professional standards.",
      mm: "အောက်ပါ ပရော်ဖက်ရှင်နယ်စံနှုန်းများကို အတည်ပြုပေးပါ။",
      zh: "請確認以下專業標準。",
    },
    fields: [
      {
        name: "confirm_no_medical_advice",
        type: "checkbox",
        required: true,
        label: { en: "I understand that I am not authorized to provide medical advice or diagnosis.", mm: "ဆေးဘက်ဆိုင်ရာအကြံဉာဏ် သို့မဟုတ် ရောဂါရှာဖွေခွင့် မရှိကြောင်း နားလည်ပါသည်။", zh: "我了解我無權提供醫療建議或診斷。" },
        colSpan: 2,
      },
      {
        name: "confirm_custom_package_prices",
        type: "checkbox",
        required: true,
        label: { en: "I agree to use only the customized package prices provided by the Facilitator.", mm: "Facilitator မှပေးသော သီးသန့်ပက်ကေ့ဈေးနှုန်းများကိုသာ အသုံးပြုရန် သဘောတူပါသည်။", zh: "我同意僅使用 Facilitator 提供的客製化套餐價格。" },
        colSpan: 2,
      },
      {
        name: "confirm_no_outcome_guarantees",
        type: "checkbox",
        required: true,
        label: { en: "I agree not to make guarantees regarding treatment outcomes.", mm: "ကုသမှုရလဒ်နှင့်ပတ်သက်၍ အာမခံချက်များ မပေးရန် သဘောတူပါသည်။", zh: "我同意不對治療結果做出保證。" },
        colSpan: 2,
      },
      {
        name: "confirm_patient_privacy",
        type: "checkbox",
        required: true,
        label: { en: "I will protect patient privacy and confidentiality.", mm: "လူနာ၏ ကိုယ်ရေးကိုယ်တာနှင့် လျှို့ဝှက်ချက်ကို ကာကွယ်ပါမည်။", zh: "我將保護病患的隱私和機密。" },
        colSpan: 2,
      },
      {
        name: "confirm_compliance",
        type: "checkbox",
        required: true,
        label: { en: "I agree to comply with the Referral Partner Handbook, Commission Policy, and applicable laws.", mm: "Referral Partner Handbook၊ Commission Policy နှင့် သက်ဆိုင်ရာဥပဒေများကို လိုက်နာရန် သဘောတူပါသည်။", zh: "我同意遵守轉介夥伴手冊、佣金政策及適用法律。" },
        colSpan: 2,
      },
    ],
  },

  // =============================================================
  // SECTION E – SUPPORTING DOCUMENTS (Checkbox Only)
  // =============================================================
  {
    id: "supporting_docs",
    title: {
      en: "Section E – Supporting Documents",
      mm: "အပိုင်း E – အထောက်အထားစာရွက်စာတမ်းများ",
      zh: "E 部分 – 證明文件",
    },
    description: {
      en: "Please indicate which documents you have. You will be contacted later to submit the actual files.",
      mm: "သင်တွင်ရှိသော စာရွက်စာတမ်းများကို ရွေးချယ်ပါ။ ဖိုင်အစစ်များကို နောက်မှ ဆက်သွယ်၍ တောင်းယူပါမည်။",
      zh: "請標示您擁有的文件。我們將於稍後聯繫您提交實際檔案。",
    },
    fields: [
      {
        name: "supporting_documents",
        type: "checkbox-group",
        label: { en: "Document Types", mm: "စာရွက်စာတမ်းအမျိုးအစားများ", zh: "文件類型" },
        options: SUPPORTING_DOCUMENTS,
        colSpan: 2,
      },
      // NOTE: The file upload field (supporting_document_files) has been REMOVED per spec.
      // Staff will request these files manually via email/chat later.
    ],
  },

  // =============================================================
  // SECTION F – ADDITIONAL INFO, MASTER SIGNATURE & DECLARATION
  // =============================================================
  {
    id: "additional_info",
    title: {
      en: "Section F – Additional Information & Declaration",
      mm: "အပိုင်း F – ထပ်ဆောင်းအချက်အလက်နှင့် ကြေညာချက်",
      zh: "F 部分 – 補充資訊與聲明",
    },
    fields: [
      {
        name: "commission_tier_preference",
        type: "radio",
        label: { en: "Commission Tier (Informational)", mm: "ကော်မရှင်အဆင့် (သိရှိရန်)", zh: "佣金層級（參考用）" },
        placeholder: {
          en: "Partner tier is reviewed monthly based on the number of completed treatment cases.",
          mm: "မိတ်ဖက်အဆင့်ကို ပြီးစီးသော ကုသမှုအရေအတွက်ပေါ်မူတည်၍ လစဉ်ပြန်လည်သုံးသပ်ပါသည်။",
          zh: "合作夥伴層級每月根據完成的治療案例數進行審查。",
        },
        options: COMMISSION_TIERS,
      },
      {
        name: "remarks",
        type: "textarea",
        label: { en: "Remarks / Additional Notes", mm: "မှတ်ချက် / ထပ်ဆောင်းမှတ်စု", zh: "備註 / 補充說明" },
        placeholder: { en: "Any additional information you would like us to know...", mm: "ကျွန်ုပ်တို့သိစေလိုသော ထပ်ဆောင်းအချက်အလက်များ...", zh: "您希望我們知道的任何補充資訊..." },
        colSpan: 2,
      },
      // --- MASTER SIGNATURE SECTION ---
      {
        name: "heading_signature",
        type: "heading",
        label: { en: "Master Signature & Consent", mm: "လက်မှတ်နှင့် သဘောတူညီချက်", zh: "簽名與同意" },
        colSpan: 3,
      },
      {
        name: "use_master_signature",
        type: "checkbox",
        label: { en: "☑ Use my Master Signature for all agreements above", mm: "☑ အထက်ပါ သဘောတူညီချက်အားလုံးအတွက် ကျွန်ုပ်၏ Master Signature ကို သုံးပါမည်", zh: "☑ 對上述所有協議使用我的主簽名" },
        required: false, // Optional, defaults to using separate signatures if unchecked
      },
      {
        name: "signature_data",
        type: "signature",
        label: { en: "Draw your signature (Canvas)", mm: "သင့်လက်မှတ်ကို ရေးဆွဲပါ (Canvas)", zh: "繪製您的簽名 (Canvas)" },
        required: true,
        colSpan: 2,
        compressWidth: 600,
        compressQuality: 70,
        // Note: If 'use_master_signature' is checked, this single signature applies to ALL checkboxes in Sections D & F.
      },
      // --- DECLARATION SECTION (Checkboxes with PDF Modal) ---
            // =========================================================
      // DECLARATION SECTION
      // =========================================================
      {
        name: "heading_declaration",
        type: "heading",
        label: {
          en: "Declaration",
          mm: "ကြေညာချက်",
          zh: "聲明",
        },
        colSpan: 3,
      },

      // =========================================================
      // 1. DECLARATION – ACCURATE INFO (No PDF)
      // =========================================================
      {
        name: "declaration_accurate_info",
        type: "checkbox",
        label: {
          en: "I certify that all information provided in this application is true and accurate.",
          mm: "ဤလျှောက်လွှာပါ အချက်အလက်အားလုံးမှန်ကန်ကြောင်း အတည်ပြုပါသည်။",
          zh: "本人證明本申請表中提供的所有資訊均真實準確。",
        },
        required: true,
        colSpan: 2,
      },

      // =========================================================
      // 2. DECLARATION – NO GUARANTEE (No PDF)
      // =========================================================
      {
        name: "declaration_no_guarantee_approval",
        type: "checkbox",
        label: {
          en: "I understand that submission of this application does not guarantee approval as an Authorized Referral Partner.",
          mm: "ဤလျှောက်လွှာတင်သွင်းခြင်းသည် Authorized Referral Partner အဖြစ် အတည်ပြုချက်ရမည်ဟု အာမခံချက်မရှိကြောင်း နားလည်ပါသည်။",
          zh: "我了解提交此申請並不保證能獲批成為授權轉介夥伴。",
        },
        required: true,
        colSpan: 2,
      },

      // =========================================================
      // 3. DECLARATION – COMPREHENSIVE COMPLIANCE (With 4 PDFs)
      //    Combines: Referral Partner Agreement, Referral Partner Handbook,
      //    Commission Policy, Code of Conduct
      // =========================================================
      {
        name: "declaration_compliance_agreement",
        type: "checkbox",
        label: {
          en: "I have read and agree to the Referral Partner Agreement, Referral Ownership Policy, Commission Policy, and Code of Conduct.",
          mm: "Referral Partner Agreement၊ Referral Ownership Policy၊ Commission Policy နှင့် Code of Conduct တို့ကို ဖတ်ရှုပြီး သဘောတူပါသည်။",
          zh: "我已閱讀並同意轉介夥伴協議、轉介夥伴手冊、佣金政策及行為準則。",
        },
        required: true,
        colSpan: 2,
        // Array of PDFs to be shown in the agreement modal
        // UI must display each PDF with its own "I Agree" button
        // Checkbox becomes ticked ONLY after all 4 are agreed
        agreementFiles: [
          "/agreements/partner_agreement_v1.md",
          "/agreements/refer_ownership_policy_v1.md",
          "/agreements/commission_policy_v1.md",
          "/agreements/code_of_conduct_v1.md",
        ],
      },
      // --- APPLICANT NAME & DATE ---
      {
        name: "applicant_name",
        type: "text",
        label: { en: "Applicant Name", mm: "လျှောက်ထားသူအမည်", zh: "申請人姓名" },
        placeholder: { en: "Type your full name", mm: "သင့်အမည်အပြည့်အစုံကို ရိုက်ထည့်ပါ", zh: "請輸入您的全名" },
        required: true,
        colSpan: 2,
      },
      {
        name: "signature_date",
        type: "date",
        label: { en: "Date", mm: "ရက်စွဲ", zh: "日期" },
        placeholder: { en: "DD / MM / YYYY", mm: "ရက် / လ / နှစ်", zh: "日 / 月 / 年" },
        required: true,
      },
    ],
  },
];

// =================================================================
// Export Helper Functions
// =================================================================
export const getAllSections = () => AGENT_REGISTRATION_FORM;
export const getAllFields = (): FormField[] =>
  getAllFieldsFromSections(AGENT_REGISTRATION_FORM);
export const getSectionById = (id: string) =>
  getSectionByIdFromSections(AGENT_REGISTRATION_FORM, id);
export const getFieldsWithAgreement = (): FormField[] =>
  getFieldsWithAgreementFromSections(AGENT_REGISTRATION_FORM);
export const getConsentFields = (): FormField[] =>
  getConsentFieldsFromSections(AGENT_REGISTRATION_FORM);
export const getSignatureField = (): FormField | undefined =>
  getSignatureFieldFromSections(AGENT_REGISTRATION_FORM);
export const getMasterSignatureField = (): FormField | undefined =>
  getMasterSignatureFieldFromSections(AGENT_REGISTRATION_FORM);
export const getDefaultValues = () =>
  getDefaultValuesFromSections(AGENT_REGISTRATION_FORM);