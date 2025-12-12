import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { clsx } from 'clsx'
import { fetchPostIndex, savePostIndex, uploadFile } from '../api/posts'
import { FileTree } from '../components/features/FileTree'
import { Toolbar } from '../components/features/Toolbar'
import { KeyboardShortcuts } from '../components/features/KeyboardShortcuts'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import {
    IconSave,
    IconArrowLeft,
    IconEye,
    IconMaximize,
    IconMinimize,
    IconKeyboard,
    IconClock,
    IconCheck,
    IconFolder,
    IconColumns,
    IconUpload,
} from '../components/Icons'
import { useTheme } from '../context/ThemeContext'

// Calculate reading time (average 200 words per minute)
function getReadingTime(text: string): string {
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const minutes = Math.ceil(words / 200)
    return minutes === 1 ? '1 min read' : `${minutes} min read`
}

// Get word and character counts
function getStats(text: string) {
    const chars = text.length
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const lines = text.split('\n').length
    return { chars, words, lines }
}

export default function PostEditorPage() {
    const { slug } = useParams<{ slug: string }>()
    const { theme } = useTheme()
    const { success, error } = useToast()
    const queryClient = useQueryClient()
    const editorRef = useRef<ReactCodeMirrorRef>(null)
    const previewRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Editor state
    const [content, setContent] = useState('')
    const [savedContent, setSavedContent] = useState('')
    const [showPreview, setShowPreview] = useState(true)
    const [showFiles, setShowFiles] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
    const [isDragging, setIsDragging] = useState(false)

    // Check if content has changed
    const hasUnsavedChanges = content !== savedContent

    // Load initial content
    const { data: initialContent, isLoading } = useQuery({
        queryKey: ['post-content', slug],
        queryFn: () => fetchPostIndex(slug!),
        enabled: !!slug,
    })

    useEffect(() => {
        if (initialContent !== undefined) {
            setContent(initialContent)
            setSavedContent(initialContent)
        }
    }, [initialContent])

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (newContent: string) => savePostIndex(slug!, newContent),
        onSuccess: () => {
            setSavedContent(content)
            setLastSaved(new Date())
            queryClient.invalidateQueries({ queryKey: ['post-content', slug] })
            success('Saved successfully')
        },
        onError: () => {
            error('Failed to save')
        },
    })

    const handleSave = useCallback(() => {
        if (!hasUnsavedChanges) return
        saveMutation.mutate(content)
    }, [content, hasUnsavedChanges, saveMutation])

    // Auto-save every 30 seconds if enabled
    useEffect(() => {
        if (!autoSaveEnabled || !hasUnsavedChanges) return
        const timer = setTimeout(() => {
            saveMutation.mutate(content)
        }, 30000)
        return () => clearTimeout(timer)
    }, [content, autoSaveEnabled, hasUnsavedChanges, saveMutation])

    // Keyboard shortcuts
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey

            // Save: Ctrl+S
            if (isMod && e.key === 's') {
                e.preventDefault()
                handleSave()
            }

            // Toggle preview: Ctrl+E
            if (isMod && e.key === 'e') {
                e.preventDefault()
                setShowPreview((p) => !p)
            }

            // Toggle files: Ctrl+Shift+F
            if (isMod && e.shiftKey && e.key === 'F') {
                e.preventDefault()
                setShowFiles((f) => !f)
            }

            // Toggle fullscreen: Ctrl+Shift+M
            if (isMod && e.shiftKey && e.key === 'M') {
                e.preventDefault()
                setIsFullscreen((f) => !f)
            }

            // Show shortcuts: Ctrl+/
            if (isMod && e.key === '/') {
                e.preventDefault()
                setShowShortcuts((s) => !s)
            }

            // Exit fullscreen: Escape
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false)
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [handleSave, isFullscreen])

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    // Upload mutation for drag-drop
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            await uploadFile(slug!, '', file)
            return file.name
        },
        onSuccess: (fileName) => {
            // Insert markdown for the uploaded file
            const ext = fileName.split('.').pop()?.toLowerCase()
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')
            const markdown = isImage ? `![${fileName}](${fileName})` : `[${fileName}](${fileName})`
            insertText(markdown)
            queryClient.invalidateQueries({ queryKey: ['files', slug] })
            success(`Uploaded ${fileName}`)
        },
        onError: () => {
            error('Upload failed')
        },
    })

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        files.forEach((file) => uploadMutation.mutate(file))
    }

    // Insert text helper for toolbar
    const insertText = (before: string, after = '', placeholder = '') => {
        const view = editorRef.current?.view
        if (!view) return

        const { from, to } = view.state.selection.main
        const selectedText = view.state.sliceDoc(from, to)
        const insertedText = selectedText || placeholder
        const newText = before + insertedText + after

        view.dispatch({
            changes: { from, to, insert: newText },
            selection: {
                anchor: from + before.length,
                head: from + before.length + insertedText.length,
            },
        })
        view.focus()
    }

    // Transform image URLs in markdown preview
    const transformImageUri = useCallback(
        (src: string) => {
            if (!src) return src
            // If it's already an absolute URL, return as-is
            if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
                return src
            }
            // Transform relative paths to media URLs
            return `/media/posts/${encodeURIComponent(slug!)}/${src}`
        },
        [slug]
    )

    // Stats
    const stats = useMemo(() => getStats(content), [content])
    const readingTime = useMemo(() => getReadingTime(content), [content])

    if (!slug) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-[var(--text-muted)]">Invalid post</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">Loading editor...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className={clsx(
                'flex flex-col bg-[var(--bg-primary)]',
                isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drop overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-[var(--accent)]/10 border-2 border-dashed border-[var(--accent)] flex items-center justify-center">
                    <div className="bg-[var(--bg-secondary)] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                        <IconUpload size={24} className="text-[var(--accent)]" />
                        <span className="text-lg font-medium">Drop files to upload</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        onClick={(e) => {
                            if (hasUnsavedChanges && !confirm('You have unsaved changes. Leave anyway?')) {
                                e.preventDefault()
                            }
                        }}
                    >
                        <IconArrowLeft size={18} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">{slug}</span>
                        <span className="text-xs text-[var(--text-muted)]">index.md</span>
                        {hasUnsavedChanges && (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-3 mr-3 text-xs text-[var(--text-muted)]">
                        <span>{stats.words} words</span>
                        <span>{stats.chars} chars</span>
                        <span className="flex items-center gap-1">
                            <IconClock size={12} />
                            {readingTime}
                        </span>
                    </div>

                    {/* Last saved indicator */}
                    {lastSaved && (
                        <div className="hidden sm:flex items-center gap-1 mr-2 text-xs text-[var(--success)]">
                            <IconCheck size={12} />
                            <span>Saved {lastSaved.toLocaleTimeString()}</span>
                        </div>
                    )}

                    {/* Toggle Files */}
                    <button
                        onClick={() => setShowFiles(!showFiles)}
                        className={clsx(
                            'p-1.5 rounded-lg transition-colors',
                            showFiles
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                        )}
                        title="Toggle files (Ctrl+Shift+F)"
                    >
                        <IconFolder size={18} />
                    </button>

                    {/* Toggle Preview */}
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={clsx(
                            'p-1.5 rounded-lg transition-colors',
                            showPreview
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                        )}
                        title="Toggle preview (Ctrl+E)"
                    >
                        {showPreview ? <IconColumns size={18} /> : <IconEye size={18} />}
                    </button>

                    {/* Fullscreen */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        title="Toggle fullscreen (Ctrl+Shift+M)"
                    >
                        {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                    </button>

                    {/* Keyboard shortcuts */}
                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        title="Keyboard shortcuts (Ctrl+/)"
                    >
                        <IconKeyboard size={18} />
                    </button>

                    {/* Save button */}
                    <Button
                        size="sm"
                        icon={<IconSave size={16} />}
                        onClick={handleSave}
                        loading={saveMutation.isPending}
                        disabled={!hasUnsavedChanges}
                        className="ml-1"
                    >
                        Save
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* File Tree */}
                {showFiles && (
                    <aside className="w-56 border-r border-[var(--border)] bg-[var(--bg-secondary)] overflow-y-auto shrink-0">
                        <FileTree slug={slug} onFileSelect={(path) => insertText(`![${path}](${path})`)} />
                    </aside>
                )}

                {/* Editor Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <Toolbar onInsert={insertText} />

                    {/* Editor + Preview */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Editor */}
                        <div className={clsx('overflow-hidden flex flex-col', showPreview ? 'w-1/2' : 'w-full')}>
                            <CodeMirror
                                ref={editorRef}
                                value={content}
                                height="100%"
                                theme={theme === 'dark' ? 'dark' : 'light'}
                                extensions={[markdown({ base: markdownLanguage }), EditorView.lineWrapping]}
                                onChange={setContent}
                                className="flex-1 overflow-hidden"
                                basicSetup={{
                                    lineNumbers: true,
                                    foldGutter: true,
                                    highlightActiveLine: true,
                                    highlightActiveLineGutter: true,
                                    bracketMatching: true,
                                    closeBrackets: true,
                                    autocompletion: true,
                                    rectangularSelection: true,
                                    crosshairCursor: false,
                                    highlightSelectionMatches: true,
                                    searchKeymap: true,
                                }}
                            />
                        </div>

                        {/* Preview */}
                        {showPreview && (
                            <div
                                ref={previewRef}
                                className="w-1/2 border-l border-[var(--border)] overflow-y-auto bg-[var(--bg-primary)]"
                            >
                                <div className="max-w-3xl mx-auto p-8 markdown-preview">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
                                        urlTransform={transformImageUri}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status bar */}
            <footer className="h-6 flex items-center justify-between px-4 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)] shrink-0">
                <div className="flex items-center gap-4">
                    <span>Ln {stats.lines}</span>
                    <span>{stats.words} words</span>
                    <span>{stats.chars} characters</span>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoSaveEnabled}
                            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                            className="w-3 h-3 rounded"
                        />
                        Auto-save
                    </label>
                    <span>Markdown</span>
                </div>
            </footer>

            {/* Hidden file input for manual upload */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                    if (e.target.files) {
                        Array.from(e.target.files).forEach((f) => uploadMutation.mutate(f))
                        e.target.value = ''
                    }
                }}
                className="hidden"
            />

            {/* Keyboard shortcuts modal */}
            <KeyboardShortcuts open={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </div>
    )
}
