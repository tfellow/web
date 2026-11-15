#!/usr/bin/env python3
"""MY Knowledge Passport 글 빌드 도구

원본(글마다 JSON 한 개)을 읽어서 사이트 파일을 만들어요.
  - app/books.js        글 목록(카탈로그)
  - app/books/<id>.js   글 본문 (본문·분석·핵심 사실·Did you know·단어장)
  - app/themes.js       분야·글 종류 표 (BOOK_THEMES 부분만 새로 써요)
  - <out>/quiz.json     퀴즈 (정답이 들어 있어서 저장소에 올리지 않아요!)

사용법: python3 tools/build.py <원본 폴더> <퀴즈 출력 폴더>
퀴즈 정답은 공개 저장소(GitHub Pages)에 올리면 학생이 볼 수 있으므로, 원본과 퀴즈는 저장소 밖에 둬요.
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / "app"
LEVEL_ORDER = {"A0": 0, "A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5}
REQUIRED = ["id", "title", "titleKo", "emoji", "color", "cefr", "category", "type", "story", "analysis", "facts", "vocab", "quiz"]


def words(text):
    return len(re.findall(r"[A-Za-z0-9]+(?:['’][A-Za-z]+)?", text))


def check(d, f):
    miss = [k for k in REQUIRED if k not in d]
    if miss:
        raise SystemExit(f"{f}: 빠진 항목 {miss}")
    if d["cefr"] not in LEVEL_ORDER:
        raise SystemExit(f"{f}: cefr 는 A0(Pre-A1)/A1/A2/B1/B2/C1 중 하나")
    if len(d["quiz"]) != 10:
        raise SystemExit(f"{f}: 퀴즈는 10문항이어야 해요 (지금 {len(d['quiz'])})")
    for i, q in enumerate(d["quiz"], 1):
        if len(q["choices"]) != 4 or q["answer"] not in q["choices"] or len(set(q["choices"])) != 4:
            raise SystemExit(f"{f}: {i}번 문항 보기 4개/정답 확인")
    for p in d["story"]:
        if not p.get("en") or not p.get("ko"):
            raise SystemExit(f"{f}: 본문 단락에 en/ko 가 모두 있어야 해요")


def sq(v):
    return "'" + str(v).replace("'", "''") + "'"


def seed_sql(quiz):
    """r2_books 와 r2_quiz_questions 를 채우는 SQL. 정답이 들어 있으니 저장소에 올리지 마세요."""
    import random
    out = ["-- MY Knowledge Passport 글·퀴즈 등록 (supabase_reading2.sql 을 먼저 한 번 실행한 뒤에 실행하세요)",
           "-- 여러 번 실행해도 괜찮아요. 글 정보와 퀴즈 문항을 최신 내용으로 바꿔요. 학생 기록은 그대로 남아요.",
           "begin;"]
    for bid, q in quiz.items():
        places = "array[" + ",".join(sq(x) for x in q["places"]) + "]::text[]" if q["places"] else "'{}'::text[]"
        out.append(f"insert into public.r2_books (id, title, cefr, word_count, published, places) values ({sq(bid)}, {sq(q['title'])}, {sq(q['cefr'])}, {q['words']}, true, {places})"
                   " on conflict (id) do update set title = excluded.title, cefr = excluded.cefr, word_count = excluded.word_count, places = excluded.places;")
        out.append(f"delete from public.r2_quiz_questions where book_id = {sq(bid)};")
        rnd = random.Random(bid)
        rows = []
        for i, item in enumerate(q["questions"], 1):
            ch = list(item["choices"])
            rnd.shuffle(ch)
            rows.append(f"({sq(bid)}, {i}, {sq(item['q'])}, {sq(json.dumps(ch, ensure_ascii=False))}::jsonb, {ch.index(item['answer']) + 1})")
        out.append("insert into public.r2_quiz_questions (book_id, no, question, choices, answer) values\n  " + ",\n  ".join(rows) + ";")
    out.append("commit;")
    return "\n".join(out) + "\n"


def main():
    src = pathlib.Path(sys.argv[1])
    out = pathlib.Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    items = []
    for f in sorted(src.glob("*.json")):
        d = json.loads(f.read_text())
        check(d, f.name)
        items.append(d)
    ids = [d["id"] for d in items]
    if len(ids) != len(set(ids)):
        raise SystemExit("id 가 겹쳐요")
    cats = [d["category"] if isinstance(d["category"], list) else [d["category"]] for d in items]
    order = {c: i for i, c in enumerate(["knowledge", "science", "space", "history", "holiday", "food", "invention", "people", "culture", "school"])}
    items_c = sorted(zip(items, cats), key=lambda x: (LEVEL_ORDER[x[0]["cefr"]], order.get(x[1][0], 99), x[0]["id"]))

    (APP / "books").mkdir(exist_ok=True)
    catalog, themes, quiz = [], {}, {}
    for d, c in items_c:
        n = sum(words(p["en"]) for p in d["story"])
        places = d.get("places") or ([d["country"]] if d.get("country") else [])
        row = {"id": d["id"], "title": d["title"], "titleKo": d["titleKo"]}
        if places:
            row["country"] = places[0]
        row.update({"emoji": d["emoji"], "color": d["color"], "cefr": d["cefr"]})
        if d.get("cefrLabel"):
            row["cefrLabel"] = d["cefrLabel"]
        row["words"] = n
        row["places"] = places
        catalog.append(row)
        themes[d["id"]] = ",".join(c) + "|" + d["type"]
        content = {"story": d["story"], "analysis": d["analysis"], "facts": d["facts"], "vocab": d["vocab"]}
        if d.get("didYouKnow"):
            content["didYouKnow"] = d["didYouKnow"]
        js = ("// " + d["title"] + " 본문. 목록 정보는 ../books.js 에 있어요.\n"
              "window.BOOK_CONTENT = window.BOOK_CONTENT || {};\n"
              "window.BOOK_CONTENT[" + json.dumps(d["id"]) + "] = " + json.dumps(content, ensure_ascii=False, indent=1) + ";\n")
        (APP / "books" / (d["id"] + ".js")).write_text(js)
        quiz[d["id"]] = {"title": d["title"], "cefr": d["cefr"], "words": n, "places": places, "questions": d["quiz"]}

    head = ("// 글 목록(카탈로그). tools/build.py 가 만들어요. 본문은 books/<id>.js 에 있어요.\n"
            "// cefr 는 A0(Pre-A1) / A1 / A2 / B1 / B2 / C1 중 하나. Supabase 의 r2_books / r2_quiz_questions 에도 같은 id 로 등록해요.\n"
            "// places: 여권 도장 후보 나라. 첫 번째가 글의 대표 나라(기본값). Supabase r2_books.places 와 같게 맞춰요.\n")
    (APP / "books.js").write_text(head + "window.BOOKS = " + json.dumps(catalog, ensure_ascii=False, indent=1) + ";\n")

    t = (APP / "themes.js").read_text()
    t = re.sub(r"window\.BOOK_THEMES = \{.*?\};\n", lambda m: "window.BOOK_THEMES = " + json.dumps(themes, ensure_ascii=False, indent=2) + ";\n", t, flags=re.S)
    (APP / "themes.js").write_text(t)
    (out / "quiz.json").write_text(json.dumps(quiz, ensure_ascii=False, indent=1))
    (out / "reading2_seed.sql").write_text(seed_sql(quiz))
    by = {}
    for r in catalog:
        by[r["cefr"]] = by.get(r["cefr"], 0) + 1
    print(f"글 {len(catalog)}편 {by} · 퀴즈 {sum(len(q['questions']) for q in quiz.values())}문항")
    for r in catalog:
        print(f"  {r['cefr']} {r['words']:>4}단어  {r['id']}")


if __name__ == "__main__":
    main()
