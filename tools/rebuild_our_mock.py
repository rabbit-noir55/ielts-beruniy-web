"""
Our Mock fayllarni qayta yaratish — Cambridge formatiga 100% mos.
HTML fayillardan to'liq parse qiladi, variantlar (A/B/C) bilan.

Ishlatish:
    cd tools && python rebuild_our_mock.py
"""
import os
import re
import sys
import json
import html as html_mod
from bs4 import BeautifulSoup

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_LISTEN = os.path.join(
    os.path.dirname(TOOLS_DIR), "public", "json", "our_mock", "listening"
)
SRC_READ = os.path.join(
    os.path.dirname(TOOLS_DIR), "public", "json", "our_mock", "reading"
)

HTML_LISTEN_DIR = r"C:\Users\User\Desktop\lab\downloads\listening"
HTML_READ_DIR = r"C:\Users\User\Desktop\lab\downloads\listening\downloads\reading"

OUT_LISTEN = os.path.join(
    os.path.dirname(TOOLS_DIR), "public", "json", "our_mock", "listening"
)
OUT_READ = os.path.join(
    os.path.dirname(TOOLS_DIR), "public", "json", "our_mock", "reading"
)

MOCK_SKILLS = {
    i: ["listening", "reading"] for i in range(1, 21)
}
MOCK_SKILLS[21] = ["reading"]
MOCK_SKILLS[22] = ["reading"]


