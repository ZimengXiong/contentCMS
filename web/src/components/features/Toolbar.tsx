import { clsx } from 'clsx'
import {
  IconBold,
  IconItalic,
  IconCode,
  IconLink,
  IconImage,
  IconList,
  IconListOrdered,
  IconHeading,
  IconQuote,
  IconTable,
  IconCheckSquare,
  IconMinus,
} from '../Icons'

interface ToolbarProps {
  onInsert: (before: string, after?: string, placeholder?: string) => void
  className?: string
}

interface ToolbarButton {
  icon: React.ReactNode
  label: string
  before: string
  after?: string
  placeholder?: string
  shortcut?: string
}

const tools: ToolbarButton[] = [
  { icon: <IconBold size={16} />, label: 'Bold', before: '**', after: '**', placeholder: 'bold text', shortcut: 'Ctrl+B' },
  { icon: <IconItalic size={16} />, label: 'Italic', before: '_', after: '_', placeholder: 'italic text', shortcut: 'Ctrl+I' },
  { icon: <IconCode size={16} />, label: 'Inline Code', before: '`', after: '`', placeholder: 'code' },
  { icon: <IconLink size={16} />, label: 'Link', before: '[', after: '](url)', placeholder: 'link text', shortcut: 'Ctrl+K' },
  { icon: <IconImage size={16} />, label: 'Image', before: '![', after: '](image-url)', placeholder: 'alt text' },
  { icon: <IconHeading size={16} />, label: 'Heading', before: '## ', placeholder: 'Heading' },
  { icon: <IconList size={16} />, label: 'Bullet List', before: '- ', placeholder: 'List item' },
  { icon: <IconListOrdered size={16} />, label: 'Numbered List', before: '1. ', placeholder: 'List item' },
  { icon: <IconCheckSquare size={16} />, label: 'Task List', before: '- [ ] ', placeholder: 'Task' },
  { icon: <IconQuote size={16} />, label: 'Quote', before: '> ', placeholder: 'Quote' },
  { icon: <IconMinus size={16} />, label: 'Divider', before: '\n---\n' },
  { icon: <IconTable size={16} />, label: 'Table', before: '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n' },
]

export function Toolbar({ onInsert, className }: ToolbarProps) {
  return (
    <div className={clsx('flex items-center gap-0.5 p-1.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]', className)}>
      {tools.map((tool, i) => (
        <button
          key={i}
          onClick={() => onInsert(tool.before, tool.after, tool.placeholder)}
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  )
}
