window.SMS = window.SMS || {};

(function () {
  let repeatTimer = null;
  let activeRepeatToken = 0;

  function pickEnglishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    return (
      voices.find((v) => v.lang === 'en-US' && /Google|Samantha|Aria|Jenny|Natural/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null
    );
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = pickEnglishVoice;
  }

  function stopSpeaking() {
    activeRepeatToken += 1;
    if (repeatTimer) {
      clearTimeout(repeatTimer);
      repeatTimer = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function speak(text, options) {
    const opts = Object.assign({ rate: 1.0, repeat: 1, onEnd: null }, options);
    stopSpeaking();

    if (!('speechSynthesis' in window)) {
      if (window.SMS.toast) window.SMS.toast('이 브라우저는 음성 합성(TTS)을 지원하지 않습니다.', 'error');
      return;
    }

    const token = activeRepeatToken;
    let remaining = opts.repeat;

    function runOnce() {
      if (token !== activeRepeatToken || remaining <= 0) {
        if (opts.onEnd) opts.onEnd();
        return;
      }
      remaining -= 1;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = opts.rate;
      const voice = pickEnglishVoice();
      if (voice) utter.voice = voice;

      utter.onend = () => {
        if (token !== activeRepeatToken) return;
        if (remaining > 0) {
          repeatTimer = setTimeout(runOnce, 550);
        } else if (opts.onEnd) {
          opts.onEnd();
        }
      };

      utter.onerror = () => {
        if (opts.onEnd) opts.onEnd();
      };

      window.speechSynthesis.speak(utter);
    }

    runOnce();
  }

  function renderTTSBar(text, extraClass) {
    const safeAttr = encodeURIComponent(text);
    return `
      <div class="tts-bar ${extraClass || ''}">
        <button type="button" class="tts-btn" data-tts="${safeAttr}" data-rate="1.0" data-repeat="1" title="원속도 듣기">▶ 1.0x</button>
        <button type="button" class="tts-btn" data-tts="${safeAttr}" data-rate="0.7" data-repeat="1" title="느리게 듣기">🐢 0.7x</button>
        <button type="button" class="tts-btn" data-tts="${safeAttr}" data-rate="0.95" data-repeat="3" title="3회 반복 듣기">🔁 3회</button>
      </div>
    `;
  }

  function bindTTSButtons(container) {
    container.querySelectorAll('[data-tts]').forEach((btn) => {
      if (btn.dataset.ttsBound) return;
      btn.dataset.ttsBound = '1';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = decodeURIComponent(btn.dataset.tts);
        const rate = parseFloat(btn.dataset.rate || '1');
        const repeat = parseInt(btn.dataset.repeat || '1', 10);
        container.querySelectorAll('.tts-btn.playing').forEach((b) => b.classList.remove('playing'));
        btn.classList.add('playing');
        speak(text, {
          rate,
          repeat,
          onEnd: () => btn.classList.remove('playing')
        });
      });
    });
  }

  function isRecognitionSupported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function startRecognition(callbacks) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      if (callbacks.onError) callbacks.onError('unsupported');
      return null;
    }
    stopSpeaking();
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (callbacks.onResult) callbacks.onResult(transcript);
    };
    rec.onerror = (event) => {
      if (callbacks.onError) callbacks.onError(event.error);
    };
    rec.onend = () => {
      if (callbacks.onEnd) callbacks.onEnd();
    };
    rec.start();
    return rec;
  }

  window.SMS.speech = {
    speak,
    stopSpeaking,
    renderTTSBar,
    bindTTSButtons,
    isRecognitionSupported,
    startRecognition
  };
})();
