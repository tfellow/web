// MY Word Rush · 교과서 단어·문장 챌린지 — Main Controller
// Full 8-game suite + Supabase Auth/RLS/Analytics + Teacher Admin Dashboard
(function (global) {
  const D = global.MY_DATA;
  const S = global.MY_STORAGE;
  const TTS = global.MY_TTS;

  const state = {
    auth: null, // { status: 'loading'|'signed_out'|'blocked'|'allowed', ... }
    view: "lobby", // 'lobby' | 'playing' | 'result' | 'stats' | 'wordlist' | 'leaderboard' | 'teacher'
    grade: "1",
    lessons: [],
    weakOnly: false,
    questionCount: 10,
    activeGameId: null,
    activeCleanup: null,
    lastResult: null,
    lastGameContext: null,
    modal: null, // null | 'tts'
    // Server-synced views
    myDaily: [],
    leaderboard: [],
    lbGameId: "all",
    customSets: [],
    // Teacher dashboard state
    teacherDaily: [],
    teacherRoster: [],
    teacherWeak: [],
    teacherGradeFilter: "",
    teacherLessonFilter: "",
    teacherLoaded: false,
    dbPingOk: null,
  };

  const GAME_CATALOG = [
    {
      id: "cloze-spelling",
      group: "core",
      icon: "✍️",
      bg: "#e8eefc",
      title: "문맥 빈칸 & 스펠링 챌린지",
      desc: "예문 속 빈칸 단어를 추리해 타이핑! 틀린 단어는 뒤에서 자동 재출제됩니다.",
      tag: "말해보카 스타일",
      minItems: 1,
    },
    {
      id: "unscramble",
      group: "core",
      icon: "🧩",
      bg: "#e0f2fe",
      title: "문장 어순 블록 조립기",
      desc: "쪼개진 단어 블록을 순서대로 눌러 교과서 핵심 예문을 완성하세요.",
      tag: "문장·어순 감각",
      minItems: 1,
    },
    {
      id: "speed-match",
      group: "core",
      icon: "⚡",
      bg: "#fef3c7",
      title: "스피드 짝짓기 타임어택",
      desc: "영단어↔한글뜻, 영영풀이, 숙어 카드를 빠르게 매칭해 최고 기록에 도전!",
      tag: "어휘·숙어 순발력",
      minItems: 4,
    },
    {
      id: "engdef-quiz",
      group: "core",
      icon: "📖",
      bg: "#d1fae5",
      title: "영영풀이 퀴즈쇼",
      desc: "내신 단골 영영풀이를 읽고 알맞은 영단어를 빠르게 맞히는 4지선다 퀴즈!",
      tag: "내신 영영풀이",
      minItems: 4,
    },
    {
      id: "spellspire",
      group: "puzzle",
      icon: "⚔️",
      bg: "#ffe4e6",
      title: "스펠스파이어 RPG 배틀",
      desc: "10개 알파벳 타일로 교과서 단어를 완성해 슬라임·고블린·드래곤 보스를 처치!",
      tag: "철자 RPG 배틀",
      minItems: 4,
    },
    {
      id: "cryptogram",
      group: "puzzle",
      icon: "🔐",
      bg: "#f3e8ff",
      title: "크립토그램 암호 해독",
      desc: "치환 암호로 숨겨진 교과서 핵심 예문을 문맥과 해석으로 해독하는 퍼즐!",
      tag: "문장 암호 해독",
      minItems: 1,
    },
    {
      id: "connections",
      group: "puzzle",
      icon: "🟦",
      bg: "#e0e7ff",
      title: "커넥션즈 (4×4 묶기)",
      desc: "16개 단어에서 같은 단원·품사 4개씩 4그룹을 찾아 분류하세요! (기회 4번)",
      tag: "어휘 분류 퍼즐",
      minItems: 4,
    },
    {
      id: "word-puzzle",
      group: "puzzle",
      icon: "🐝",
      bg: "#fef9c3",
      title: "교과서 워들 & 스펠링 비",
      desc: "6번 안에 단어를 추리하는 워들과 벌집 알파벳 조합 스펠링 비 2가지 모드!",
      tag: "워들 · 스펠링 비",
      minItems: 3,
    },
  ];

  let rootEl = null;
  let toastTimer = null;

  function showToast(msg) {
    let el = document.getElementById("my-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "my-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.display = "none";
    }, 2800);
  }

  function emblemImgHtml(cls) {
    return `
      <div class="${cls}">
        <img src="../app/emblem.png" alt="MOONYOUNG" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <span class="brand-emblem-fallback" style="display:none;">MY</span>
      </div>
    `;
  }

  function getFilteredPool() {
    return D.filterItems({
      grade: state.grade,
      lessons: state.lessons,
      weakOnly: state.weakOnly,
    });
  }

  function getFilterLabel() {
    const gLabel = state.grade === "all" ? "전체 학년" : `중${state.grade}`;
    const lLabel =
      state.lessons.length === 0
        ? "전체 단원"
        : state.lessons
            .slice()
            .sort((a, b) => a - b)
            .map((l) => `${l}단원`)
            .join(", ");
    return state.weakOnly ? `[오답복습] ${gLabel} ${lLabel}` : `${gLabel} · ${lLabel}`;
  }

  function stopActiveGame() {
    if (typeof state.activeCleanup === "function") {
      state.activeCleanup();
      state.activeCleanup = null;
    }
  }

  async function setView(nextView) {
    stopActiveGame();
    state.view = nextView;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (nextView === "leaderboard") {
      await loadLeaderboard();
    } else if (nextView === "stats" && state.auth?.email) {
      state.myDaily = await global.MY_SB.fetchMyDaily(state.auth.email);
      render();
    } else if (nextView === "teacher" && state.auth?.isAdmin) {
      await loadTeacherData();
    }
  }

  async function loadLeaderboard() {
    state.leaderboard = await global.MY_SB.fetchLeaderboard(state.lbGameId, 25);
    render();
  }

  async function loadTeacherData() {
    const SB = global.MY_SB;
    const [pingOk, daily, roster, weak, sets] = await Promise.all([
      SB.ping(),
      SB.fetchTeacherDaily(300),
      SB.fetchRoster(),
      SB.fetchTeacherWeakWords(state.teacherGradeFilter || null, state.teacherLessonFilter || null, 30),
      SB.fetchCustomSets(),
    ]);
    state.dbPingOk = pingOk;
    state.teacherDaily = daily;
    state.teacherRoster = roster;
    state.teacherWeak = weak;
    state.customSets = sets;
    S.setRemoteCustomSets(sets);
    state.teacherLoaded = true;
    render();
  }

  function startGame(gameId, customItems = null, customLabel = null) {
    const gameDef = GAME_CATALOG.find((g) => g.id === gameId);
    const mod = global.MY_GAMES && global.MY_GAMES[gameId];
    if (!gameDef || !mod) return;

    const items = customItems || getFilteredPool();
    if (items.length < (gameDef.minItems || 1)) {
      showToast(`이 게임을 시작하려면 최소 ${gameDef.minItems}개 이상의 단어가 필요합니다.`);
      return;
    }

    stopActiveGame();
    S.resetSessionBuffer();
    state.view = "playing";
    state.activeGameId = gameId;
    state.lastGameContext = {
      gameId,
      items,
      filterLabel: customLabel || getFilterLabel(),
      questionCount: state.questionCount,
    };
    render();

    const mountTarget = document.getElementById("game-mount");
    state.activeCleanup = mod.mount(mountTarget, {
      items,
      filterLabel: state.lastGameContext.filterLabel,
      questionCount: state.questionCount,
      onExit: () => setView("lobby"),
      onComplete: async (result) => {
        const wordResults = S.getSessionWordBuffer();
        const saved = S.saveLocalSession(result, state.auth);
        state.lastResult = saved;
        state.view = "result";
        state.activeCleanup = null;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Sync aggregated result to Supabase (wr_daily, wr_word_stats, wr_leaderboard)
        try {
          await global.MY_SB.recordSession({
            gameId: result.gameId,
            score: result.score,
            correctCount: result.correctCount,
            totalQuestions: result.totalQuestions,
            durationSec: result.durationSec,
            displayName: state.auth.displayName,
            grade: state.auth.grade,
            wordResults,
          });
          showToast("☁️ 학습 기록이 서버에 저장되었습니다!");
        } catch (err) {
          console.warn("Supabase recordSession failed:", err);
          showToast("로컬에는 저장되었으나 서버 동기화에 실패했습니다. (SQL 설치 확인)");
        }
      },
    });
  }

  // --- Auth Gate Screens (No Public Demo Mode) ---
  function renderAuthScreen() {
    const auth = state.auth;
    if (!auth || auth.status === "loading") {
      return `
        <div class="auth-screen">
          <div class="auth-card">
            ${emblemImgHtml("auth-emblem")}
            <h2 style="margin:0 0 8px;">MY Word Rush</h2>
            <p style="color:var(--text-muted); margin:0;">로그인 상태를 확인하고 있습니다...</p>
          </div>
        </div>
      `;
    }

    if (auth.status === "blocked") {
      return `
        <div class="auth-screen">
          <div class="auth-card">
            ${emblemImgHtml("auth-emblem")}
            <span class="badge badge-danger" style="margin-bottom:8px;">접근 제한</span>
            <h2 style="margin:0 0 10px;">이 앱에서는 쓸 수 없어요</h2>
            <p style="color:var(--text-muted); font-size:0.94rem; margin:0 0 14px;">
              현재 로그인된 계정(<strong>${D.escapeHtml(auth.email)}</strong>)은 서울문영여자중학교 계정이 아닙니다.<br>
              <strong>@smy.ms.kr</strong> 학교 구글 계정으로 다시 로그인해 주세요.
            </p>
            <div class="gis-wrap" id="gis-btn-slot"></div>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:10px;">
              ※ 다른 MY 앱의 로그인을 유지하기 위해 자동 로그아웃하지 않습니다. 위 버튼으로 학교 계정을 선택해 주세요.
            </p>
          </div>
        </div>
      `;
    }

    // signed_out
    return `
      <div class="auth-screen">
        <div class="auth-card">
          ${emblemImgHtml("auth-emblem")}
          <span class="badge badge-gold" style="margin-bottom:8px;">MOONYOUNG ENGLISH</span>
          <h1 style="margin:0 0 6px; font-size:1.45rem;">MY Word Rush</h1>
          <p style="margin:0 0 16px; color:var(--text-muted); font-weight:600;">교과서 단어·문장 챌린지 (8종 게임)</p>
          <div class="hint-box" style="text-align:left; font-size:0.88rem; margin-bottom:14px;">
            • 서울문영여자중학교 <strong>@smy.ms.kr</strong> 구글 계정 또는 교사 계정으로 로그인하세요.<br>
            • 중1·중2 교과서 어휘 674개와 예문으로 8가지 단어·문장 게임을 즐길 수 있습니다.
          </div>
          <div class="gis-wrap" id="gis-btn-slot"></div>
        </div>
      </div>
    `;
  }

  function renderHeader() {
    const auth = state.auth;
    return `
      <header class="app-header">
        <div class="header-inner">
          <div class="brand" id="nav-brand">
            ${emblemImgHtml("brand-emblem")}
            <div>
              <div class="brand-title">
                MY Word Rush
                <span class="badge badge-gold">8종 게임</span>
              </div>
              <span class="brand-sub">서울문영여자중학교 · 교과서 단어·문장 챌린지</span>
            </div>
          </div>

          <div class="header-actions">
            <button class="nav-pill ${["lobby", "playing", "result"].includes(state.view) ? "active" : ""}" id="nav-lobby">🎮 게임</button>
            <button class="nav-pill ${state.view === "wordlist" ? "active" : ""}" id="nav-wordlist">📚 단어장</button>
            <button class="nav-pill ${state.view === "stats" ? "active" : ""}" id="nav-stats">📊 내 기록</button>
            <button class="nav-pill ${state.view === "leaderboard" ? "active" : ""}" id="nav-lb">🏆 랭킹</button>
            ${auth.isAdmin ? `<button class="nav-pill ${state.view === "teacher" ? "active" : ""}" id="nav-teacher">👩‍🏫 교사</button>` : ""}
            <button class="nav-pill" id="nav-tts">🔊 음성</button>
            <button class="user-pill" id="btn-logout" title="클릭하여 로그아웃">👤 ${D.escapeHtml(auth.displayName)} · 로그아웃</button>
          </div>
        </div>
      </header>
    `;
  }

  function renderFilterPanel() {
    const grades = D.getGrades();
    const lessons = D.getLessonsForGrade(state.grade);
    const pool = getFilteredPool();
    const weakCount = S.getWeakWords(999).length;

    const gradeChips = [
      ...grades.map((g) => `<button class="chip ${String(state.grade) === String(g) ? "active" : ""}" data-grade="${g}">중${g}</button>`),
      `<button class="chip ${state.grade === "all" ? "active" : ""}" data-grade="all">전체 학년</button>`,
    ].join("");

    const lessonChips = [
      `<button class="chip ${state.lessons.length === 0 ? "active" : ""}" data-lesson="all">전체 단원</button>`,
      ...lessons.map((l) => {
        const active = state.lessons.includes(String(l));
        return `<button class="chip ${active ? "active" : ""}" data-lesson="${l}">${l}단원</button>`;
      }),
    ].join("");

    const countChips = [5, 10, 15, 20]
      .map((n) => `<button class="chip ${state.questionCount === n ? "active" : ""}" data-qcount="${n}">${n}문항</button>`)
      .join("");

    return `
      <section class="card filter-panel">
        <div class="filter-row">
          <span class="filter-label">학년 선택</span>
          <div class="chip-group">${gradeChips}</div>
        </div>
        <div class="filter-row">
          <span class="filter-label">단원 선택</span>
          <div class="chip-group">${lessonChips}</div>
        </div>
        <div class="filter-row">
          <span class="filter-label">출제 설정</span>
          <div class="chip-group">
            ${countChips}
            <button class="chip weak-chip ${state.weakOnly ? "active" : ""}" id="btn-toggle-weak">
              🔥 내 오답만 집중 (${weakCount})
            </button>
          </div>
        </div>
        <div class="pool-summary">
          <div class="pool-count">
            선택 범위: <strong>${D.escapeHtml(getFilterLabel())}</strong> · 출제 가능 어휘 <strong>${pool.length}개</strong>
          </div>
          <button class="btn btn-outline btn-sm" id="btn-view-pool">📚 단어 미리보기</button>
        </div>
      </section>
    `;
  }

  function renderLobby() {
    const core = GAME_CATALOG.filter((g) => g.group === "core");
    const puzzle = GAME_CATALOG.filter((g) => g.group === "puzzle");
    const renderCard = (g) => `
      <button class="game-card playable" data-start-game="${g.id}">
        <div class="game-icon" style="background:${g.bg};">${g.icon}</div>
        <h3>${g.title}</h3>
        <p>${g.desc}</p>
        <div class="game-meta">
          <span class="badge badge-primary">${g.tag}</span>
          <span style="font-weight:800; color:var(--navy); font-size:0.9rem;">플레이 →</span>
        </div>
      </button>
    `;

    return `
      ${renderFilterPanel()}
      <div class="section-title">
        <span>📘 기본 단어·문장 학습 게임 (4종)</span>
        <span class="badge badge-success">교과서 어휘·영영풀이·예문 자동 출제</span>
      </div>
      <div class="game-grid">${core.map(renderCard).join("")}</div>

      <div class="section-title">
        <span>🎯 퍼즐 & RPG 챌린지 게임 (4종)</span>
        <span class="badge badge-gold">몰입형 어휘·문장 퍼즐</span>
      </div>
      <div class="game-grid">${puzzle.map(renderCard).join("")}</div>
    `;
  }

  function renderResult() {
    const r = state.lastResult;
    if (!r) return renderLobby();
    const stars = r.accuracy >= 90 ? "⭐⭐⭐" : r.accuracy >= 70 ? "⭐⭐" : "⭐";
    const wrongList = r.wrongWords || [];

    const wrongHtml =
      wrongList.length === 0
        ? `<div class="feedback-banner correct">🎉 완벽해요! 이번 라운드에서 틀린 단어가 하나도 없습니다!</div>`
        : `
          <div class="section-title" style="margin-top:16px;">
            <span>📌 이번 게임 오답 복습 (${wrongList.length}개)</span>
            <button class="btn btn-danger btn-sm" id="btn-retry-wrong">🔁 오답만 다시 풀기</button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>단어</th><th>뜻</th><th>예문</th><th>발음</th></tr></thead>
              <tbody>
                ${wrongList
                  .map(
                    (w) => `
                  <tr>
                    <td><strong>${D.escapeHtml(w.word)}</strong> <span class="badge badge-muted">${D.escapeHtml(w.pos)}</span></td>
                    <td>${D.escapeHtml(w.ko)}</td>
                    <td>${D.escapeHtml(w.example)}<br><small style="color:var(--text-muted);">${D.escapeHtml(w.exampleKo)}</small></td>
                    <td><button class="btn btn-secondary btn-sm" data-speak="${D.escapeHtml(w.word)}">🔊</button></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;

    return `
      <div class="game-shell">
        <div class="card" style="text-align:center;">
          <div style="font-size:2.4rem;">${stars}</div>
          <h2 style="margin:4px 0;">${D.escapeHtml(r.gameName)} 완료!</h2>
          <p style="margin:0; color:var(--text-muted);">${D.escapeHtml(r.filterLabel)}</p>

          <div class="stat-grid">
            <div class="stat-box"><div class="stat-val">${r.score}</div><div class="stat-label">최종 점수</div></div>
            <div class="stat-box"><div class="stat-val">${r.accuracy}%</div><div class="stat-label">정답률 (${r.correctCount}/${r.totalQuestions})</div></div>
            <div class="stat-box"><div class="stat-val">${r.durationSec}초</div><div class="stat-label">소요 시간</div></div>
            <div class="stat-box"><div class="stat-val">${r.maxStreak || 0}</div><div class="stat-label">최대 콤보</div></div>
          </div>

          <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:14px;">
            <button class="btn btn-gold" id="btn-play-again">🎮 다시 도전</button>
            <button class="btn btn-outline" id="btn-copy-code">📋 결과 복사</button>
            <button class="btn btn-outline" id="btn-go-lb">🏆 랭킹 보기</button>
            <button class="btn btn-primary" id="btn-go-lobby">🏠 로비로</button>
          </div>
        </div>
        <div class="card" style="margin-top:16px;">${wrongHtml}</div>
      </div>
    `;
  }

  function renderStats() {
    const weakWords = S.getWeakWords(20);
    const totalPlays = state.myDaily.reduce((s, r) => s + (r.plays || 0), 0);
    const totalCorrect = state.myDaily.reduce((s, r) => s + (r.correct || 0), 0);
    const totalQ = state.myDaily.reduce((s, r) => s + (r.total || 0), 0);
    const avgAcc = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

    return `
      <div class="card" style="margin-bottom:18px;">
        <div class="section-title">
          <span>📊 나의 누적 학습 기록 (Supabase 연동)</span>
          <button class="btn btn-outline btn-sm" id="btn-stats-csv">📥 로컬 기록 CSV</button>
        </div>
        <div class="stat-grid">
          <div class="stat-box"><div class="stat-val">${totalPlays}</div><div class="stat-label">총 완료 횟수</div></div>
          <div class="stat-box"><div class="stat-val">${avgAcc}%</div><div class="stat-label">누적 정답률</div></div>
          <div class="stat-box"><div class="stat-val">${Object.keys(S.getWordStats()).length}</div><div class="stat-label">학습한 단어</div></div>
          <div class="stat-box"><div class="stat-val" style="color:var(--danger);">${weakWords.length}</div><div class="stat-label">취약 어휘</div></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="section-title">
          <span>🔥 내 취약 단어 TOP ${weakWords.length}</span>
          ${weakWords.length > 0 ? `<button class="btn btn-danger btn-sm" id="btn-practice-weak">✍️ 취약 단어 집중 복습</button>` : ""}
        </div>
        ${
          weakWords.length === 0
            ? `<p style="color:var(--text-muted); margin:0;">아직 오답 기록이 없습니다. 게임을 플레이하면 틀린 단어가 자동으로 모입니다.</p>`
            : `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>단어</th><th>단원</th><th>오답 / 시도</th><th>오답률</th><th>듣기</th></tr></thead>
                <tbody>
                  ${weakWords
                    .map(
                      (w) => `
                    <tr>
                      <td><strong>${D.escapeHtml(w.word)}</strong> ${w.ko ? `<small style="color:var(--text-muted);">(${D.escapeHtml(w.ko)})</small>` : ""}</td>
                      <td>중${w.grade} ${w.lesson}단원</td>
                      <td>${w.wrong} / ${w.attempts}</td>
                      <td><span class="badge badge-danger">${w.wrongRate}%</span></td>
                      <td><button class="btn btn-secondary btn-sm" data-speak="${D.escapeHtml(w.word)}">🔊</button></td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      </div>

      <div class="card">
        <div class="section-title"><span>📅 날짜별 학습 요약 (wr_daily)</span></div>
        ${
          state.myDaily.length === 0
            ? `<p style="color:var(--text-muted); margin:0;">서버에 저장된 일별 기록이 아직 없습니다.</p>`
            : `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>날짜</th><th>게임</th><th>횟수</th><th>정답률</th><th>최고점</th><th>학습시간</th></tr></thead>
                <tbody>
                  ${state.myDaily
                    .map((r) => {
                      const g = GAME_CATALOG.find((x) => x.id === r.game_id);
                      const acc = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
                      return `
                        <tr>
                          <td>${D.escapeHtml(r.day)}</td>
                          <td><strong>${D.escapeHtml(g ? g.title : r.game_id)}</strong></td>
                          <td>${r.plays}회</td>
                          <td><span class="badge ${acc >= 80 ? "badge-success" : "badge-warning"}">${acc}%</span></td>
                          <td>${r.best_score}점</td>
                          <td>${r.total_sec}초</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      </div>
    `;
  }

  function renderLeaderboard() {
    const gameOptions = [
      `<button class="chip ${state.lbGameId === "all" ? "active" : ""}" data-lb-game="all">🏆 종합 랭킹</button>`,
      ...GAME_CATALOG.map(
        (g) => `<button class="chip ${state.lbGameId === g.id ? "active" : ""}" data-lb-game="${g.id}">${g.icon} ${g.title.split(" ")[0]}</button>`
      ),
    ].join("");

    return `
      <div class="card">
        <div class="section-title">
          <span>🏆 MY Word Rush 실시간 랭킹</span>
          <button class="btn btn-outline btn-sm" id="btn-lb-refresh">🔄 새로고침</button>
        </div>
        <div class="chip-group" style="margin-bottom:16px;">${gameOptions}</div>
        ${
          state.leaderboard.length === 0
            ? `<p style="color:var(--text-muted);">아직 랭킹 기록이 없습니다. 첫 번째 기록의 주인공이 되어 보세요!</p>`
            : `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>순위</th><th>학생</th><th>학년</th><th>최고점(합산)</th><th>플레이 수</th></tr></thead>
                <tbody>
                  ${state.leaderboard
                    .map((row, idx) => {
                      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;
                      return `
                        <tr>
                          <td><strong>${medal}</strong></td>
                          <td><strong>${D.escapeHtml(row.display_name)}</strong></td>
                          <td>중${row.grade}</td>
                          <td><strong style="color:var(--navy);">${row.best_score}점</strong></td>
                          <td>${row.total_plays}회</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      </div>
    `;
  }

  function renderTeacher() {
    if (!state.auth?.isAdmin) return renderLobby();
    const rosterMap = new Map();
    state.teacherRoster.forEach((r) => rosterMap.set((r.email || "").toLowerCase(), r));

    const allowExt = Boolean(state.auth.allowExternal);

    return `
      <div class="card" style="margin-bottom:18px;">
        <div class="section-title">
          <span>👩‍🏫 교사 관리 대시보드 (MOONYOUNG Admin)</span>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="badge ${state.dbPingOk ? "badge-success" : "badge-danger"}">
              ${state.dbPingOk ? "✅ Supabase wr_ 정상" : "⚠️ supabase_wr.sql 실행 필요"}
            </span>
            <button class="btn btn-outline btn-sm" id="btn-teacher-refresh">🔄 새로고침</button>
          </div>
        </div>

        <div class="toggle-row">
          <div>
            <strong>외부 구글 계정 로그인 허용</strong>
            <div style="font-size:0.84rem; color:var(--text-muted);">
              기본 꺼짐(OFF): <code>@smy.ms.kr</code> 학교 계정과 교사만 이용 가능 · 켜면 외부 지메일도 임시 허용됩니다.
            </div>
          </div>
          <button class="btn ${allowExt ? "btn-danger" : "btn-primary"} btn-sm" id="btn-toggle-external">
            ${allowExt ? "🔓 현재 허용 중 (끄기)" : "🔒 현재 차단 중 (켜기)"}
          </button>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="section-title">
          <span>🔥 전체 학생 취약 어휘 TOP ${state.teacherWeak.length}</span>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <select id="t-grade-filter" style="padding:8px 10px; border-radius:10px; border:1.5px solid var(--border); min-height:40px;">
              <option value="">전체 학년</option>
              <option value="1" ${state.teacherGradeFilter === "1" ? "selected" : ""}>중1</option>
              <option value="2" ${state.teacherGradeFilter === "2" ? "selected" : ""}>중2</option>
              <option value="3" ${state.teacherGradeFilter === "3" ? "selected" : ""}>중3</option>
            </select>
            <select id="t-lesson-filter" style="padding:8px 10px; border-radius:10px; border:1.5px solid var(--border); min-height:40px;">
              <option value="">전체 단원</option>
              ${[1, 2, 3, 4, 5, 6, 7, 8]
                .map((l) => `<option value="${l}" ${String(state.teacherLessonFilter) === String(l) ? "selected" : ""}>${l}단원</option>`)
                .join("")}
            </select>
          </div>
        </div>
        ${
          state.teacherWeak.length === 0
            ? `<p style="color:var(--text-muted); margin:0;">집계된 오답 데이터가 아직 없습니다.</p>`
            : `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>단어</th><th>단원</th><th>총 오답 / 시도</th><th>오답률</th><th>오답 학생 수</th></tr></thead>
                <tbody>
                  ${state.teacherWeak
                    .map(
                      (w) => `
                    <tr>
                      <td><strong>${D.escapeHtml(w.word)}</strong></td>
                      <td>중${w.grade} ${w.lesson}단원</td>
                      <td>${w.total_wrong} / ${w.total_attempts}</td>
                      <td><span class="badge badge-danger">${w.wrong_rate}%</span></td>
                      <td>${w.student_count}명</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="section-title">
          <span>📋 학생별 일일 학습 현황 (${state.teacherDaily.length}건)</span>
          <button class="btn btn-gold btn-sm" id="btn-teacher-csv" ${state.teacherDaily.length === 0 ? "disabled" : ""}>📥 CSV 다운로드</button>
        </div>
        ${
          state.teacherDaily.length === 0
            ? `<p style="color:var(--text-muted); margin:0;">아직 제출된 학생 기록이 없습니다.</p>`
            : `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>날짜</th><th>학생</th><th>게임</th><th>횟수</th><th>정답률</th><th>최고점</th><th>시간</th></tr></thead>
                <tbody>
                  ${state.teacherDaily
                    .slice(0, 100)
                    .map((r) => {
                      const ros = rosterMap.get((r.email || "").toLowerCase());
                      const who = ros
                        ? `${ros.grade}-${ros.class_no}-${ros.student_no} ${ros.name}`
                        : r.email;
                      const acc = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
                      const g = GAME_CATALOG.find((x) => x.id === r.game_id);
                      return `
                        <tr>
                          <td>${D.escapeHtml(r.day)}</td>
                          <td><strong>${D.escapeHtml(who)}</strong></td>
                          <td>${D.escapeHtml(g ? g.title : r.game_id)}</td>
                          <td>${r.plays}회</td>
                          <td><span class="badge ${acc >= 80 ? "badge-success" : "badge-warning"}">${acc}%</span></td>
                          <td>${r.best_score}점</td>
                          <td>${r.total_sec}초</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          `
        }
      </div>

      <div class="card">
        <div class="section-title">
          <span>📂 커스텀 단어장 DB 관리 (wr_custom_sets)</span>
          <button class="btn btn-outline btn-sm" id="btn-sample-csv">📄 샘플 CSV</button>
        </div>
        <p style="font-size:0.88rem; color:var(--text-muted); margin:0 0 12px;">
          중3·추가 단원 CSV 또는 JSON 파일을 올리면 DB에 저장되어 모든 학생에게 즉시 배포됩니다. (1단어장 = 1줄 JSONB)
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:14px;">
          <input type="text" id="custom-set-title" placeholder="단어장 제목 (예: 중3 1단원)" style="padding:10px 12px; border-radius:10px; border:1.5px solid var(--border); min-height:44px; flex:1; min-width:180px;" />
          <input type="file" id="teacher-import-file" accept=".csv,.json" />
        </div>
        ${
          state.customSets.length > 0
            ? `
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>제목</th><th>학년/단원</th><th>단어 수</th><th>관리</th></tr></thead>
                <tbody>
                  ${state.customSets
                    .map(
                      (s) => `
                    <tr>
                      <td><strong>${D.escapeHtml(s.title)}</strong></td>
                      <td>중${s.grade} ${s.lesson}단원</td>
                      <td>${Array.isArray(s.items) ? s.items.length : 0}개</td>
                      <td><button class="btn btn-danger btn-sm" data-del-set="${D.escapeHtml(s.id)}">삭제</button></td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
            : `<p style="color:var(--text-muted); font-size:0.88rem; margin:0;">등록된 커스텀 단어장이 없습니다.</p>`
        }
      </div>
    `;
  }

  function renderWordList() {
    const pool = getFilteredPool();
    return `
      ${renderFilterPanel()}
      <div class="card">
        <div class="section-title">
          <span>📚 선택 범위 단어장 (${pool.length}개)</span>
          <button class="btn btn-gold btn-sm" id="btn-back-lobby">🎮 이 단어로 게임하기</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>단원</th><th>단어</th><th>한글 뜻</th><th>영영풀이</th><th>예문</th><th>발음</th></tr></thead>
            <tbody>
              ${pool
                .map(
                  (w) => `
                <tr>
                  <td><span class="badge badge-muted">중${w.grade}-${w.lesson}</span></td>
                  <td><strong>${D.escapeHtml(w.word)}</strong><br><small style="color:var(--text-muted);">${D.escapeHtml(w.pos)}</small></td>
                  <td>${D.escapeHtml(w.ko)}</td>
                  <td style="font-size:0.86rem;">${D.escapeHtml(w.engDef)}</td>
                  <td style="font-size:0.88rem;">${D.escapeHtml(w.example)}<br><small style="color:var(--text-muted);">${D.escapeHtml(w.exampleKo)}</small></td>
                  <td><button class="btn btn-secondary btn-sm" data-speak="${D.escapeHtml(w.word)}">🔊</button></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderModal() {
    if (state.modal !== "tts") return "";
    const enVoices = TTS.getVoicesFor("en");
    const koVoices = TTS.getVoicesFor("ko");
    const curEn = TTS.getCurrentVoice("en-US");
    const curKo = TTS.getCurrentVoice("ko-KR");
    const prefs = TTS.getPrefs();
    const engine = prefs.engine || "auto";
    const rate = typeof prefs.rate === "number" ? prefs.rate : 0.94;

    return `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card">
          <h2>🔊 영어 · 한국어 음성(TTS) 설정</h2>
          <p style="color:var(--text-muted); font-size:0.86rem; margin:0 0 12px;">
            현재 영어 엔진: <strong>${D.escapeHtml(TTS.getActiveEngineLabel("en-US"))}</strong><br>
            현재 한국어 엔진: <strong>${D.escapeHtml(TTS.getActiveEngineLabel("ko-KR"))}</strong>
          </p>
          <div class="form-field">
            <label>음성 엔진 모드</label>
            <select id="tts-engine-select">
              <option value="auto" ${engine === "auto" ? "selected" : ""}>✨ 자동 (Natural/Google 우선, 없으면 온라인 원어민)</option>
              <option value="online" ${engine === "online" ? "selected" : ""}>🌐 온라인 원어민 음성 강제</option>
              <option value="browser" ${engine === "browser" ? "selected" : ""}>💻 브라우저 내장 음성 선택</option>
            </select>
          </div>
          <div class="form-field">
            <label>🇺🇸 브라우저 영어 음성 (${enVoices.length}개)</label>
            <select id="tts-en-select" ${engine === "online" ? "disabled" : ""}>
              ${
                enVoices.length === 0
                  ? `<option value="auto">감지된 영어 내장 음성 없음 → 온라인 원어민 자동 사용</option>`
                  : `<option value="auto" ${!prefs.enVoiceURI || prefs.enVoiceURI === "auto" ? "selected" : ""}>자동 추천 (${D.escapeHtml(curEn ? curEn.name : "온라인")})</option>` +
                    enVoices
                      .map((v) => `<option value="${D.escapeHtml(v.voiceURI)}" ${prefs.enVoiceURI === v.voiceURI ? "selected" : ""}>${D.escapeHtml(v.name)} (${D.escapeHtml(v.lang)})</option>`)
                      .join("")
              }
            </select>
          </div>
          <div class="form-field">
            <label>🇰🇷 브라우저 한국어 음성 (${koVoices.length}개)</label>
            <select id="tts-ko-select" ${engine === "online" ? "disabled" : ""}>
              ${
                koVoices.length === 0
                  ? `<option value="auto">감지된 한국어 내장 음성 없음 → 온라인 자동 사용</option>`
                  : `<option value="auto" ${!prefs.koVoiceURI || prefs.koVoiceURI === "auto" ? "selected" : ""}>자동 추천 (${D.escapeHtml(curKo ? curKo.name : "온라인")})</option>` +
                    koVoices
                      .map((v) => `<option value="${D.escapeHtml(v.voiceURI)}" ${prefs.koVoiceURI === v.voiceURI ? "selected" : ""}>${D.escapeHtml(v.name)} (${D.escapeHtml(v.lang)})</option>`)
                      .join("")
              }
            </select>
          </div>
          <div class="form-field">
            <label>읽기 속도: <strong id="tts-rate-val">${rate.toFixed(2)}x</strong></label>
            <input type="range" id="tts-rate-slider" min="0.7" max="1.2" step="0.05" value="${rate}" />
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-top:14px;">
            <div style="display:flex; gap:8px;">
              <button class="btn btn-outline btn-sm" id="btn-test-en">🔊 영어 테스트</button>
              <button class="btn btn-outline btn-sm" id="btn-test-ko">🔊 한국어 테스트</button>
            </div>
            <button class="btn btn-primary btn-sm" id="modal-close">완료</button>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    if (!state.auth || state.auth.status !== "allowed") {
      rootEl.innerHTML = renderAuthScreen();
      const slot = document.getElementById("gis-btn-slot");
      if (slot && global.MY_SB) {
        global.MY_SB.drawGoogleButton(slot, (msg) => showToast("로그인 오류: " + msg));
      }
      return;
    }

    let bodyHtml = "";
    if (state.view === "lobby") bodyHtml = renderLobby();
    else if (state.view === "playing") bodyHtml = `<div id="game-mount"></div>`;
    else if (state.view === "result") bodyHtml = renderResult();
    else if (state.view === "stats") bodyHtml = renderStats();
    else if (state.view === "wordlist") bodyHtml = renderWordList();
    else if (state.view === "leaderboard") bodyHtml = renderLeaderboard();
    else if (state.view === "teacher") bodyHtml = renderTeacher();

    rootEl.innerHTML = `
      ${renderHeader()}
      <main class="container">${bodyHtml}</main>
      ${renderModal()}
    `;
    bindEvents();
  }

  function bindEvents() {
    const byId = (id) => document.getElementById(id);
    if (byId("nav-brand")) byId("nav-brand").addEventListener("click", () => setView("lobby"));
    if (byId("nav-lobby")) byId("nav-lobby").addEventListener("click", () => setView("lobby"));
    if (byId("nav-wordlist")) byId("nav-wordlist").addEventListener("click", () => setView("wordlist"));
    if (byId("nav-stats")) byId("nav-stats").addEventListener("click", () => setView("stats"));
    if (byId("nav-lb")) byId("nav-lb").addEventListener("click", () => setView("leaderboard"));
    if (byId("nav-teacher")) byId("nav-teacher").addEventListener("click", () => setView("teacher"));
    if (byId("nav-tts")) byId("nav-tts").addEventListener("click", () => { state.modal = "tts"; render(); });
    if (byId("btn-logout")) {
      byId("btn-logout").addEventListener("click", () => {
        if (confirm("MY Word Rush에서 로그아웃할까요?")) {
          global.MY_SB.signOutLocal();
        }
      });
    }

    rootEl.querySelectorAll("[data-grade]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.grade = btn.getAttribute("data-grade");
        state.lessons = [];
        render();
      });
    });

    rootEl.querySelectorAll("[data-lesson]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-lesson");
        if (val === "all") state.lessons = [];
        else state.lessons = state.lessons.includes(val) ? state.lessons.filter((x) => x !== val) : [...state.lessons, val];
        render();
      });
    });

    rootEl.querySelectorAll("[data-qcount]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.questionCount = Number(btn.getAttribute("data-qcount"));
        render();
      });
    });

    if (byId("btn-toggle-weak")) byId("btn-toggle-weak").addEventListener("click", () => { state.weakOnly = !state.weakOnly; render(); });
    if (byId("btn-view-pool")) byId("btn-view-pool").addEventListener("click", () => setView("wordlist"));
    if (byId("btn-back-lobby")) byId("btn-back-lobby").addEventListener("click", () => setView("lobby"));

    rootEl.querySelectorAll("[data-start-game]").forEach((btn) => {
      btn.addEventListener("click", () => startGame(btn.getAttribute("data-start-game")));
    });

    rootEl.querySelectorAll("[data-speak]").forEach((btn) => {
      btn.addEventListener("click", () => TTS.speakEn(btn.getAttribute("data-speak")));
    });

    // Result actions
    if (byId("btn-play-again") && state.lastGameContext) {
      byId("btn-play-again").addEventListener("click", () =>
        startGame(state.lastGameContext.gameId, state.lastGameContext.items, state.lastGameContext.filterLabel)
      );
    }
    if (byId("btn-go-lobby")) byId("btn-go-lobby").addEventListener("click", () => setView("lobby"));
    if (byId("btn-go-lb")) byId("btn-go-lb").addEventListener("click", () => setView("leaderboard"));
    if (byId("btn-copy-code") && state.lastResult) {
      byId("btn-copy-code").addEventListener("click", async () => {
        const code = S.buildResultCode(state.lastResult, state.auth);
        try {
          await navigator.clipboard.writeText(code);
          showToast("결과가 클립보드에 복사되었습니다!");
        } catch (e) {
          prompt("아래 결과를 복사하세요:", code);
        }
      });
    }
    if (byId("btn-retry-wrong") && state.lastResult?.wrongWords?.length > 0) {
      byId("btn-retry-wrong").addEventListener("click", () => {
        startGame("cloze-spelling", state.lastResult.wrongWords, `오답 재도전 (${state.lastResult.wrongWords.length}단어)`);
      });
    }

    // Stats actions
    if (byId("btn-stats-csv")) byId("btn-stats-csv").addEventListener("click", () => S.exportSessionsCSV());
    if (byId("btn-practice-weak")) {
      byId("btn-practice-weak").addEventListener("click", () => {
        const weakIds = new Set(S.getWeakWords(20).map((w) => w.id));
        const weakItems = D.getAllItems().filter((it) => weakIds.has(it.id));
        if (weakItems.length > 0) startGame("cloze-spelling", weakItems, `내 취약 단어 TOP ${weakItems.length}`);
      });
    }

    // Leaderboard actions
    if (byId("btn-lb-refresh")) byId("btn-lb-refresh").addEventListener("click", loadLeaderboard);
    rootEl.querySelectorAll("[data-lb-game]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.lbGameId = btn.getAttribute("data-lb-game");
        loadLeaderboard();
      });
    });

    // Teacher Dashboard actions
    if (byId("btn-teacher-refresh")) byId("btn-teacher-refresh").addEventListener("click", loadTeacherData);
    if (byId("btn-toggle-external")) {
      byId("btn-toggle-external").addEventListener("click", async () => {
        try {
          const next = !state.auth.allowExternal;
          await global.MY_SB.setAllowExternal(next, state.auth.email);
          state.auth.allowExternal = next;
          showToast(next ? "외부 구글 계정 허용을 켰습니다." : "학교 계정(@smy.ms.kr) 전용으로 잠갔습니다.");
          render();
        } catch (e) {
          showToast("설정 변경 실패: " + e.message);
        }
      });
    }
    if (byId("t-grade-filter")) {
      byId("t-grade-filter").addEventListener("change", (e) => {
        state.teacherGradeFilter = e.target.value;
        loadTeacherData();
      });
    }
    if (byId("t-lesson-filter")) {
      byId("t-lesson-filter").addEventListener("change", (e) => {
        state.teacherLessonFilter = e.target.value;
        loadTeacherData();
      });
    }
    if (byId("btn-teacher-csv")) {
      byId("btn-teacher-csv").addEventListener("click", () => {
        const rosterMap = new Map();
        state.teacherRoster.forEach((r) => rosterMap.set((r.email || "").toLowerCase(), r));
        const header = ["날짜", "이메일", "학번", "이름", "게임", "횟수", "정답수", "문항수", "정답률(%)", "최고점", "학습시간(초)"];
        const rows = state.teacherDaily.map((r) => {
          const ros = rosterMap.get((r.email || "").toLowerCase());
          const acc = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
          return [
            r.day,
            r.email,
            ros ? `${ros.grade}-${ros.class_no}-${ros.student_no}` : "",
            ros ? ros.name : "",
            r.game_id,
            r.plays,
            r.correct,
            r.total,
            acc,
            r.best_score,
            r.total_sec,
          ];
        });
        S.exportRowsCSV(`MY_Word_Rush_학생통계_${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
      });
    }
    if (byId("btn-sample-csv")) byId("btn-sample-csv").addEventListener("click", () => D.downloadSampleCSV());
    if (byId("teacher-import-file")) {
      byId("teacher-import-file").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const imported = file.name.toLowerCase().endsWith(".json")
            ? (Array.isArray(JSON.parse(text)) ? JSON.parse(text) : JSON.parse(text).items || [])
            : D.parseCSV(text);
          if (!imported.length) {
            showToast("유효한 단어 데이터가 없습니다.");
            return;
          }
          const title = (byId("custom-set-title")?.value || "").trim() || file.name.replace(/\.(csv|json)$/i, "");
          await global.MY_SB.saveCustomSet({
            id: "set-" + Date.now().toString(36),
            title,
            grade: imported[0].grade || 3,
            lesson: imported[0].lesson || 1,
            items: imported,
            createdBy: state.auth.email,
          });
          showToast(`"${title}" (${imported.length}단어) DB 저장 완료!`);
          await loadTeacherData();
        } catch (err) {
          showToast("업로드 실패: " + err.message);
        }
      });
    }
    rootEl.querySelectorAll("[data-del-set]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-set");
        if (!confirm("이 커스텀 단어장을 DB에서 삭제할까요?")) return;
        await global.MY_SB.deleteCustomSet(id);
        showToast("삭제되었습니다.");
        await loadTeacherData();
      });
    });

    // TTS Modal
    if (byId("modal-backdrop")) {
      byId("modal-backdrop").addEventListener("click", (e) => {
        if (e.target.id === "modal-backdrop") { state.modal = null; render(); }
      });
    }
    if (byId("modal-close")) byId("modal-close").addEventListener("click", () => { state.modal = null; render(); });
    if (byId("tts-engine-select")) {
      byId("tts-engine-select").addEventListener("change", (e) => {
        TTS.setPrefs({ engine: e.target.value });
        render();
        TTS.speakEn("She is very active and friendly.");
      });
    }
    if (byId("tts-en-select")) {
      byId("tts-en-select").addEventListener("change", (e) => {
        TTS.setPrefs({ enVoiceURI: e.target.value, engine: e.target.value === "auto" ? "auto" : "browser" });
        render();
        TTS.speakEn("She is very active and friendly.");
      });
    }
    if (byId("tts-ko-select")) {
      byId("tts-ko-select").addEventListener("change", (e) => {
        TTS.setPrefs({ koVoiceURI: e.target.value, engine: e.target.value === "auto" ? "auto" : "browser" });
        render();
        TTS.speakKo("그녀는 매우 활동적이며 다정하다.");
      });
    }
    if (byId("tts-rate-slider")) {
      byId("tts-rate-slider").addEventListener("input", (e) => {
        const v = Number(e.target.value);
        TTS.setPrefs({ rate: v });
        if (byId("tts-rate-val")) byId("tts-rate-val").textContent = `${v.toFixed(2)}x`;
      });
    }
    if (byId("btn-test-en")) byId("btn-test-en").addEventListener("click", () => TTS.speakEn("She is very active and friendly."));
    if (byId("btn-test-ko")) byId("btn-test-ko").addEventListener("click", () => TTS.speakKo("그녀는 매우 활동적이며 다정하다."));
  }

  async function boot() {
    rootEl = document.getElementById("app");
    state.auth = { status: "loading" };
    render();

    await D.init();

    // Wait for ES module supabase-client.js if not yet attached
    if (!global.MY_SB) {
      await new Promise((resolve) => window.addEventListener("my-sb-ready", resolve, { once: true }));
    }

    const auth = await global.MY_SB.getAuthState();
    state.auth = auth;

    if (auth.status === "allowed") {
      // Auto-select student's grade if available in dataset
      if (auth.grade && D.getGrades().includes(auth.grade)) {
        state.grade = String(auth.grade);
      }
      // Hydrate per-word stats & custom sets from Supabase
      try {
        const [wordRows, sets] = await Promise.all([
          global.MY_SB.fetchMyWordStats(auth.email),
          global.MY_SB.fetchCustomSets(),
        ]);
        S.hydrateWordStatsFromServer(wordRows);
        state.customSets = sets;
        S.setRemoteCustomSets(sets);
      } catch (e) {}
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", boot);
})(window);
