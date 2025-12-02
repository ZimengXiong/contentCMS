import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface CreatePostModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}

export function CreatePostModal({ open, onClose, onCreate }: CreatePostModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onCreate(name.trim())
      setName('')
    } catch (err) {
      console.error('Failed to create:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName('')
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Post"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!name.trim()}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Post Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My New Post"
          autoFocus
          disabled={loading}
        />
      </form>
    </Modal>
  )
}
