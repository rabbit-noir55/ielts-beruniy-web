import os
import re
import json
import sys
import html as html_mod
from bs4 import BeautifulSoup

SRC = os.path.join(os.path.dirname(__file__), "..", "public", "qayta_ishlash_kerak")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "json")
IMG = os.path.join(os.path.dirname(__file__), "..", "public", "images")

SERIES = {
    101: ["Reading Mock Test.html", "Listening Mock Test.html"],
}
for i in range(1, 11):
    SERIES[101 + i] = [
        f"Reading Mock Test_{i}.html",
        f"Listening Mock Test_{i}.html",
    ]
for i in range(11, 17):
    SERIES[101 + i] = [f"Reading Mock Test_{i}.html"]
SERIES[118] = ["Listening Mock Tests.html"]
SERIES[119] = ["IELTS Listening Mock Test.html"]
SERIES[120] = ["IELTS Listening Mock Test_1.html"]
SERIES[121] = ["IELTS Listening Mock Test_2.html"]
SERIES[122] = ["IELTS Listening Mock Test_3.html"]
SERIES[123] = ["MOCK LISTENING.html"]
SERIES[124] = ["FULL_LISTENING.html"]


def clean(s):
    if s is None:
        return ""
    s = html_mod.unescape(s)
    s = s.replace("\xa0", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def input_marker():
    return "<input>"


def text_with_inputs(soup_el, explicit_qids=None, marker="<input>"):
    """Element ichidagi barcha <input> elementlarini marker bilan almashtiradi."""
    out = []
    explicit_qids = explicit_qids or {}
    for node in soup_el.descendants:
        if getattr(node, "name", None) == "input":
            qid = node.get("id")
            if qid and qid in explicit_qids:
                out.append(f"[qzone-input-{explicit_qids[qid]}]")
            else:
                out.append(marker)
            if qid:
                out.append("")
        elif getattr(node, "name", None) is None and isinstance(node, str):
            out.append(str(node))
    text = "".join(out)
    text = html_mod.unescape(text)
    text = text.replace("\xa0", " ").replace("\n", " ").replace("\r", " ")
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


# ──────────────────────────────────────────────────────────────────────────────
#  READING
# ──────────────────────────────────────────────────────────────────────────────


def build_reading_passage(soup, n):
    """Passage-text-N dan article qurish."""
    pid = f"passage-text-{n}"
    el = soup.find(id=pid)
    if el is None:
        return None
    title_el = el.find("h4", class_="text-center")
    title = clean(title_el.get_text(" ", strip=True)) if title_el else ""

    # italic subtitle
    subtitles = []
    for p in el.find_all("p"):
        style = p.get("style", "")
        if "italic" in style and "center" in style:
            subtitles.append(clean(p.get_text(" ", strip=True)))

    paragraphs = []
    for p in el.find_all("p"):
        style = p.get("style", "")
        if "italic" in style and "center" in style:
            continue
        strong = p.find("strong")
        is_labeled = strong and re.match(r"^[A-Z]$", clean(strong.get_text()))
        label = ""
        para_text = ""
        if is_labeled:
            label = clean(strong.get_text())
            strong.extract()
            para_text = text_with_inputs(p)
        else:
            para_text = clean(p.get_text(" ", strip=True))
        paragraphs.append({"label": label, "text": para_text})

    # agar hech biri labeled bo'lmasa, barchasini bitta section ga joylashtirish
    sections = []
    if any(p["label"] for p in paragraphs):
        for p in paragraphs:
            if p["label"]:
                sections.append(
                    {
                        "title": p["label"],
                        "items": [
                            {
                                "type": "",
                                "items": [
                                    {"items": [{"sentence_raw": p["text"]}]}
                                ],
                                "title": "",
                            }
                        ],
                    }
                )
    else:
        sections.append(
            {
                "title": "",
                "items": [
                    {
                        "type": "",
                        "items": [{"items": [{"sentence_raw": p["text"]}]}],
                        "title": "",
                    }
                    for p in paragraphs
                ],
            }
        )

    return {
        "title": title,
        "footer": [],
        "glossary": [],
        "sections": sections,
        "subtitles": subtitles,
    }


def extract_constraint(prompt):
    text = clean(prompt.get_text(" ", strip=True))
    m = re.search(
        r"(ONE WORD (?:AND/OR A NUMBER|ONLY)|NO MORE THAN (?:TWO|THREE) WORDS|ONE WORD|TWO WORDS|THREE WORDS)",
        text,
        re.I,
    )
    return m.group(1).upper() if m else ""


def reading_answer_key_range(blocks):
    starts = [b["start"] for b in blocks]
    ends = [b["end"] for b in blocks]
    return [min(starts), max(ends)]


def parse_summary_text(block_soup, prompt, explicit_qids):
    """summary-text dan input-note / input-sentence / input-summary ni qurish."""
    st = block_soup.select_one(".summary-text")
    if st is None:
        return None, None

    # centered title
    title = ""
    for p in st.find_all("p"):
        if "center" in p.get("style", "") and "font-weight" in p.get("style", ""):
            title = clean(p.get_text(" ", strip=True))
            break

    # Guruhlar (strong + ul) borligini tekshiramiz
    groups = []
    group_heads = st.find_all("p")
    has_groups = any(
        g.find("strong") and g.find_next_sibling("ul") for g in group_heads
    )

    if has_groups:
        items = []
        current = None
        for child in st.children:
            if getattr(child, "name", None) == "p":
                if child.find("strong") and child.find_next_sibling("ul"):
                    current = {
                        "title": clean(child.get_text(" ", strip=True)),
                        "items": [],
                    }
                    items.append(current)
                elif "center" in child.get("style", ""):
                    title = clean(child.get_text(" ", strip=True))
            elif getattr(child, "name", None) == "ul" and current is not None:
                for li in child.find_all("li"):
                    current["items"].append(
                        text_with_inputs(li, explicit_qids)
                    )
        return (
            {
                "type": "input-note",
                "start": int(block_soup.get("data-q-start")),
                "end": int(block_soup.get("data-q-end")),
                "desc": {"constraint": extract_constraint(prompt)},
                "body": {"title": title, "items": items},
            },
            None,
        )

    # Sentence / summary paragraph
    paras = []
    for p in st.find_all("p"):
        if "center" in p.get("style", ""):
            title = clean(p.get_text(" ", strip=True))
            continue
        t = text_with_inputs(p, explicit_qids)
        # "24&nbsp;&nbsp;..." bosh raqamini olib tashlash
        t = re.sub(r"^\d+\s+", "", t)
        paras.append(t)

    if len(paras) > 1:
        return (
            {
                "type": "input-sentence",
                "start": int(block_soup.get("data-q-start")),
                "end": int(block_soup.get("data-q-end")),
                "desc": {"constraint": extract_constraint(prompt)},
                "body": {"items": paras},
            },
            None,
        )
    else:
        return (
            {
                "type": "input-summary",
                "start": int(block_soup.get("data-q-start")),
                "end": int(block_soup.get("data-q-end")),
                "desc": {"constraint": extract_constraint(prompt)},
                "body": {"title": title, "items": paras},
            },
            None,
        )


def parse_reading_matching(block_soup, prompt, people_list=None, people_title=None):
    """matching-form-container → select-section / select-given-list."""
    start = int(block_soup.get("data-q-start"))
    end = int(block_soup.get("data-q-end"))

    # first select options letters
    first_select = block_soup.find("select")
    opts = first_select.find_all("option") if first_select else []
    letters = [o.get("value") for o in opts if o.get("value")]
    if not letters:
        letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"][
            : end - start + 1
        ]
    first_letter, last_letter = letters[0], letters[-1]

    items = []
    for row in block_soup.select(".matching-form-row"):
        label = row.select_one(".matching-form-label")
        t = text_with_inputs(label)
        t = re.sub(r"^\d+\s+", "", t)
        items.append(t + " <input>")

    if people_list is not None:
        return (
            {
                "type": "select-given-list",
                "start": start,
                "end": end,
                "desc": {
                    "optionRange": [first_letter, last_letter],
                    "text": [clean(prompt.get_text(" ", strip=True))],
                    "textReadable": [clean(prompt.get_text(" ", strip=True))],
                },
                "body": {
                    "list": people_list,
                    "listTitle": people_title or "List of People",
                    "items": items,
                },
            },
            None,
        )
    else:
        return (
            {
                "type": "select-section",
                "start": start,
                "end": end,
                "desc": {
                    "sectionRange": [first_letter, last_letter],
                    "text": [clean(prompt.get_text(" ", strip=True))],
                    "sectionType": "section",
                },
                "body": {"items": items},
            },
            None,
        )


