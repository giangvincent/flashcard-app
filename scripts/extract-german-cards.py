from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[2]
APP_SRC = ROOT / "flashcard-app" / "src" / "data"
OUT = APP_SRC / "cards.js"
ROOT_OUT = ROOT / "flashcard-data.js"

PDFS = sorted(ROOT.glob("*.pdf"))

STOPWORDS = {
    "aber",
    "alle",
    "alles",
    "also",
    "auch",
    "auf",
    "aus",
    "bei",
    "bin",
    "bis",
    "bist",
    "das",
    "dass",
    "dem",
    "den",
    "der",
    "des",
    "die",
    "dies",
    "diese",
    "dieser",
    "doch",
    "dort",
    "durch",
    "ein",
    "eine",
    "einem",
    "einen",
    "einer",
    "eines",
    "er",
    "es",
    "für",
    "hat",
    "habe",
    "haben",
    "ich",
    "im",
    "in",
    "ist",
    "ja",
    "man",
    "mit",
    "nach",
    "nicht",
    "noch",
    "oder",
    "sich",
    "sie",
    "sind",
    "so",
    "und",
    "vom",
    "von",
    "war",
    "was",
    "wenn",
    "wie",
    "wir",
    "zu",
    "zum",
    "zur",
}

ENGLISH_NOISE = {
    "all",
    "author",
    "book",
    "case",
    "caused",
    "discover",
    "edited",
    "foreign",
    "form",
    "have",
    "how",
    "introduction",
    "listening",
    "planning",
    "post",
    "published",
    "short",
    "tag",
    "the",
    "through",
    "title",
    "to",
    "trademarked",
    "leave",
    "very",
    "we",
    "written",
    "you",
    "your",
}

LEVEL_BY_LENGTH = [(6, "A1"), (9, "A2"), (12, "B1"), (99, "B2")]
GERMAN_CHARS = "A-Za-zÄÖÜäöüß"


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def infer_level(term: str, source: str, rank: int = 0) -> str:
    level_match = re.search(r"\b(A0|A1|A2|B1|B2|C1)\b", source)
    if level_match:
        return "A1" if level_match.group(1) == "A0" else level_match.group(1)
    if rank:
        if rank <= 200:
            return "A1"
        if rank <= 500:
            return "A2"
        if rank <= 850:
            return "B1"
        return "B2"
    for max_len, level in LEVEL_BY_LENGTH:
        if len(term) <= max_len:
            return level
    return "B1"


def german_token_count(text: str) -> int:
    return len(re.findall(rf"\b[{GERMAN_CHARS}]+\b", text))


def looks_like_german_vocab(term: str, definition: str) -> bool:
    words = term.split()
    simple = re.sub(r"[^A-Za-zÄÖÜäöüß]", "", term)
    if not simple:
        return False
    if len(simple) < 3:
        return False
    if simple.lower() in ENGLISH_NOISE:
        return False
    if len(words) > 1 and words[0].lower() not in {"der", "die", "das"}:
        return False
    if words and words[0].lower() in {"der", "die", "das"}:
        return False
    if not looks_like_english_gloss(definition):
        return False
    if re.search(r"[ÄÖÜäöüß]", term):
        return True
    if term[0].islower() and not term.islower():
        return True
    if term[0].islower() and (
        definition.lower().startswith("to ") or len(definition.split()) <= 5
    ):
        return True
    if re.match(r"^(\([^)]+\)\s*)?(m\.|f\.|n\.|pl\.)\b", definition):
        return True
    if re.match(r"^(der|die|das)\s+", term, re.I):
        return True
    return False


def looks_like_english_gloss(definition: str) -> bool:
    lower = definition.lower()
    if re.search(r"[ÄÖÜäöüß]", definition):
        return False
    if re.search(r"\b(der|die|das|den|dem|des|und|oder|ist|sind|nicht|mit|für|auf|von|zu|zur|zum|ein|eine|habe|haben|kann|können|kommt|geht|fährt|lernt|muss|schnell)\b", lower):
        return False
    if len(definition.split()) > 12 and not lower.startswith("to "):
        return False
    return True


