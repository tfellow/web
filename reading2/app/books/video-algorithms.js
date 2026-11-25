// How Do Algorithms Choose Your Videos? 본문. 목록 정보는 ../books.js 에 있어요.
window.BOOK_CONTENT = window.BOOK_CONTENT || {};
window.BOOK_CONTENT["video-algorithms"] = {
 "story": [
  {
   "en": "After school, you open a video app to find a clip that explains a math problem. Later, when you open the app again, a different math clip appears near the top of your feed. This can happen because a recommendation algorithm uses clues from your activity to predict what you might want to watch. Since the app has far more videos than it can show on one screen, it uses those predictions to decide which ones to display first.",
   "ko": "방과 후에 수학 문제를 설명해 주는 영상을 찾으려고 동영상 앱을 열어요. 나중에 앱을 다시 열면 피드 위쪽에 다른 수학 영상이 나타나요. 추천 알고리즘이 내 활동에서 단서를 얻어 내가 보고 싶어 할 만한 영상을 예측하기 때문에 이런 일이 생길 수 있어요. 앱에는 한 화면에 보여 줄 수 있는 것보다 훨씬 많은 영상이 있어서, 이런 예측을 바탕으로 어떤 영상을 먼저 보여 줄지 정해요."
  },
  {
   "en": "To make a prediction, the system can look at signals such as which clips you finish and which ones you skip. Finishing a clip may suggest that it held your attention, while skipping it may suggest that you lost interest. However, the same action can have different explanations. If you leave halfway through a clip because your bus arrives, the system can record when you stopped, but that signal alone cannot tell it why you left.",
   "ko": "시스템은 예측을 하기 위해 어떤 영상을 끝까지 봤는지, 어떤 영상은 건너뛰었는지 같은 신호를 살펴볼 수 있어요. 영상을 끝까지 봤다면 그 영상에 계속 관심이 있었다는 뜻일 수 있고, 건너뛰었다면 흥미를 잃었다는 뜻일 수 있어요. 하지만 같은 행동에도 여러 이유가 있을 수 있어요. 버스가 도착해서 영상을 보다가 중간에 나갔다면, 시스템은 언제 시청을 멈췄는지 기록할 수 있지만 그 신호만으로는 왜 나갔는지 알 수 없어요."
  },
  {
   "en": "A system can also compare patterns across viewers. Suppose many people who finish the same math clip also watch a lesson about fractions. The system may give that lesson a higher ranking in your feed because people with similar viewing habits have watched it. As a result, you might discover a useful lesson even if you never searched for fractions. This method allows the system to make recommendations based partly on what other people have watched.",
   "ko": "시스템은 시청자들의 시청 패턴을 서로 비교할 수도 있어요. 같은 수학 영상을 끝까지 본 사람들 중 많은 사람이 분수에 관한 수업 영상도 본다고 생각해 봐요. 내 시청 습관과 비슷한 사람들이 그 영상을 봤기 때문에 시스템은 내 피드에서 그 영상의 순위를 높일 수 있어요. 그 결과 분수를 검색한 적이 없어도 유용한 수업 영상을 발견할 수 있어요. 이런 방식으로 시스템은 다른 사람들이 본 영상도 참고해 추천할 수 있어요."
  },
  {
   "en": "Recommendations can create a feedback loop. Imagine that you watch several basketball clips, so the app begins showing you more of them. Because basketball clips now fill more of your feed, you have more chances to choose one. Each new basketball clip you watch then provides another signal that can influence later recommendations. Over time, your feed may become less varied, even though your interests outside the app are just as broad as they were before.",
   "ko": "추천은 피드백 고리를 만들 수 있어요. 농구 영상을 여러 편 봤더니 앱이 농구 영상을 더 많이 보여 주기 시작했다고 생각해 봐요. 이제 농구 영상이 피드에서 더 많은 자리를 차지하므로 그중 하나를 고를 기회도 많아져요. 그렇게 농구 영상을 볼 때마다 이후 추천에 영향을 줄 수 있는 신호가 하나씩 더 생겨요. 시간이 지나면 앱 밖에서의 관심사는 여전히 다양해도 피드에 나오는 영상은 덜 다양해질 수 있어요."
  },
  {
   "en": "Your choices can help shape what appears next. If the app has a button for marking a video as uninteresting, using it gives the system a direct signal about your preference. Searching for a different topic and watching some of the results can also give the app new clues. Although a recommendation may look like a guess about who you are, it reflects the clues the system has collected so far, and those clues can change.",
   "ko": "내가 어떤 선택을 하느냐에 따라 다음에 나타나는 영상이 달라질 수 있어요. 앱에 영상에 관심이 없다고 표시하는 버튼이 있다면, 그 버튼을 눌러 내 선호를 시스템에 직접 알려 줄 수 있어요. 다른 주제를 검색하고 검색 결과에 나온 영상 몇 편을 보는 것도 앱에 새로운 단서를 줄 수 있어요. 추천 영상은 내가 어떤 사람인지 짐작한 결과처럼 보일 수 있지만, 사실 시스템이 지금까지 모은 단서를 반영하며 그 단서는 달라질 수 있어요."
  }
 ],
 "analysis": [
  {
   "label": "Topic (글감)",
   "en": "How video recommendation algorithms choose what to show.",
   "ko": "동영상 추천 알고리즘이 보여 줄 영상을 고르는 방식이다."
  },
  {
   "label": "Main Idea (요지)",
   "en": "Video apps use viewing signals to rank recommendations, and users' choices can change the signals that shape their feeds.",
   "ko": "동영상 앱은 시청 신호로 추천 순위를 정하며, 사용자의 선택은 피드에 영향을 주는 신호를 바꿀 수 있다."
  },
  {
   "label": "Purpose (글의 목적)",
   "en": "To explain how video recommendations are formed and how viewers can influence them.",
   "ko": "동영상 추천이 이루어지는 방식과 시청자가 추천에 영향을 줄 수 있는 방법을 설명하는 것이다."
  }
 ],
 "facts": [
  {
   "name": "Recommendation Algorithm (추천 알고리즘)",
   "en": "A set of rules or steps that a system uses to select and order suggestions.",
   "ko": "시스템이 추천할 항목을 고르고 순서를 정하는 데 사용하는 규칙이나 절차다."
  },
  {
   "name": "Viewing Signal (시청 신호)",
   "en": "A piece of information from an action, such as skipping a clip, that can help a system make a prediction.",
   "ko": "영상 건너뛰기 같은 행동에서 얻는 정보로, 시스템의 예측에 활용될 수 있다."
  },
  {
   "name": "Ranking (순위)",
   "en": "A video's position in an ordered list of suggestions.",
   "ko": "추천 목록에서 영상이 차지하는 위치다."
  },
  {
   "name": "Feedback Loop (피드백 고리)",
   "en": "A process in which recommendations affect viewing choices, and those choices then affect later recommendations.",
   "ko": "추천이 시청 선택에 영향을 주고, 그 선택이 다시 이후의 추천에 영향을 주는 과정이다."
  }
 ],
 "vocab": [
  {
   "level": "C1 - Advanced",
   "items": [
    [
     "Algorithm",
     "n.",
     "알고리즘",
     "A set of steps for solving a problem or making a decision."
    ],
    [
     "Feedback loop",
     "n.",
     "피드백 고리",
     "A process in which a result affects what happens the next time."
    ],
    [
     "Ranking",
     "n.",
     "순위",
     "A position in a list ordered by importance or another rule."
    ]
   ]
  },
  {
   "level": "B2 - Upper Intermediate",
   "items": [
    [
     "Recommendation",
     "n.",
     "추천",
     "A suggestion about what someone might like or find useful."
    ],
    [
     "Predict",
     "v.",
     "예측하다",
     "To say what you think will happen or what someone will do."
    ],
    [
     "Signal",
     "n.",
     "신호",
     "A piece of information that points to something."
    ],
    [
     "Preference",
     "n.",
     "선호",
     "A stronger liking for one thing than for another."
    ],
    [
     "Varied",
     "adj.",
     "다양한",
     "Containing several different kinds of things."
    ]
   ]
  },
  {
   "level": "B1 - Intermediate",
   "items": [
    [
     "Clip",
     "n.",
     "짧은 영상",
     "A short video or a short part of a video."
    ],
    [
     "Skip",
     "v.",
     "건너뛰다",
     "To pass over something and go to the next thing."
    ],
    [
     "Pattern",
     "n.",
     "패턴, 반복되는 양상",
     "A way in which something happens again and again."
    ],
    [
     "Viewer",
     "n.",
     "시청자",
     "A person who watches a video, program, or other visual content."
    ]
   ]
  }
 ],
 "didYouKnow": {
  "en": "The word \"algorithm\" comes from the name of al-Khwarizmi, a mathematician who worked in Baghdad in the ninth century.",
  "ko": "‘알고리즘’이라는 말은 9세기에 바그다드에서 활동한 수학자 알콰리즈미의 이름에서 왔어요."
 }
};
