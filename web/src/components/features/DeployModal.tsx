import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface DeployModalProps {
  open: boolean
  onClose: () => void
  onDeploy: (message: string) => Promise<void>
}

export function DeployModal({ open, onClose, onDeploy }: DeployModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    try {
      await onDeploy(message.trim())
      setMessage('')
      onClose()
    } catch (err) {
      console.error('Deploy failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMessage('')
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Deploy to Production"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!message.trim()}>
            Deploy
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Commit Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Updated blog post"
          autoFocus
          disabled={loading}
        />
        <p className="text-xs text-[var(--text-muted)]">
          This will push all changes to the production repository.
        </p>
      </form>
    </Modal>
  )
}
