import type { PatientSource, PatientStatus } from "@/prisma/generated/prisma/client";
import type { SupportedLanguage } from "@/lib/constants/questionnaires";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "mm", "zh"];

export const LANGUAGE_LABELS: Record<
  SupportedLanguage,
  Record<SupportedLanguage, string>
> = {
  en: { en: "English", mm: "English", zh: "English" },
  mm: { en: "Myanmar", mm: "မြန်မာ", zh: "缅甸语" },
  zh: { en: "Chinese", mm: "တရုတ်", zh: "中文" },
};

export const GENDER_OPTIONS = [
  { value: "male", label: { en: "Male", mm: "ကျား", zh: "男" } },
  { value: "female", label: { en: "Female", mm: "မ", zh: "女" } },
  { value: "other", label: { en: "Other", mm: "အခြား", zh: "其他" } },
] as const;

export const PATIENT_STATUS_LABELS: Record<
  PatientStatus,
  Record<SupportedLanguage, string>
> = {
  PENDING: { en: "Pending", mm: "စောင့်ဆိုင်းဆဲ", zh: "待处理" },
  APPOINTED: { en: "Appointed", mm: "ချိန်းဆိုပြီး", zh: "已预约" },
  TREATING: { en: "Treating", mm: "ကုသဆဲ", zh: "治疗中" },
  COMPLETED: { en: "Completed", mm: "ပြီးမြောက်", zh: "已完成" },
};

export const PATIENT_SOURCE_LABELS: Record<
  PatientSource,
  Record<SupportedLanguage, string>
> = {
  WALKIN: { en: "Walk-in", mm: "လာရောက်လည်ပတ်", zh: "现场就诊" },
  BOOKING: { en: "Booking", mm: "ကြိုတင်ချိန်းဆို", zh: "预约" },
  AGENT: { en: "Agent Referral", mm: "အေးဂျင့်မှ လွှဲပြောင်း", zh: "代理推荐" },
};

export const UI_LABELS = {
  patientInfo: {
    en: "Patient Information",
    mm: "လူနာအချက်အလက်",
    zh: "患者信息",
  },
  name: { en: "Full Name", mm: "အမည်", zh: "姓名" },
  age: { en: "Age", mm: "အသက်", zh: "年龄" },
  gender: { en: "Gender", mm: "လိင်", zh: "性别" },
  phone: { en: "Phone", mm: "ဖုန်းနံပါတ်", zh: "电话" },
  submit: { en: "Submit Survey", mm: "စစ်တမ်းတင်သွင်းရန်", zh: "提交问卷" },
  selectLanguage: {
    en: "Select Language",
    mm: "ဘာသာစကားရွေးချယ်ရန်",
    zh: "选择语言",
  },
  yourResults: {
    en: "Your Results",
    mm: "သင့်ရလဒ်များ",
    zh: "您的结果",
  },
  totalScore: { en: "Total Score", mm: "စုစုပေါင်းရမှတ်", zh: "总分" },
  severity: { en: "Severity / Diagnosis", mm: "ပြင်းထန်မှု / ရောဂါရှာဖွေချက်", zh: "严重程度 / 诊断" },
  clinicalNote: { en: "Clinical Note", mm: "ဆေးဘက်ဆိုင်ရာမှတ်ချက်", zh: "临床说明" },
  backToForms: {
    en: "Back to Forms",
    mm: "ပုံစံများသို့ ပြန်သွားရန်",
    zh: "返回表单列表",
  },
  required: { en: "Required", mm: "လိုအပ်သည်", zh: "必填" },
};
