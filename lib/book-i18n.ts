export const CLINIC = {
  name: "CLINIQUE PRINTEMPS",
  address:
    "5th Floor-1, No. 333, Sec. 4, Zhongxiao E. Rd., Da’an Dist., Taipei City",
  mapsUrl: "https://maps.app.goo.gl/maHgzmZzD8JUvTvS8",
  mapsEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3615.0!2d121.543!3d25.041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDAyJzI3LjYiTiAxMjHCsDMyJzM0LjgiRQ!5e0!3m2!1sen!2stw!4v1700000000000!5m2!1sen!2stw",
  lineUrl: "https://lin.ee/8sTqqT2",
  email: "uroadrian.tw@gmail.com",
} as const;

export type BookLang = "en" | "zh";

export type BookDict = {
  title: string;
  subtitle: string;
  language: string;
  preferredLanguage: string;
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  referralCode: string;
  notes: string;
  service: string;
  doctor: string;
  dateTime: string;
  book: string;
  submitting: string;
  male: string;
  female: string;
  other: string;
  english: string;
  chinese: string;
  burmese: string;
  confirmTitle: string;
  confirmId: string;
  confirmPatientId: string;
  confirmPatientName: string;
  saveToGallery: string;
  saveWarning: string;
  bookAnother: string;
  bookAnotherYes: string;
  bookAnotherNo: string;
  upcomingSummary: string;
  arriveOnTime: string;
  cancelNote: string;
  contactUs: string;
  prefilledHint: string;
  mapsLabel: string;
};

const DICTS: Record<BookLang, BookDict> = {
  en: {
    title: "Book an Appointment",
    subtitle: "Taiwan time (UTC+8) · 30-minute slots",
    language: "Language",
    preferredLanguage: "Preferred language",
    fullName: "Full name",
    dob: "Date of birth",
    gender: "Gender",
    phone: "Phone",
    email: "Email",
    referralCode: "Referral code (optional)",
    notes: "Notes / special requests",
    service: "Services",
    doctor: "Choose a doctor",
    dateTime: "Choose date and time",
    book: "Book Appointment",
    submitting: "Submitting…",
    male: "Male",
    female: "Female",
    other: "Other",
    english: "English",
    chinese: "Chinese",
    burmese: "Burmese",
    confirmTitle: "Appointment Confirmed",
    confirmId: "Appointment ID",
    confirmPatientId: "Patient ID",
    confirmPatientName: "Patient name",
    saveToGallery: "Save",
    saveWarning:
      "Save this image to your device — it will disappear if you close this page.",
    bookAnother: "You already have an upcoming appointment. Book another?",
    bookAnotherYes: "Yes, book another",
    bookAnotherNo: "No, keep this one",
    upcomingSummary: "Upcoming appointment",
    arriveOnTime: "Please arrive on time.",
    cancelNote: "If you need to cancel, please contact us via email.",
    contactUs: "Contact",
    prefilledHint: "Your details are prefilled from your patient record.",
    mapsLabel: "Clinic location",
  },
  zh: {
    title: "預約看診",
    subtitle: "台灣時區（UTC+8）· 每次 30 分鐘",
    language: "介面語言",
    preferredLanguage: "偏好語言",
    fullName: "姓名",
    dob: "出生日期",
    gender: "性別",
    phone: "電話",
    email: "電子郵件",
    referralCode: "推薦碼（選填）",
    notes: "備註 / 特殊需求",
    service: "服務項目",
    doctor: "選擇醫師",
    dateTime: "選擇日期與時間",
    book: "確認預約",
    submitting: "送出中…",
    male: "男",
    female: "女",
    other: "其他",
    english: "英文",
    chinese: "中文",
    burmese: "緬甸文",
    confirmTitle: "預約已確認",
    confirmId: "預約編號",
    confirmPatientId: "病患編號",
    confirmPatientName: "病患姓名",
    saveToGallery: "儲存",
    saveWarning: "請將此畫面儲存至裝置 — 關閉頁面後將無法再查看。",
    bookAnother: "您已有即將到來的預約。要再預約一次嗎？",
    bookAnotherYes: "是，再預約",
    bookAnotherNo: "否，保留此預約",
    upcomingSummary: "即將到來的預約",
    arriveOnTime: "請準時到達。",
    cancelNote: "如需取消，請以電子郵件聯絡我們。",
    contactUs: "聯絡方式",
    prefilledHint: "您的資料已依病患紀錄自動帶入。",
    mapsLabel: "診所位置",
  },
};

export function getBookDict(lang: BookLang): BookDict {
  return DICTS[lang] ?? DICTS.en;
}

/** Stable Taiwan datetime for SSR + client (avoids hydration mismatch). */
export function formatStableTaiwanDateTime(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("month")} ${get("day")}, ${get("year")} ${get("hour")}:${get("minute")}`;
}
