import { Modal } from '../ui/Modal'

interface KeyboardShortcutsProps {
  open: boolean
  onClose: () => void
}

const shortcuts = [
  { category: 'File', items: [
    { keys: ['Ctrl', 'S'], action: 'Save document' },
    { keys: ['Ctrl', 'Shift', 'S'], action: 'Save and deploy' },
  ]},
  { category: 'Editor', items: [
    { keys: ['Ctrl', 'B'], action: 'Bold text' },
    { keys: ['Ctrl', 'I'], action: 'Italic text' },
    { keys: ['Ctrl', 'K'], action: 'Insert link' },
    { keys: ['Ctrl', 'Z'], action: 'Undo' },
    { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
    { keys: ['Ctrl', '/'], action: 'Toggle comment' },
  ]},
  { category: 'View', items: [
    { keys: ['Ctrl', 'E'], action: 'Toggle preview' },
    { keys: ['Ctrl', 'Shift', 'F'], action: 'Toggle files panel' },
    { keys: ['Ctrl', 'Shift', 'M'], action: 'Toggle fullscreen' },
    { keys: ['Escape'], action: 'Exit fullscreen' },
  ]},
  { category: 'Navigation', items: [
    { keys: ['Ctrl', 'Home'], action: 'Go to beginning' },
    { keys: ['Ctrl', 'End'], action: 'Go to end' },
    { keys: ['Ctrl', 'G'], action: 'Go to line' },
    { keys: ['Ctrl', 'F'], action: 'Find in document' },
  ]},
]

export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts">
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
              {section.category}
            </h4>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-[var(--text-secondary)]">{item.action}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((key, j) => (
                      <span key={j}>
                        <kbd className="px-2 py-1 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] rounded text-[var(--text-primary)]">
                          {key}
                        </kbd>
                        {j < item.keys.length - 1 && <span className="mx-0.5 text-[var(--text-muted)]">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
