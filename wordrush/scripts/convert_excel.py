#!/usr/bin/env python3
"""
Convert Middle School English textbook Excel files (G1, G2, ...)
into wordrush/data/vocab.json and wordrush/data/vocab-data.js.
"""
import glob
import json
import os
import re
import openpyxl

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(SCRIPT_DIR)
WORKSPACE_DIR = os.path.dirname(APP_DIR)
DATA_DIR = os.path.join(APP_DIR, "data")

POS_MAP = {
    "n.": "n.",
    "v.": "v.",
    "a.": "adj.",
    "adj.": "adj.",
    "ad.": "adv.",
    "adv.": "adv.",
    "prep.": "prep.",
    "conj.": "conj.",
    "pron.": "pron.",
    "int.": "int.",
    "phr.": "phr.",
}

IRREGULAR_FORMS = {
    "be": ["am", "is", "are", "was", "were", "been", "being", "'m", "’m", "'s", "’s", "'re", "’re"],
    "leave": ["left", "leaving", "leaves"],
    "shake": ["shook", "shaken", "shaking", "shakes"],
    "throw": ["threw", "thrown", "throwing", "throws"],
    "fall": ["fell", "fallen", "falling", "falls"],
    "stick": ["stuck", "sticking", "sticks"],
    "take": ["took", "taken", "taking", "takes"],
    "make": ["made", "making", "makes"],
    "hang": ["hung", "hanged", "hanging", "hangs"],
    "go": ["went", "gone", "going", "goes"],
    "come": ["came", "coming", "comes"],
    "get": ["got", "gotten", "getting", "gets"],
    "give": ["gave", "given", "giving", "gives"],
    "find": ["found", "finding", "finds"],
    "keep": ["kept", "keeping", "keeps"],
    "hold": ["held", "holding", "holds"],
    "run": ["ran", "running", "runs"],
    "write": ["wrote", "written", "writing", "writes"],
    "read": ["reading", "reads"],
    "see": ["saw", "seen", "seeing", "sees"],
    "feel": ["felt", "feeling", "feels"],
    "break": ["broke", "broken", "breaking", "breaks"],
    "build": ["built", "building", "builds"],
    "buy": ["bought", "buying", "buys"],
    "catch": ["caught", "catching", "catches"],
    "choose": ["chose", "chosen", "choosing", "chooses"],
    "draw": ["drew", "drawn", "drawing", "draws"],
    "drink": ["drank", "drunk", "drinking", "drinks"],
    "drive": ["drove", "driven", "driving", "drives"],
    "eat": ["ate", "eaten", "eating", "eats"],
    "fly": ["flew", "flown", "flying", "flies"],
    "forget": ["forgot", "forgotten", "forgetting", "gets"],
    "grow": ["grew", "grown", "growing", "grows"],
    "hear": ["heard", "hearing", "hears"],
    "hide": ["hid", "hidden", "hiding", "hides"],
    "know": ["knew", "known", "knowing", "knows"],
    "lose": ["lost", "losing", "loses"],
    "meet": ["met", "meeting", "meets"],
    "pay": ["paid", "paying", "pays"],
    "put": ["putting", "puts"],
    "ride": ["rode", "ridden", "riding", "rides"],
    "ring": ["rang", "rung", "ringing", "rings"],
    "rise": ["rose", "risen", "rising", "rises"],
    "say": ["said", "saying", "says"],
    "sell": ["sold", "selling", "sells"],
    "send": ["sent", "sending", "sends"],
    "set": ["setting", "sets"],
    "shine": ["shone", "shining", "shines"],
    "show": ["showed", "shown", "showing", "shows"],
    "sing": ["sang", "sung", "singing", "sings"],
    "sit": ["sat", "sitting", "sits"],
    "sleep": ["slept", "sleeping", "sleeps"],
    "speak": ["spoke", "spoken", "speaking", "speaks"],
    "spend": ["spent", "spending", "spends"],
    "stand": ["stood", "standing", "stands"],
    "steal": ["stole", "stolen", "stealing", "steals"],
    "swim": ["swam", "swum", "swimming", "swims"],
    "teach": ["taught", "teaching", "teaches"],
    "tell": ["told", "telling", "tells"],
    "think": ["thought", "thinking", "thinks"],
    "understand": ["understood", "understanding", "understands"],
    "wake": ["woke", "woken", "waking", "wakes"],
    "wear": ["wore", "worn", "wearing", "wears"],
    "win": ["won", "winning", "wins"],
    "flavour": ["flavor", "flavours", "flavors"],
    "colour": ["color", "colours", "colors"],
}


def clean_text(val):
    if val is None:
        return ""
    s = str(val).strip()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\.\.+", ".", s)
    return s


def parse_pos_and_meaning(text):
    text = clean_text(text)
    m = re.match(r"^([a-zA-Z]+\.)\s*(.*)$", text)
    if m:
        raw_pos = m.group(1).lower()
        return POS_MAP.get(raw_pos, raw_pos), m.group(2).strip()
    return "", text


