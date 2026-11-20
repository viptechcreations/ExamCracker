// ==============================================================
// GURU JI LIVE AI ENGINE (POWERED BY OPENROUTER DEDICATED API)
// ==============================================================

const OPENROUTER_API_KEY = "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";

const GuruAI = {
  isTyping: false,
  chatHistory: [],

  // Official Indian Exam Knowledge Base
  examFactsheet: `
OFFICIAL EXAM PATTERNS (ALWAYS USE THIS EXACT DATA WHEN ASKED):
1. SSC MTS (Computer Based Online Test):
   - Total: 90 Questions, 270 Marks (3 Marks each), Total Time: 90 Minutes (45 Min per session).
   - Session 1 (Qualifying, NO Negative Marking): Maths (20 Q, 60 Marks) + Reasoning (20 Q, 60 Marks).
   - Session 2 (Merit Deciding, -1 Negative Marking per wrong answer): General Awareness/GK (25 Q, 75 Marks) + English (25 Q, 75 Marks).
2. SSC Stenographer (Grade C & D - Online CBT):
   - Total: 200 Questions, 200 Marks, Time: 2 Hours (120 Mins), Negative Marking: 0.25 marks.
   - Sections: Reasoning (50 Q, 50 Marks), General Awareness (50 Q, 50 Marks), English Language (100 Q, 100 Marks). (NO Maths in Steno!).
   - Skill Test: Shorthand Dictation (80 wpm for Grade D, 100 wpm for Grade C).
3. SSC CHSL / CGL (Tier-1 Online CBT):
   - Total: 100 Questions, 200 Marks (2 Marks each), Time: 60 Minutes, Negative Marking: 0.50 marks.
   - Sections: Reasoning (25 Q), GK/GS (25 Q), Maths (25 Q), English (25 Q).
4. SSC GD Constable:
   - Total: 80 Questions, 160 Marks (2 Marks each), Time: 60 Minutes, Negative Marking: 0.25 marks.
   - Sections: Reasoning (20 Q), GK/GS (20 Q), Maths (20 Q), Hindi/English (20 Q).
5. RRB NTPC (CBT-1):
   - Total: 100 Questions, 100 Marks, Time: 90 Minutes, Negative Marking: 1/3rd mark.
   - Sections: General Awareness (40 Q), Maths (30 Q), Reasoning (30 Q).
6. UPSSSC PET:
   - Total: 100 Questions, 100 Marks, Time: 2 Hours, Negative Marking: 0.25 marks.`,

  getLoggedInUser() {
    try {
      const saved = localStorage.getItem('ec_active_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  detectFemaleByName(firstName) {
    const lower = firstName.toLowerCase();
    const maleExceptions = [
      "aditya", "shiva", "krishna", "kanhaiya", "ravi", "shashi", 
      "abhi", "mani", "hari", "gopal", "raja", "rana", "urya", "surya", "somya"
    ];
    if (maleExceptions.includes(lower)) return false;

    const femaleNames = [
      "priya", "neha", "pooja", "puja", "anjali", "ritu", "khushi", "sakshi",
      "divya", "kavita", "sunita", "anita", "rekha", "sneha", "kriti", "preeti",
      "priti", "swati", "arti", "aarti", "jyoti", "komal", "payal", "kajal",
      "sonal", "anchal", "muskan", "simran", "tanu", "manu", "annu", "radha",
      "shreya", "tanya", "anya", "riya", "siya", "diya", "nisha", "asha"
    ];
    if (femaleNames.includes(lower)) return true;

    return (
      lower.endsWith("a") || lower.endsWith("i") || lower.endsWith("ee") || 
      lower.endsWith("ya") || lower.endsWith("ti") || lower.endsWith("shi") || 
      lower.endsWith("ni") || lower.endsWith("ka")
    );
  },

  // Boys = "Vishal Guru", Girls = "Priya Devi Ji"
  getFormattedTitleName() {
    const user = this.getLoggedInUser();
    if (user && user.name && user.name.trim()) {
      const firstName = user.name.trim().split(' ')[0];
      const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);

      let isFemale = false;
      if (user.gender === 'female') isFemale = true;
      else if (user.gender === 'male') isFemale = false;
      else isFemale = this.detectFemaleByName(firstName);

      const honorific = isFemale ? "Devi Ji" : "Guru";
      const lowerCap = capitalized.toLowerCase();
      if (lowerCap.endsWith("guru") || lowerCap.endsWith("devi") || lowerCap.endsWith("devi ji")) {
        return capitalized;
      }
      return `${capitalized} ${honorific}`;
    }
    return "Guru";
  },

  async askGuru(userQuestion) {
    if (!userQuestion || !userQuestion.trim()) return;
    if (this.isTyping) return;

    const currentUser = this.getLoggedInUser();
    if (!currentUser) {
      this.speak("🔒 Arey Guru! Pehle upar 'Mobile Login' button se apna naam daal kar login kar lo, fir aaram se baith kar baat karenge! 🔱");
      if (typeof openAuthModal === 'function') {
        setTimeout(() => openAuthModal(), 1200);
      }
      return;
    }

    const studentTitle = this.getFormattedTitleName();
    this.isTyping = true;
    this.showThinking();

    const systemInstruction = `You are "Guru Ji", an extremely intelligent, friendly, and authentic Indian competitive exam AI Mentor (just like Google Gemini).
The student you are talking to is "${studentTitle}".

${this.examFactsheet}

CRITICAL INSTRUCTIONS:
1. Language: ALWAYS speak in natural, conversational Hinglish (Hindi written in English alphabets, e.g., "Dekho ${studentTitle}, is sawal ko aise samjho..."). Never reply in pure formal English unless asked for English grammar/vocab.
2. Personalization: Address the student warmly as "${studentTitle}" (if "${studentTitle}" ends with "Devi Ji", speak with feminine respect like "karti hain"; if "Guru", speak warmly like "karte ho").
3. Intelligence & Accuracy: Give real, unscripted, step-by-step, and 100% accurate answers. Solve Maths/Reasoning problems step-by-step with short tricks. Explain GK/GS/English concepts clearly. If asked about SSC/Steno/Railway patterns, strictly follow the OFFICIAL EXAM PATTERNS above.
4. Blessing: End your response naturally with Mahadev's blessing for "${studentTitle}" getting a government job.`;

    this.chatHistory.push({ role: "user", content: userQuestion });
    if (this.chatHistory.length > 8) {
      this.chatHistory.shift();
    }

    // Top Free High-Intelligence Models on OpenRouter (Auto-fallback chain)
    const freeModels = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "mistralai/mistral-small-3.1-24b-instruct:free",
      "openrouter/free"
    ];

    for (const modelId of freeModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vip-2005.github.io/ExamCracker/",
            "X-Title": "ExamCracker Guru Ji AI"
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: "system", content: systemInstruction },
              ...this.chatHistory
            ],
            temperature: 0.6
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiReply = data.choices?.[0]?.message?.content;
          if (aiReply && aiReply.trim().length > 5) {
            this.isTyping = false;
            this.chatHistory.push({ role: "assistant", content: aiReply.trim() });
            this.speak(aiReply.trim());
            return;
          }
        }
      } catch (err) {
        console.warn(`Model ${modelId} busy, switching to next...`);
      }
    }

    this.isTyping = false;
    this.speak(`Arey ${studentTitle}! Internet connection thoda slow ho gaya hai, ek baar dobara 'Pucho' dabao! Har Har Mahadev! 🔱`);
  },

  showThinking() {
    const studentTitle = this.getFormattedTitleName();
    const box = document.getElementById('guruSpeechBox');
    const text = document.getElementById('guruSpeechText');
    if (box && text) {
      text.innerHTML = `<span class="animate-pulse text-amber-600 font-bold">🧘‍♂️ Guru Ji ${studentTitle} ke liye soch rahe hain...</span>`;
      box.classList.remove('hidden');
    }
  },

  speak(message) {
    const box = document.getElementById('guruSpeechBox');
    const text = document.getElementById('guruSpeechText');
    if (!box || !text) return;
    text.innerText = message.replace(/\*\*/g, '');
    box.classList.remove('hidden');
  },

  dismiss() {
    const box = document.getElementById('guruSpeechBox');
    if (box) box.classList.add('hidden');
  },

  toggleBox() {
    const box = document.getElementById('guruSpeechBox');
    if (!box) return;
    box.classList.toggle('hidden');
    const input = document.getElementById('guruUserInput');
    if (input && !box.classList.contains('hidden')) {
      input.focus();
    }
  },

  openAndAsk(question) {
    const box = document.getElementById('guruSpeechBox');
    if (box) box.classList.remove('hidden');
    this.askGuru(question);
  },

  askExamGoal() {
    const studentTitle = this.getFormattedTitleName();
    this.askGuru(`Namaste Guru Ji! Mera naam ${studentTitle} hai. Mujhse pucho ki meri taiyari kaisi chal rahi hai aur aaj kaunsa subject padhna hai.`);
  },

  randomTip() {
    this.askGuru("Exam crack karne ki ek practical strategy aur motivation batao.");
  }
};

// Update navbar title immediately
if (typeof updateAuthUI === 'function') {
  updateAuthUI();
}
