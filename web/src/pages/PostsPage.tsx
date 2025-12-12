import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { fetchPosts, createPost, deletePost, updatePostMetadata } from '../api/posts'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Switch } from '../components/ui/Switch'
import { useToast } from '../components/ui/Toast'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconFileText,
  IconSearch,
  IconRefresh,
  IconGrid,
  IconList,
  IconChevronDown,
} from '../components/Icons'
import { CreatePostModal } from '../components/features/CreatePostModal'
import { formatTime } from '../utils/time'

type SortOption = 'name' | 'newest' | 'oldest'
type ViewMode = 'grid' | 'list'

export default function PostsPage() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showSortMenu, setShowSortMenu] = useState(false)

  const { data: posts, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    if (!posts) return []
    let result = [...posts]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
        result.sort((a, b) => new Date(b.modifiedAt || 0).getTime() - new Date(a.modifiedAt || 0).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.modifiedAt || 0).getTime() - new Date(b.modifiedAt || 0).getTime())
        break
    }

    return result
  }, [posts, searchQuery, sortBy])

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setCreateOpen(false)
      success('Post created successfully')
    },
    onError: () => {
      error('Failed to create post')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      success('Post deleted')
    },
    onError: () => {
      error('Failed to delete post')
    },
  })

  const updateMetadataMutation = useMutation({
    mutationFn: ({ slug, draft }: { slug: string; draft: boolean }) =>
      updatePostMetadata(slug, { draft }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      success(`Post marked as ${data.draft ? 'draft' : 'published'}`)
    },
    onError: () => {
      error('Failed to update post status')
    },
  })

  const handleDelete = (slug: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(slug)
    }
  }

  const handleRefresh = () => {
    refetch()
    success('Posts refreshed')
  }

  const sortLabels: Record<SortOption, string> = {
    name: 'Name',
    newest: 'Newest first',
    oldest: 'Oldest first',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Posts</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {posts?.length || 0} post{posts?.length === 1 ? '' : 's'}
            {searchQuery && ` (${filteredPosts.length} match${filteredPosts.length === 1 ? '' : 'es'})`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<IconPlus size={16} />}>
          New Post
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {sortLabels[sortBy]}
              <IconChevronDown size={14} className={clsx('transition-transform', showSortMenu && 'rotate-180')} />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 mt-1 py-1 w-40 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                  {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option)
                        setShowSortMenu(false)
                      }}
                      className={clsx(
                        'w-full text-left px-3 py-2 text-sm transition-colors',
                        sortBy === option
                          ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                      )}
                    >
                      {sortLabels[option]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
              title="Grid view"
            >
              <IconGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
              title="List view"
            >
              <IconList size={18} />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className={clsx(
              'p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors',
              isFetching && 'animate-spin'
            )}
            title="Refresh"
          >
            <IconRefresh size={18} />
          </button>
        </div>
      </div>

      {/* Posts Grid/List */}
      {filteredPosts.length === 0 ? (
        <Card className="text-center py-12">
          <IconFileText size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          {searchQuery ? (
            <>
              <h3 className="font-medium text-[var(--text-primary)]">No matches found</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">
                Try a different search term
              </p>
              <Button variant="secondary" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-medium text-[var(--text-primary)]">No posts yet</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">
                Create your first post to get started
              </p>
              <Button onClick={() => setCreateOpen(true)} icon={<IconPlus size={16} />}>
                New Post
              </Button>
            </>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card key={post.slug} className="group hover:border-[var(--accent)] transition-colors flex flex-col">
              <Link to={`/post/${post.slug}`} className="block flex-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent)]">
                    <IconFileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={clsx(
                          'px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full border',
                          post.draft
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-green-500/10 text-green-500 border-green-500/20'
                        )}
                      >
                        {post.draft ? 'Draft' : 'Published'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors" title={post.name}>
                      {post.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5 truncate">
                      /{post.slug}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2" title="Toggle Draft Status">
                  <Switch
                    checked={post.draft}
                    onCheckedChange={(checked) =>
                      updateMetadataMutation.mutate({ slug: post.slug, draft: checked })
                    }
                  />
                  <span className="text-xs text-[var(--text-muted)]">
                    {post.draft ? 'Draft' : 'Public'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDelete(post.slug, post.name)}
                    className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    title="Delete"
                  >
                    <IconTrash size={16} />
                  </button>
                  <Link to={`/post/${post.slug}`}>
                    <button className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-tertiary)] transition-colors">
                      <IconEdit size={16} />
                    </button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
          {filteredPosts.map((post) => (
            <div
              key={post.slug}
              className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors group"
            >
              <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent)]">
                <IconFileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to={`/post/${post.slug}`} className="hover:text-[var(--accent)] transition-colors">
                    <h3 className="font-medium text-[var(--text-primary)] truncate" title={post.name}>
                      {post.name}
                    </h3>
                  </Link>
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full border',
                      post.draft
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        : 'bg-green-500/10 text-green-500 border-green-500/20'
                    )}
                  >
                    {post.draft ? 'Draft' : 'Published'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono truncate">/{post.slug}</p>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2" title="Toggle Draft Status">
                  <Switch
                    checked={post.draft}
                    onCheckedChange={(checked) =>
                      updateMetadataMutation.mutate({ slug: post.slug, draft: checked })
                    }
                  />
                  <span className="text-xs text-[var(--text-muted)] hidden sm:block w-14">
                    {post.draft ? 'Draft' : 'Public'}
                  </span>
                </div>

                <span className="text-xs text-[var(--text-muted)] hidden sm:block w-24 text-right">
                  {post.modifiedAt ? formatTime(post.modifiedAt) : 'Unknown'}
                </span>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(post.slug, post.name)}
                    className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-primary)] transition-colors"
                    title="Delete"
                  >
                    <IconTrash size={16} />
                  </button>
                  <Link to={`/post/${post.slug}`}>
                    <button className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-colors">
                      <IconEdit size={16} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreatePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (name) => {
          await createMutation.mutateAsync(name)
        }}
      />
    </div>
  )
}
