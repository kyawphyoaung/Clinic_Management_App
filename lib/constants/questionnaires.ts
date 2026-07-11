export type SupportedLanguage = 'en' | 'mm' | 'zh';

export interface QuestionnaireDefinition {
  id: string;
  title: Record<SupportedLanguage, string>;
  questions: Array<{
    id: string;
    type: "radio" | "select" | "checkbox";
    text: Record<SupportedLanguage, string>;
    options?: Array<{
      value: number | string;
      label: Record<SupportedLanguage, string>;
    }>;
  }>;
  scoringRules: {
    calculate: (rawAnswers: Record<string, any>) => {
      totalScore: number;
      severity: Record<SupportedLanguage, string>;
      clinicalNote?: Record<SupportedLanguage, string>;
    };
  };
}

export const QUESTIONNAIRES: Record<string, QuestionnaireDefinition> = {
  ehs_v1: {
    id: "ehs_v1",
    title: {
      en: "Erectile Hardness Score (EHS)",
      mm: "လိင်တံမာကြောမှုအဆင့် သတ်မှတ်ချက်စနစ် (EHS)",
      zh: "勃起硬度分级评分 (EHS)"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "How would you rate the hardness of your erection?",
          mm: "သင့်လိင်တံ၏ မာကြောမှုအဆင့်ကို မည်သို့သတ်မှတ်မည်နည်း။",
          zh: "您如何评价您的勃起硬度？"
        },
        options: [
          { value: 0, label: { en: "The penis does not enlarge at all.", mm: "လိင်တံလုံးဝ ကြီးထွားလာခြင်းမရှိပါ။", zh: "阴茎完全没有增大。" } },
          { value: 1, label: { en: "The penis is enlarged, but not hard.", mm: "လိင်တံ ကြီးထွားလာသော်လည်း မာကြောခြင်းမရှိပါ။", zh: "阴茎有增大，但不硬。" } },
          { value: 2, label: { en: "The penis is hard, but not hard enough for penetration.", mm: "လိင်တံ မာကြောမှုရှိသော်လည်း အမျိုးသမီးအင်္ဂါအတွင်းသို့ ထည့်သွင်းရန် လုံလောက်စွာ မာကြောမှုမရှိပါ။", zh: "阴茎硬，但硬度不足以插入。" } },
          { value: 3, label: { en: "The penis is hard enough for penetration, but not fully rigid.", mm: "အမျိုးသမီးအင်္ဂါအတွင်းသို့ ထည့်သွင်းရန်လုံလောက်စွာ မာကြောမှုရှိသော်လည်း လုံးဝအပြည့်အဝ မာကြောခြင်းမျိုး မဟုတ်ပါ။", zh: "阴茎硬度足以插入，但未完全坚挺。" } },
          { value: 4, label: { en: "The penis is completely hard and fully rigid.", mm: "လိင်တံ အပြည့်အဝ မာကြော တောင့်တင်းနေပါသည်။", zh: "阴茎完全坚硬且坚挺。" } }
        ]
      }
    ],
    scoringRules: {
      calculate: (answers) => {
        const score = Number(answers.q1) || 0;
        let enSeverity = "";
        let mmSeverity = "";
        let zhSeverity = "";

        if (score === 0 || score === 1) {
          enSeverity = "Severe Erectile Dysfunction";
          mmSeverity = "ပြင်းထန်သော ပန်းသေပန်းညှိုးရောဂါ";
          zhSeverity = "重度勃起功能障碍";
        } else if (score === 2) {
          enSeverity = "Moderate Erectile Dysfunction";
          mmSeverity = "အသင့်အတင့် ပန်းသေပန်းညှိုးရောဂါ";
          zhSeverity = "中度勃起功能障碍";
        } else if (score === 3) {
          enSeverity = "Mild Erectile Dysfunction";
          mmSeverity = "အနည်းငယ် ပန်းသေပန်းညှိုးရောဂါ";
          zhSeverity = "轻度勃起功能障碍";
        } else if (score === 4) {
          enSeverity = "Normal/Optimal Erectile Function";
          mmSeverity = "ပုံမှန်/ကောင်းမွန်သော လိင်တံလုပ်ဆောင်ချက်";
          zhSeverity = "正常/最佳勃起功能";
        }

        return {
          totalScore: score,
          severity: { en: enSeverity, mm: mmSeverity, zh: zhSeverity }
        };
      }
    }
  },

  ipss_v1: {
    id: "ipss_v1",
    title: {
      en: "International Prostate Symptom Score (IPSS)",
      mm: "ဆီးကျိတ်ကြီးခြင်း ရောဂါ(BPH) လက္ခဏာများ ဆန်းစစ်ရန် မေးခွန်းလွှာ (IPSS)",
      zh: "国际前列腺症状评分 (IPSS)"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "Incomplete Emptying: How often have you had a sensation of not emptying your bladder completely after you finish urinating?",
          mm: "၁။ ဆီးကျန်ခဲ့သလို ခံစားရခြင်း: ဆီးသွားပြီးသည့်တိုင်အောင် ဆီးအိမ်ထဲတွင် ဆီးအားလုံး ကုန်စင်အောင်မသွားရသေးဘဲ ကျန်နေသေးသကဲ့သို့ ခံစားရမှုမျိုး အကြိမ်ရေမည်မျှရှိခဲ့ပါသလဲ။",
          zh: "排尿不尽感：排尿后，您经常有膀胱未完全排空的感觉吗？"
        },
        options: [
          { value: 0, label: { en: "Not at all", mm: "လုံးဝမရှိပါ", zh: "完全没有" } },
          { value: 1, label: { en: "Less than 1 time in 5", mm: "၅ ကြိမ်ဆီးသွားလျှင် ၁ ကြိမ်ထက်နည်းပါသည်", zh: "少于五分之一的时间" } },
          { value: 2, label: { en: "Less than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက်နည်းပါသည်", zh: "少于一半的时间" } },
          { value: 3, label: { en: "About half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ခန့် ရှိပါသည်", zh: "大约一半的时间" } },
          { value: 4, label: { en: "More than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက် ပိုများပါသည်", zh: "多于一半的时间" } },
          { value: 5, label: { en: "Almost always", mm: "ဆီးသွားချိန်တိုင်း အမြဲလိုလို ဖြစ်ပါသည်", zh: "几乎总是" } }
        ]
      },
      {
        id: "q2",
        type: "radio",
        text: {
          en: "Frequency: How often have you had to urinate again less than two hours after you finished urinating?",
          mm: "၂။ ဆီးခဏခဏသွားခြင်း: ဆီးသွားပြီးနောက် (၂) နာရီပင်မပြည့်သေးမီ နောက်တစ်ကြိမ် ထပ်မံဆီးသွားချင်သည့်အကြိမ်ရေ မည်မျှရှိခဲ့ပါသလဲ။",
          zh: "尿频：排尿后不到两小时，您经常需要再次排尿吗？"
        },
        options: [
          { value: 0, label: { en: "Not at all", mm: "လုံးဝမရှိပါ", zh: "完全没有" } },
          { value: 1, label: { en: "Less than 1 time in 5", mm: "၅ ကြိမ်ဆီးသွားလျှင် ၁ ကြိမ်ထက်နည်းပါသည်", zh: "少于五分之一的时间" } },
          { value: 2, label: { en: "Less than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက်နည်းပါသည်", zh: "少于一半的时间" } },
          { value: 3, label: { en: "About half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ခန့် ရှိပါသည်", zh: "大约一半的时间" } },
          { value: 4, label: { en: "More than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက် ပိုများပါသည်", zh: "多于一半的时间" } },
          { value: 5, label: { en: "Almost always", mm: "ဆီးသွားချိန်တိုင်း အမြဲလိုလို ဖြစ်ပါသည်", zh: "几乎总是" } }
        ]
      },
      {
        id: "q3",
        type: "radio",
        text: {
          en: "Intermittency: How often have you found you stopped and started again several times when you urinated?",
          mm: "၃။ ဆီးပြတ်တောင်းပြတ်တောင်းဖြစ်ခြင်း: ဆီးသွားနေစဉ်အတွင်း ဆီးတစ်ဆက်တည်းမသွားနိုင်ဘဲ ခဏခဏပြတ်တောက်သွားပြီးမှပြန်သွားရသည့် အကြိမ်ရေ မည်မျှရှိပါသလဲ။",
          zh: "尿流中断：排尿时，您经常发现尿流停止并多次重新开始吗？"
        },
        options: [
          { value: 0, label: { en: "Not at all", mm: "လုံးဝမရှိပါ", zh: "完全没有" } },
          { value: 1, label: { en: "Less than 1 time in 5", mm: "၅ ကြိမ်ဆီးသွားလျှင် ၁ ကြိမ်ထက်နည်းပါသည်", zh: "少于五分之一的时间" } },
          { value: 2, label: { en: "Less than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက်နည်းပါသည်", zh: "少于一半的时间" } },
          { value: 3, label: { en: "About half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ခန့် ရှိပါသည်", zh: "大约一半的时间" } },
          { value: 4, label: { en: "More than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက် ပိုများပါသည်", zh: "多于一半的时间" } },
          { value: 5, label: { en: "Almost always", mm: "ဆီးသွားချိန်တိုင်း အမြဲလိုလို ဖြစ်ပါသည်", zh: "几乎总是" } }
        ]
      },
      {
        id: "q4",
        type: "radio",
        text: {
          en: "Urgency: How often have you found it difficult to postpone urination?",
          mm: "၄။ ဆီးမထိန်းနိုင်ခြင်း: ဆီးသွားချင်စိတ်ဖြစ်ပေါ်လာပါက အောင့်ထားရန် သို့မဟုတ် ထိန်းထားရန် အလွန်ခက်ခဲသောအခြေအနေမျိုး မည်မျှရှိပါသလဲ။",
          zh: "尿急：您经常发现很难推迟排尿吗？"
        },
        options: [
          { value: 0, label: { en: "Not at all", mm: "လုံးဝမရှိပါ", zh: "完全没有" } },
          { value: 1, label: { en: "Less than 1 time in 5", mm: "၅ ကြိမ်ဆီးသွားလျှင် ၁ ကြိမ်ထက်နည်းပါသည်", zh: "少于五分之一的时间" } },
          { value: 2, label: { en: "Less than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက်နည်းပါသည်", zh: "少于一半的时间" } },
          { value: 3, label: { en: "About half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ခန့် ရှိပါသည်", zh: "大约一半的时间" } },
          { value: 4, label: { en: "More than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက် ပိုများပါသည်", zh: "多于一半的时间" } },
          { value: 5, label: { en: "Almost always", mm: "ဆီးသွားချိန်တိုင်း အမြဲလိုလို ဖြစ်ပါသည်", zh: "几乎总是" } }
        ]
      },
      {
        id: "q5",
        type: "radio",
        text: {
          en: "Weak Stream: How often have you had a weak urinary stream?",
          mm: "၅။ ဆီးလုံးအားနည်းခြင်း: ဆီးသွားသည့်အခါ ဆီးအရှိန်မသန်ဘဲ အားနည်းနေသည့် အကြိမ်ရေ မည်မျှရှိပါသလဲ။",
          zh: "尿流细弱：您经常有尿流细弱的情况吗？"
        },
        options: [
          { value: 0, label: { en: "Not at all", mm: "လုံးဝမရှိပါ", zh: "完全没有" } },
          { value: 1, label: { en: "Less than 1 time in 5", mm: "၅ ကြိမ်ဆီးသွားလျှင် ၁ ကြိမ်ထက်နည်းပါသည်", zh: "少于五分之一的时间" } },
          { value: 2, label: { en: "Less than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက်နည်းပါသည်", zh: "少于一半的时间" } },
          { value: 3, label: { en: "About half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ခန့် ရှိပါသည်", zh: "大约一半的时间" } },
          { value: 4, label: { en: "More than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက် ပိုများပါသည်", zh: "多于一半的时间" } },
          { value: 5, label: { en: "Almost always", mm: "ဆီးသွားချိန်တိုင်း အမြဲလိုလို ဖြစ်ပါသည်", zh: "几乎总是" } }
        ]
      },
      {
        id: "q6",
        type: "radio",
        text: {
          en: "Straining: How often have you had to push or strain to begin urination?",
          mm: "၆။ ဆီးညှစ်ရခြင်း: ဆီးစတင်သွားနိုင်ရန်အတွက် ဗိုက်ကိုအားစိုက်ညှစ်ရသည့်အကြိမ်ရေ မည်မျှရှိပါသလဲ။",
          zh: "排尿困难：您经常需要用力或使劲才能开始排尿吗？"
        },
        options: [
          { value: 0, label: { en: "Not at all", mm: "လုံးဝမရှိပါ", zh: "完全没有" } },
          { value: 1, label: { en: "Less than 1 time in 5", mm: "၅ ကြိမ်ဆီးသွားလျှင် ၁ ကြိမ်ထက်နည်းပါသည်", zh: "少于五分之一的时间" } },
          { value: 2, label: { en: "Less than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက်နည်းပါသည်", zh: "少于一半的时间" } },
          { value: 3, label: { en: "About half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ခန့် ရှိပါသည်", zh: "大约一半的时间" } },
          { value: 4, label: { en: "More than half the time", mm: "အကြိမ်ရေ ထက်ဝက် (၅၀%) ထက် ပိုများပါသည်", zh: "多于一半的时间" } },
          { value: 5, label: { en: "Almost always", mm: "ဆီးသွားချိန်တိုင်း အမြဲလိုလို ဖြစ်ပါသည်", zh: "几乎总是" } }
        ]
      },
      {
        id: "q7",
        type: "radio",
        text: {
          en: "Nocturia: How many times did you most typically get up to urinate from the time you went to bed until the time you got up in the morning?",
          mm: "၇။ ညဘက်ဆီးခဏခဏထသွားရခြင်း: ညအိပ်ရာဝင်ချိန်မှစ၍ မနက်အိပ်ရာထချိန်အထိ ပုံမှန်အားဖြင့် တစ်ညလျှင် ဆီးသွားရန် အိပ်ရာမှဘယ်နှစ်ကြိမ် ထရပါသလဲ။",
          zh: "夜尿：从您上床睡觉到早上起床，您通常需要起床排尿多少次？"
        },
        options: [
          { value: 0, label: { en: "None", mm: "လုံးဝမထရပါ", zh: "没有" } },
          { value: 1, label: { en: "1 time", mm: "၁ ကြိမ်", zh: "1次" } },
          { value: 2, label: { en: "2 times", mm: "၂ ကြိမ်", zh: "2次" } },
          { value: 3, label: { en: "3 times", mm: "၃ ကြိမ်", zh: "3次" } },
          { value: 4, label: { en: "4 times", mm: "၄ ကြိမ်", zh: "4次" } },
          { value: 5, label: { en: "5 or more times", mm: "၅ ကြိမ် သို့မဟုတ် ၅ ကြိမ်ထက်ပို၍", zh: "5次或以上" } }
        ]
      },
      {
        id: "q8",
        type: "radio",
        text: {
          en: "Quality of Life: If you were to spend the rest of your life with your urinary condition just the way it is now, how would you feel about that?",
          mm: "လူနေမှုဘဝ အရည်အသွေး မေးခွန်း: အကယ်၍ သင်သည် လက်ရှိကြုံတွေ့နေရသော ဆီးလမ်းကြောင်းဆိုင်ရာ ဝေဒနာများနှင့်ပဲ သင်၏ကျန်ရှိသော လူ့သက်တမ်းတစ်လျှောက်လုံး ဖြတ်သန်းသွားရမည်ဆိုပါက သင့်အနေဖြင့်မည်သို့ခံစားရမည်နည်း။",
          zh: "生活质量：如果您余生都要忍受现在的排尿状况，您会有什么感觉？"
        },
        options: [
          { value: 0, label: { en: "Delighted", mm: "အလွန်စိတ်ကျေနပ်ပါသည်", zh: "非常高兴" } },
          { value: 1, label: { en: "Pleased", mm: "သဘောကျနှစ်သက်ပါသည်", zh: "满意" } },
          { value: 2, label: { en: "Mostly satisfied", mm: "အများအားဖြင့် စိတ်ကျေနပ်မှုရှိပါသည်", zh: "基本满意" } },
          { value: 3, label: { en: "Mixed (about equally satisfied and dissatisfied)", mm: "ဆိုးလည်းမဆိုး၊ ကောင်းလည်းမကောင်းပါ (Mixed)", zh: "混合（满意和不满意各半）" } },
          { value: 4, label: { en: "Mostly dissatisfied", mm: "အများအားဖြင့် စိတ်မကျေနပ်ပါ", zh: "基本不满意" } },
          { value: 5, label: { en: "Unhappy", mm: "စိတ်မချမ်းမြေ့ပါ", zh: "不开心" } },
          { value: 6, label: { en: "Terrible", mm: "အလွန်ဆိုးရွားလှပါသည်", zh: "糟糕透顶" } }
        ]
      }
    ],
    scoringRules: {
      calculate: (answers) => {
        const score = 
          (Number(answers.q1) || 0) + 
          (Number(answers.q2) || 0) + 
          (Number(answers.q3) || 0) + 
          (Number(answers.q4) || 0) + 
          (Number(answers.q5) || 0) + 
          (Number(answers.q6) || 0) + 
          (Number(answers.q7) || 0);

        const qolScore = Number(answers.q8) || 0;
        
        let enSeverity = "";
        let mmSeverity = "";
        let zhSeverity = "";
        let enNote = `Quality of Life Score: ${qolScore}/6`;
        let mmNote = `လူနေမှုဘဝ အရည်အသွေး ရမှတ်: ${qolScore}/6`;
        let zhNote = `生活质量评分: ${qolScore}/6`;

        if (score <= 7) {
          enSeverity = "Mild Symptoms";
          mmSeverity = "ရောဂါလက္ခဏာ နည်းပါးခြင်း (Mild)";
          zhSeverity = "轻度症状";
        } else if (score <= 19) {
          enSeverity = "Moderate Symptoms";
          mmSeverity = "ရောဂါလက္ခဏာ အသင့်အတင့်ရှိခြင်း(Moderate)";
          zhSeverity = "中度症状";
        } else {
          enSeverity = "Severe Symptoms";
          mmSeverity = "ပြင်းထန်သော ရောဂါလက္ခဏာ (Severe)";
          zhSeverity = "重度症状";
        }

        return {
          totalScore: score,
          severity: { en: enSeverity, mm: mmSeverity, zh: zhSeverity },
          clinicalNote: { en: enNote, mm: mmNote, zh: zhNote }
        };
      }
    }
  },

  adam_v1: {
    id: "adam_v1",
    title: {
      en: "ADAM Questionnaire",
      mm: "ADAM မေးခွန်းလွှာ (ကျားဟော်မုန်းလျော့နည်းမှု စစ်ဆေးခြင်း)",
      zh: "ADAM 问卷 (男性衰老雄激素缺乏)"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "1. Do you have a decrease in libido (sex drive)?",
          mm: "၁။ သင့်တွင် လိင်စိတ်ဆန္ဒ (Sex Drive) လျော့နည်းလာပါသလား။",
          zh: "1. 您的性欲是否减退？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q2",
        type: "radio",
        text: {
          en: "2. Do you have a lack of energy?",
          mm: "၂။ သင့်တွင် နုံးခွေခြင်း၊ အားအင်ကုန်ခမ်းခြင်းမျိုး ခံစားရပါသလား။",
          zh: "2. 您是否感到缺乏活力？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q3",
        type: "radio",
        text: {
          en: "3. Do you have a decrease in strength and/or endurance?",
          mm: "၃။ သင့်တွင် ခွန်အား (သို့မဟုတ်) ခန္ဓာကိုယ်ကြံ့ခိုင်မှု လျော့နည်းလာပါသလား။",
          zh: "3. 您的力量和/或耐力是否下降？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q4",
        type: "radio",
        text: {
          en: "4. Have you lost height?",
          mm: "၄။ သင့်အရပ် အနည်းငယ် ပုသွားပါသလား။",
          zh: "4. 您的身高是否变矮了？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q5",
        type: "radio",
        text: {
          en: "5. Have you noticed a decreased “enjoyment of life”?",
          mm: "၅။ ဘဝကို ပျော်ပျော်ရွှင်ရွှင် ဖြတ်သန်းလိုစိတ် (သို့မဟုတ်) ဘဝအပေါ် စိတ်ကျေနပ်မှု လျော့နည်းလာပါသလား။",
          zh: "5. 您是否注意到“生活乐趣”减少？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q6",
        type: "radio",
        text: {
          en: "6. Are you sad and/or grumpy?",
          mm: "၆။ သင့်တွင် စိတ်မကောင်းဖြစ်ခြင်း၊ ဝမ်းနည်းခြင်း (သို့မဟုတ်) စိတ်တိုလွယ်ခြင်းမျိုး ဖြစ်တတ်ပါသလား။",
          zh: "6. 您是否感到悲伤和/或脾气暴躁？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q7",
        type: "radio",
        text: {
          en: "7. Are your erections less strong?",
          mm: "၇။ သင့်လိင်တံ မာကြောမှုအားနည်းသွားပါသလား။",
          zh: "7. 您的勃起硬度是否下降？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q8",
        type: "radio",
        text: {
          en: "8. Have you noticed a recent deterioration in your ability to play sports?",
          mm: "၈။ မကြာသေးမီကစပြီး အားကစားလုပ်နိုင်စွမ်း အရင်ကလောက် မကောင်းတော့ဘဲ ကျဆင်းသွားသည်ဟု ခံစားရပါသလား။",
          zh: "8. 您是否注意到最近进行体育运动的能力下降？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q9",
        type: "radio",
        text: {
          en: "9. Are you falling asleep after dinner?",
          mm: "၉။ ညစာစားပြီးလျှင် ချက်ချင်း အိပ်ငိုက်ပြီး အိပ်ပျော်သွားတတ်ပါသလား။",
          zh: "9. 您晚餐后会打瞌睡吗？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      },
      {
        id: "q10",
        type: "radio",
        text: {
          en: "10. Has there been a recent deterioration in your work performance?",
          mm: "၁၀။ မကြာသေးမီကစပြီး အလုပ်လုပ်နိုင်စွမ်း (သို့မဟုတ်) ရုံးလုပ်ငန်းစွမ်းဆောင်ရည် ကျဆင်းလာပါသလား။",
          zh: "10. 您最近的工作表现是否下降？"
        },
        options: [
          { value: 1, label: { en: "Yes", mm: "ဟုတ်ကဲ့", zh: "是" } },
          { value: 0, label: { en: "No", mm: "မဟုတ်ပါ", zh: "否" } }
        ]
      }
    ],
    scoringRules: {
      calculate: (answers) => {
        const q1 = Number(answers.q1) === 1;
        const q7 = Number(answers.q7) === 1;
        
        let otherYesCount = 0;
        const otherQuestions = ['q2', 'q3', 'q4', 'q5', 'q6', 'q8', 'q9', 'q10'];
        otherQuestions.forEach(q => {
          if (Number(answers[q]) === 1) otherYesCount++;
        });

        const isPositive = q1 || q7 || (otherYesCount >= 3);

        return {
          totalScore: isPositive ? 1 : 0,
          severity: {
            en: isPositive ? "Positive Screen (Suggests Low Testosterone)" : "Negative Screen",
            mm: isPositive ? "ကျားဟော်မုန်းလျော့နည်းနိုင်ခြေရှိပါသည် (Positive Screen)" : "ပုံမှန်ဖြစ်ပါသည် (Negative Screen)",
            zh: isPositive ? "阳性筛查 (提示低睾酮)" : "阴性筛查"
          }
        };
      }
    }
  },

  pedt_v1: {
    id: "pedt_v1",
    title: {
      en: "Premature Ejaculation Diagnostic Tool (PEDT)",
      mm: "စောစီးစွာ သုတ်လွှတ်ခြင်းဆိုင်ရာ စစ်ဆေးမှု (PEDT)",
      zh: "早泄诊断工具 (PEDT)"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "1. How difficult is it for you to delay ejaculation?",
          mm: "၁။ သုတ်လွှတ်ခြင်းကို အချိန်ဆွဲထားနိုင်စေရန်ကြိုးစားမှုသည် သင့်အတွက် မည်မျှအထိခက်ခဲပါသလဲ။",
          zh: "1. 对您来说，延迟射精有多困难？"
        },
        options: [
          { value: 0, label: { en: "Not difficult at all", mm: "လုံးဝမခက်ခဲပါ", zh: "一点也不困难" } },
          { value: 1, label: { en: "Slightly difficult", mm: "အနည်းငယ် ခက်ခဲပါသည်", zh: "有点困难" } },
          { value: 2, label: { en: "Moderately difficult", mm: "အသင့်အတင့် ခက်ခဲပါသည်", zh: "中度困难" } },
          { value: 3, label: { en: "Very difficult", mm: "အလွန် ခက်ခဲပါသည်", zh: "非常困难" } },
          { value: 4, label: { en: "Extremely difficult", mm: "အလွန်တရာ ခက်ခဲပါသည်", zh: "极度困难" } }
        ]
      },
      {
        id: "q2",
        type: "radio",
        text: {
          en: "2. Do you ejaculate before you want to?",
          mm: "၂။ မိမိ တကယ် အလိုမရှိခင် (အချိန်မတိုင်မီ) စောစီးစွာ သုတ်လွှတ်မိခြင်းမျိုး ဖြစ်တတ်ပါသလား။",
          zh: "2. 您会在想射精之前就射精吗？"
        },
        options: [
          { value: 0, label: { en: "Almost never or never", mm: "မဖြစ်သလောက် ရှားပါသည် (သို့မဟုတ်) လုံးဝမဖြစ်ပါ", zh: "几乎从不或从不" } },
          { value: 1, label: { en: "Less than half the time", mm: "ဖြစ်ခဲပါသည် (၂၅% မှ ၅၀% ကြား)", zh: "少于一半的时间" } },
          { value: 2, label: { en: "About half the time", mm: "လိင်ဆက်ဆံမှုအကြိမ်ရေ တစ်ဝက်လောက် ဖြစ်တတ်ပါသည်", zh: "大约一半的时间" } },
          { value: 3, label: { en: "More than half the time", mm: "လိင်ဆက်ဆံတိုင်းမကြာခဏ ဖြစ်တတ်ပါသည်", zh: "多于一半的时间" } },
          { value: 4, label: { en: "Almost always or always", mm: "လိင်ဆက်ဆံတိုင်း အမြဲလိုလို ဖြစ်တတ်ပါသည်", zh: "几乎总是或总是" } }
        ]
      },
      {
        id: "q3",
        type: "radio",
        text: {
          en: "3. Do you ejaculate with very little stimulation?",
          mm: "၃။ အနည်းငယ်မျှ ဆွပေးရုံ (နှိုးဆွမှု အနည်းငယ်) ဖြင့် သုတ်လွှတ်မိခြင်းမျိုး ဖြစ်တတ်ပါသလား။",
          zh: "3. 您会在很少的刺激下就射精吗？"
        },
        options: [
          { value: 0, label: { en: "Almost never or never", mm: "မဖြစ်သလောက် ရှားပါသည် (သို့မဟုတ်) လုံးဝမဖြစ်ပါ", zh: "几乎从不或从不" } },
          { value: 1, label: { en: "Less than half the time", mm: "ဖြစ်ခဲပါသည်", zh: "少于一半的时间" } },
          { value: 2, label: { en: "About half the time", mm: "လိင်ဆက်ဆံမှုအကြိမ်ရေ တစ်ဝက်လောက် ဖြစ်တတ်ပါသည်", zh: "大约一半的时间" } },
          { value: 3, label: { en: "More than half the time", mm: "လိင်ဆက်ဆံတိုင်း မကြာခဏ ဖြစ်တတ်ပါသည်", zh: "多于一半的时间" } },
          { value: 4, label: { en: "Almost always or always", mm: "လိင်ဆက်ဆံတိုင်း အမြဲလိုလို ဖြစ်တတ်ပါသည်", zh: "几乎总是或总是" } }
        ]
      },
      {
        id: "q4",
        type: "radio",
        text: {
          en: "4. Do you feel frustrated because you ejaculate before you want to?",
          mm: "၄။ မိမိ အလိုမရှိဘဲ စောစီးစွာ သုတ်လွှတ်မိသည့်အတွက် စိတ်ပျက်အားလျော့ခြင်း (Frustrated) ဖြစ်ရပါသလား။",
          zh: "4. 您是否因为在想射精之前就射精而感到沮丧？"
        },
        options: [
          { value: 0, label: { en: "Not at all frustrated", mm: "လုံးဝ စိတ်မပျက်ပါ", zh: "完全不沮丧" } },
          { value: 1, label: { en: "Slightly frustrated", mm: "အနည်းငယ် စိတ်ပျက်မိပါသည်", zh: "有点沮丧" } },
          { value: 2, label: { en: "Moderately frustrated", mm: "အသင့်အတင့် စိတ်ပျက်မိပါသည်", zh: "中度沮丧" } },
          { value: 3, label: { en: "Very frustrated", mm: "အလွန် စိတ်ပျက်မိပါသည်", zh: "非常沮丧" } },
          { value: 4, label: { en: "Extremely frustrated", mm: "အလွန်တရာ စိတ်ပျက်မိပါသည်", zh: "极度沮丧" } }
        ]
      },
      {
        id: "q5",
        type: "radio",
        text: {
          en: "5. How concerned are you that your time to ejaculation will leave your partner sexually unfulfilled?",
          mm: "၅။ သင်၏ သုတ်လွှတ်မြန်မှုကြောင့် သင့်အဖော် (Partner) အနေဖြင့် လိင်မှုကိစ္စ ပြည့်ဝမှုမရှိဘဲ ဖြစ်ကျန်ခဲ့မည်ကို မည်မျှအထိစိုးရိမ်ပူပန်မိပါသလဲ။",
          zh: "5. 您有多担心您的射精时间会让伴侣在性方面得不到满足？"
        },
        options: [
          { value: 0, label: { en: "Not at all concerned", mm: "လုံးဝ မစိုးရိမ်ပါ", zh: "完全不担心" } },
          { value: 1, label: { en: "Slightly concerned", mm: "အနည်းငယ် စိုးရိမ်မိပါသည်", zh: "有点担心" } },
          { value: 2, label: { en: "Moderately concerned", mm: "အသင့်အတင့် စိုးရိမ်မိပါသည်", zh: "中度担心" } },
          { value: 3, label: { en: "Very concerned", mm: "အလွန် စိုးရိမ်မိပါသည်", zh: "非常担心" } },
          { value: 4, label: { en: "Extremely concerned", mm: "အလွန်တရာ စိုးရိမ်မိပါသည်", zh: "极度担心" } }
        ]
      }
    ],
    scoringRules: {
      calculate: (answers) => {
        const score = 
          (Number(answers.q1) || 0) + 
          (Number(answers.q2) || 0) + 
          (Number(answers.q3) || 0) + 
          (Number(answers.q4) || 0) + 
          (Number(answers.q5) || 0);

        let enSeverity = "";
        let mmSeverity = "";
        let zhSeverity = "";

        if (score <= 8) {
          enSeverity = "No Premature Ejaculation";
          mmSeverity = "သုတ်လွှတ်မြန်သည့် ပြဿနာမရှိပါ (No PE)";
          zhSeverity = "无早泄";
        } else if (score <= 10) {
          enSeverity = "Probable Premature Ejaculation";
          mmSeverity = "သုတ်လွှတ်မြန်သည့်ပြဿနာ ဖြစ်နိုင်ခြေရှိပါသည် (Probable PE)";
          zhSeverity = "疑似早泄";
        } else {
          enSeverity = "Presence of Premature Ejaculation";
          mmSeverity = "သုတ်လွှတ်မြန်သည့်ပြဿနာရှိနေပါသည် (Presence of PE)";
          zhSeverity = "存在早泄";
        }

        return {
          totalScore: score,
          severity: { en: enSeverity, mm: mmSeverity, zh: zhSeverity }
        };
      }
    }
  },

  utisa_v1: {
    id: "utisa_v1",
    title: {
      en: "Urinary Tract Infection Symptom Assessment (UTISA)",
      mm: "ဆီးလမ်းကြောင်းပိုးဝင်ခြင်း လက္ခဏာများဆန်းစစ်ခြင်း (UTISA)",
      zh: "尿路感染症状评估 (UTISA)"
    },
    questions: [
      {
        id: "q1_sev",
        type: "radio",
        text: {
          en: "1a. Frequency Severity: Feeling the need to urinate more often than usual.",
          mm: "၁က။ ဆီးခဏခဏသွားခြင်း (ပြင်းထန်မှုအဆင့်)",
          zh: "1a. 尿频严重程度：感觉比平时更频繁地需要排尿。"
        },
        options: [
          { value: 0, label: { en: "None", mm: "လုံးဝမရှိပါ", zh: "无" } },
          { value: 1, label: { en: "Mild", mm: "အနည်းငယ်သာ", zh: "轻微" } },
          { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
          { value: 3, label: { en: "Severe", mm: "အလွန်ပြင်းထန်", zh: "重度" } }
        ]
      },
      {
        id: "q2_sev",
        type: "radio",
        text: {
          en: "2a. Urgency Severity: A sudden, strong, uncontrollable compulsion to urinate immediately.",
          mm: "၂က။ အလွန်အမင်း ဆီးသွားချင်စိတ်ဖြစ်ခြင်း (ပြင်းထန်မှုအဆင့်)",
          zh: "2a. 尿急严重程度：突然、强烈、无法控制的立即排尿冲动。"
        },
        options: [
           { value: 0, label: { en: "None", mm: "လုံးဝမရှိပါ", zh: "无" } },
          { value: 1, label: { en: "Mild", mm: "အနည်းငယ်သာ", zh: "轻微" } },
          { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
          { value: 3, label: { en: "Severe", mm: "အလွန်ပြင်းထန်", zh: "重度" } }
        ]
      },
      {
        id: "q3_sev",
        type: "radio",
        text: {
          en: "3a. Dysuria Severity: Burning, stinging, or sharp pain during urination.",
          mm: "၃က။ ဆီးပူခြင်း/ဆီးအောင့်ခြင်း (ပြင်းထန်မှုအဆင့်)",
          zh: "3a. 排尿困难严重程度：排尿时有灼热感、刺痛感或剧痛。"
        },
        options: [
           { value: 0, label: { en: "None", mm: "လုံးဝမရှိပါ", zh: "无" } },
          { value: 1, label: { en: "Mild", mm: "အနည်းငယ်သာ", zh: "轻微" } },
          { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
          { value: 3, label: { en: "Severe", mm: "အလွန်ပြင်းထန်", zh: "重度" } }
        ]
      },
      {
        id: "q4_sev",
        type: "radio",
        text: {
          en: "4a. Incomplete Emptying Severity: Feeling like your bladder isn't empty even after you just finished.",
          mm: "၄က။ ဆီးကျန်သလို ခံစားရခြင်း (ပြင်းထန်မှုအဆင့်)",
          zh: "4a. 排尿不尽感严重程度：排尿后仍感觉膀胱未排空。"
        },
        options: [
           { value: 0, label: { en: "None", mm: "လုံးဝမရှိပါ", zh: "无" } },
          { value: 1, label: { en: "Mild", mm: "အနည်းငယ်သာ", zh: "轻微" } },
          { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
          { value: 3, label: { en: "Severe", mm: "အလွန်ပြင်းထန်", zh: "重度" } }
        ]
      },
      {
        id: "q5_sev",
        type: "radio",
        text: {
          en: "5a. Pelvic Discomfort Severity: Pain, pressure, or cramping in the lower abdomen or pubic area.",
          mm: "၅က။ ဆီးခုံ/ဆီးအိမ် ကိုက်ခဲခြင်း (ပြင်းထန်မှုအဆင့်)",
          zh: "5a. 盆腔不适严重程度：下腹部或耻骨区域疼痛、有压迫感或痉挛。"
        },
        options: [
           { value: 0, label: { en: "None", mm: "လုံးဝမရှိပါ", zh: "无" } },
          { value: 1, label: { en: "Mild", mm: "အနည်းငယ်သာ", zh: "轻微" } },
          { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
          { value: 3, label: { en: "Severe", mm: "အလွန်ပြင်းထန်", zh: "重度" } }
        ]
      },
      {
        id: "q6_sev",
        type: "radio",
        text: {
          en: "6a. Back Pain Severity: Lower back pain or flank pain stemming from the urinary tract.",
          mm: "၆က။ ခါးနာခြင်း (ပြင်းထန်မှုအဆင့်)",
          zh: "6a. 背痛严重程度：源于尿路的下背痛或腰窝痛。"
        },
        options: [
           { value: 0, label: { en: "None", mm: "လုံးဝမရှိပါ", zh: "无" } },
          { value: 1, label: { en: "Mild", mm: "အနည်းငယ်သာ", zh: "轻微" } },
          { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
          { value: 3, label: { en: "Severe", mm: "အလွန်ပြင်းထန်", zh: "重度" } }
        ]
      },
      {
        id: "q7_sev",
        type: "radio",
        text: {
          en: "7a. Hematuria Severity: Visibly seeing blood or a pinkish/red tint in the urine.",
          mm: "၇က။ ဆီးထဲသွေးပါခြင်း (ပြင်းထန်မှုအဆင့်)",
          zh: "7a. 血尿严重程度：肉眼可见尿液中有血或呈粉红/红色。"
        },
        options: [
           { value: 0, label: { en: "None", mm: "လုံးဝမရှိပါ", zh: "无" } },
          { value: 1, label: { en: "Mild", mm: "အနည်းငယ်သာ", zh: "轻微" } },
          { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
          { value: 3, label: { en: "Severe", mm: "အလွန်ပြင်းထန်", zh: "重度" } }
        ]
      }
      // Note: Simplified to only include severity for the total score calculation as per standard practice, QoL questions omitted for brevity but can be added similarly
    ],
    scoringRules: {
      calculate: (answers) => {
        const score = 
          (Number(answers.q1_sev) || 0) + 
          (Number(answers.q2_sev) || 0) + 
          (Number(answers.q3_sev) || 0) + 
          (Number(answers.q4_sev) || 0) + 
          (Number(answers.q5_sev) || 0) + 
          (Number(answers.q6_sev) || 0) + 
          (Number(answers.q7_sev) || 0);

        return {
          totalScore: score,
          severity: {
            en: `Total Severity Score: ${score}/21`,
            mm: `စုစုပေါင်း ပြင်းထန်မှု ရမှတ်: ${score}/21`,
            zh: `总严重程度评分: ${score}/21`
          }
        };
      }
    }
  },

  oabss_v1: {
    id: "oabss_v1",
    title: {
      en: "Overactive Bladder Symptom Score (OABSS)",
      mm: "ဆီးအိမ် တက်ကြွလွန်ရောဂါလက္ခဏာ (OABSS)",
      zh: "膀胱过度活动症症状评分 (OABSS)"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "Q1: Daytime Frequency - How many times do you typically urinate from waking up in the morning until going to bed at night?",
          mm: "၁။ နေ့ဘက်တွင် ဆီးသွားသည့်အကြိမ်ရေ: မနက်အိပ်ရာထချိန်မှစ၍ ညအိပ်ရာဝင်ချိန်အထိ တစ်နေ့တာအတွင်းပုံမှန်အားဖြင့် ဘယ်နှစ်ကြိမ် ဆီးသွားတတ်ပါသလဲ။",
          zh: "Q1：日间尿频 - 从早上起床到晚上睡觉，您通常排尿多少次？"
        },
        options: [
          { value: 0, label: { en: "7 times or less", mm: "၇ ကြိမ် သို့မဟုတ် ၇ ကြိမ်အောက်", zh: "7次或更少" } },
          { value: 1, label: { en: "8–14 times", mm: "၈ ကြိမ် မှ ၁၄ ကြိမ်အထိ", zh: "8-14次" } },
          { value: 2, label: { en: "15 times or more", mm: "၁၅ ကြိမ် သို့မဟုတ် ၁၅ ကြိမ်အထက်", zh: "15次或更多" } }
        ]
      },
      {
        id: "q2",
        type: "radio",
        text: {
          en: "Q2: Nighttime Frequency (Nocturia) - How many times do you typically get up to urinate after going to bed at night?",
          mm: "၂။ ညဘက် ဆီးသွားသည့်အကြိမ်ရေ: ညအိပ်ရာဝင်ပြီးနောက် မနက်အိပ်ရာမထမီအထိ တစ်ညလျှင် ပုံမှန်အားဖြင့် ဘယ်နှစ်ကြိမ် ဆီးထသွားရတတ်ပါသလဲ။",
          zh: "Q2：夜间尿频（夜尿症） - 晚上睡觉后，您通常需要起床排尿多少次？"
        },
        options: [
          { value: 0, label: { en: "0 times", mm: "လုံးဝမထရပါ", zh: "0次" } },
          { value: 1, label: { en: "1 time", mm: "၁ ကြိမ်", zh: "1次" } },
          { value: 2, label: { en: "2 times", mm: "၂ ကြိမ်", zh: "2次" } },
          { value: 3, label: { en: "3 times or more", mm: "၃ ကြိမ် သို့မဟုတ် ၃ ကြိမ်အထက်", zh: "3次或更多" } }
        ]
      },
      {
        id: "q3",
        type: "radio",
        text: {
          en: "Q3: Urgency - How often do you experience a sudden, strong, and crushing urge to urinate that is difficult to defer or postpone?",
          mm: "၃။ ဆီးအလွန်အမင်း သွားချင်စိတ်ဖြစ်ခြင်း: ဆီးအောင့်ထားရန် အလွန်ခက်ခဲပြီး ချက်ချင်းသွားချင်စိတ်ရုတ်တရက် ပြင်းထန်စွာဖြစ်ပေါ်ခြင်းမျိုး ဘယ်နှစ်ကြိမ်လောက်ခံစားရဖူးပါသလဲ။",
          zh: "Q3：尿急 - 您多久经历一次突然、强烈且难以推迟的排尿冲动？"
        },
        options: [
          { value: 0, label: { en: "Not at all", mm: "လုံးဝမဖြစ်ဖူးပါ", zh: "完全没有" } },
          { value: 1, label: { en: "Less than once a week", mm: "တစ်ပတ်လျှင် ၁ ကြိမ်အောက်", zh: "每周少于一次" } },
          { value: 2, label: { en: "Once a week or more", mm: "တစ်ပတ်လျှင် ၁ ကြိမ် သို့မဟုတ် ၁ ကြိမ်ထက်ပို၍", zh: "每周一次或更多" } },
          { value: 3, label: { en: "2–4 times a week", mm: "တစ်ပတ်လျှင် ၂ ကြိမ် မှ ၄ ကြိမ်အထိ", zh: "每周2-4次" } },
          { value: 4, label: { en: "5 times a week or more", mm: "တစ်ပတ်လျှင် ၅ ကြိမ် သို့မဟုတ် ၅ ကြိမ်ထက်ပို၍", zh: "每周5次或更多" } },
          { value: 5, label: { en: "Once a day or more", mm: "တစ်နေ့လျှင် ၁ ကြိမ် သို့မဟုတ် ၁ ကြိမ်ထက်ပို၍", zh: "每天一次或更多" } }
        ]
      },
      {
        id: "q4",
        type: "radio",
        text: {
          en: "Q4: Urgency Incontinence - How often do you experience a sudden urge to urinate and leak urine before you can reach the toilet?",
          mm: "၄။ ဆီးမထိန်းနိုင်ဘဲ ထွက်ကျခြင်း: ဆီးရုတ်တရက် အလွန်အမင်း သွားချင်လာပြီး အိမ်သာသို့မရောက်မီ ဆီးမထိန်းနိုင်ဘဲ ဆီးထွက်ကျသွားခြင်းမျိုး ဘယ်နှစ်ကြိမ်လောက်ဖြစ်ဖူးပါသလဲ။",
          zh: "Q4：急迫性尿失禁 - 您多久经历一次突然想排尿，但在到达厕所前就漏尿的情况？"
        },
        options: [
           { value: 0, label: { en: "Not at all", mm: "လုံးဝမဖြစ်ဖူးပါ", zh: "完全没有" } },
          { value: 1, label: { en: "Less than once a week", mm: "တစ်ပတ်လျှင် ၁ ကြိမ်အောက်", zh: "每周少于一次" } },
          { value: 2, label: { en: "Once a week or more", mm: "တစ်ပတ်လျှင် ၁ ကြိမ် သို့မဟုတ် ၁ ကြိမ်ထက်ပို၍", zh: "每周一次或更多" } },
          { value: 3, label: { en: "2–4 times a week", mm: "တစ်ပတ်လျှင် ၂ ကြိမ် မှ ၄ ကြိမ်အထိ", zh: "每周2-4次" } },
          { value: 4, label: { en: "5 times a week or more", mm: "တစ်ပတ်လျှင် ၅ ကြိမ် သို့မဟုတ် ၅ ကြိမ်ထက်ပို၍", zh: "每周5次或更多" } },
          { value: 5, label: { en: "Once a day or more", mm: "တစ်နေ့လျှင် ၁ ကြိမ် သို့မဟုတ် ၁ ကြိမ်ထက်ပို၍", zh: "每天一次或更多" } }
        ]
      }
    ],
    scoringRules: {
      calculate: (answers) => {
        const q3Score = Number(answers.q3) || 0;
        const totalScore = 
          (Number(answers.q1) || 0) + 
          (Number(answers.q2) || 0) + 
          q3Score + 
          (Number(answers.q4) || 0);

        let enSeverity = "";
        let mmSeverity = "";
        let zhSeverity = "";

        // Diagnostic criteria: Total >= 3 AND Q3 >= 2
        if (totalScore >= 3 && q3Score >= 2) {
          if (totalScore <= 5) {
            enSeverity = "Mild OAB";
            mmSeverity = "လက္ခဏာ အနည်းငယ်သာရှိခြင်း (Mild OAB)";
            zhSeverity = "轻度 OAB";
          } else if (totalScore <= 11) {
            enSeverity = "Moderate OAB";
            mmSeverity = "လက္ခဏာ အသင့်အတင့်ရှိခြင်း (Moderate OAB)";
            zhSeverity = "中度 OAB";
          } else {
            enSeverity = "Severe OAB";
            mmSeverity = "ပြင်းထန်သော လက္ခဏာရှိခြင်း (Severe OAB)";
            zhSeverity = "重度 OAB";
          }
        } else {
          enSeverity = "No OAB Diagnosis";
          mmSeverity = "OAB ရောဂါလက္ခဏာ မရှိပါ";
          zhSeverity = "无 OAB 诊断";
        }

        return {
          totalScore,
          severity: { en: enSeverity, mm: mmSeverity, zh: zhSeverity }
        };
      }
    }
  },

  iief5_v1: {
    id: "iief5_v1",
    title: {
      en: "International Index of Erectile Function (IIEF-5 / SHIM)",
      mm: "ပန်းသေပန်းညှိုးရောဂါ အဆင့်ဆင့် ဆန်းစစ်ခြင်း (IIEF-5)",
      zh: "国际勃起功能指数 (IIEF-5)"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "Q1: How do you rate your confidence that you could get and keep an erection?",
          mm: "၁။ သင့်အနေဖြင့် လိင်တံကို မာကြောလာအောင် ပြုလုပ်နိုင်စွမ်းနှင့် ထိုမာကြောမှုကို ဆက်လက်ထိန်းထားနိုင်စွမ်းအပေါ် မိမိကိုယ်မိမိ မည်မျှအထိ ယုံကြည်မှု ရှိပါသလဲ။",
          zh: "Q1：您对自己获得并维持勃起的信心如何评价？"
        },
        options: [
          { value: 1, label: { en: "Very low", mm: "အလွန်နည်းပါသည်", zh: "非常低" } },
          { value: 2, label: { en: "Low", mm: "နည်းပါသည်", zh: "低" } },
          { value: 3, label: { en: "Moderate", mm: "အသင့်အတင့် ရှိပါသည်", zh: "中等" } },
          { value: 4, label: { en: "High", mm: "များပါသည်", zh: "高" } },
          { value: 5, label: { en: "Very high", mm: "အလွန်များပါသည်", zh: "非常高" } }
        ]
      },
      {
        id: "q2",
        type: "radio",
        text: {
          en: "Q2: When you had erections with sexual stimulation, how often were your erections hard enough for penetration?",
          mm: "၂။ လိင်စိတ်နှိုးဆွမှုကြောင့် လိင်တံမာကြောလာသည့်အခါ အမျိုးသမီးအင်္ဂါအတွင်းသို့ ထည့်သွင်းရန် လုံလောက်သော မာကြောမှုမျိုးဘယ်နှစ်ကြိမ်လောက် ဖြစ်ဖူးပါသလဲ။",
          zh: "Q2：在有性刺激而勃起时，您的勃起硬度足以插入的频率有多高？"
        },
        options: [
          { value: 0, label: { en: "No sexual activity", mm: "လိင်မှုကိစ္စ လုံးဝမရှိခဲ့ပါ", zh: "无性活动" } },
          { value: 1, label: { en: "Almost never or never", mm: "မဖြစ်သလောက် ရှားပါသည်", zh: "几乎从不或从不" } },
          { value: 2, label: { en: "A few times (less than half)", mm: "ရံဖန်ရံခါသာ ဖြစ်ပါသည်", zh: "少数几次（少于一半）" } },
          { value: 3, label: { en: "Sometimes (about half)", mm: "တစ်ခါတရံ ဖြစ်တတ်ပါသည်", zh: "有时（大约一半）" } },
          { value: 4, label: { en: "Most times (more than half)", mm: "မကြာခဏ ဖြစ်တတ်ပါသည်", zh: "大多数时候（多于一半）" } },
          { value: 5, label: { en: "Almost always or always", mm: "အမြဲလိုလို ဖြစ်တတ်ပါသည်", zh: "几乎总是或总是" } }
        ]
      },
      {
        id: "q3",
        type: "radio",
        text: {
          en: "Q3: During sexual intercourse, how often were you able to maintain your erection after you had penetrated (entered) your partner?",
          mm: "၃။ လိင်ဆက်ဆံနေစဉ်အတွင်း အမျိုးသမီးအင်္ဂါအတွင်းသို့ ထည့်သွင်းပြီးနောက် လိင်တံမာကြောမှုကို မည်မျှအထိ ဆက်လက်ထိန်းထားနိုင်ပါသလဲ။",
          zh: "Q3：在性交过程中，插入伴侣后，您能维持勃起的频率有多高？"
        },
        options: [
          { value: 0, label: { en: "Did not attempt intercourse", mm: "လိင်ဆက်ဆံရန် မကြိုးစားခဲ့ပါ", zh: "未尝试性交" } },
          { value: 1, label: { en: "Almost never or never", mm: "မထိန်းနိုင်သလောက် ရှားပါသည်", zh: "几乎从不或从不" } },
          { value: 2, label: { en: "A few times (less than half)", mm: "ရံဖန်ရံခါသာ ထိန်းနိုင်ပါသည်", zh: "少数几次（少于一半）" } },
          { value: 3, label: { en: "Sometimes (about half)", mm: "တစ်ခါတရံ ထိန်းနိုင်ပါသည်", zh: "有时（大约一半）" } },
          { value: 4, label: { en: "Most times (more than half)", mm: "မကြာခဏ ထိန်းနိုင်ပါသည်", zh: "大多数时候（多于一半）" } },
          { value: 5, label: { en: "Almost always or always", mm: "အမြဲလိုလို ထိန်းထားနိုင်ပါသည်", zh: "几乎总是或总是" } }
        ]
      },
      {
        id: "q4",
        type: "radio",
        text: {
          en: "Q4: During sexual intercourse, how difficult was it to maintain your erection to completion of intercourse?",
          mm: "၄။ လိင်ဆက်ဆံနေစဉ်အတွင်း ကိစ္စပြီးမြောက်သည်အထိ လိင်တံမာကြောမှုကို ဆက်လက်ထိန်းထားနိုင်စေရန်ကြိုးပမ်းမှုသည် သင့်အတွက် မည်မျှအထိ ခက်ခဲပါသလဲ။",
          zh: "Q4：在性交过程中，维持勃起直到性交结束有多困难？"
        },
        options: [
          { value: 0, label: { en: "Did not attempt intercourse", mm: "လိင်ဆက်ဆံရန် မကြိုးစားခဲ့ပါ", zh: "未尝试性交" } },
          { value: 1, label: { en: "Extremely difficult", mm: "အလွန်တရာ ခက်ခဲပါသည်", zh: "极其困难" } },
          { value: 2, label: { en: "Very difficult", mm: "အလွန် ခက်ခဲပါသည်", zh: "非常困难" } },
          { value: 3, label: { en: "Difficult", mm: "ခက်ခဲပါသည်", zh: "困难" } },
          { value: 4, label: { en: "Slightly difficult", mm: "အနည်းငယ် ခက်ခဲပါသည်", zh: "有点困难" } },
          { value: 5, label: { en: "Not difficult", mm: "မခက်ခဲပါ", zh: "不困难" } }
        ]
      },
      {
        id: "q5",
        type: "radio",
        text: {
          en: "Q5: When you attempted sexual intercourse, how often was it satisfactory for you?",
          mm: "၅။ သင့်အနေဖြင့် လိင်ဆက်ဆံခဲ့သည့် အကြိမ်များတွင် မိမိကိုယ်မိမိ မည်မျှအထိ စိတ်ကျေနပ်မှု ရှိခဲ့ပါသလဲ။",
          zh: "Q5：当您尝试性交时，您感到满意的频率有多高？"
        },
        options: [
          { value: 0, label: { en: "Did not attempt intercourse", mm: "လိင်ဆက်ဆံရန် မကြိုးစားခဲ့ပါ", zh: "未尝试性交" } },
          { value: 1, label: { en: "Almost never or never", mm: "ကျေနပ်မှုမရှိသလောက် ရှားပါသည်", zh: "几乎从不或从不" } },
          { value: 2, label: { en: "A few times (less than half)", mm: "ရံဖန်ရံခါသာ ကျေနပ်မှုရှိပါသည်", zh: "少数几次（少于一半）" } },
          { value: 3, label: { en: "Sometimes (about half)", mm: "တစ်ခါတရံ ကျေနပ်မှုရှိပါသည်", zh: "有时（大约一半）" } },
          { value: 4, label: { en: "Most times (more than half)", mm: "မကြာခဏ ကျေနပ်မှုရှိပါသည်", zh: "大多数时候（多于一半）" } },
          { value: 5, label: { en: "Almost always or always", mm: "အမြဲလိုလို စိတ်ကျေနပ်မှု ရှိပါသည်", zh: "几乎总是或总是" } }
        ]
      }
    ],
    scoringRules: {
      calculate: (answers) => {
        const score = 
          (Number(answers.q1) || 0) + 
          (Number(answers.q2) || 0) + 
          (Number(answers.q3) || 0) + 
          (Number(answers.q4) || 0) + 
          (Number(answers.q5) || 0);

        let enSeverity = "";
        let mmSeverity = "";
        let zhSeverity = "";

        if (score >= 22) {
          enSeverity = "No Erectile Dysfunction";
          mmSeverity = "ပန်းသေပန်းညှိုးရောဂါ မရှိပါ (No ED)";
          zhSeverity = "无勃起功能障碍";
        } else if (score >= 17) {
          enSeverity = "Mild ED";
          mmSeverity = "လက္ခဏာ အနည်းငယ်သာရှိခြင်း (Mild ED)";
          zhSeverity = "轻度 ED";
        } else if (score >= 12) {
          enSeverity = "Mild-to-Moderate ED";
          mmSeverity = "အနည်းငယ်မှ အသင့်အတင့်ရှိခြင်း (Mild-to-Moderate ED)";
          zhSeverity = "轻至中度 ED";
        } else if (score >= 8) {
          enSeverity = "Moderate ED";
          mmSeverity = "အသင့်အတင့် ရှိခြင်း (Moderate ED)";
          zhSeverity = "中度 ED";
        } else {
          enSeverity = "Severe ED";
          mmSeverity = "ပြင်းထန်သော လက္ခဏာရှိခြင်း (Severe ED)";
          zhSeverity = "重度 ED";
        }

        return {
          totalScore: score,
          severity: { en: enSeverity, mm: mmSeverity, zh: zhSeverity }
        };
      }
    }
  },

  iciq_v1: {
    id: "iciq_v1",
    title: {
      en: "ICIQ-UI Short Form (Urinary Incontinence)",
      mm: "ဆီးမထိန်းနိုင်ဘဲ ထွက်ကျခြင်းဆိုင်ရာ ဆန်းစစ်ခြင်း (ICIQ-UI)",
      zh: "国际尿失禁咨询委员会问卷简表 (ICIQ-UI)"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "1. How often do you leak urine?",
          mm: "၁။ ဆီးဘယ်လောက် ခဏခဏ ထွက်ကျတတ်ပါသလဲ။",
          zh: "1. 您多久漏尿一次？"
        },
        options: [
          { value: 0, label: { en: "Never", mm: "လုံးဝမကျပါ", zh: "从不" } },
          { value: 1, label: { en: "About once a week or less often", mm: "တစ်ပတ်လျှင် ၁ ကြိမ်ခန့် (သို့မဟုတ်) ထိုထက်နည်းပါသည်", zh: "大约每周一次或更少" } },
          { value: 2, label: { en: "Two or three times a week", mm: "တစ်ပတ်လျှင် ၂ ကြိမ် သို့မဟုတ် ၃ ကြိမ်ခန့်", zh: "每周两三次" } },
          { value: 3, label: { en: "About once a day", mm: "တစ်နေ့လျှင် ၁ ကြိမ်ခန့်", zh: "大约每天一次" } },
          { value: 4, label: { en: "Several times a day", mm: "တစ်နေ့လျှင် အကြိမ်အနည်းငယ်", zh: "每天几次" } },
          { value: 5, label: { en: "All the time", mm: "အမြဲတမ်းလိုလို", zh: "一直" } }
        ]
      },
      {
        id: "q2",
        type: "radio",
        text: {
          en: "2. How much urine do you usually leak (whether you wear protection or not)?",
          mm: "၂။ ပုံမှန်အားဖြင့် ဆီးပမာဏ ဘယ်လောက်အထိ ထွက်ကျသွားတတ်ပါသလဲ?",
          zh: "2. 您通常漏多少尿（无论您是否采取保护措施）？"
        },
        options: [
          { value: 0, label: { en: "None", mm: "လုံးဝမထွက်ပါ", zh: "无" } },
          { value: 2, label: { en: "A small amount", mm: "ပမာဏ အနည်းငယ်သာ", zh: "少量" } },
          { value: 4, label: { en: "A moderate amount", mm: "အသင့်အတင့် ပမာဏ", zh: "中等量" } },
          { value: 6, label: { en: "A large amount", mm: "ပမာဏ အများအပြား", zh: "大量" } }
        ]
      },
      {
        id: "q3",
        type: "radio",
        text: {
          en: "3. Overall, how much does leaking urine interfere with your everyday life? (0 = Not at all, 10 = A great deal)",
          mm: "၃။ ခြုံငုံကြည့်လျှင် ဆီးမထိန်းနိုင်ဘဲ ထွက်ကျသည့်ပြဿနာသည် သင့်နေ့စဉ်လူမှုဘဝအပေါ် မည်မျှအထိအနှောင့်အယှက် ဖြစ်စေပါသလဲ။ (၀ မှ ၁၀ အထိ ရွေးချယ်ပါ)",
          zh: "3. 总体而言，漏尿在多大程度上干扰了您的日常生活？（0 = 完全没有，10 = 非常大）"
        },
        options: [
           { value: 0, label: { en: "0", mm: "0", zh: "0" } },
           { value: 1, label: { en: "1", mm: "1", zh: "1" } },
           { value: 2, label: { en: "2", mm: "2", zh: "2" } },
           { value: 3, label: { en: "3", mm: "3", zh: "3" } },
           { value: 4, label: { en: "4", mm: "4", zh: "4" } },
           { value: 5, label: { en: "5", mm: "5", zh: "5" } },
           { value: 6, label: { en: "6", mm: "6", zh: "6" } },
           { value: 7, label: { en: "7", mm: "7", zh: "7" } },
           { value: 8, label: { en: "8", mm: "8", zh: "8" } },
           { value: 9, label: { en: "9", mm: "9", zh: "9" } },
           { value: 10, label: { en: "10", mm: "10", zh: "10" } }
        ]
      }
    ],
    scoringRules: {
      calculate: (answers) => {
        const score = 
          (Number(answers.q1) || 0) + 
          (Number(answers.q2) || 0) + 
          (Number(answers.q3) || 0);

        let enSeverity = "";
        let mmSeverity = "";
        let zhSeverity = "";

        if (score === 0) {
           enSeverity = "No Incontinence";
           mmSeverity = "ဆီးမထိန်းနိုင်မှု မရှိပါ";
           zhSeverity = "无尿失禁";
        } else if (score <= 5) {
          enSeverity = "Mild Incontinence";
          mmSeverity = "ဆီးမထိန်းနိုင်မှု အနည်းငယ်သာရှိခြင်း (Mild)";
          zhSeverity = "轻度尿失禁";
        } else if (score <= 12) {
          enSeverity = "Moderate Incontinence";
          mmSeverity = "ဆီးမထိန်းနိုင်မှု အသင့်အတင့်ရှိခြင်း (Moderate)";
          zhSeverity = "中度尿失禁";
        } else {
          enSeverity = "Severe / Very Severe Incontinence";
          mmSeverity = "ဆီးမထိန်းနိုင်မှု ပြင်းထန်/အလွန်ပြင်းထန်ခြင်း (Severe)";
          zhSeverity = "重度/极重度尿失禁";
        }

        return {
          totalScore: score,
          severity: { en: enSeverity, mm: mmSeverity, zh: zhSeverity }
        };
      }
    }
  },

  nih_cpsi_v1: {
     id: "nih_cpsi_v1",
     title: {
       en: "NIH-CPSI (Chronic Prostatitis Symptom Index)",
       mm: "နာတာရှည် ဆီးကျိတ်ရောင်ခြင်းနှင့် ဆီးခုံကိုက်ခဲခြင်းဆိုင်ရာ (NIH-CPSI)",
       zh: "NIH慢性前列腺炎症状指数 (NIH-CPSI)"
     },
     questions: [
       {
         id: "q1a",
         type: "radio",
         text: {
           en: "1a. Pain Location: Area between rectum and testicles (perineum)?",
           mm: "၁က။ နာကျင်မှုနေရာ: စအိုနှင့် ကပ်ပယ်အိတ်ကြားနေရာ (ဆီးခုံအောက်ပိုင်း) တွင်နာကျင်ပါသလား။",
           zh: "1a. 疼痛部位：直肠和睾丸之间的区域（会阴）？"
         },
         options: [{ value: 1, label: { en: "Yes", mm: "ဟုတ်", zh: "是" } }, { value: 0, label: { en: "No", mm: "မဟုတ်", zh: "否" } }]
       },
       {
         id: "q1b",
         type: "radio",
         text: {
           en: "1b. Pain Location: Testicles?",
           mm: "၁ခ။ နာကျင်မှုနေရာ: ဝှေးစေ့/ကပ်ပယ်အိတ် တွင်နာကျင်ပါသလား။",
           zh: "1b. 疼痛部位：睾丸？"
         },
         options: [{ value: 1, label: { en: "Yes", mm: "ဟုတ်", zh: "是" } }, { value: 0, label: { en: "No", mm: "မဟုတ်", zh: "否" } }]
       },
       {
         id: "q1c",
         type: "radio",
         text: {
           en: "1c. Pain Location: Tip of the penis (not related to urination)?",
           mm: "၁ဂ။ နာကျင်မှုနေရာ: လိင်တံထိပ်ဖျား (ဆီးသွားခြင်းနှင့်မဆိုင်ဘဲ) နာကျင်ပါသလား။",
           zh: "1c. 疼痛部位：阴茎尖端（与排尿无关）？"
         },
         options: [{ value: 1, label: { en: "Yes", mm: "ဟုတ်", zh: "是" } }, { value: 0, label: { en: "No", mm: "မဟုတ်", zh: "否" } }]
       },
       {
         id: "q1d",
         type: "radio",
         text: {
           en: "1d. Pain Location: Below your waist, in your pubic or bladder area?",
           mm: "၁ဃ။ နာကျင်မှုနေရာ: ခါးအောက်ပိုင်း၊ ဆီးခုံ သို့မဟုတ် ဆီးအိမ်တည်ရှိရာနေရာ တွင်နာကျင်ပါသလား။",
           zh: "1d. 疼痛部位：腰部以下，耻骨或膀胱区域？"
         },
         options: [{ value: 1, label: { en: "Yes", mm: "ဟုတ်", zh: "是" } }, { value: 0, label: { en: "No", mm: "မဟုတ်", zh: "否" } }]
       },
       {
         id: "q2a",
         type: "radio",
         text: {
           en: "2a. Pain Triggers: Pain or burning during urination?",
           mm: "၂က။ ဆီးသွားနေစဉ်အတွင်း နာကျင်ခြင်း သို့မဟုတ်ပူစပ်ပူလောင်ဖြစ်ပါသလား။",
           zh: "2a. 疼痛触发因素：排尿时疼痛或灼热？"
         },
         options: [{ value: 1, label: { en: "Yes", mm: "ဟုတ်", zh: "是" } }, { value: 0, label: { en: "No", mm: "မဟုတ်", zh: "否" } }]
       },
       {
         id: "q2b",
         type: "radio",
         text: {
           en: "2b. Pain Triggers: Pain or discomfort during or after sexual climax (ejaculation)?",
           mm: "၂ခ။ သုတ်လွှတ်စဉ် (သို့မဟုတ်) သုတ်လွှတ်ပြီးနောက်နာကျင်ကိုက်ခဲပါသလား။",
           zh: "2b. 疼痛触发因素：性高潮（射精）期间或之后疼痛或不适？"
         },
         options: [{ value: 1, label: { en: "Yes", mm: "ဟုတ်", zh: "是" } }, { value: 0, label: { en: "No", mm: "မဟုတ်", zh: "否" } }]
       },
       {
         id: "q3",
         type: "radio",
         text: {
           en: "3. How often have you had pain or discomfort in any of these areas? (0=Never, 5=Always)",
           mm: "၃။ ဤနေရာများတွင် နာကျင်မှု မည်မျှအထိခဏခဏ ဖြစ်တတ်ပါသလဲ။ (၀=လုံးဝမဖြစ်ပါ မှ ၅=အမြဲတမ်းဖြစ်ပါသည်)",
           zh: "3. 您在这些区域发生疼痛或不适的频率如何？ (0=从不, 5=总是)"
         },
         options: [
            { value: 0, label: { en: "0", mm: "0", zh: "0" } },
            { value: 1, label: { en: "1", mm: "1", zh: "1" } },
            { value: 2, label: { en: "2", mm: "2", zh: "2" } },
            { value: 3, label: { en: "3", mm: "3", zh: "3" } },
            { value: 4, label: { en: "4", mm: "4", zh: "4" } },
            { value: 5, label: { en: "5", mm: "5", zh: "5" } }
         ]
       },
       {
         id: "q4",
         type: "radio",
         text: {
           en: "4. Rate your average pain on a scale of 0 (No pain) to 10 (Worst pain imaginable).",
           mm: "၄။ နာကျင်မှုဖြစ်သည့်ရက်များတွင် ပျမ်းမျှ မည်မျှအထိ ပြင်းထန်ပါသလဲ။ (၀=လုံးဝမနာပါ မှ ၁၀=အလွန်အမင်းနာကျင်ပါသည်)",
           zh: "4. 请在0（无痛）到10（想象中最痛）的范围内评估您的平均疼痛。"
         },
         options: [
            { value: 0, label: { en: "0", mm: "0", zh: "0" } }, { value: 1, label: { en: "1", mm: "1", zh: "1" } },
            { value: 2, label: { en: "2", mm: "2", zh: "2" } }, { value: 3, label: { en: "3", mm: "3", zh: "3" } },
            { value: 4, label: { en: "4", mm: "4", zh: "4" } }, { value: 5, label: { en: "5", mm: "5", zh: "5" } },
            { value: 6, label: { en: "6", mm: "6", zh: "6" } }, { value: 7, label: { en: "7", mm: "7", zh: "7" } },
            { value: 8, label: { en: "8", mm: "8", zh: "8" } }, { value: 9, label: { en: "9", mm: "9", zh: "9" } },
            { value: 10, label: { en: "10", mm: "10", zh: "10" } }
         ]
       },
       {
         id: "q5",
         type: "radio",
         text: {
           en: "5. How often have you had a sensation of not emptying your bladder completely?",
           mm: "၅။ ဆီးသွားပြီးလျှင် ဆီးမကုန်ဘဲ ကျန်နေသေးသလိုခံစားရမှု မည်မျှအထိ ဖြစ်တတ်ပါသလဲ။",
           zh: "5. 您多久会有一次膀胱未完全排空的感觉？"
         },
         options: [
            { value: 0, label: { en: "0", mm: "0", zh: "0" } },
            { value: 1, label: { en: "1", mm: "1", zh: "1" } },
            { value: 2, label: { en: "2", mm: "2", zh: "2" } },
            { value: 3, label: { en: "3", mm: "3", zh: "3" } },
            { value: 4, label: { en: "4", mm: "4", zh: "4" } },
            { value: 5, label: { en: "5", mm: "5", zh: "5" } }
         ]
       },
       {
         id: "q6",
         type: "radio",
         text: {
           en: "6. How often have you had to urinate again less than two hours after you finished?",
           mm: "၆။ ဆီးသွားပြီး (၂) နာရီပင်မပြည့်သေးမီ နောက်တစ်ကြိမ် ထပ်သွားရခြင်းမျိုး မည်မျှအထိ ဖြစ်တတ်ပါသလဲ။",
           zh: "6. 排尿后不到两小时，您多久需要再次排尿？"
         },
         options: [
            { value: 0, label: { en: "0", mm: "0", zh: "0" } },
            { value: 1, label: { en: "1", mm: "1", zh: "1" } },
            { value: 2, label: { en: "2", mm: "2", zh: "2" } },
            { value: 3, label: { en: "3", mm: "3", zh: "3" } },
            { value: 4, label: { en: "4", mm: "4", zh: "4" } },
            { value: 5, label: { en: "5", mm: "5", zh: "5" } }
         ]
       },
       {
         id: "q7",
         type: "radio",
         text: {
           en: "7. How much have your symptoms kept you from doing the kinds of things you would usually do?",
           mm: "၇။ ဤလက္ခဏာများကြောင့် သင်ပုံမှန်လုပ်ဆောင်နေကျ အလုပ်ကိစ္စများကို မလုပ်နိုင်ဘဲ မည်မျှအထိအဟန့်အတား ဖြစ်စေပါသလဲ။",
           zh: "7. 您的症状在多大程度上妨碍了您做通常会做的事情？"
         },
         options: [
            { value: 0, label: { en: "None", mm: "လုံးဝမရှိပါ", zh: "无" } },
            { value: 1, label: { en: "A little", mm: "အနည်းငယ်", zh: "一点" } },
            { value: 2, label: { en: "Some", mm: "အသင့်အတင့်", zh: "一些" } },
            { value: 3, label: { en: "A lot", mm: "အလွန်အမင်း", zh: "很多" } }
         ]
       },
       {
         id: "q8",
         type: "radio",
         text: {
           en: "8. How much did you think about your symptoms?",
           mm: "၈။ သင့်ရောဂါလက္ခဏာများအကြောင်းကို စိုးရိမ်ပူပန်ပြီး မည်မျှအထိ တွေးတောနေမိပါသလဲ။",
           zh: "8. 您有多经常想您的症状？"
         },
         options: [
            { value: 0, label: { en: "None", mm: "လုံးဝမတွေးမိပါ", zh: "无" } },
            { value: 1, label: { en: "A little", mm: "အနည်းငယ်", zh: "一点" } },
            { value: 2, label: { en: "Some", mm: "အသင့်အတင့်", zh: "一些" } },
            { value: 3, label: { en: "A lot", mm: "အလွန်အမင်း", zh: "很多" } }
         ]
       },
       {
         id: "q9",
         type: "radio",
         text: {
           en: "9. If you had to spend the rest of your life with your symptoms just the way they have been, how would you feel?",
           mm: "၉။ အကယ်၍ ဤဝေဒနာများနှင့်ပဲ တစ်သက်လုံးနေထိုင်သွားရမည်ဆိုပါက မည်သို့ခံစားရမည်နည်း။",
           zh: "9. 如果您余生都要忍受现在的症状，您会有什么感觉？"
         },
         options: [
            { value: 0, label: { en: "Delighted", mm: "အလွန်ကျေနပ်ပါသည်", zh: "非常高兴" } },
            { value: 1, label: { en: "Pleased", mm: "ကျေနပ်ပါသည်", zh: "高兴" } },
            { value: 2, label: { en: "Mostly satisfied", mm: "အများအားဖြင့် ကျေနပ်ပါသည်", zh: "基本满意" } },
            { value: 3, label: { en: "Mixed", mm: "ဆိုးလည်းမဆိုး၊ ကောင်းလည်းမကောင်းပါ", zh: "混合" } },
            { value: 4, label: { en: "Mostly dissatisfied", mm: "အများအားဖြင့် မကျေနပ်ပါ", zh: "基本不满意" } },
            { value: 5, label: { en: "Unhappy", mm: "စိတ်မချမ်းမြေ့ပါ", zh: "不开心" } },
            { value: 6, label: { en: "Terrible", mm: "အလွန်တရာ ဆိုးရွားလှပါသည်", zh: "糟糕透顶" } }
         ]
       }
     ],
     scoringRules: {
       calculate: (answers) => {
         const score = 
           (Number(answers.q1a) || 0) + (Number(answers.q1b) || 0) + (Number(answers.q1c) || 0) + (Number(answers.q1d) || 0) +
           (Number(answers.q2a) || 0) + (Number(answers.q2b) || 0) +
           (Number(answers.q3) || 0) + (Number(answers.q4) || 0) +
           (Number(answers.q5) || 0) + (Number(answers.q6) || 0) +
           (Number(answers.q7) || 0) + (Number(answers.q8) || 0) + (Number(answers.q9) || 0);

         let enSeverity = "";
         let mmSeverity = "";
         let zhSeverity = "";

         if (score <= 14) {
           enSeverity = "Mild Chronic Prostatitis/CPPS";
           mmSeverity = "လက္ခဏာ အနည်းငယ်သာရှိခြင်း (Mild)";
           zhSeverity = "轻度慢性前列腺炎/CPPS";
         } else if (score <= 29) {
           enSeverity = "Moderate Chronic Prostatitis/CPPS";
           mmSeverity = "လက္ခဏာ အသင့်အတင့်ရှိခြင်း (Moderate)";
           zhSeverity = "中度慢性前列腺炎/CPPS";
         } else {
           enSeverity = "Severe Chronic Prostatitis/CPPS";
           mmSeverity = "ပြင်းထန်သော လက္ခဏာရှိခြင်း (Severe)";
           zhSeverity = "重度慢性前列腺炎/CPPS";
         }

         return {
           totalScore: score,
           severity: { en: enSeverity, mm: mmSeverity, zh: zhSeverity }
         };
       }
     }
  },

  puf_v1: {
    id: "puf_v1",
    title: {
      en: "PUF Scale (Pelvic Pain and Urgency/Frequency)",
      mm: "တင်ပါဆုံနှင့် ဆီးအိမ်ကိုက်ခဲမှုဆိုင်ရာ မေးခွန်းလွှာ (PUF Scale)",
      zh: "PUF 量表 (盆腔疼痛和尿急/尿频)"
    },
    questions: [
      {
        id: "q1",
        type: "radio",
        text: {
          en: "1. Daytime Urination Frequency: How many times do you go to the bathroom during the day?",
          mm: "၁။ နေ့ဘက်တွင် ဆီးဘယ်နှစ်ကြိမ် သွားတတ်ပါသလဲ။",
          zh: "1. 日间排尿频率：您白天去几次洗手间？"
        },
        options: [
          { value: 0, label: { en: "3–6 times", mm: "၃ ကြိမ်မှ ၆ ကြိမ်", zh: "3-6次" } },
          { value: 1, label: { en: "7–10 times", mm: "၇ ကြိမ်မှ ၁၀ ကြိမ်", zh: "7-10次" } },
          { value: 2, label: { en: "11–14 times", mm: "၁၁ ကြိမ်မှ ၁၄ကြိမ်", zh: "11-14次" } },
          { value: 3, label: { en: "15–19 times", mm: "၁၅ ကြိမ်မှ ၁၉ ကြိမ်", zh: "15-19次" } },
          { value: 4, label: { en: "20 or more times", mm: "အကြိမ် ၂၀ နှင့်အထက်", zh: "20次或更多" } }
        ]
      },
      {
        id: "q2a",
        type: "radio",
        text: {
          en: "2A. Nighttime Urination Frequency: How many times do you get up at night to urinate?",
          mm: "၂က။ ညဘက်တွင် ဆီးသွားရန် ဘယ်နှစ်ကြိမ် နိုးတတ်ပါသလဲ။",
          zh: "2A. 夜间排尿频率：您晚上起床排尿几次？"
        },
        options: [
           { value: 0, label: { en: "0 times", mm: "၀ ကြိမ်", zh: "0次" } },
           { value: 1, label: { en: "1 time", mm: "၁ ကြိမ်", zh: "1次" } },
           { value: 2, label: { en: "2 times", mm: "၂ ကြိမ်", zh: "2次" } },
           { value: 3, label: { en: "3 times", mm: "၃ ကြိမ်", zh: "3次" } },
           { value: 4, label: { en: "4 or more times", mm: "၄ ကြိမ်နှင့်အထက်", zh: "4次或更多" } }
        ]
      },
      {
        id: "q2b",
        type: "radio",
        text: {
          en: "2B. Nighttime Bother: If you get up at night, does it bother you?",
          mm: "၂ခ။ ညဘက်ဆီးထသွားရခြင်းက စိတ်အနှောင့်အယှက်ဖြစ်ပါသလား။",
          zh: "2B. 夜间烦恼：如果您晚上起床，这会困扰您吗？"
        },
        options: [
           { value: 0, label: { en: "Never", mm: "လုံးဝမရှိ", zh: "从不" } },
           { value: 1, label: { en: "Mildly", mm: "အနည်းငယ်", zh: "轻微" } },
           { value: 2, label: { en: "Moderately", mm: "အသင့်အတင့်", zh: "中度" } },
           { value: 3, label: { en: "Severely", mm: "အလွန်အမင်း", zh: "严重" } }
        ]
      },
      {
        id: "q3a",
        type: "radio",
        text: {
          en: "3A. Pain Frequency: Do you experience pelvic pain or symptoms during or after sexual intercourse?",
          mm: "၃က။ အတူနေစဉ်အတွင်း သို့မဟုတ် အတူနေပြီးနောက် တင်ပါးဆုံအတွင်းပိုင်းနှင့်ဆီးခုံကိုက်ခဲမှုရှိပါသလား။",
          zh: "3A. 疼痛频率：您在性交期间或之后是否经历过盆腔疼痛或症状？"
        },
        options: [
           { value: 0, label: { en: "Never", mm: "လုံးဝမရှိ", zh: "从不" } },
           { value: 1, label: { en: "Occasionally", mm: "တစ်ခါတရံ", zh: "偶尔" } },
           { value: 2, label: { en: "Usually", mm: "အမြဲလိုလို", zh: "通常" } },
           { value: 3, label: { en: "Always", mm: "အမြဲတမ်း", zh: "总是" } }
        ]
      },
      {
        id: "q3b",
        type: "radio",
        text: {
          en: "3B. Behavioral Impact: Has pain or urgency ever made you avoid intimacy?",
          mm: "၃ခ။ နာကျင်မှုကြောင့် အတူနေရန် ရှောင်ကြဉ်မိပါသလား။",
          zh: "3B. 行为影响：疼痛或尿急是否曾让您避免亲密接触？"
        },
        options: [
           { value: 0, label: { en: "Never", mm: "လုံးဝမရှောင်", zh: "从不" } },
           { value: 1, label: { en: "Occasionally", mm: "တစ်ခါတရံ", zh: "偶尔" } },
           { value: 2, label: { en: "Usually", mm: "အမြဲလိုလို", zh: "通常" } },
           { value: 3, label: { en: "Always", mm: "အမြဲတမ်း", zh: "总是" } }
        ]
      },
      {
        id: "q4a",
        type: "radio",
        text: {
          en: "4A. Pain Location: Do you have pain associated with your bladder or in your pelvis?",
          mm: "၄က။ ဆီးအိမ် သို့မဟုတ် ဆီးခုံတစ်ဝိုက် နာကျင်ကိုက်ခဲမှု ရှိပါသလား။",
          zh: "4A. 疼痛部位：您是否有与膀胱或骨盆相关的疼痛？"
        },
        options: [
           { value: 0, label: { en: "Never", mm: "လုံးဝမရှိ", zh: "从不" } },
           { value: 1, label: { en: "Occasionally", mm: "တစ်ခါတရံ", zh: "偶尔" } },
           { value: 2, label: { en: "Usually", mm: "အမြဲလိုလို", zh: "通常" } },
           { value: 3, label: { en: "Always", mm: "အမြဲတမ်း", zh: "总是" } }
        ]
      },
      {
        id: "q4b",
        type: "radio",
        text: {
          en: "4B. Pain Intensity: If you have pain, is it usually...",
          mm: "၄ခ။ ဆီးခုံနာကျင်မှု ပြင်းထန်မှုအဆင့်-",
          zh: "4B. 疼痛强度：如果您有疼痛，通常是..."
        },
        options: [
           { value: 0, label: { en: "None", mm: "မနာပါ", zh: "无" } },
           { value: 1, label: { en: "Mild", mm: "အနည်းငယ်", zh: "轻度" } },
           { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
           { value: 3, label: { en: "Severe", mm: "ပြင်းထန်", zh: "重度" } }
        ]
      },
      {
        id: "q4c",
        type: "radio",
        text: {
          en: "4C. Pain Bother: Does your pelvic pain bother you?",
          mm: "၄ဂ။ ဆီးခုံနာကျင်မှုက စိတ်အနှောင့်အယှက်ဖြစ်စေပါသလား။",
          zh: "4C. 疼痛困扰：您的盆腔疼痛会困扰您吗？"
        },
        options: [
           { value: 0, label: { en: "Never", mm: "လုံးဝမရှိ", zh: "从不" } },
           { value: 1, label: { en: "Occasionally", mm: "တစ်ခါတရံ", zh: "偶尔" } },
           { value: 2, label: { en: "Usually", mm: "အမြဲလိုလို", zh: "通常" } },
           { value: 3, label: { en: "Always", mm: "အမြဲတမ်း", zh: "总是" } }
        ]
      },
      {
        id: "q5a",
        type: "radio",
        text: {
          en: "5A. Urgency Frequency: Do you still feel a strong urgency to urinate immediately after you have emptied your bladder?",
          mm: "၅က။ ဆီးသွားပြီးသော်လည်း ချက်ချင်းဆီးပြန်သွားချင်စိတ်(ဆီးအောင့်ခြင်း) ဖြစ်ပေါ်ပါသလား။",
          zh: "5A. 尿急频率：排空膀胱后，您是否仍感到强烈的立即排尿冲动？"
        },
        options: [
           { value: 0, label: { en: "Never", mm: "လုံးဝမရှိ", zh: "从不" } },
           { value: 1, label: { en: "Occasionally", mm: "တစ်ခါတရံ", zh: "偶尔" } },
           { value: 2, label: { en: "Usually", mm: "အမြဲလိုလို", zh: "通常" } },
           { value: 3, label: { en: "Always", mm: "အမြဲတမ်း", zh: "总是" } }
        ]
      },
      {
        id: "q5b",
        type: "radio",
        text: {
          en: "5B. Urgency Intensity: If you have urgency, is it usually...",
          mm: "၅ခ။ ဆီးအောင့်ခြင်း ပြင်းထန်မှုအဆင့်-",
          zh: "5B. 尿急强度：如果您有尿急，通常是..."
        },
        options: [
           { value: 0, label: { en: "None", mm: "မရှိပါ", zh: "无" } },
           { value: 1, label: { en: "Mild", mm: "အနည်းငယ်", zh: "轻度" } },
           { value: 2, label: { en: "Moderate", mm: "အသင့်အတင့်", zh: "中度" } },
           { value: 3, label: { en: "Severe", mm: "ပြင်းထန်", zh: "重度" } }
        ]
      },
      {
        id: "q5c",
        type: "radio",
        text: {
          en: "5C. Urgency Bother: Does this urgency bother you?",
          mm: "၅ဂ။ ဆီးအောင့်ခြင်းက စိတ်အနှောင့်အယှက်ဖြစ်စေပါသလား။",
          zh: "5C. 尿急困扰：这种尿急会困扰您吗？"
        },
        options: [
           { value: 0, label: { en: "Never", mm: "လုံးဝမရှိ", zh: "从不" } },
           { value: 1, label: { en: "Occasionally", mm: "တစ်ခါတရံ", zh: "偶尔" } },
           { value: 2, label: { en: "Usually", mm: "အမြဲလိုလို", zh: "通常" } },
           { value: 3, label: { en: "Always", mm: "အမြဲတမ်း", zh: "总是" } }
        ]
      }
    ],
    scoringRules: {
      calculate: (answers) => {
        const score = 
          (Number(answers.q1) || 0) + 
          (Number(answers.q2a) || 0) + (Number(answers.q2b) || 0) +
          (Number(answers.q3a) || 0) + (Number(answers.q3b) || 0) +
          (Number(answers.q4a) || 0) + (Number(answers.q4b) || 0) + (Number(answers.q4c) || 0) +
          (Number(answers.q5a) || 0) + (Number(answers.q5b) || 0) + (Number(answers.q5c) || 0);

        let enSeverity = "";
        let mmSeverity = "";
        let zhSeverity = "";

        if (score <= 4) {
          enSeverity = "Very low risk";
          mmSeverity = "ရောဂါဖြစ်နိုင်ခြေ အလွန်နည်းပါသည် (Very low risk)";
          zhSeverity = "风险极低";
        } else if (score <= 12) {
          enSeverity = "Mild symptoms";
          mmSeverity = "လက္ခဏာ အနည်းငယ်ရှိခြင်း (Mild symptoms)";
          zhSeverity = "轻度症状";
        } else if (score <= 20) {
          enSeverity = "Moderate indicators";
          mmSeverity = "လက္ခဏာ အသင့်အတင့်ရှိခြင်း (Moderate indicators)";
          zhSeverity = "中度指标";
        } else {
          enSeverity = "Severe syndrome";
          mmSeverity = "ပြင်းထန်သော လက္ခဏာရှိခြင်း (Severe syndrome)";
          zhSeverity = "重度综合征";
        }

        return {
          totalScore: score,
          severity: { en: enSeverity, mm: mmSeverity, zh: zhSeverity }
        };
      }
    }
  }
};