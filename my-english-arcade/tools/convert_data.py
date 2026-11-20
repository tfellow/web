"""Read the original workbooks without modifying them; regenerate the game bank."""
import pathlib, json, re, csv, collections
import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[1]
items, skipped = [], []
for path in sorted(ROOT.parent.glob('*.xlsx')):
    book = openpyxl.load_workbook(path, read_only=True, data_only=True)
    for sheet in book:
        for rownum, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), 2):
            if not any(v is not None for v in row):
                continue
            grade, lesson, number, word, meaning, definition, sentence, translation = (list(row)+[None]*8)[:8]
            if not (str(grade).isdigit() and word and meaning and lesson is not None):
                skipped.append({'file':path.name,'row':rownum,'reason':'missing grade/lesson/word/meaning'})
                continue
            clean = lambda x: re.sub(r'\s+', ' ', str(x or '')).strip()
            items.append(dict(id=f'g{grade}-u{lesson}-r{rownum}',grade=int(grade),unit=clean(lesson),word=clean(word),meaning=clean(meaning),definition=clean(definition),sentence=clean(sentence),translation=clean(translation),acceptedAnswers=[],source={'file':path.name,'sheet':sheet.title,'row':rownum}))
    book.close()
bank={'version':1,'title':'문영 중학교 영어 단어','items':items}
(ROOT/'data').mkdir(exist_ok=True)
payload=json.dumps(bank,ensure_ascii=False,indent=2)
(ROOT/'data'/'bank.json').write_text(payload,encoding='utf-8')
(ROOT/'data'/'bank.js').write_text('window.MY_BANK = '+payload+';\n',encoding='utf-8')
with (ROOT/'data'/'template.csv').open('w',encoding='utf-8-sig',newline='') as f:
    fields=['id','grade','unit','word','meaning','definition','sentence','translation']
    w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(items[:3])
report={'total':len(items),'byGradeUnit':dict(collections.Counter(f"{x['grade']}/{x['unit']}" for x in items)),'missingSentence':sum(not x['sentence'] for x in items),'missingDefinition':sum(not x['definition'] for x in items),'skipped':skipped}
(ROOT/'data'/'conversion-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))
