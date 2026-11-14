import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './components'
import { useI18n } from './i18n'

export default function FlashcardSession({title,onClose,children}: {title:string;onClose:()=>void;children:ReactNode}) {
  const {t}=useI18n()
  const [fullscreen,setFullscreen]=useState(()=>window.matchMedia('(max-width: 1199px)').matches)
  const dialog=useRef<HTMLDialogElement>(null)
  const toggle=useRef<HTMLButtonElement>(null)
  const wasFullscreen=useRef(false)
  useEffect(()=>{
    const node=dialog.current
    if (!node) return
    node.close()
    if (fullscreen) node.showModal()
    else {
      node.show()
      if (wasFullscreen.current) toggle.current?.focus()
    }
    wasFullscreen.current=fullscreen
    const previous=document.body.style.overflow
    if (fullscreen) document.body.style.overflow='hidden'
    return ()=>{node.close();document.body.style.overflow=previous}
  },[fullscreen])
  return <dialog ref={dialog} className={`flashcard-session${fullscreen?' fullscreen':''}`} aria-labelledby="study-deck-title"
    onCancel={event=>{event.preventDefault();setFullscreen(false)}}
    onKeyDown={event=>{
      if (!fullscreen || event.key !== 'Tab') return
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]'))
        .filter(element => element.getClientRects().length > 0)
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }}>
    <div className="session-toolbar">
      <Button variant="text" icon="back" onClick={onClose}>{t('Back to topics')}</Button>
      <button ref={toggle} type="button" className="button button--secondary" onClick={()=>setFullscreen(!fullscreen)}>
        {t(fullscreen?'Exit full screen':'Full screen')}
      </button>
    </div>
    <h2 id="study-deck-title">{title}</h2>
    <div className="study-stage">{children}</div>
  </dialog>
}
