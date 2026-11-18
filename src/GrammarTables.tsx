import { useState } from 'react'
import { useI18n, type MessageKey } from './i18n'
import { Button, Chip, GrammarTable, PageHeader } from './components'
import data from './data/grammar-tables.json'
import { filterGrammarTables, grammarTopics, isGrammarTopic, type GrammarTableData, type GrammarTopic } from './grammar-tables'

const tables = data.tables as GrammarTableData[]
const languageNames: Record<string, MessageKey> = { de: 'German', en: 'English', es: 'Spanish', fr: 'French', nl: 'Dutch' }
const topicLabels: Record<GrammarTopic, MessageKey> = {
  articles: 'Articles', pronouns: 'Personal pronouns', prepositions: 'Prepositions', aduso: 'ADUSO', adjectives: 'Adjective endings', connectors: 'Connectors',
}
const topicFromLocation = () => {
  const topic = window.location.hash.slice(1).split('/')[1] || ''
  return isGrammarTopic(topic) ? topic : ''
}

/** Prints one table: every other table is hidden by the print stylesheet until printing ends. */
function printTable(id: string) {
  const card = document.getElementById(id)
  if (!card) return
  card.dataset.printOnly = ''
  document.body.dataset.printOne = ''
  window.addEventListener('afterprint', () => { delete card.dataset.printOnly; delete document.body.dataset.printOne }, { once: true })
  window.print()
}

export default function GrammarTables() {
  const { t } = useI18n()
  const languages = [...new Set(tables.filter(table => table.reviewed).map(table => table.language))]
  const [language, setLanguage] = useState(languages[0] || '')
  const [topic, setTopic] = useState<GrammarTopic | ''>(topicFromLocation)
  const chooseTopic = (next: GrammarTopic | '') => {
    setTopic(next)
    // Keep a shareable address without triggering a view change.
    window.history.replaceState(null, '', next ? `#grammar/${next}` : '#grammar')
  }
  const shown = filterGrammarTables(tables, language, topic)
  return <main className="page grammar-page">
    <PageHeader eyebrow="" title={t('Grammar tables')} description={t('Reference tables to look up while you practise, or to print.')} />
    <div className="grammar-toolbar">
      <label className="grammar-language">
        <span className="field-label">{t('Language')}</span>
        <select value={language} onChange={event => setLanguage(event.target.value)}>
          {languages.map(code => <option key={code} value={code}>{t(languageNames[code])}</option>)}
        </select>
      </label>
      <div className="grammar-topics" role="group" aria-label={t('Topic')}>
        <Chip selected={topic === ''} onClick={() => chooseTopic('')}>{t('All topics')}</Chip>
        {grammarTopics.map(id => <Chip key={id} selected={topic === id} onClick={() => chooseTopic(id)}>{t(topicLabels[id])}</Chip>)}
      </div>
      <Button variant="secondary" icon="export" className="grammar-print-all" onClick={() => window.print()}>{t('Print shown tables')}</Button>
    </div>
    <div className="grammar-list">
      {shown.map(table => <article key={table.id} id={table.id} className="grammar-card">
        <div className="grammar-card-header">
          <div>
            <span className="eyebrow">{t(languageNames[table.language])} · {table.level} · {t(topicLabels[table.topic])}</span>
            <h2 id={`${table.id}-title`}>{t(table.title as MessageKey)}</h2>
          </div>
          <Button variant="text" icon="export" className="grammar-print" onClick={() => printTable(table.id)}>{t('Print this table')}</Button>
        </div>
        <GrammarTable columns={table.columns} rows={table.rows} labelledBy={`${table.id}-title`} lang={table.language} />
        {table.notes.length > 0 && <ul className="grammar-notes">{table.notes.map(note => <li key={note}>{t(note as MessageKey)}</li>)}</ul>}
      </article>)}
    </div>
  </main>
}