def clean(s):
    if s is None:
        return ""
    s = html_mod.unescape(str(s))
    s = s.replace("\xa0", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def input_marker():
    return "<input>"


def text_with_inputs(soup_el, explicit_qids=None, marker="<input>"):
    explicit_qids = explicit_qids or {}
    out = []
    for node in soup_el.descendants:
        if getattr(node, "name", None) == "input":
            qid = node.get("id")
            if qid and qid in explicit_qids:
                out.append(f"<input>{explicit_qids[qid]}")
            else:
                out.append(marker)
        elif isinstance(node, str):
            t = html_mod.unescape(node)
            t = t.replace("\xa0", " ")
            if t.strip():
                out.append(t)
        elif getattr(node, "name", None) in ("br",):
            out.append(" ")
    return re.sub(r"\s+", " ", "".join(out)).strip()


def extract_constraint(prompt_el):
    if prompt_el is None:
        return ""
    txt = clean(prompt_el.get_text(" ", strip=True))
    m = re.search(
        r"(NO MORE THAN .+|ONE WORD .+|TWO WORDS .+|A NUMBER|MAXIMUM .+ WORDS?)",
        txt,
        re.IGNORECASE,
    )
    return m.group(1).strip() if m else ""


def block_range(q):
    inputs = q.find_all("input")
    qids = set()
    for inp in inputs:
        nm = inp.get("name") or inp.get("id") or ""
        m = re.search(r"q(\d+)", nm)
        if m:
            qids.add(int(m.group(1)))
    if qids:
        return min(qids), max(qids)
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
    if start is None:
        return None, None

    # 1. single-choice → option-abc
    sc_container = q.select_one(".single-choice-container")
    if sc_container is not None:
        items = []
        for sc in sc_container.select(".single-choice"):
            p = sc.find("p")
            title = clean(p.get_text(" ", strip=True)) if p else ""
            title = re.sub(r"^\d+\s+", "", title)
            options = []
            for lab in sc.select("label"):
                t = clean(lab.get_text(" ", strip=True))
                t = re.sub(r"^[A-Z]\.\s*", "", t)
                options.append(t)
            items.append({"title": title, "options": options})
        if items:
            return {
                "type": "option-abc",
                "start": start,
                "end": start + len(items) - 1,
                "desc": {},
                "body": {"items": items},
            }, None

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
        nq = (end or start) - start + 1
        return {
            "type": "checkbox",
            "start": start,
            "end": end,
            "desc": {
                "optionRange": ["A", chr(64 + len(options))],
                "quantity": nq,
            },
            "body": {"title": title, "options": options},
        }, None

    # 3. mcq-item / multi-choice-question → option-abc
    mcq_items = q.select(".mcq-item, .multi-choice-question")
    if mcq_items:
        items = []
        for mi in mcq_items:
            # Title might be in a sibling <p> before this div
            title = ""
            # Try inside first
            p_prompt = mi.select_one(".question-prompt p, p")
            if p_prompt:
                title = clean(p_prompt.get_text(" ", strip=True))
                title = re.sub(r"^\d+\.?\s+", "", title)
            # If no title inside, look at previous sibling <p>
            if not title:
                prev = mi.find_previous_sibling("p")
                if prev:
                    title = clean(prev.get_text(" ", strip=True))
                    title = re.sub(r"^\d+\.?\s+", "", title)
            # Also check parent div's first <p>
            if not title and mi.parent:
                parent_p = mi.parent.find("p")
                if parent_p:
                    title = clean(parent_p.get_text(" ", strip=True))
                    title = re.sub(r"^\d+\.?\s+", "", title)
            options = []
            for opt in mi.select(".multi-choice-option label, label"):
                t = clean(opt.get_text(" ", strip=True))
                t = re.sub(r"^[A-Z]\.\s*", "", t)
                options.append(t)
            if options:
                items.append({"title": title, "options": options})
        if items:
            return {
                "type": "option-abc",
                "start": start,
                "end": start + len(items) - 1,
                "desc": {},
                "body": {"items": items},
            }, None

    # 4. map-radio-table → radio-table
    mrt = q.select_one(".map-radio-table")
    if mrt is not None:
        return parse_radio_table(q, mrt)

    # 5. drag-drop
    drag = q.select_one(".drag-options-container")
    drop = q.select_one(".drop-zone")
    has_arrow = "&darr;" in str(q) or "↓" in str(q)

    if drag is not None:
        options = []
        for d in drag.select(".drag-item"):
            t = clean(d.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)
        letters = [chr(65 + i) for i in range(len(options))]

        if drop is not None:
            if has_arrow:
                body_items = []
                steps = []
                current_step = []
                for div in q.find_all("div"):
                    style = div.get("style", "")
                    if "border: 1px solid" in style or "border:1px solid" in style:
                        t = text_with_inputs(div, explicit_qids)
                        t = re.sub(r"^\d+\s+", "", t)
                        current_step.append(t)
                    elif "text-align: center" in style and (
                        "darr" in str(div) or "↓" in str(div)
                    ):
                        if current_step:
                            steps.append(current_step)
                            current_step = []
                        body_items.append("↓")
                body_items.extend(current_step)
                return {
                    "type": "select-flowchart-given-list",
                    "start": start,
                    "end": end,
                    "desc": {
                        "optionRange": [letters[0], letters[-1]],
                        "text": [clean(prompt.get_text(" ", strip=True)) if prompt else ""],
                        "textReadable": [clean(prompt.get_text(" ", strip=True)) if prompt else ""],
                    },
                    "body": {"list": options, "items": body_items},
                }, None
            else:
                body_items = []
                for mi in q.select(".matching-question-item"):
                    t = text_with_inputs(mi, explicit_qids)
                    t = re.sub(r"^\d+\.?\s+", "", t)
                    body_items.append(t + " <input>")
                return {
                    "type": "select-given-list",
                    "start": start,
                    "end": end,
                    "desc": {
                        "optionRange": [letters[0], letters[-1]],
                        "text": [clean(prompt.get_text(" ", strip=True)) if prompt else ""],
                        "textReadable": [clean(prompt.get_text(" ", strip=True)) if prompt else ""],
                    },
                    "body": {
                        "list": options,
                        "listTitle": "Options",
                        "items": body_items,
                    },
                }, None

    # 6. table
    table = q.select_one("table.people-table") or q.find("table")
    if table is not None:
        return parse_input_table(q, table, explicit_qids)

    # 7. notes → input-note
    if q.select_one(".centered-title") or q.find("ul"):
        return parse_notes(q, explicit_qids)

    # 8. select element → option-abc
    sel = q.select_one("select")
    if sel:
        items = []
        name = sel.get("name", "")
        for opt in sel.select("option"):
            v = opt.get("value", "")
            t = clean(opt.get_text())
            if v and t:
                items.append({"title": f"Question {name}", "options": [t] if len(items) == 0 else items[-1].get("options", []) + [t]})
        return None, None

    # 9. fallback: input-note with <input> in body
    if q.find("input"):
        return parse_notes(q, explicit_qids)

    return None, None


def parse_radio_table(q, mrt):
    start, end = block_range(q)
    thead = mrt.find("thead")
    letters = []
    if thead:
        for th in thead.find_all("th"):
            t = clean(th.get_text(" ", strip=True))
            if re.match(r"^[A-Z]$", t):
                letters.append(t)
    img = q.find("img")
    img_src = img.get("src") if img else ""
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
    return {
        "type": "radio-table",
        "start": start,
        "end": end,
        "desc": {
            "optionRange": [letters[0] if letters else "A", letters[-1] if letters else "I"],
        },
        "body": {"title": title, "img": img_src, "items": items},
    }, None


def parse_input_table(q, table, explicit_qids):
    start, end = block_range(q)
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
    return {
        "type": "input-table",
        "start": start,
        "end": end,
        "desc": {"constraint": extract_constraint(q.select_one(".question-prompt"))},
        "body": {"items": rows},
    }, None


def parse_notes(q, explicit_qids):
    start, end = block_range(q)
    title = ""
    for p in q.find_all("p", class_="centered-title"):
        title = clean(p.get_text(" ", strip=True))
        break
    items = []
    current = None
    for child in q.children:
        if getattr(child, "name", None) == "p" and "center" not in child.get("style", ""):
            strong = child.find("strong")
            if strong and child.find_next_sibling("ul"):
                current = {"title": clean(child.get_text(" ", strip=True)), "items": []}
                items.append(current)
            elif child.find("input") or (strong and not child.find_next_sibling("ul")):
                t = text_with_inputs(child, explicit_qids)
                if t.strip():
                    if current is not None:
                        current["items"].append(t)
                    else:
                        items.append(t)
        elif getattr(child, "name", None) == "ul":
            li_texts = [text_with_inputs(li, explicit_qids) for li in child.find_all("li")]
            if current is not None:
                current["items"].extend(li_texts)
            else:
                items.extend(li_texts)
        elif getattr(child, "name", None) == "div":
            if child.get("class") and "question-prompt" in child.get("class"):
                continue
            for p in child.find_all("p"):
                if p.get("class") and "centered-title" in p.get("class"):
                    if not title:
                        title = clean(p.get_text(" ", strip=True))
                strong = p.find("strong")
                if strong and p.find_next_sibling("ul"):
                    current = {"title": clean(p.get_text(" ", strip=True)), "items": []}
                    items.append(current)
                elif p.find("input") or (strong and not p.find_next_sibling("ul")):
                    t = text_with_inputs(p, explicit_qids)
                    if t.strip():
                        if current is not None:
                            current["items"].append(t)
                        else:
                            items.append(t)
            for ul in child.find_all("ul"):
                li_texts = [text_with_inputs(li, explicit_qids) for li in ul.find_all("li")]
                if current is not None:
                    current["items"].extend(li_texts)
                else:
                    items.extend(li_texts)
    return {
        "type": "input-note",
        "start": start,
        "end": end,
        "desc": {"constraint": extract_constraint(q.select_one(".question-prompt"))},
        "body": {"title": title, "items": items},
    }, None


def build_qid_map(soup, part_num):
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
    td = soup.select_one(".transcription-data") or soup.find(id="transcription-data")
    if td is None:
        return []
    out = []
    idx = 0
    for part_div in td.find_all("div", attrs={"data-part": True}):
        for br in part_div.find_all("br"):
            br.replace_with("\n")
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
            out.append({
                "text": sentence_text,
                "speaker": speaker,
                "index": idx,
                "question_ids": [],
            })
            idx += 1
    return out


def _parse_correct_answers_js(body):
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
    body = re.sub(r"//[^\n]*", "", body)
    body = re.sub(r"['\"]?q(\d+)['\"]?(?:-\d+)?\s*:", r'"\1":', body)
    body = re.sub(r"(^|[\s,{])(\d+)\s*:", r'\1"\2":', body)
    body = re.sub(r",\s*([}\]])", r"\1", body)
    try:
        return json.loads("{" + body.replace("'", '"') + "}")
    except Exception:
        try:
            return eval("{" + body + "}")
        except Exception:
            return {}


def parse_listening_answers(html):
    answers = {}
    m = re.search(r"correctAnswers\s*=\s*\{(.*?)\};", html, re.S)
    if m:
        obj = _parse_correct_answers_js(m.group(1))
        answers = {k: normalize_answer(v) for k, v in obj.items() if isinstance(k, str) and k.isdigit()}
    ak = re.search(r'id="answer-key"[^>]*>(.*?)</div>', html, re.S)
    if ak:
        for m2 in re.finditer(r"<strong>\s*(\d+)\s*</strong>\s*:\s*([^<]+)", ak.group(1)):
            answers[m2.group(1)] = clean(m2.group(2))
    return answers


def answers_for_range(all_answers, rng):
    start, end = rng
    return {k: v for k, v in all_answers.items() if k.isdigit() and start <= int(k) <= end}


def remap_checkbox_answers(blocks, answers):
    for b in blocks:
        if b["type"] == "checkbox":
            return answers
    return answers


def listening_audio_src(html):
    m = re.search(r"audio_src\s*[:=]\s*['\"]([^'\"]+)['\"]", html)
    return clean(m.group(1)) if m else ""


def convert_listening(path, series_id):
    html = open(path, encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")
    all_answers = parse_listening_answers(html)
    audio = listening_audio_src(html)
    audioscript = parse_audioscript(soup)
    parts = {}
    for pn in range(1, 5):
        qid_map = build_qid_map(soup, pn)
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
        "book": f"Our Mock {series_id} Listening",
        "type": "listening",
        "series_id": series_id,
        "tests": {"1": {"parts": parts}},
    }


def parse_reading_block(q, explicit_qids):
    prompt = q.select_one(".question-prompt")
    start, end = block_range(q)
    if start is None:
        return None, None

    # 1. single-choice → option-abc
    sc_container = q.select_one(".single-choice-container")
    if sc_container is not None:
        items = []
        for sc in sc_container.select(".single-choice"):
            p = sc.find("p")
            title = clean(p.get_text(" ", strip=True)) if p else ""
            title = re.sub(r"^\d+\s+", "", title)
            options = []
            for lab in sc.select("label"):
                t = clean(lab.get_text(" ", strip=True))
                t = re.sub(r"^[A-Z]\.\s*", "", t)
                options.append(t)
            items.append({"title": title, "options": options})
        if items:
            return {
                "type": "option-abc",
                "start": start,
                "end": start + len(items) - 1,
                "desc": {},
                "body": {"items": items},
            }, None

    # 2. checkbox-group
    cg = q.select_one(".checkbox-group")
    if cg is not None:
        gt = cg.select_one(".group-title")
        title = clean(gt.get_text(" ", strip=True)) if gt else ""
        options = []
        for lab in cg.select("label"):
            t = clean(lab.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)
        nq = (end or start) - start + 1
        return {
            "type": "checkbox",
            "start": start,
            "end": end,
            "desc": {
                "optionRange": ["A", chr(64 + len(options))],
                "quantity": nq,
            },
            "body": {"title": title, "options": options},
        }, None

    # 3. multi-choice-question → option-abc
    mcq_items = q.select(".multi-choice-question")
    if mcq_items:
        items = []
        for mi in mcq_items:
            p_prompt = mi.select_one(".question-prompt p, p")
            title = clean(p_prompt.get_text(" ", strip=True)) if p_prompt else ""
            title = re.sub(r"^\d+\.?\s+", "", title)
            options = []
            for opt in mi.select(".multi-choice-option label, label"):
                t = clean(opt.get_text(" ", strip=True))
                t = re.sub(r"^[A-Z]\.\s*", "", t)
                options.append(t)
            if title and options:
                items.append({"title": title, "options": options})
        if items:
            return {
                "type": "option-abc",
                "start": start,
                "end": start + len(items) - 1,
                "desc": {},
                "body": {"items": items},
            }, None

    # 4. true/false (TF checkboxes) — also .tf-question
    tf_items = q.select(".true-false-option, .tf-option")
    tf_questions = q.select(".tf-question")
    if tf_questions:
        items = []
        for tfq in tf_questions:
            text_el = tfq.select_one(".tf-question-text")
            if text_el:
                t = clean(text_el.get_text(" ", strip=True))
                items.append(t)
        if items:
            body_items = []
            for i, item_text in enumerate(items):
                body_items.append({
                    "question_num": start + i,
                    "text": item_text,
                })
            return {
                "type": "tf-yn",
                "start": start,
                "end": end,
                "desc": {},
                "body": {"items": body_items},
            }, None
    if tf_items:
        items = []
        for tf in tf_items:
            label = tf.select_one("label")
            if label:
                t = clean(label.get_text(" ", strip=True))
                items.append(t)
        if items:
            body_items = []
            for i, item_text in enumerate(items):
                body_items.append({
                    "question_num": start + i,
                    "text": item_text,
                })
            return {
                "type": "tf-yn",
                "start": start,
                "end": end,
                "desc": {},
                "body": {"items": body_items},
            }, None

    # 5. drag-drop
    drag = q.select_one(".drag-options-container")
    if drag is not None:
        options = []
        for d in drag.select(".drag-item"):
            t = clean(d.get_text(" ", strip=True))
            t = re.sub(r"^[A-Z]\s+", "", t)
            options.append(t)
        letters = [chr(65 + i) for i in range(len(options))]
        body_items = []
        for mi in q.select(".matching-question-item"):
            t = text_with_inputs(mi, explicit_qids)
            t = re.sub(r"^\d+\.?\s+", "", t)
            body_items.append(t + " <input>")
        if not body_items:
            for p in q.select(".question-prompt"):
                pass
            items_text = []
            for li in q.find_all("li"):
                t = text_with_inputs(li, explicit_qids)
                if t:
                    items_text.append(t + " <input>")
            body_items = items_text
        return {
            "type": "select-given-list",
            "start": start,
            "end": end,
            "desc": {
                "optionRange": [letters[0], letters[-1]],
                "text": [clean(prompt.get_text(" ", strip=True)) if prompt else ""],
                "textReadable": [clean(prompt.get_text(" ", strip=True)) if prompt else ""],
            },
            "body": {
                "list": options,
                "listTitle": "Options",
                "items": body_items,
            },
        }, None

    # 6. table
    table = q.select_one("table.people-table") or q.find("table")
    if table is not None:
        return parse_input_table(q, table, explicit_qids)

    # 7. select element
    sel = q.select_one("select")
    if sel:
        opts = []
        for opt in sel.select("option"):
            v = opt.get("value", "")
            t = clean(opt.get_text())
            if v and t:
                opts.append(t)
        name = sel.get("name", "")
        if opts:
            return {
                "type": "option-abc",
                "start": start,
                "end": end,
                "desc": {},
                "body": {
                    "items": [{"title": f"Question {name}", "options": opts}]
                },
            }, None

    # 8. notes → input-note
    if q.select_one(".centered-title") or q.find("ul"):
        return parse_notes(q, explicit_qids)

    # 9. fallback
    if q.find("input"):
        return parse_notes(q, explicit_qids)

    return None, None


def parse_reading_answers(html):
    answers = {}
    m = re.search(r"correctAnswers\s*=\s*\{(.*?)\};", html, re.S)
    if m:
        obj = _parse_correct_answers_js(m.group(1))
        answers = {k: normalize_answer(v) for k, v in obj.items() if isinstance(k, str) and k.isdigit()}
    ak = re.search(r'id="answer-key"[^>]*>(.*?)</div>', html, re.S)
    if ak:
        for m2 in re.finditer(r"<strong>\s*(\d+)\s*</strong>\s*:\s*([^<]+)", ak.group(1)):
            answers[m2.group(1)] = clean(m2.group(2))
    return answers


def extract_reading_passages(soup):
    passages = []
    for rp in soup.select(".reading-passage"):
        paragraphs = []
        for para_el in rp.select("p, div.reading-paragraph, div"):
            text = clean(para_el.get_text(" ", strip=True))
            if not text or len(text) < 20:
                continue
            words = text.split()
            sentence_items = []
            for i, w in enumerate(words):
                sentence_items.append({"type": "word", "span": w})
                if i < len(words) - 1:
                    sentence_items.append({"type": "", "span": " "})
            paragraphs.append({
                "items": [{
                    "sentence_raw": text,
                    "items": sentence_items,
                }]
            })
        if not paragraphs:
            full_text = clean(rp.get_text(" ", strip=True))
            if full_text:
                for para_text in full_text.split("\n"):
                    para_text = para_text.strip()
                    if not para_text or len(para_text) < 20:
                        continue
                    words = para_text.split()
                    sentence_items = []
                    for i, w in enumerate(words):
                        sentence_items.append({"type": "word", "span": w})
                        if i < len(words) - 1:
                            sentence_items.append({"type": "", "span": " "})
                    paragraphs.append({
                        "items": [{
                            "sentence_raw": para_text,
                            "items": sentence_items,
                        }]
                    })
        if not paragraphs:
            paragraphs.append({"items": [{"sentence_raw": "", "items": []}]})
        passages.append({"sections": paragraphs})
    return passages


def build_reading_qid_map(soup):
    m = {}
    for inp in soup.find_all("input"):
        iid = inp.get("id")
        if iid and re.match(r"^q\d+$", iid):
            m[iid] = iid[1:]
    return m


def convert_reading(path, series_id):
    html = open(path, encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")
    all_answers = parse_reading_answers(html)
    passages = extract_reading_passages(soup)
    qid_map = build_reading_qid_map(soup)

    question_sets = soup.select(".question-set")
    if not question_sets:
        question_sets = [soup]

    parts = {}
    part_num = 1
    for qs in question_sets:
        blocks = []
        for q in qs.select(".question"):
            b, meta = parse_reading_block(q, qid_map)
            if b is not None:
                blocks.append(b)
        if not blocks:
            continue
        start = min(b["start"] for b in blocks)
        end = max(b["end"] for b in blocks)
        pkey = str(part_num)
        passage_data = passages[part_num - 1] if part_num <= len(passages) else passages[0] if passages else {"sections": []}
        parts[pkey] = {
            "question": {"test_question": blocks},
            "text": {
                "test_text": {
                    "audio_src": "",
                    "mock_audio_src": "",
                    "title": "",
                    "article": passage_data,
                    "answer_key_range": [start, end],
                }
            },
            "answers": {k: v for k, v in all_answers.items() if k.isdigit() and start <= int(k) <= end},
        }
        part_num += 1

    if not parts and passages:
        parts["1"] = {
            "question": {"test_question": []},
            "text": {
                "test_text": {
                    "audio_src": "",
                    "mock_audio_src": "",
                    "title": "",
                    "article": passages[0],
                    "answer_key_range": [1, 13],
                }
            },
            "answers": all_answers,
        }

    return {
        "book": f"Our Mock {series_id} Reading",
        "type": "reading",
        "series_id": series_id,
        "tests": {"1": {"parts": parts}},
    }


def get_series_id_from_filename(filename):
    m = re.search(r"(\d{4,5})", filename)
    return int(m.group(1)) if m else 0


def extract_correct_answers(html, prefix="correctAnswers"):
    m = re.search(prefix + r"\s*=\s*\{(.*?)\};", html, re.S)
    if not m:
        return {}
    body = m.group(1)
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
    body = re.sub(r"//[^\n]*", "", body)
    body = re.sub(r"([,{]\s*)q(\d+)\s*:", r'\1"\2":', body)
    body = re.sub(r"(^\s*|[,{]\s*)['\"]?(\d+)['\"]?\s*:", r'\1"\2":', body)
    body = re.sub(r"'([^'\n]*)'", r'"\1"', body)
    body = re.sub(r",\s*([}\]])", r"\1", body)
    try:
        obj = json.loads("{" + body + "}")
    except Exception:
        obj = {}
        for m2 in re.finditer(
            r'["\']?q?(\d+)["\']?\s*:\s*("(?:[^"\\]|\\.)*"|\[[^\]]*\]|[^,\n}]+)',
            body,
        ):
            k = m2.group(1)
            v = m2.group(2).strip()
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


def normalize_answer(v):
    if isinstance(v, list):
        return "|".join(str(x) for x in v)
    return str(v).strip().upper()


def find_html_file(series_id, html_dir, skill):
    sid = str(series_id)
    for f in os.listdir(html_dir):
        fl = f.lower()
        if sid in fl and fl.endswith('.html') and 'reading' not in fl:
            return os.path.join(html_dir, f)
    return None


def find_html_file_reading(series_id, html_dir):
    sid = str(series_id)
    for f in os.listdir(html_dir):
        fl = f.lower()
        if sid in fl and fl.endswith('.html'):
            return os.path.join(html_dir, f)
    return None


def get_mock_series_ids_from_existing(mock_num, skill):
    if skill == "listening":
        pattern = f"IELTS_Listening_Mock_{mock_num:02d}.json"
        fp = os.path.join(SRC_LISTEN, pattern)
    else:
        pattern = f"IELTS_Reading_Mock_{mock_num:02d}.json"
        fp = os.path.join(SRC_READ, pattern)

    if os.path.exists(fp):
        with open(fp, encoding="utf-8") as f:
            d = json.load(f)
        return d.get("series_id", 0)
    return 0


def main():
    os.makedirs(OUT_LISTEN, exist_ok=True)
    os.makedirs(OUT_READ, exist_ok=True)

    print("=" * 60)
    print("OUR MOCK QAYTA YARATISH — CAMBRIDGE FORMAT")
    print("=" * 60)

    for mock_num in range(1, 23):
        skills = MOCK_SKILLS.get(mock_num, [])
        for skill in skills:
            series_id = get_mock_series_ids_from_existing(mock_num, skill)

            if skill == "listening":
                html_file = find_html_file(series_id, HTML_LISTEN_DIR, "Listening")
            else:
                html_file = find_html_file_reading(series_id, HTML_READ_DIR)

            if html_file is None:
                print(f"  SKIP Mock {mock_num} {skill}: no HTML for series_id={series_id}")
                continue

            if skill == "listening":
                data = convert_listening(html_file, series_id)
                out_path = os.path.join(OUT_LISTEN, f"IELTS_Listening_Mock_{mock_num:02d}.json")
            else:
                data = convert_reading(html_file, series_id)
                out_path = os.path.join(OUT_READ, f"IELTS_Reading_Mock_{mock_num:02d}.json")

            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            test = data["tests"]["1"]
            nparts = len(test.get("parts", {}))
            nq = sum(len(p.get("answers", {})) for p in test.get("parts", {}).values())
            types = []
            for p in test.get("parts", {}).values():
                for q in p.get("question", {}).get("test_question", []):
                    types.append(q.get("type"))
            print(f"  Mock {mock_num:02d} {skill}: {nparts} parts, {nq} answers, types={types}")

    print()
    print("DONE!")


if __name__ == "__main__":
    main()
