import { clsx } from 'clsx'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

export const Switch = ({ checked, onCheckedChange, disabled, className, id }: SwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering parent click events (like card navigation)
        onCheckedChange(!checked);
      }}
      className={clsx(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]', // Using accent for active, tertiary for inactive
        className
      )}
    >
      <span
        className={clsx(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}