def word_variants(token):
    t = token.lower()
    forms = {t}
    if t in IRREGULAR_FORMS:
        forms.update(IRREGULAR_FORMS[t])
    # regular noun/verb inflections
    forms.add(t + "s")
    forms.add(t + "es")
    forms.add(t + "ed")
    forms.add(t + "d")
    forms.add(t + "ing")
    if t.endswith("y") and len(t) > 2:
        forms.add(t[:-1] + "ies")
        forms.add(t[:-1] + "ied")
    if t.endswith("e") and len(t) > 2:
        forms.add(t[:-1] + "ing")
    if len(t) >= 3 and t[-1] not in "aeiouywx" and t[-2] in "aeiou":
        forms.add(t + t[-1] + "ed")
        forms.add(t + t[-1] + "ing")
    return sorted(forms, key=len, reverse=True)


def find_example_match(word, example):
    """Find the exact substring in example that corresponds to `word`."""
    candidates = [c.strip() for c in re.split(r"[,/]", word) if c.strip()]
    for cand in candidates:
        # Direct word-boundary match
        m = re.search(r"\b" + re.escape(cand) + r"(?:s|es|ed|d|ing)?\b", example, re.IGNORECASE)
        if m:
            return m.group(0)

    # Single word inflection check
    for cand in candidates:
        if " " not in cand:
            for form in word_variants(cand):
                m = re.search(r"\b" + re.escape(form) + r"\b", example, re.IGNORECASE)
                if m:
                    return m.group(0)

    # Multi-word phrase check (e.g., "be interested in", "take a picture of")
    for cand in candidates:
        tokens = cand.split()
        if len(tokens) >= 2:
            # Handle "mix A with B" -> just blank first verb if A/B placeholders exist
            if any(tok in ("A", "B", "one's", "someone", "something") for tok in tokens):
                first_forms = word_variants(tokens[0])
                pat = r"\b(?:" + "|".join(re.escape(f) for f in first_forms) + r")\b"
                m = re.search(pat, example, re.IGNORECASE)
                if m:
                    return m.group(0)
                continue

            parts = []
            for idx, tok in enumerate(tokens):
                if idx == 0:
                    forms = word_variants(tok)
                    # Allow "I'm" contraction when tok == "be"
                    if tok.lower() == "be":
                        parts.append(r"(?:\b(?:am|is|are|was|were|be|been|being)\b|(?:’m|'m|’s|'s|’re|'re))")
                    else:
                        parts.append(r"\b(?:" + "|".join(re.escape(f) for f in forms) + r")\b")
                else:
                    parts.append(r"\b" + re.escape(tok) + r"\b")
            # Allow optional adverb between "be" and next word (e.g. "I'm so proud of")
            if tokens[0].lower() == "be":
                pattern = parts[0] + r"(?:\s+\w+)?\s+" + r"\s+".join(parts[1:])
            else:
                pattern = r"\s+".join(parts)
            m = re.search(pattern, example, re.IGNORECASE)
            if m:
                matched = m.group(0)
                # Strip leading apostrophe contraction if it's "'m so proud of"
                matched = re.sub(r"^[’'](?:m|s|re)\s+", "", matched)
                return matched.strip()

    return None


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    xlsx_files = sorted(glob.glob(os.path.join(WORKSPACE_DIR, "*.xlsx")))
    if not xlsx_files:
        raise FileNotFoundError(f"No .xlsx files found in {WORKSPACE_DIR}")

    items = []
    unmatched = []

    for path in xlsx_files:
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb.active
        for row in list(ws.iter_rows(values_only=True))[1:]:
            if not row or len(row) < 8 or not row[3] or not str(row[3]).strip():
                continue
            grade = int(row[0])
            lesson = int(row[1])
            no = int(row[2]) if row[2] is not None else len(items) + 1
            word = clean_text(row[3])
            pos, meaning_ko = parse_pos_and_meaning(row[4])
            eng_pos, eng_def = parse_pos_and_meaning(row[5])
            if not pos and eng_pos:
                pos = eng_pos
            if not pos and " " in word:
                pos = "phr."
            example = clean_text(row[6])
            example_ko = clean_text(row[7])

            cloze_target = find_example_match(word, example)
            if not cloze_target:
                unmatched.append((grade, lesson, word, example))
                cloze_target = re.split(r"[,/]", word)[0].strip()

            item_id = f"G{grade}-L{lesson}-{no}"
            items.append({
                "id": item_id,
                "grade": grade,
                "lesson": lesson,
                "no": no,
                "word": word,
                "pos": pos or "etc.",
                "ko": meaning_ko,
                "engDef": eng_def,
                "example": example,
                "exampleKo": example_ko,
                "clozeTarget": cloze_target,
                "isPhrase": " " in re.split(r"[,/]", word)[0].strip(),
            })

    payload = {
        "version": "1.0.0",
        "school": "서울문영여자중학교",
        "totalCount": len(items),
        "items": items,
    }

    json_path = os.path.join(DATA_DIR, "vocab.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    js_path = os.path.join(DATA_DIR, "vocab-data.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("// Auto-generated by scripts/convert_excel.py\n")
        f.write("window.MY_VOCAB_DATA = ")
        json.dump(payload, f, ensure_ascii=False)
        f.write(";\n")

    print(f"Converted {len(items)} items -> {json_path} & {js_path}")
    print(f"Unmatched cloze targets: {len(unmatched)}")
    for u in unmatched:
        print("  Unmatched:", u)


if __name__ == "__main__":
    main()
