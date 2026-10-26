"""Convert the supplied XLSX workbooks using Python's standard library."""
import hashlib
import json
import posixpath
from pathlib import Path
import xml.etree.ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def workbook(path):
    with ZipFile(path) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(t.text or '' for t in item.findall('.//s:t', NS))
                       for item in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        rels = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        result = {}
        for sheet in ET.fromstring(archive.read('xl/workbook.xml')).findall('s:sheets/s:sheet', NS):
            target = rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            target = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
            rows = []
            for row in ET.fromstring(archive.read(target)).findall('s:sheetData/s:row', NS):
                cells = {}
                for cell in row:
                    col = ''.join(c for c in cell.attrib['r'] if c.isalpha())
                    value = cell.find('s:v', NS)
                    text = value.text or '' if value is not None else ''.join(t.text or '' for t in cell.findall('.//s:t', NS))
                    if cell.get('t') == 's':
                        text = strings[int(text)]
                    # User responses, spreadsheet scores and formulas are never exported.
                    if cell.find('s:f', NS) is None:
                        cells[col] = text.strip()
                rows.append((int(row.attrib['r']), cells))
            result[sheet.attrib['name']] = rows
        return result


def convert():
    decks, audit, ids = [], [], set()

    def deck(id, title):
        item = {'id': id, 'title': title, 'cards': []}
        decks.append(item)
        return item

    def add(target, file, sheet, row, key, prompt, answer, detail='', translations=None):
        if not prompt.strip() or not answer.strip() or answer.strip() in ('—', '-', 'undefined', 'NaN'):
            raise ValueError(f'{file}:{sheet}:{row}: missing prompt/answer ({key})')
        identity = target['id'] + ':' + key
        card_id = target['id'] + '-' + hashlib.sha256(identity.encode()).hexdigest()[:16]
        if card_id in ids:
            raise ValueError(f'Duplicate card: {identity}')
        ids.add(card_id)
        target['cards'].append({'id': card_id, 'deckId': target['id'], 'prompt': prompt,
                               'answer': answer, 'detail': detail, 'translations': translations or {},
                               'source': {'file': file, 'sheet': sheet, 'row': row}})

    def translations(c, start):
        return {lang: c.get(col, '') for lang, col in zip(('en', 'es', 'fr'), start)}

    file = 'german_irregular_verbs_B2.xlsx'
    sheets = workbook(ROOT / 'practice' / file)
    d = deck('irregular-verbs', 'Irregular verbs')
    rows = sheets['Irregular Verbs B2']
    assert rows[0][1].get('B') == 'Infinitiv', 'Unexpected verb headers'
    for row, c in rows[1:]:
        for col, label in [('C', 'Präsens (er/sie/es)'), ('D', 'Präteritum (er/sie/es)'), ('E', 'Perfekt (er/sie/es)'), ('F', 'Partizip II')]:
            add(d, file, 'Irregular Verbs B2', row, c['B'] + ':' + col,
                c['B'] + ' — ' + label, c.get(col, ''), translations=translations(c, 'GHI'))
    audit.append({'file': file, 'sheet': 'Irregular Verbs B2', 'rows': len(rows)-1, 'cards': len(d['cards'])})

    file = 'german_vocab_health_friendship_B2.xlsx'
    for sheet, rows in workbook(ROOT / 'practice' / file).items():
        if sheet == 'Notes':
            continue
        assert rows[0][1].get('C') == 'Deutsch', 'Unexpected vocabulary headers'
        d = deck('gesundheit' if sheet.startswith('Körper') else 'freundschaft', sheet)
        for row, c in rows[1:]:
            detail = '\n'.join(v for v in (c.get('D', ''), c.get('H', '')) if v and v != '—')
            add(d, file, sheet, row, c['C'], c['C'], c.get('E', ''), detail, translations(c, 'EFG'))
        audit.append({'file': file, 'sheet': sheet, 'rows': len(rows)-1, 'cards': len(d['cards'])})

    file = 'german_temporal_connectors_B2_training.xlsx'
    sheets = workbook(ROOT / 'practice' / file)
    d = deck('temporal-connectors', 'Temporal connectors')
    for row, c in sheets['Übersicht']:
        if not c.get('A', '').isdigit():
            continue
        add(d, file, 'Übersicht', row, c['C'], c['C'], c.get('D', ''),
            '\n'.join(c.get(col, '') for col in 'HIJ'), translations(c, 'EFG'))
    audit.append({'file': file, 'sheet': 'Übersicht', 'rows': len(d['cards']), 'cards': len(d['cards'])})
    solutions = {(c['A'], c['B']): c.get('C', '') for _, c in sheets['Lösungen'] if c.get('B', '').isdigit()}
    used = set()
    for index in range(1, 6):
        sheet = f'Übung {index}'
        d = deck(f'temporal-exercise-{index}', sheets[sheet][0][1]['A'])
        for row, c in sheets[sheet]:
            if not c.get('A', '').isdigit():
                continue
            key = (sheet, c['A'])
            answer = solutions[key]
            used.add(key)
            hint = c.get('C', '') if index <= 3 else ''
            add(d, file, sheet, row, c['B'], c['B'], answer,
                'Model answer; other formulations may be valid.' if index >= 4 else hint)
        audit.append({'file': file, 'sheet': sheet, 'rows': len(d['cards']), 'cards': len(d['cards'])})
    if used != set(solutions):
        raise ValueError(f'Unmatched solutions: {set(solutions) - used}')
    return {'schemaVersion': 1, 'decks': decks}, audit


if __name__ == '__main__':
    data, audit = convert()
    (ROOT / 'src/data/study-decks.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'docs/practice-data-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
    for item in audit:
        print(f"{item['sheet']}: {item['rows']} rows → {item['cards']} cards")