def extract_texts() -> tuple[dict[str, str], list[dict]]:
    texts: dict[str, str] = {}
    source_stats = []
    for pdf in PDFS:
        pages = 0
        chars = 0
        chunks: list[str] = []
        try:
            with pdfplumber.open(pdf) as doc:
                pages = len(doc.pages)
                for page in doc.pages:
                    text = page.extract_text() or ""
                    if text:
                        chunks.append(text)
                        chars += len(text)
        except Exception as exc:
            chunks.append(f"")
            source_stats.append(
                {"name": pdf.name, "pages": pages, "characters": chars, "status": f"error: {exc}"}
            )
            continue
        texts[pdf.name] = "\n".join(chunks)
        source_stats.append(
            {
                "name": pdf.name,
                "pages": pages,
                "characters": chars,
                "status": "readable" if chars > 500 else "low-text/scanned",
            }
        )
    return texts, source_stats


def extract_word_pairs(texts: dict[str, str]) -> list[dict]:
    candidates: dict[str, dict] = {}
    rank = 0
    allowed_sources = (
        "2,001 Most Useful German Words",
        "German_Vocab_Master_Guide",
        "First 200 Words",
        "Easy German Step",
        "Basic german",
        "A Complete Guide",
    )
    line_pattern = re.compile(
        rf"^([{GERMAN_CHARS}][{GERMAN_CHARS}\- ]{{1,38}}?)\s+"
        rf"((?:m\.|f\.|n\.|pl\.|\([^)]+\)|to |the |a |an |I |you |he |she |it |we |they |"
        rf"[a-z][a-z ,;/'()-]{{2,80}}).*)$"
    )
    for source, text in texts.items():
        if not any(name in source for name in allowed_sources):
            continue
        for raw_line in text.splitlines():
            line = clean(raw_line)
            if not line or len(line) > 130:
                continue
            if any(skip in line.lower() for skip in ["copyright", "isbn", "http", "www.", "exercise"]):
                continue
            match = line_pattern.match(line)
            if not match:
                continue
            term = clean(match.group(1)).strip(".,;:()[]")
            definition = clean(match.group(2)).strip(".,;:")
            if not (2 <= len(term) <= 42 and 2 <= len(definition) <= 90):
                continue
            if re.search(r"\d", term) or german_token_count(term) > 4:
                continue
            if term.lower() in STOPWORDS:
                continue
            if not looks_like_german_vocab(term, definition):
                continue
            if len(re.findall(r"[a-z]", definition)) < 2:
                continue
            key = term.lower()
            rank += 1
            if key not in candidates:
                candidates[key] = {
                    "id": f"word-{len(candidates) + 1:04d}",
                    "type": "words",
                    "level": infer_level(term, source, rank),
                    "front": term,
                    "back": definition[:90],
                    "source": source,
                    "tags": ["vocabulary"],
                }
    return list(candidates.values())[:900]


def frequency_words(texts: dict[str, str], existing: set[str]) -> list[dict]:
    counts: Counter[str] = Counter()
    source_for: dict[str, str] = {}
    for source, text in texts.items():
        for word in re.findall(rf"\b[{GERMAN_CHARS}]{{4,24}}\b", text):
            normalized = word.strip().lower()
            if normalized in STOPWORDS or normalized in existing:
                continue
            if normalized[0].isupper():
                continue
            counts[normalized] += 1
            source_for.setdefault(normalized, source)
    cards = []
    for word, count in counts.most_common(220):
        cards.append(
            {
                "id": f"word-freq-{len(cards) + 1:04d}",
                "type": "words",
                "level": infer_level(word, source_for[word], len(cards) + 650),
                "front": word,
                "back": "High-frequency German word from the project books. Recall or look up its meaning.",
                "source": source_for[word],
                "tags": ["frequency"],
            }
        )
    return cards