def parse_reading_checkbox(block_soup, prompt):
    start = int(block_soup.get("data-q-start"))
    end = int(block_soup.get("data-q-end"))
    cg = block_soup.select_one(".checkbox-group")
    mc = block_soup.select_one(".multi-choice-question")
    src = cg if cg is not None else mc
    if src is None:
        return None, None
    # multi-choice-question radio input (har savol alohida) → option-abc
    if cg is None and block_soup.select_one(".multi-choice-question input[type=radio]"):
        return parse_reading_mcq_radio(block_soup, prompt)
    options = []
    # .checkbox-group: label barchasi; .multi-choice-question: .multi-choice-option
    sel = ".checkbox-group label" if cg is not None else ".multi-choice-option"
    for opt in src.select(sel):
        t = clean(opt.get_text(" ", strip=True))
        t = re.sub(r"^[A-Z]\s+", "", t)
        options.append(t)
    # title: checkbox-group da .group-title yoki ichki p; aks holda prompt
    gt = src.select_one(".group-title")
    title = clean(gt.get_text(" ", strip=True)) if gt else ""
    if not title and cg is not None:
        p = cg.find("p")
        title = clean(p.get_text(" ", strip=True)) if p else ""
    if not title:
        title = clean(prompt.get_text(" ", strip=True))
    title = re.sub(r"^Questions \d+[-–]\d+", "", title).strip()
    title = re.sub(r"^Questions?\s+\d+\s+and\s+\d+", "", title).strip()
    # "Choose TWO letters, A-E." va "Write the correct letters..." kabi qismlarni olib tashlash
    title = re.sub(r"^Choose\s+(TWO|THREE)\s+letters?[^.]*\.?\s*", "", title)
    title = re.sub(r"^Write the correct letters?[^.]*\.?\s*", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return (
        {
            "type": "checkbox",
            "start": start,
            "end": end,
            "desc": {
                "optionRange": ["A", chr(64 + len(options))],
                "quantity": end - start + 1,
            },
            "body": {"title": title, "options": options},
        },
        None,
    )


def parse_reading_mcq_radio(block_soup, prompt):
    """multi-choice-question radio input (har savol o'z options'i bilan) → option-abc."""
    items = []
    for mq in block_soup.select(".multi-choice-question"):
        p = mq.find("p")
        title = clean(p.get_text(" ", strip=True)) if p else ""
        title = re.sub(r"^\d+\s+", "", title)
        options = []
        for opt in mq.select(".multi-choice-option"):
            t = clean(opt.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)
        items.append({"title": title, "options": options})
    if not items:
        return None, None
    qs = [int(x.get("data-q-start")) for x in block_soup.select(".multi-choice-question")]
    start = int(block_soup.get("data-q-start"))
    end = int(block_soup.get("data-q-end"))
    return (
        {
            "type": "option-abc",
            "start": start,
            "end": end,
            "desc": {},
            "body": {"items": items},
        },
        None,
    )


def parse_reading_mcq(block_soup, prompt):
    """mcq-question → option-abc. Agar checkbox inputlar bo'lsa (Choose TWO) → checkbox."""
    start = int(block_soup.get("data-q-start"))
    end = int(block_soup.get("data-q-end"))
    # Choose TWO savollari: mcq-option ichida checkbox input bor
    is_multi = bool(block_soup.select_one(".mcq-question input[type=checkbox]"))
    if is_multi:
        mq = block_soup.select_one(".mcq-question")
        title = ""
        p = mq.find("p")
        if p:
            title = clean(p.get_text(" ", strip=True))
        if not title:
            title = clean(prompt.get_text(" ", strip=True))
        title = re.sub(r"^Questions \d+[-–]\d+", "", title).strip()
        title = re.sub(r"^Questions?\s+\d+\s+and\s+\d+", "", title).strip()
        title = re.sub(r"^Choose\s+(TWO|THREE)\s+letters?[^.]*\.?\s*", "", title)
        title = re.sub(r"^Write the correct letters?[^.]*\.?\s*", "", title)
        title = re.sub(r"\s+", " ", title).strip()
        options = []
        for lab in mq.select(".mcq-option"):
            t = clean(lab.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)
        return (
            {
                "type": "checkbox",
                "start": start,
                "end": end,
                "desc": {
                    "optionRange": ["A", chr(64 + len(options))],
                    "quantity": end - start + 1,
                },
                "body": {"title": title, "options": options},
            },
            None,
        )
    items = []
    for mq in block_soup.select(".mcq-question"):
        p = mq.find("p")
        title = clean(p.get_text(" ", strip=True)) if p else ""
        title = re.sub(r"^\d+\s+", "", title)
        options = []
        for lab in mq.select(".mcq-option"):
            t = clean(lab.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)
        items.append({"title": title, "options": options})
    return (
        {
            "type": "option-abc",
            "start": start,
            "end": end,
            "desc": {},
            "body": {"items": items},
        },
        None,
    )


def parse_reading_flowchart(block_soup, prompt):
    """flow-chart (raqamli qutilar + ↓) → input-summary."""
    start = int(block_soup.get("data-q-start"))
    end = int(block_soup.get("data-q-end"))
    title = ""
    items = []
    for child in block_soup.children:
        if getattr(child, "name", None) != "p":
            continue
        txt = clean(child.get_text(" ", strip=True))
        if "center" in child.get("style", "") or "↓" in txt:
            if "center" in child.get("style", "") and "font-weight" in child.get("style", ""):
                title = txt
            continue
        items.append(text_with_inputs(child))
    return (
        {
            "type": "input-summary",
            "start": start,
            "end": end,
            "desc": {"constraint": extract_constraint(prompt)},
            "body": {"title": title, "items": items},
        },
        None,
    )


def parse_reading_summary_select(block_soup, prompt):
    """summary-text ichida <select> → select-summary-given-list."""
    st = block_soup.select_one(".summary-text")
    start = int(block_soup.get("data-q-start"))
    end = int(block_soup.get("data-q-end"))

    first_select = st.find("select")
    opts = [o.get("value") for o in first_select.find_all("option") if o.get("value")]
    # letters yoki words
    is_words = not all(re.match(r"^[A-Z]$", o) for o in opts)

    list_vals = []
    if is_words:
        for sel in st.find_all("select"):
            for o in sel.find_all("option"):
                v = o.get("value")
                if v and v not in list_vals:
                    list_vals.append(v)
        letters = [chr(65 + i) for i in range(len(list_vals))]
    else:
        list_vals = [chr(65 + i) for i in range(len(opts))]
        letters = list_vals

    items = []
    for p in st.find_all("p"):
        if "center" in p.get("style", ""):
            continue
        for sel in p.find_all("select"):
            sel.replace_with(BeautifulSoup("<input>", "html.parser"))
        items.append(text_with_inputs(p))

    return (
        {
            "type": "select-summary-given-list",
            "start": start,
            "end": end,
            "desc": {"optionRange": [letters[0], letters[-1]]},
            "body": {"list": list_vals, "items": items},
        },
        {"is_words": is_words, "list": list_vals},
    )


def parse_reading_block(block_soup, block_qids):
    """Bitta .question blokini parse qilish."""
    prompt = block_soup.select_one(".question-prompt")

    # 1. tf-question
    if block_soup.select_one(".tf-question"):
        items = []
        for tf in block_soup.select(".tf-question"):
            txt = tf.select_one(".tf-question-text")
            items.append(clean(txt.get_text(" ", strip=True)) if txt else "")
        return (
            {
                "type": "option-true-false",
                "start": int(block_soup.get("data-q-start")),
                "end": int(block_soup.get("data-q-end")),
                "desc": {},
                "body": {"items": items},
            },
            None,
        )

    # 1b. mcq-question → option-abc
    if block_soup.select_one(".mcq-question"):
        return parse_reading_mcq(block_soup, prompt)

    # 1c. checkbox-group → checkbox
    if block_soup.select_one(".checkbox-group"):
        return parse_reading_checkbox(block_soup, prompt)

    # 1d. flow-chart (raqamli qutilar + ↓) → input-summary
    if block_soup.select_one(".flow-chart") or (
        block_soup.find("p", string=lambda t: t and "↓" in t)
    ):
        return parse_reading_flowchart(block_soup, prompt)

    # 2. multi-choice → checkbox
    if block_soup.select_one(".multi-choice-question"):
        return parse_reading_checkbox(block_soup, prompt)

    # 3. summary-text
    if block_soup.select_one(".summary-text"):
        # select ichida → select-summary-given-list
        if block_soup.select_one(".summary-text select"):
            return parse_reading_summary_select(block_soup, prompt)
        return parse_summary_text(block_soup, prompt, block_qids)

    # 4. people-section + matching
    people_el = block_soup.select_one(".people-section")
    if people_el and block_soup.select_one(".matching-form-container"):
        people_list = []
        for li in people_el.select("ul li"):
            t = clean(li.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            people_list.append(t)
        ptitle_el = people_el.select_one(".section-title")
        ptitle = clean(ptitle_el.get_text(" ", strip=True)) if ptitle_el else None
        return parse_reading_matching(
            block_soup, prompt, people_list=people_list, people_title=ptitle
        )

    # 5. matching-form-container (people-siz)
    if block_soup.select_one(".matching-form-container"):
        return parse_reading_matching(block_soup, prompt)

    return None, None


def extract_correct_answers(html, prefix="correctAnswers"):
    """correctAnswers JS obyektini ajratib olish."""
    m = re.search(
        prefix + r"\s*=\s*\{(.*?)\};", html, re.S
    )
    if not m:
        return {}
    body = m.group(1)
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
    body = re.sub(r"//[^\n]*", "", body)
    # q1 → "1"
    body = re.sub(
        r"([,{]\s*)q(\d+)\s*:", r'\1"\2":', body
    )
    # '1': yoki 1: → "1": (boshidagi kalit uchun ^ ham)
    body = re.sub(
        r"(^\s*|[,{]\s*)['\"]?(\d+)['\"]?\s*:", r'\1"\2":', body
    )
    # single-quote qiymatlarni double-quote qilish (string va array elementlari)
    body = re.sub(r"'([^'\n]*)'", r'"\1"', body)
    # trailing vergullarni olib tashlash
    body = re.sub(r",\s*([}\]])", r"\1", body)
    try:
        obj = json.loads("{" + body + "}")
    except Exception:
        obj = {}
        # fallback: har bir kalit-qiymatni regex bilan
        for m in re.finditer(
            r'["\']?q?(\d+)["\']?\s*:\s*("(?:[^"\\]|\\.)*"|\[[^\]]*\]|[^,\n}]+)',
            body,
        ):
            k = m.group(1)
            v = m.group(2).strip()
            try:
                val = json.loads(v)
            except Exception:
                val = v.strip("'\"")
            obj[k] = val
    return obj


def answers_for_range(all_answers, range_):
    out = {}
    lo, hi = range_
    for k, v in all_answers.items():
        try:
            n = int(k)
        except Exception:
            continue
        if lo <= n <= hi:
            out[str(n)] = v
    return out


def remap_word_answers(blocks, answers):
    """select-summary-given-list da word-options bo'lsa javob so'zini letterga aylantirish."""
    for b in blocks:
        if b.get("type") != "select-summary-given-list":
            continue
        lst = b["body"].get("list", [])
        if not lst:
            continue
        # word-options (list alphabetik emas)
        if all(len(x) == 1 and x.isalpha() for x in lst):
            continue
        letter_of = {v: chr(65 + i) for i, v in enumerate(lst)}
        for qid in range(b["start"], b["end"] + 1):
            k = str(qid)
            if k not in answers:
                continue
            vals = str(answers[k]).split("|")
            new = []
            for v in vals:
                key = v.strip()
                if key in letter_of:
                    new.append(letter_of[key])
                else:
                    new.append(key)
            answers[k] = "|".join(new)
    return answers


ROMAN = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7,
    "viii": 8, "ix": 9, "x": 10, "xi": 11, "xii": 12, "xiii": 13,
    "xiv": 14, "xv": 15, "xvi": 16,
}


def roman_to_num(s):
    return ROMAN.get(s.strip().lower())


def remap_roman_answers(blocks, answers):
    """select-given-list da list 'i ....' (roman) bo'lsa javob roman raqamini letterga aylantirish."""
    for b in blocks:
        if b.get("type") != "select-given-list":
            continue
        lst = b["body"].get("list", [])
        if not lst:
            continue
        # list boshi roman raqamlari bilan boshlanadimi?
        first = clean(str(lst[0]))
        m = re.match(r"^([ivxlc]+)\b", first)
        if not m:
            continue
        roman_to_letter = {}
        for idx, item in enumerate(lst):
            t = clean(str(item))
            m2 = re.match(r"^([ivxlc]+)\b", t)
            if m2:
                roman_to_letter[m2.group(1).lower()] = chr(65 + idx)
        for qid in range(b["start"], b["end"] + 1):
            k = str(qid)
            if k not in answers:
                continue
            vals = str(answers[k]).split("|")
            new = []
            for v in vals:
                key = v.strip().lower()
                if key in roman_to_letter:
                    new.append(roman_to_letter[key])
                else:
                    new.append(v.strip())
            answers[k] = "|".join(new)
    return answers


def remap_checkbox_answers(blocks, answers):
    """checkbox guruhlarida 'C,E' ko'rinishidagi javobni har qidga bitta letter qilib taqsimlash."""
    for b in blocks:
        if b.get("type") != "checkbox":
            continue
        qids = list(range(b["start"], b["end"] + 1))
        # barcha qid javoblarini yig'amiz — guruh javobi bir xil bo'ladi
        letters = []
        for qid in qids:
            k = str(qid)
            if k not in answers:
                continue
            for part in str(answers[k]).replace(",", "|").split("|"):
                p = part.strip()
                if p and p not in letters:
                    letters.append(p)
        if not letters:
            continue
        # har bir qidga navbatdagi letter (loop)
        for i, qid in enumerate(qids):
            answers[str(qid)] = letters[i % len(letters)]
    return answers


def normalize_answer(v):
    """Array qiymatini '|' bilan birlashtirish, stringni o'zini qaytarish."""
    if isinstance(v, list):
        return "|".join(str(x) for x in v)
    return str(v)


def normalize_listening_answer(v):
    """Listening javobi: '/' alternativlarni '|' ga aylantirish."""
    s = normalize_answer(v)
    # JSON qiymat ichidagi tarixlarda vergul bor bo'lishi mumkin; avval '/'→'|'
    s = re.sub(r"\s*/\s*", "|", s)
    return s


def convert_reading(path, series_id):
    html = open(path, encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")

    # correctAnswers
    all_answers = extract_correct_answers(html)
    all_answers = {k: normalize_answer(v) for k, v in all_answers.items()}

    parts = {}
    meta_sections = {}
    for pn in range(1, 4):
        passage = build_reading_passage(soup, pn)
        if passage is None:
            continue
        qset = soup.find(id=f"questions-{pn}")
        blocks = []
        block_qids = {}
        if qset:
            for q in qset.select(".question"):
                b, meta = parse_reading_block(q, block_qids)
                if b is not None:
                    blocks.append(b)
        start = min(b["start"] for b in blocks) if blocks else 1
        end = max(b["end"] for b in blocks) if blocks else start
        pkey = str(pn)
        parts[pkey] = {
            "question": {"test_question": blocks},
            "text": {
                "test_text": {
                    "title": passage["title"],
                    "article": passage,
                    "answer_key_range": [start, end],
                    "orphan_explain_map": {},
                }
            },
            "answers": remap_checkbox_answers(
                blocks,
                remap_roman_answers(
                    blocks,
                    remap_word_answers(
                        blocks, answers_for_range(all_answers, [start, end])
                    ),
                ),
            ),
        }
        meta_sections[pkey] = {"section": pn, "passage_in_section": 1}

    test = {
        "parts": parts,
        "meta": {"total_parts": len(parts), "part_sections": meta_sections},
    }

    return {
        "book": f"Mock {series_id} Reading",
        "type": "reading",
        "series_id": series_id,
        "tests": {"1": test},
    }


# ──────────────────────────────────────────────────────────────────────────────
#  LISTENING
# ──────────────────────────────────────────────────────────────────────────────


def parse_listening_answers(html):
    """answer-key div yoki correctAnswers JS dan javoblarni olish."""
    # 1. correctAnswers q1... (FULL_LISTENING)
    if "correctAnswers = {" in html:
        obj = extract_correct_answers(html)
        return {k: normalize_listening_answer(v) for k, v in obj.items()}

    # 2. #answer-key div JSON fragment
    m = re.search(r'id="answer-key"[^>]*>(.*?)</div>', html, re.S)
    if m:
        content = m.group(1)
        content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)
        content = re.sub(r"//[^\n]*", "", content)
        content = content.strip().strip(",")
        # extract_correct_answers bilan bir xil: kalit va qiymatlarni normalize qilish
        content = re.sub(
            r"(^\s*|[,{]\s*)['\"]?(\d+)['\"]?\s*:", r'\1"\2":', content
        )
        content = re.sub(r"'([^'\n]*)'", r'"\1"', content)
        content = re.sub(r",\s*([}\]])", r"\1", content)
        try:
            obj = json.loads("{" + content + "}")
        except Exception:
            obj = {}
            for km, vm in re.finditer(
                r'"(\d+)"\s*:\s*("(?:[^"\\]|\\.)*"|\[[^\]]*\]|[^,\n}]+)',
                content,
            ):
                k = km.group(1)
                try:
                    val = json.loads(vm.group(1).strip())
                except Exception:
                    val = vm.group(1).strip("'\"")
                obj[k] = val
        out = {}
        for k, v in obj.items():
            out[k] = normalize_listening_answer(v)
        return out

    return {}


def listening_audio_src(html):
    m = re.search(r"audioSource\s*=\s*['\"]([^'\"]+)", html)
    if m:
        return m.group(1)
    # audio elementdan
    m = re.search(r'<audio[^>]+src="([^"]+)"', html)
    if m:
        return m.group(1)
    return ""


def parse_listening_part(html, soup, part_num, explicit_qids):
    part_el = soup.find(id=f"part-{part_num}")
    if part_el is None:
        return None

    blocks = []
    for q in part_el.select(".question"):
        b, meta = parse_listening_block(q, explicit_qids)
        if b is not None:
            blocks.append(b)
    if not blocks:
        return None

    start = min(b["start"] for b in blocks)
    end = max(b["end"] for b in blocks)

    return {
        "question": {"test_question": blocks},
        "text": {"test_text": {"answer_key_range": [start, end]}},
        "answers": {},
    }


def block_range(q):
    """data-q-start/end yoki input id yoki prompt dan range aniqlash."""
    s = q.get("data-q-start")
    e = q.get("data-q-end")
    if s and e:
        return int(s), int(e)
    qids = []
    for inp in q.find_all("input"):
        iid = inp.get("id")
        m = re.match(r"q(\d+)", iid or "")
        if m:
            qids.append(int(m.group(1)))
    if qids:
        return min(qids), max(qids)
    # checkbox name="q11-12"
    for inp in q.find_all("input"):
        nm = inp.get("name")
        m = re.match(r"q(\d+)\s*-\s*(\d+)", nm or "")
        if m:
            return int(m.group(1)), int(m.group(2))
    # prompt: Questions 1-10 / Questions 11 and 12
    pr = q.select_one(".question-prompt")
    if pr:
        txt = clean(pr.get_text(" ", strip=True))
        m = re.search(r"Questions?\s+(\d+)\s*[-–]\s*(\d+)", txt)
        if m:
            return int(m.group(1)), int(m.group(2))
        m = re.search(r"Questions?\s+(\d+)\s+and\s+(\d+)", txt)
        if m:
            return int(m.group(1)), int(m.group(2))
        m = re.search(r"Questions?\s+(\d+)", txt)
        if m:
            return int(m.group(1)), int(m.group(1))
    return None, None


def parse_listening_block(q, explicit_qids):
    prompt = q.select_one(".question-prompt")
    start, end = block_range(q)

    # 1. single-choice / mcq-item → option-abc
    items = []
    sc_container = q.select_one(".single-choice-container")
    if sc_container is not None:
        for sc in sc_container.select(".single-choice"):
            p = sc.find("p")
            title = clean(p.get_text(" ", strip=True)) if p else ""
            title = re.sub(r"^\d+\s+", "", title)
            options = []
            for lab in sc.select("label"):
                options.append(clean(lab.get_text(" ", strip=True)))
            items.append({"title": title, "options": options})
        if items:
            return (
                {
                    "type": "option-abc",
                    "start": start,
                    "end": start + len(items) - 1,
                    "desc": {},
                    "body": {"items": items},
                },
                None,
            )

    # 2. checkbox-group
    cg = q.select_one(".checkbox-group")
    if cg is not None:
        gt = cg.select_one(".group-title")
        title = clean(gt.get_text(" ", strip=True)) if gt else ""
        title = re.sub(r"^\d+[-–]\d+\s+", "", title)
        options = []
        for lab in cg.select("label"):
            t = clean(lab.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)
        nq = end - start + 1
        return (
            {
                "type": "checkbox",
                "start": start,
                "end": end,
                "desc": {
                    "optionRange": ["A", chr(64 + len(options))],
                    "quantity": nq,
                },
                "body": {"title": title, "options": options},
            },
            None,
        )

    # 3. mcq-item (no container)
    mcq_items = q.select(".mcq-item")
    if mcq_items:
        for mi in mcq_items:
            p = mi.find("p")
            title = clean(p.get_text(" ", strip=True)) if p else ""
            title = re.sub(r"^\d+\.\s+", "", title)
            options = []
            for opt in mi.select(".multi-choice-option label"):
                t = clean(opt.get_text(" ", strip=True))
                t = re.sub(r"^[A-Z]\.\s*", "", t)
                options.append(t)
            items.append({"title": title, "options": options})
        if items:
            return (
                {
                    "type": "option-abc",
                    "start": start,
                    "end": start + len(items) - 1,
                    "desc": {},
                    "body": {"items": items},
                },
                None,
            )

    # 4. map-radio-table → radio-table
    mrt = q.select_one(".map-radio-table")
    if mrt is not None:
        return parse_radio_table(q, mrt)

    # 5. drag-drop / matching
    drag = q.select_one(".drag-options-container")
    drop = q.select_one(".drop-zone")
    has_arrow = "&darr;" in str(q) or "↓" in str(q) or "\u2193" in str(q)

    if drag is not None:
        options = []
        for d in drag.select(".drag-item"):
            t = clean(d.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)

        letters = [chr(65 + i) for i in range(len(options))]

        if drop is not None:
            # flow-chart
            if has_arrow:
                body_items = []
                # har bir step blok
                steps = []
                current_step = []
                for child in q.children:
                    pass
                # q ichida flow-chart divlarni topamiz
                for div in q.find_all("div"):
                    style = div.get("style", "")
                    if "border: 1px solid" in style or "border:1px solid" in style:
                        t = text_with_inputs(div, explicit_qids)
                        t = re.sub(r"^\d+\s+", "", t)
                        current_step.append(t)
                    elif "text-align: center" in style and (
                        "darr" in str(div) or "\u2193" in str(div)
                    ):
                        if current_step:
                            steps.append(current_step)
                            current_step = []
                        body_items.append("↓")
                # remaining
                body_items.extend(current_step)
                return (
                    {
                        "type": "select-flowchart-given-list",
                        "start": start,
                        "end": end,
                        "desc": {
                            "optionRange": [letters[0], letters[-1]],
                            "text": [clean(prompt.get_text(" ", strip=True))],
                            "textReadable": [
                                clean(prompt.get_text(" ", strip=True))
                            ],
                        },
                        "body": {"list": options, "items": body_items},
                    },
                    None,
                )
            else:
                # matching-question-item → select-given-list
                body_items = []
                for mi in q.select(".matching-question-item"):
                    t = text_with_inputs(mi, explicit_qids)
                    t = re.sub(r"^\d+\.?\s+", "", t)
                    body_items.append(t + " <input>")
                return (
                    {
                        "type": "select-given-list",
                        "start": start,
                        "end": end,
                        "desc": {
                            "optionRange": [letters[0], letters[-1]],
                            "text": [clean(prompt.get_text(" ", strip=True))],
                            "textReadable": [
                                clean(prompt.get_text(" ", strip=True))
                            ],
                        },
                        "body": {
                            "list": options,
                            "listTitle": "Options",
                            "items": body_items,
                        },
                    },
                    None,
                )

    # 6. people-table → input-table
    table = q.select_one("table.people-table") or q.find("table")
    if table is not None:
        return parse_input_table(q, table, explicit_qids)

    # 6b. flow-chart (↓ + border step qutilar + inline options box)
    if "↓" in str(q):
        step_boxes = []
        for div in q.find_all("div"):
            style = div.get("style", "")
            if "border: 1px solid" in style and "border-radius" in style:
                if re.search(r"<strong>\d+\.</strong>", str(div)):
                    step_boxes.append(div)
        if step_boxes:
            box = None
            for div in q.find_all("div"):
                style = div.get("style", "")
                if "border" in style and "border-radius" in style:
                    ps = [p for p in div.find_all("p") if p.find("strong")]
                    heads = [
                        clean(p.find("strong").get_text(" ", strip=True))
                        for p in ps
                    ]
                    letters = [h for h in heads if re.match(r"^[A-Z]$", h)]
                    if letters:
                        box = div
                        break
            if box is not None:
                options = []
                for p in box.find_all("p"):
                    s = p.find("strong")
                    st = clean(s.get_text(" ", strip=True)) if s else ""
                    if not re.match(r"^[A-Z]$", st):
                        continue
                    t = clean(p.get_text(" ", strip=True))
                    t = re.sub(r"^[A-Z]\s+", "", t)
                    options.append(t)
                body_items = []
                for div in step_boxes:
                    t = text_with_inputs(div, explicit_qids)
                    t = re.sub(r"^(\d+\.)\s*", "", t)
                    body_items.append(t)
                    body_items.append("↓")
                body_items.pop()
                letters = [chr(65 + i) for i in range(len(options))]
                return (
                    {
                        "type": "select-flowchart-given-list",
                        "start": start,
                        "end": end,
                        "desc": {
                            "optionRange": [letters[0], letters[-1]],
                            "text": [clean(prompt.get_text(" ", strip=True))],
                            "textReadable": [
                                clean(prompt.get_text(" ", strip=True))
                            ],
                        },
                        "body": {"list": options, "items": body_items},
                    },
                    None,
                )

    # 7. diagram (base64) — ul/notes dan oldin
    if q.find("img") and "base64" in str(q):
        return parse_diagram(q)

    # 7a. notes → input-note
    if q.select_one(".centered-title") or q.find("ul"):
        return parse_notes(q, explicit_qids)

    # 7b. border box paragraf (input-summary): <div border><p> ... <input> ... </p></div>
    border_ps = []
    for div in q.find_all("div"):
        style = div.get("style", "")
        if "border" in style and "padding" in style:
            ps = div.find_all("p")
            if len(ps) == 1 and div.find("input") and not div.find("select"):
                t = text_with_inputs(div, explicit_qids)
                border_ps.append(t)
    if border_ps:
        return (
            {
                "type": "input-summary",
                "start": start,
                "end": end,
                "desc": {"constraint": extract_constraint(prompt)},
                "body": {"title": "", "items": border_ps},
            },
            None,
        )

    # 9. inline options box (border box: <strong>A</strong> ... + savol qatorlari)
    box = None
    for div in q.find_all("div"):
        style = div.get("style", "")
        if "border" in style and "border-radius" in style:
            ps = [p for p in div.find_all("p") if p.find("strong")]
            heads = [
                clean(p.find("strong").get_text(" ", strip=True)) for p in ps
            ]
            letters = [h for h in heads if re.match(r"^[A-Z]$", h)]
            if letters:
                box = div
                break

    if box is not None:
        options = []
        for p in box.find_all("p"):
            s = p.find("strong")
            st = clean(s.get_text(" ", strip=True)) if s else ""
            if not re.match(r"^[A-Z]$", st):
                continue
            t = clean(p.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)
        body_items = []
        for p in q.find_all("p"):
            s = p.find("strong")
            if not s:
                continue
            st = clean(s.get_text(" ", strip=True))
            if re.match(r"^\d+\.$", st):
                body_items.append(text_with_inputs(p, explicit_qids))
        letters = [chr(65 + i) for i in range(len(options))]
        return (
            {
                "type": "select-given-list",
                "start": start,
                "end": end,
                "desc": {
                    "optionRange": [letters[0], letters[-1]],
                    "text": [clean(prompt.get_text(" ", strip=True))],
                    "textReadable": [clean(prompt.get_text(" ", strip=True))],
                },
                "body": {
                    "list": options,
                    "listTitle": "Options",
                    "items": body_items,
                },
            },
            None,
        )

    return None, None


def parse_radio_table(q, mrt):
    start, end = block_range(q)


    # options letters from thead th (skip first empty)
    thead = mrt.find("thead")
    letters = []
    if thead:
        for th in thead.find_all("th"):
            t = clean(th.get_text(" ", strip=True))
            if re.match(r"^[A-Z]$", t):
                letters.append(t)

    # img
    img = q.find("img")
    img_src = img.get("src") if img else ""

    # title
    title = ""
    for p in q.find_all("p"):
        if "center" in p.get("style", ""):
            title = clean(p.get_text(" ", strip=True))
            break

    items = []
    tbody = mrt.find("tbody")
    if tbody:
        qid = start
        for tr in tbody.find_all("tr"):
            td = tr.find("td")
            if td:
                t = clean(td.get_text(" ", strip=True))
                t = re.sub(r"^\d+\s+", "", t)
                items.append({"qid": qid, "text": t})
                qid += 1

    return (
        {
            "type": "radio-table",
            "start": start,
            "end": end,
            "desc": {
                "optionRange": [letters[0] if letters else "A", letters[-1] if letters else "I"],
            },
            "body": {
                "title": title,
                "img": img_src,
                "items": items,
            },
        },
        None,
    )


def parse_input_table(q, table, explicit_qids):
    start, end = block_range(q)


    rows = []
    # thead
    thead = table.find("thead")
    header = []
    if thead:
        for th in thead.find_all("th"):
            header.append(clean(th.get_text(" ", strip=True)))
    tbody = table.find("tbody") or table
    data_rows = []
    for tr in tbody.find_all("tr"):
        cells = []
        for td in tr.find_all("td"):
            cells.append(text_with_inputs(td, explicit_qids))
        data_rows.append(cells)

    if header:
        rows = [header] + data_rows
    else:
        rows = data_rows

    return (
        {
            "type": "input-table",
            "start": start,
            "end": end,
            "desc": {"constraint": extract_constraint(q.select_one(".question-prompt"))},
            "body": {"items": rows},
        },
        None,
    )


def parse_notes(q, explicit_qids):
    start, end = block_range(q)


    title = ""
    for p in q.find_all("p", class_="centered-title"):
        title = clean(p.get_text(" ", strip=True))
        break

    # ul ga ega bo'lgan guruhlar
    items = []
    current = None
    for child in q.children:
        if getattr(child, "name", None) == "p" and "center" not in child.get("style", ""):
            strong = child.find("strong")
            if strong and child.find_next_sibling("ul"):
                current = {
                    "title": clean(child.get_text(" ", strip=True)),
                    "items": [],
                }
                items.append(current)
        elif getattr(child, "name", None) == "ul":
            li_texts = [text_with_inputs(li, explicit_qids) for li in child.find_all("li")]
            if current is not None:
                current["items"].extend(li_texts)
            else:
                items.extend(li_texts)
        elif getattr(child, "name", None) == "div":
            # nested div (FULL_LISTENING)
            for p in child.find_all("p"):
                if p.get("class") and "centered-title" in p.get("class"):
                    if not title:
                        title = clean(p.get_text(" ", strip=True))
                strong = p.find("strong")
                if strong and p.find_next_sibling("ul"):
                    current = {
                        "title": clean(p.get_text(" ", strip=True)),
                        "items": [],
                    }
                    items.append(current)
            for ul in child.find_all("ul"):
                li_texts = [text_with_inputs(li, explicit_qids) for li in ul.find_all("li")]
                if current is not None:
                    current["items"].extend(li_texts)
                else:
                    items.extend(li_texts)

    return (
        {
            "type": "input-note",
            "start": start,
            "end": end,
            "desc": {"constraint": extract_constraint(q.select_one(".question-prompt"))},
            "body": {"title": title, "items": items},
        },
        None,
    )


def parse_diagram(q):
    start, end = block_range(q)


    img = q.find("img")
    src = img.get("src") if img else ""
    series_hint = str(start)

    filename = None
    if src.startswith("data:image"):
        ext = "png"
        m = re.match(r"data:image/(\w+);base64,", src)
        if m:
            ext = m.group(1)
        base64_data = re.sub(r"^data:image/\w+;base64,", "", src)
        filename = f"mock_diagram_{start}_{end}.{ext}"
        path = os.path.join(IMG, filename)
        import base64 as b64

        with open(path, "wb") as f:
            f.write(b64.b64decode(base64_data))
    else:
        filename = src

    # options letters
    letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
    # items: input bor li qatorlari (options box li'siz)
    items = []
    for li in q.find_all("li"):
        if not li.find("input"):
            continue
        t = clean(li.get_text(" ", strip=True))
        t = re.sub(r"^\d+\s+", "", t)
        if t:
            items.append(t)
    # agar li bo'lmasa, input bor p qatorlar
    if not items:
        for p in q.find_all("p"):
            if p.find("input"):
                t = clean(p.get_text(" ", strip=True))
                t = re.sub(r"^\d+\.?\s*", "", t)
                items.append(t)

    option_range = ["A", letters[min(len(items) - 1, 9)]] if items else ["A", "I"]

    return (
        {
            "type": "select-given-diagram",
            "start": start,
            "end": end,
            "desc": {"optionRange": option_range},
            "body": {
                "img": filename,
                "desc": {"optionRange": option_range},
                "items": items,
            },
        },
        None,
    )


def build_listening_qid_map(html, soup, part_num):
    """input id → qid raqami mapini qurish."""
    m = {}
    part_el = soup.find(id=f"part-{part_num}")
    if part_el is None:
        return m
    for inp in part_el.find_all("input"):
        iid = inp.get("id")
        if iid and re.match(r"^q\d+$", iid):
            m[iid] = iid[1:]
    return m


def parse_audioscript(soup):
    """transcription-data div dan audioscript qurish."""
    td = soup.select_one(".transcription-data") or soup.find(
        id="transcription-data"
    )
    if td is None:
        return []
    out = []
    idx = 0
    for part_div in td.find_all("div", attrs={"data-part": True}):
        part_num = part_div.get("data-part")
        for br in part_div.find_all("br"):
            br.replace_with("\n")
        # q-marker spanlarni olib tashlash (highlight matni qoladi)
        for qm in part_div.find_all("span", class_="q-marker"):
            qm.decompose()
        text = part_div.get_text(" ", strip=False)
        lines = [l for l in text.split("\n") if l.strip()]
        for line in lines:
            line = line.strip()
            speaker = ""
            m = re.match(r"^([A-Za-z\s]+):\s*(.*)$", line)
            if m:
                speaker = m.group(1).strip().title()
                sentence_text = m.group(2)
            else:
                sentence_text = line
            # q-markers (already stripped by get_text, but keep)
            out.append(
                {
                    "text": sentence_text,
                    "speaker": speaker,
                    "index": idx,
                    "question_ids": [],
                }
            )
            idx += 1
    return out


def convert_listening(path, series_id):
    html = open(path, encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")

    all_answers = parse_listening_answers(html)
    audio = listening_audio_src(html)
    audioscript = parse_audioscript(soup)

    parts = {}
    for pn in range(1, 5):
        qid_map = build_listening_qid_map(html, soup, pn)
        part_el = soup.find(id=f"part-{pn}")
        if part_el is None:
            continue
        blocks = []
        for q in part_el.select(".question"):
            b, meta = parse_listening_block(q, qid_map)
            if b is not None:
                blocks.append(b)
        if not blocks:
            continue
        start = min(b["start"] for b in blocks)
        end = max(b["end"] for b in blocks)
        pkey = str(pn)
        parts[pkey] = {
            "question": {"test_question": blocks},
            "text": {
                "test_text": {
                    "audio_src": audio,
                    "mock_audio_src": "",
                    "title": "",
                    "audioscript": audioscript,
                    "audioscript_blocks": [],
                    "answer_key_range": [start, end],
                    "orphan_explain_map": {},
                }
            },
            "answers": remap_checkbox_answers(
                blocks, answers_for_range(all_answers, [start, end])
            ),
        }

    return {
        "book": f"Mock {series_id} Listening",
        "type": "listening",
        "series_id": series_id,
        "tests": {"1": {"parts": parts}},
    }


# ──────────────────────────────────────────────────────────────────────────────


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(IMG, exist_ok=True)
    for sid, files in sorted(SERIES.items()):
        for f in files:
            path = os.path.join(SRC, f)
            if not os.path.exists(path):
                print(f"SKIP missing: {f}")
                continue
            if "reading" in f.lower() or f.startswith("Reading"):
                skill = "Reading"
                data = convert_reading(path, sid)
            else:
                skill = "Listening"
                data = convert_listening(path, sid)
            outpath = os.path.join(OUT, f"MOCK_{sid}_{skill}.json")
            with open(outpath, "w", encoding="utf-8") as fh:
                json.dump(data, fh, ensure_ascii=False, indent=1)
            # summary
            test = data["tests"]["1"]
            nparts = len(test.get("parts", {}))
            nq = sum(
                len(p.get("answers", {})) for p in test.get("parts", {}).values()
            )
            print(f"{sid} {skill}: {nparts} parts, {nq} questions -> {outpath}")


if __name__ == "__main__":
    main()
