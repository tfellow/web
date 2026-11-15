# MY Knowledge Passport · 글 만들기

글 원본(JSON)과 퀴즈 정답은 **공개 저장소에 올리지 않아요.** 원본은 비공개 폴더에 두고 아래처럼 빌드해요.

```
python3 reading2/tools/build.py <원본 폴더>/ <출력 폴더>/
```

- 저장소에 쓰는 것: `app/books.js`, `app/books/<id>.js`, `app/themes.js` 의 BOOK_THEMES (퀴즈 없음)
- 출력 폴더에만 쓰는 것(비공개): `quiz.json`, `reading2_seed.sql` (r2_books · r2_quiz_questions 등록용)

처음 한 번은 Supabase SQL 편집기에서 `reading2/supabase_reading2.sql` 을 실행하고, 글을 바꿀 때마다 `reading2_seed.sql` 을 실행해요.