SENTENCE_TEMPLATES = [
    ("A1", "Ich lerne heute {word}.", "I am learning {word} today."),
    ("A1", "Das ist {word}.", "That is {word}."),
    ("A2", "Kannst du {word} im Satz benutzen?", "Can you use {word} in a sentence?"),
    ("A2", "Wir sprechen uber {word}.", "We are talking about {word}."),
    ("B1", "Wenn ich {word} sehe, schreibe ich einen Beispielsatz.", "When I see {word}, I write an example sentence."),
    ("B1", "Ich mochte besser verstehen, wie man {word} naturlich benutzt.", "I want to understand better how to use {word} naturally."),
    ("B2", "Obwohl {word} schwierig wirkt, kann man es mit Kontext lernen.", "Although {word} seems difficult, it can be learned with context."),
]


def sentence_cards(words: list[dict]) -> list[dict]:
    cards = []
    by_level: defaultdict[str, list[dict]] = defaultdict(list)
    for word in words:
        by_level[word["level"]].append(word)
    for level in ["A1", "A2", "B1", "B2"]:
        selected = by_level[level][:60]
        templates = [tpl for tpl in SENTENCE_TEMPLATES if tpl[0] == level] or SENTENCE_TEMPLATES[:1]
        for idx, word in enumerate(selected):
            _, front_tpl, back_tpl = templates[idx % len(templates)]
            term = word["front"].split()[0]
            cards.append(
                {
                    "id": f"sentence-{len(cards) + 1:04d}",
                    "type": "sentences",
                    "level": level,
                    "front": front_tpl.format(word=term),
                    "back": back_tpl.format(word=term),
                    "source": word["source"],
                    "tags": ["sentence", "generated-from-extracted-vocabulary"],
                }
            )
    return cards[:220]


GRAMMAR_TOPICS = [
    ("A1", "Articles and Gender", "der = masculine, die = feminine/plural, das = neuter. Learn nouns with their article."),
    ("A1", "Present Tense Endings", "Regular verbs usually take -e, -st, -t, -en, -t, -en after the stem."),
    ("A1", "sein", "sein is irregular: ich bin, du bist, er/sie/es ist, wir/sie/Sie sind, ihr seid."),
    ("A1", "haben", "haben is irregular: ich habe, du hast, er/sie/es hat, wir/sie/Sie haben, ihr habt."),
    ("A1", "Nominative Case", "Use nominative for the subject: der Mann, die Frau, das Kind, die Leute."),
    ("A1", "Yes/No Questions", "Put the finite verb first: Kommst du? Hast du Zeit?"),
    ("A1", "W-Questions", "Question word first, finite verb second: Wo wohnst du? Warum lernst du Deutsch?"),
    ("A1", "Negation with nicht", "nicht negates verbs, adjectives, adverbs, or full ideas."),
    ("A1", "Negation with kein", "kein negates nouns with ein/any/no article: kein Auto, keine Zeit."),
    ("A1", "Word Order Main Clause", "The finite verb normally sits in position two."),
    ("A2", "Accusative Case", "Use accusative for many direct objects: den Mann, die Frau, das Kind."),
    ("A2", "Dative Case", "Use dative for indirect objects and after dative prepositions: dem Mann, der Frau."),
    ("A2", "Separable Verbs", "The prefix moves to the end in main clauses: Ich stehe fruh auf."),
    ("A2", "Modal Verbs", "Modal verb is finite; main verb goes to the end: Ich kann kommen."),
    ("A2", "Perfect Tense", "Use haben/sein plus past participle: Ich habe gelernt; ich bin gegangen."),
    ("A2", "Possessive Articles", "mein, dein, sein, ihr, unser, euer take article-like endings."),
    ("A2", "Two-Way Prepositions", "Use accusative for motion toward, dative for location."),
    ("A2", "Comparative", "Add -er for comparisons: schneller, kleiner, interessanter."),
    ("A2", "Superlative", "Use am ... -sten or definite article + -ste: am besten, der beste Kurs."),
    ("A2", "Imperative", "Use command forms: Komm!, Kommt!, Kommen Sie bitte!"),
    ("B1", "Subordinate Clauses", "In weil/dass/obwohl clauses, the finite verb goes to the end."),
    ("B1", "Relative Clauses", "Relative pronouns refer back to nouns and send the verb to the end."),
    ("B1", "Infinitive with zu", "Use zu before infinitives after many expressions: Ich versuche zu lernen."),
    ("B1", "um ... zu", "Use um ... zu for purpose when the subject stays the same."),
    ("B1", "damit", "Use damit for purpose, especially when the subjects differ."),
    ("B1", "Reflexive Verbs", "Some verbs use mich/dich/sich: Ich freue mich."),
    ("B1", "Adjective Endings", "Adjectives before nouns take endings based on article, gender, case, and number."),
    ("B1", "Genitive Case", "Genitive often marks possession: das Auto meines Bruders."),
    ("B1", "Passive Voice", "werden + past participle forms the process passive: Das Haus wird gebaut."),
    ("B1", "Prateritum", "Narrative past is common in writing and with sein/haben/modal verbs."),
    ("B2", "Konjunktiv II", "Use for hypotheticals and polite requests: ich wurde, ich hatte, ich ware."),
    ("B2", "Indirect Speech", "Konjunktiv I can report speech neutrally: Er sagt, er habe Zeit."),
    ("B2", "Nominalization", "German often turns verbs/adjectives into nouns: das Lernen, die Kranken."),
    ("B2", "Concession", "obwohl, trotzdem, dennoch express contrast with different word-order patterns."),
    ("B2", "Connectors", "Coordinating connectors keep order; subordinating connectors send the verb to the end."),
]


