import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { IconFileText, IconRocket, IconSun, IconMoon } from '../Icons'
import { useTheme } from '../../context/ThemeContext'
import { DeployModal } from '../features/DeployModal'
import { deployToHugo } from '../../api/posts'
import { Button } from '../ui/Button'

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()
  const [deployOpen, setDeployOpen] = useState(false)

  return (
    <aside className="w-56 flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)]">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--border)]">
        <span className="font-bold text-lg text-[var(--accent)]">Content CMS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            )
          }
        >
          <IconFileText size={18} />
          Posts
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-2 border-t border-[var(--border)]">
        <Button
          variant="primary"
          className="w-full"
          icon={<IconRocket size={16} />}
          onClick={() => setDeployOpen(true)}
        >
          Deploy
        </Button>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      <DeployModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        onDeploy={deployToHugo}
      />
    </aside>
  )
}