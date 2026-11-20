// ==============================================================
// GURU JI LIVE AI ENGINE (OPENROUTER + SMART FALLBACK + DIAGNOSTICS)
// ==============================================================

const OPENROUTER_API_KEY = "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";

const GuruAI = {
  isTyping: false,
  chatHistory: [],

  examFactsheet: `
OFFICIAL EXAM PATTERNS (ALWAYS USE THIS EXACT DATA WHEN ASKED):
1. SSC MTS (Online CBT): Total 90 Qs, 270 Marks, 90 Mins. Session-1: Maths(20Q)+Reasoning(20Q) [Qualifying, No Negative]. Session-2: GK(25Q, 75M)+English(25Q, 75M) [Merit on Session-2, -1 negative].
2. SSC Stenographer (Grade C & D): 200 Qs, 200 Marks, 120 Mins, -0.25 negative. Reasoning(50Q), GK(50Q), English(100Q). No Maths! Skill: 80/100 wpm Shorthand.
3. SSC CHSL / CGL (Tier-1): 100 Qs, 200 Marks, 60 Mins, -0.50 negative (Maths 25, Reasoning 25, English 25, GK 25).
4. SSC GD: 80 Qs, 160 Marks, 60 Mins, -0.25 negative (20 Q each: Maths, Reasoning, GK, Hindi/Eng).
5. RRB NTPC CBT-1: 100 Qs, 100 Marks, 90 Mins, -1/3 negative (GA 40, Maths 30, Reasoning 30).
6. UPSSSC PET: 100 Qs, 100 Marks, 120 Mins, -0.25 negative.`,

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
      this.speak("🔒 Pehle upar 'Mobile Login' button se apna naam daal kar login kar lo, fir aaram se baith kar baat karenge! 🔱");
      if (typeof openAuthModal === 'function') {
        setTimeout(() => openAuthModal(), 1200);
      }
      return;
    }

    const studentTitle = this.getFormattedTitleName();
    this.isTyping = true;
    this.showThinking();

    const systemInstruction = `Tum "Guru Ji" ho, India ke top competitive exam mentor. Student ka naam "${studentTitle}" hai.
${this.examFactsheet}
Rules:
1. Hamesha natural Hinglish (Hindi in English script) me baat karo. Pure English mat bolo.
2. Student ko pyar aur samman se "${studentTitle}" keh kar bulao.
3. Har sawal (Maths, Reasoning, GK, English, Steno, Strategy) ka bilkul sahi, step-by-step aur smart jawab do.
4. Aakhir me Mahadev ka aashirwad do ki "${studentTitle}" ki sarkari job jaldi lage.`;

    this.chatHistory.push({ role: "user", content: userQuestion });
    if (this.chatHistory.length > 6) {
      this.chatHistory.shift();
    }

    const freeModels = [
      "openrouter/free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemma-3-27b-it:free"
    ];

    let lastStatus = "";

    for (const modelId of freeModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://viptechcreations.github.io/",
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

        const data = await response.json().catch(() => null);

        if (response.ok && data?.choices?.[0]?.message?.content) {
          const aiReply = data.choices[0].message.content.trim();
          this.isTyping = false;
          this.chatHistory.push({ role: "assistant", content: aiReply });
          this.speak(aiReply);
          return;
        } else {
          lastStatus = `HTTP ${response.status}: ${data?.error?.message || "Model unavailable"}`;
          console.warn(`OpenRouter [${modelId}] ->`, lastStatus);
        }
      } catch (err) {
        lastStatus = `Network: ${err.message}`;
        console.warn(`OpenRouter [${modelId}] error ->`, lastStatus);
      }
    }

    // Fallback to Pollinations GET if OpenRouter free pool hits rate-limit
    try {
      const shortPrompt = `You are Guru Ji (Indian Exam Mentor). Address student as ${studentTitle}. Reply in Hinglish only. (${this.examFactsheet}). Question: ${userQuestion}`;
      const url = `https://text.pollinations.ai/${encodeURIComponent(shortPrompt)}?model=openai&seed=${Date.now() % 10000}`;
      const res = await fetch(url);
      if (res.ok) {
        const textReply = await res.text();
        if (textReply && textReply.trim().length > 5 && !textReply.includes("<!DOCTYPE")) {
          this.isTyping = false;
          this.chatHistory.push({ role: "assistant", content: textReply.trim() });
          this.speak(textReply.trim());
          return;
        }
      }
    } catch (e2) {
      console.warn("Pollinations fallback failed:", e2);
    }

    this.isTyping = false;
    this.speak(`Arey ${studentTitle}! Abhi free AI servers busy chal rahe hain (${lastStatus || "Rate limit"}). 10-15 second ruk kar dobara 'Pucho' dabao! Har Har Mahadev! 🔱`);
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
    this.askGuru(`Namaste Guru Ji! Mera naam ${studentTitle} hai. Mujhse pucho ki meri taiyari kaisi chal rahi hai.`);
  },

  randomTip() {
    this.askGuru("Exam me accuracy aur speed badhane ka sabse best tarika batao.");
  }
};

if (typeof updateAuthUI === 'function') {
  updateAuthUI();
}
