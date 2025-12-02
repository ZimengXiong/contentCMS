import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { fetchFileTree, uploadFile, createFolder, deleteEntry, type FileNode } from '../../api/posts'
import { IconFolder, IconFolderOpen, IconFile, IconFileText, IconImage, IconCode, IconChevronRight, IconPlus, IconUpload, IconRefresh, IconTrash } from '../Icons'

export interface FileTreeProps {
  slug: string
  onFileSelect?: (path: string) => void
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
    case 'txt':
      return <IconFileText size={16} className="text-[var(--text-muted)]" />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return <IconImage size={16} className="text-[var(--text-muted)]" />
    case 'js':
    case 'ts':
    case 'css':
    case 'html':
    case 'json':
      return <IconCode size={16} className="text-[var(--text-muted)]" />
    default:
      return <IconFile size={16} className="text-[var(--text-muted)]" />
  }
}

interface TreeNodeProps {
  node: FileNode
  slug: string
  depth: number
  onDelete: (path: string) => void
  onFileSelect?: (path: string) => void
}

function TreeNode({ node, slug, depth, onDelete, onFileSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const isDir = node.type === 'directory'

  const handleClick = () => {
    if (isDir) {
      setExpanded(!expanded)
    } else {
      // Call onFileSelect if provided, otherwise open file in new tab
      if (onFileSelect) {
        onFileSelect(node.path)
      } else {
        const url = `/media/posts/${encodeURIComponent(slug)}/${node.path}`
        window.open(url, '_blank')
      }
    }
  }

  return (
    <div>
      <div
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group',
          'hover:bg-[var(--bg-tertiary)] transition-colors'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isDir ? (
          <>
            <IconChevronRight
              size={14}
              className={clsx('text-[var(--text-muted)] transition-transform', expanded && 'rotate-90')}
            />
            {expanded ? (
              <IconFolderOpen size={16} className="text-amber-500" />
            ) : (
              <IconFolder size={16} className="text-amber-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="flex-1 truncate text-sm text-[var(--text-primary)]">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.path)
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-secondary)] transition-all"
        >
          <IconTrash size={14} />
        </button>
      </div>
      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              slug={slug}
              depth={depth + 1}
              onDelete={onDelete}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ slug, onFileSelect }: FileTreeProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)

  const { data: tree, isLoading, refetch } = useQuery({
    queryKey: ['files', slug],
    queryFn: () => fetchFileTree(slug),
  })

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      for (const file of Array.from(files)) {
        await uploadFile(slug, '', file)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', slug] })
    },
  })

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder(slug, '', name),
    onSuccess: () => {
      setNewFolderName('')
      setShowNewFolder(false)
      queryClient.invalidateQueries({ queryKey: ['files', slug] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (path: string) => deleteEntry(slug, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', slug] })
    },
  })

  const handleDelete = (path: string) => {
    if (confirm(`Delete "${path}"?`)) {
      deleteMutation.mutate(path)
    }
  }

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      uploadMutation.mutate(e.target.files)
      e.target.value = ''
    }
  }

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim())
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Files</span>
        <div className="flex gap-1">
          <button
            onClick={() => refetch()}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Refresh"
          >
            <IconRefresh size={14} />
          </button>
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="New folder"
          >
            <IconPlus size={14} />
          </button>
          <button
            onClick={handleUpload}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Upload"
          >
            <IconUpload size={14} />
          </button>
        </div>
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <form onSubmit={handleCreateFolder} className="p-2 border-b border-[var(--border)]">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            className="w-full px-2 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            autoFocus
          />
        </form>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">Loading...</p>
        ) : tree?.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">No files</p>
        ) : (
          tree?.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              slug={slug}
              depth={0}
              onDelete={handleDelete}
              onFileSelect={onFileSelect}
            />
          ))
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