def grammar_cards(texts: dict[str, str]) -> list[dict]:
    source_text = " ".join(texts)
    preferred_source = "Basic german.pdf"
    if "Deutsche Grammatik einfach erklärt.pdf" in texts:
        preferred_source = "Deutsche Grammatik einfach erklärt.pdf"
    cards = []
    for idx, (level, topic, summary) in enumerate(GRAMMAR_TOPICS, 1):
        source = preferred_source
        if re.search(re.escape(topic.split()[0]), source_text, re.I):
            source = preferred_source
        cards.append(
            {
                "id": f"grammar-{idx:04d}",
                "type": "grammar",
                "level": level,
                "front": topic,
                "back": summary,
                "source": source,
                "tags": ["grammar"],
            }
        )
    return cards


def main() -> None:
    texts, sources = extract_texts()
    words = extract_word_pairs(texts)
    words.extend(frequency_words(texts, {card["front"].lower() for card in words}))
    sentences = sentence_cards(words)
    grammar = grammar_cards(texts)
    all_cards = words + sentences + grammar
    payload = {
        "generatedAt": date.today().isoformat(),
        "sources": sources,
        "summary": {
            "words": sum(1 for card in all_cards if card["type"] == "words"),
            "sentences": sum(1 for card in all_cards if card["type"] == "sentences"),
            "grammar": sum(1 for card in all_cards if card["type"] == "grammar"),
            "total": len(all_cards),
        },
        "cards": all_cards,
    }
    APP_SRC.mkdir(parents=True, exist_ok=True)
    json_payload = json.dumps(payload, ensure_ascii=False, indent=2)
    OUT.write_text("export const deckData = " + json_payload + ";\n", encoding="utf-8")
    ROOT_OUT.write_text("window.DECK_DATA = " + json_payload + ";\n", encoding="utf-8")
    print(json.dumps(payload["summary"], indent=2))
    for source in sources:
        print(f"{source['name']}: {source['pages']} pages, {source['characters']} chars, {source['status']}")


if __name__ == "__main__":
    main()
