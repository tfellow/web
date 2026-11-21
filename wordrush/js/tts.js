// High-Quality Bilingual TTS Helper (English en-US & Korean ko-KR)
// 1. Automatically uses Natural / Neural / Google browser voices when available
// 2. Automatically falls back to Online Native Audio (en / ko) if OS lacks English voices
//    (prevents Korean Windows / Android from reading English in a Korean accent!)
(function (global) {
  const PREF_KEY = "my_wordrush_tts_prefs_v2";
  let cachedVoices = [];
  let initialized = false;
  let activeAudio = null;

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch (e) {}
  }

  function refreshVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    const list = window.speechSynthesis.getVoices() || [];
    if (list.length > 0) cachedVoices = list;
    return cachedVoices;
  }

  function initVoices() {
    if (initialized || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    initialized = true;
    refreshVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
      window.speechSynthesis.onvoiceschanged = () => refreshVoices();
    }
  }

  function scoreEnglishVoice(v) {
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase().replace("_", "-");
    if (!lang.startsWith("en")) return -1000;

    let score = 0;
    if (lang === "en-us") score += 40;
    else if (lang === "en-gb") score += 25;
    else score += 10;

    if (/natural|neural/.test(name)) score += 120;
    if (/aria|jenny|ava|andrew|emma|brian|sonia|libby/.test(name)) score += 35;
    if (/google us english/.test(name)) score += 110;
    else if (/google uk english/.test(name)) score += 90;
    else if (/google/.test(name)) score += 60;
    if (/samantha|allison|alex|karen|daniel|siri/.test(name)) score += 55;
    if (/online/.test(name)) score += 25;
    if (/enhanced|premium/.test(name)) score += 45;
    if (/espeak|compact/.test(name)) score -= 40;
    return score;
  }

  function scoreKoreanVoice(v) {
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase().replace("_", "-");
    if (!lang.startsWith("ko")) return -1000;

    let score = 40;
    if (/natural|neural/.test(name)) score += 120;
    if (/sunhi|injoon|ji-?min|seo-?hyeon/.test(name)) score += 35;
    if (/google/.test(name)) score += 100;
    if (/yuna|sora/.test(name)) score += 55;
    if (/online/.test(name)) score += 25;
    if (/enhanced|premium/.test(name)) score += 45;
    return score;
  }

  function pickBestBrowserVoice(targetLang) {
    const voices = refreshVoices();
    if (!voices.length) return { voice: null, score: -999 };

    const isKo = targetLang.toLowerCase().startsWith("ko");
    const prefs = loadPrefs();
    const savedURI = isKo ? prefs.koVoiceURI : prefs.enVoiceURI;
    if (savedURI && savedURI !== "auto") {
      const exact = voices.find((v) => v.voiceURI === savedURI || v.name === savedURI);
      if (exact) return { voice: exact, score: 200 };
    }

    const scorer = isKo ? scoreKoreanVoice : scoreEnglishVoice;
    let best = null;
    let bestScore = -999;
    for (const v of voices) {
      const s = scorer(v);
      if (s > bestScore) {
        bestScore = s;
        best = v;
      }
    }
    return bestScore > -500 ? { voice: best, score: bestScore } : { voice: null, score: -999 };
  }

  function detectLang(text) {
    return /[가-힣]/.test(String(text || "")) ? "ko-KR" : "en-US";
  }

  function stopAll() {
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch (e) {}
      activeAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  function splitChunks(text, maxLen = 170) {
    if (text.length <= maxLen) return [text];
    const parts = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let buf = "";
    for (const p of parts) {
      if ((buf + " " + p).trim().length > maxLen) {
        if (buf) chunks.push(buf.trim());
        buf = p;
      } else {
        buf = (buf + " " + p).trim();
      }
    }
    if (buf) chunks.push(buf.trim());
    return chunks;
  }

  function playOnlineTTS(text, lang, rate, onFail) {
    const tl = lang.toLowerCase().startsWith("ko") ? "ko" : "en";
    const chunks = splitChunks(text);
    let idx = 0;

    function playNext() {
      if (idx >= chunks.length) return;
      const q = encodeURIComponent(chunks[idx]);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${q}`;
      const audio = new Audio();
      audio.referrerPolicy = "no-referrer";
      audio.src = url;
      audio.playbackRate = Math.min(1.3, Math.max(0.7, rate));
      activeAudio = audio;

      audio.onended = () => {
        idx += 1;
        playNext();
      };
      audio.onerror = () => {
        if (typeof onFail === "function") onFail();
      };
      audio.play().catch(() => {
        if (typeof onFail === "function") onFail();
      });
    }

    playNext();
  }

  function playBrowserTTS(text, lang, rate, forcedVoice) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = 1.0;

    const picked = forcedVoice || pickBestBrowserVoice(lang).voice;
    if (picked) {
      utter.voice = picked;
      utter.lang = picked.lang || lang;
    }

    setTimeout(() => {
      try {
        synth.speak(utter);
      } catch (e) {}
    }, 25);
  }

  function doSpeak(rawText, lang, rate) {
    stopAll();
    const cleaned = String(rawText)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) return;

    const prefs = loadPrefs();
    const engine = prefs.engine || "auto"; // 'auto' | 'online' | 'browser'
    const { voice, score } = pickBestBrowserVoice(lang);

    // 1. User explicitly chose Online Native TTS
    if (engine === "online") {
      playOnlineTTS(cleaned, lang, rate, () => playBrowserTTS(cleaned, lang, rate, voice));
      return;
    }

    // 2. User explicitly chose Browser TTS
    if (engine === "browser") {
      playBrowserTTS(cleaned, lang, rate, voice);
      return;
    }

    // 3. Auto mode (Recommended):
    //    Use browser voice ONLY if it's a genuinely high-quality Natural/Neural/Google voice (score >= 130)
    //    Otherwise use Online Native TTS so Korean OS never reads English in Korean accent!
    if (voice && score >= 130) {
      playBrowserTTS(cleaned, lang, rate, voice);
    } else {
      playOnlineTTS(cleaned, lang, rate, () => playBrowserTTS(cleaned, lang, rate, voice));
    }
  }

  const TTS = {
    enabled: true,

    isSupported() {
      return typeof window !== "undefined";
    },

    speak(text, rateOrOpts = 0.94) {
      if (!this.enabled || !text) return;
      initVoices();

      let lang = detectLang(text);
      let rate = 0.94;
      if (typeof rateOrOpts === "number") {
        rate = rateOrOpts;
      } else if (rateOrOpts && typeof rateOrOpts === "object") {
        if (rateOrOpts.lang) lang = rateOrOpts.lang;
        if (typeof rateOrOpts.rate === "number") rate = rateOrOpts.rate;
      }

      const prefs = loadPrefs();
      if (typeof prefs.rate === "number") rate = prefs.rate;

      const voices = refreshVoices();
      if (voices.length === 0 && "speechSynthesis" in window) {
        let done = false;
        const run = () => {
          if (done) return;
          done = true;
          refreshVoices();
          doSpeak(text, lang, rate);
        };
        window.speechSynthesis.addEventListener("voiceschanged", run, { once: true });
        setTimeout(run, 180);
      } else {
        doSpeak(text, lang, rate);
      }
    },

    speakEn(text, rate = 0.94) {
      this.speak(text, { lang: "en-US", rate });
    },

    speakKo(text, rate = 1.0) {
      this.speak(text, { lang: "ko-KR", rate });
    },

    getVoicesFor(langPrefix) {
      initVoices();
      const voices = refreshVoices();
      const isKo = langPrefix.toLowerCase().startsWith("ko");
      const scorer = isKo ? scoreKoreanVoice : scoreEnglishVoice;
      return voices
        .filter((v) => (v.lang || "").toLowerCase().startsWith(isKo ? "ko" : "en"))
        .sort((a, b) => scorer(b) - scorer(a));
    },

    getCurrentVoice(langPrefix) {
      initVoices();
      return pickBestBrowserVoice(langPrefix).voice;
    },

    getActiveEngineLabel(langPrefix) {
      const prefs = loadPrefs();
      const engine = prefs.engine || "auto";
      const { voice, score } = pickBestBrowserVoice(langPrefix);
      if (engine === "online") return "🌐 온라인 원어민 음성";
      if (engine === "browser") return voice ? `💻 ${voice.name}` : "💻 브라우저 기본";
      if (voice && score >= 130) return `✨ ${voice.name}`;
      return "🌐 온라인 원어민 음성 (자동)";
    },

    getPrefs() {
      return loadPrefs();
    },

    setPrefs(next) {
      const merged = { ...loadPrefs(), ...next };
      savePrefs(merged);
      return merged;
    },

    stop: stopAll,
  };

  initVoices();
  global.MY_TTS = TTS;
})(window);
