import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from html_to_mock_json import *

def dump(fname, part, qstart):
    html = open(os.path.join('public', 'qayta_ishlash_kerak', fname), encoding='utf-8').read()
    soup = BeautifulSoup(html, 'html.parser')
    qset = soup.find(id=f'questions-{part}')
    for q in qset.select('.question'):
        if q.get('data-q-start') == str(qstart):
            print('===', fname, 'part', part, 'block', qstart, '->', q.get('data-q-end'))
            print(str(q)[:2000])
            print('---')
            return
    print('NOT FOUND', fname, part, qstart)

dump('Reading Mock Test_15.html', 2, 20)