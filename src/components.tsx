import { useI18n, type MessageKey } from "./i18n"
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react"

export type IconName = "arrow" | "audio" | "back" | "book" | "bookmark" | "check" | "chevronDown" | "chevronRight" | "chevronUp" | "close" | "copy" | "edit" | "export" | "grid" | "history" | "import" | "info" | "more" | "palette" | "practice" | "retry" | "search" | "settings" | "spark" | "swap" | "translate" | "trash" | "warning"

export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M14 6l6 6-6 6" />
      </>
    ),
    audio: (
      <>
        <path d="M5 10v4h4l5 4V6L9 10H5Z" />
        <path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
      </>
    ),
    back: (
      <>
        <path d="m10 5-7 7 7 7M3 12h18" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22.5v-17Z" />
        <path d="M4 19a3 3 0 0 1 3-3h13" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    check: <path d="m4 12 5 5L20 6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronRight: <path d="m9 6 6 6-6 6" />,
    chevronUp: <path d="m6 15 6-6 6 6" />,
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
      </>
    ),
    edit: (
      <>
        <path d="m14 5 5 5M4 20l4-1 11-11-4-4L4 15v5Z" />
      </>
    ),
    export: (
      <>
        <path d="M12 3v12M7 8l5-5 5 5" />
        <path d="M5 13v7h14v-7" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    import: (
      <>
        <path d="M12 15V3M7 10l5 5 5-5" />
        <path d="M5 13v7h14v-7" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3a9 9 0 0 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h5a3 3 0 0 0 3-3c0-4-4-7-9-7Z" />
        <circle cx="7.5" cy="10" r=".8" fill="currentColor" />
        <circle cx="10" cy="6.5" r=".8" fill="currentColor" />
        <circle cx="15" cy="7" r=".8" fill="currentColor" />
      </>
    ),
    practice: (
      <>
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6M9 12h2M14 12h1M9 16h6" />
      </>
    ),
    retry: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M19 12a7 7 0 1 0-1 6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2.3-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2.3.7v3l2.3.7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2.3h3l.7-2.3 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7 2.3-.7Z"
          transform="translate(2)"
        />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
      </>
    ),
    swap: (
      <>
        <path d="M4 8h14l-3-3M20 16H6l3 3" />
      </>
    ),
    translate: (
      <>
        <path d="M4 5h10M9 3v2c0 5-2 8-6 10M5 10c2 3 4 4 7 5" />
        <path d="m14 20 4-10 4 10M15.5 17h5" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 3h6l1 4H8l1-4ZM7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </>
    ),
    warning: (
      <>
        <path d="M12 3 2 21h20L12 3Z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),
  }
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text" | "icon"
  icon?: IconName
  label?: string
  loading?: boolean
}

export function Button({
  variant = "primary",
  icon,
  label,
  loading,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`button button--${variant} ${className}`}
      aria-label={label}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="spinner" />
      ) : icon ? (
        <Icon name={icon} />
      ) : null}
      {children && <span>{children}</span>}
    </button>
  )
}

export function IconButton({
  label,
  icon,
  ...props
}: {
  label: string
  icon: IconName
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button variant="icon" icon={icon} label={label} title={label} {...props} />
  )
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode
  tone?: "default" | "language"
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Chip({
  children,
  selected,
  disabled,
  onClick,
}: {
  children: ReactNode
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={`chip ${selected ? "selected" : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      {selected && <Icon name="check" />}
      <span>{children}</span>
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  success,
  children,
}: {
  label: string
  hint?: string
  error?: string
  success?: string
  children: ReactNode
}) {
  const helpId = useId()
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": hint || error || success ? helpId : undefined,
      })
    : children

  return (
    <label
      className={`field ${error ? "field--error" : ""} ${
        success ? "field--success" : ""
      }`}
    >
      <span className="field-label">{label}</span>
      {control}
      {(hint || error || success) && (
        <span className="field-help" id={helpId}>
          {error && <Icon name="warning" />}
          {success && <Icon name="check" />}
          {error || success || hint}
        </span>
      )}
    </label>
  )
}

export function LanguageSelect({
  label,
  value,
  options,
}: {
  label: string
  value: string
  options: MessageKey[]
}) {
  const { t } = useI18n()
  return (
    <label className="language-select">
      <span className="field-label">{label}</span>
      <select defaultValue={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="search-field">
      <span className="sr-only">{label}</span>
      <Icon name="search" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function Tabs({
  items,
  selected,
  onChange,
}: {
  items: MessageKey[]
  selected: string
  onChange: (item: string) => void
}) {
  const { t } = useI18n()

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex = index
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length
    else if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + items.length) % items.length
    else if (event.key === "Home") nextIndex = 0
    else if (event.key === "End") nextIndex = items.length - 1
    else return

    event.preventDefault()
    onChange(items[nextIndex])
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label={t("Content sections")}>
      {items.map((item, index) => (
        <button
          type="button"
          key={item}
          role="tab"
          aria-selected={selected === item}
          tabIndex={selected === item ? 0 : -1}
          onClick={() => onChange(item)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {t(item)}
        </button>
      ))}
    </div>
  )
}

export function Alert({
  tone,
  title,
  children,
}: {
  tone: "success" | "error" | "warning" | "neutral"
  title: string
  children: ReactNode
}) {
  const icon =
    tone === "success"
      ? "check"
      : tone === "error" || tone === "warning"
        ? "warning"
        : "info"
  return (
    <div
      className={`alert alert--${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon name={icon} />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  )
}

export function Progress({ value }: { value: number }) {
  const { t, percent } = useI18n()
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t("{percent} complete", { percent: percent(value / 100) })}
      aria-valuetext={t("{percent} complete", {
        percent: percent(value / 100),
      })}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

export function Skeleton() {
  const { t } = useI18n()

  return (
    <div className="skeleton" role="status" aria-live="polite">
      <span className="sr-only">{t("Loading content")}</span>
      <i />
      <i />
      <i />
      <i />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function Toast({
  open,
  onClose,
  title,
  description,
  action,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  action?: ReactNode
}) {
  const { t } = useI18n()

  if (!open) return null
  return (
    <div className="toast" role="status">
      <span className="toast-icon">
        <Icon name="check" />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {action}
      <IconButton label={t("Dismiss")} icon="close" onClick={onClose} />
    </div>
  )
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useI18n()

  const dialogRef = useRef<HTMLDivElement>(null)
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
        return
      }
      if (event.key !== "Tab" || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        ref={dialogRef}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="dialog-icon">
          <Icon name="trash" />
        </span>
        <h2 id="dialog-title">{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div>
          <Button variant="secondary" onClick={onCancel}>
            {t("Cancel")}
          </Button>
          <Button
            className={destructive ? "button--danger" : ""}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}
