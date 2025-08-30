# farrow-react

React Hooks and utilities for interacting with Farrow APIs in React applications.

## Overview

`farrow-react` provides a suite of React Hooks and components that enable type-safe interaction with Farrow APIs in React applications. It offers data fetching, state management, and real-time updates capabilities.

## Features

- 🎯 **Type Safety** - End-to-end TypeScript type inference
- 🔄 **Automatic Refetching** - Smart caching and update strategies
- ⚡ **Optimistic Updates** - Provide instant user feedback
- 🔌 **WebSocket Support** - Real-time data synchronization
- 📦 **Lightweight** - Minimal runtime overhead

## Installation

::: code-group

```bash [npm]
npm install farrow-react
```

```bash [yarn]
yarn add farrow-react
```

```bash [pnpm]
pnpm add farrow-react
```

:::

## Quick Start

### Setup Provider

```tsx
import { FarrowProvider } from 'farrow-react'
import { createClient } from 'farrow-react/client'

const client = createClient({
  baseURL: 'http://localhost:3000/api'
})

function App() {
  return (
    <FarrowProvider client={client}>
      <YourApp />
    </FarrowProvider>
  )
}
```

### Using Hooks

```tsx
import { useQuery, useMutation } from 'farrow-react'

function UserProfile({ userId }: { userId: number }) {
  // Query data
  const { data, loading, error } = useQuery('/users/<id:int>', {
    params: { id: userId }
  })

  // Update data
  const [updateUser, { loading: updating }] = useMutation('/users/<id:int>', {
    method: 'PUT'
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{data.name}</h1>
      <button 
        onClick={() => updateUser({ 
          params: { id: userId },
          body: { name: 'New Name' }
        })}
        disabled={updating}
      >
        Update Name
      </button>
    </div>
  )
}
```

## Core Hooks

### useQuery

Hook for fetching data.

```tsx
import { useQuery } from 'farrow-react'

function PostList() {
  const { data, loading, error, refetch } = useQuery('/posts', {
    query: { page: 1, limit: 10 },
    // Options
    enabled: true,              // Whether to enable query
    refetchInterval: 5000,      // Auto refetch interval
    refetchOnFocus: true,       // Refetch on window focus
    refetchOnReconnect: true,   // Refetch on network reconnect
    staleTime: 60000,          // Data stale time
    cacheTime: 300000,         // Cache retention time
    retry: 3,                  // Retry count
    retryDelay: 1000,         // Retry delay
    onSuccess: (data) => {
      console.log('Data loaded:', data)
    },
    onError: (error) => {
      console.error('Error:', error)
    }
  })

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && (
        <ul>
          {data.posts.map(post => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      )}
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
```

### useMutation

Hook for modifying data.

```tsx
import { useMutation } from 'farrow-react'

function CreatePost() {
  const [createPost, { data, loading, error }] = useMutation('/posts', {
    method: 'POST',
    onSuccess: (data) => {
      console.log('Post created:', data)
      // Navigate to new post
    },
    onError: (error) => {
      console.error('Failed to create post:', error)
    }
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    await createPost({
      body: {
        title: formData.get('title'),
        content: formData.get('content')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  )
}
```

### useSubscription

Hook for subscribing to real-time data.

```tsx
import { useSubscription } from 'farrow-react'

function LiveComments({ postId }: { postId: number }) {
  const { data, error, status } = useSubscription('/posts/<id:int>/comments/live', {
    params: { id: postId },
    onMessage: (comment) => {
      console.log('New comment:', comment)
    },
    onError: (error) => {
      console.error('Subscription error:', error)
    }
  })

  return (
    <div>
      <div>Status: {status}</div>
      {data && (
        <ul>
          {data.map(comment => (
            <li key={comment.id}>
              <strong>{comment.author}:</strong> {comment.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### useInfiniteQuery

Hook for infinite scroll loading.

```tsx
import { useInfiniteQuery } from 'farrow-react'

function InfinitePosts() {
  const {
    data,
    loading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteQuery('/posts', {
    query: { limit: 20 },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined
    }
  })

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map(post => (
            <article key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </article>
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

## Advanced Features

### Optimistic Updates

```tsx
import { useMutation, useQueryClient } from 'farrow-react'

function TodoItem({ todo }) {
  const queryClient = useQueryClient()
  
  const [toggleTodo] = useMutation('/todos/<id:int>/toggle', {
    method: 'PATCH',
    // Optimistic update
    onMutate: async ({ params }) => {
      // Cancel related queries
      await queryClient.cancelQueries(['/todos'])
      
      // Save current data
      const previousTodos = queryClient.getQueryData(['/todos'])
      
      // Optimistic update
      queryClient.setQueryData(['/todos'], old => {
        return old.map(t => 
          t.id === params.id 
            ? { ...t, completed: !t.completed }
            : t
        )
      })
      
      return { previousTodos }
    },
    // Error rollback
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['/todos'], context.previousTodos)
      }
    },
    // Revalidate on success
    onSettled: () => {
      queryClient.invalidateQueries(['/todos'])
    }
  })

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo({ params: { id: todo.id } })}
      />
      <span>{todo.title}</span>
    </div>
  )
}
```

### Data Prefetching

```tsx
import { useQueryClient } from 'farrow-react'

function PostLink({ postId, title }) {
  const queryClient = useQueryClient()
  
  const handleMouseEnter = () => {
    // Prefetch post details
    queryClient.prefetchQuery(['/posts/<id:int>', { id: postId }], {
      staleTime: 10000
    })
  }
  
  return (
    <Link 
      to={`/posts/${postId}`}
      onMouseEnter={handleMouseEnter}
    >
      {title}
    </Link>
  )
}
```

### Dependent Queries

```tsx
function UserPosts({ userId }) {
  // First get user
  const { data: user } = useQuery('/users/<id:int>', {
    params: { id: userId }
  })
  
  // Then get user's posts
  const { data: posts } = useQuery('/users/<id:int>/posts', {
    params: { id: userId },
    enabled: !!user,  // Only query when user data exists
    select: (data) => {
      // Transform data
      return data.posts.filter(p => p.published)
    }
  })
  
  return (
    <div>
      <h1>{user?.name}'s Posts</h1>
      {posts?.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

### Polling and Real-time Updates

```tsx
function Dashboard() {
  // Polling
  const { data: stats } = useQuery('/dashboard/stats', {
    refetchInterval: 5000,  // Update every 5 seconds
    refetchIntervalInBackground: true  // Update in background too
  })
  
  // WebSocket real-time updates
  useSubscription('/dashboard/live', {
    onMessage: (update) => {
      // Handle real-time updates
      queryClient.setQueryData(['/dashboard/stats'], old => ({
        ...old,
        ...update
      }))
    }
  })
  
  return (
    <div>
      <h1>Dashboard</h1>
      <div>Users: {stats?.userCount}</div>
      <div>Revenue: ${stats?.revenue}</div>
    </div>
  )
}
```

## Components

### Query Component

Declarative data fetching component.

```tsx
import { Query } from 'farrow-react'

function UserProfile({ userId }) {
  return (
    <Query
      path="/users/<id:int>"
      params={{ id: userId }}
      loadingComponent={<Spinner />}
      errorComponent={({ error }) => <ErrorMessage error={error} />}
    >
      {(data) => (
        <div>
          <h1>{data.name}</h1>
          <p>{data.bio}</p>
        </div>
      )}
    </Query>
  )
}
```

### Suspense Support

```tsx
import { useSuspenseQuery } from 'farrow-react'
import { Suspense } from 'react'

function UserProfileSuspense({ userId }) {
  const data = useSuspenseQuery('/users/<id:int>', {
    params: { id: userId }
  })
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.bio}</p>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfileSuspense userId={1} />
    </Suspense>
  )
}
```

## Type Safety

### Automatic Type Inference

```tsx
// API definition (server-side)
app.get('/posts/<id:int>').use((request) => {
  return Response.json({
    id: request.params.id,
    title: 'Post Title',
    content: 'Post content',
    author: {
      id: 1,
      name: 'Author'
    }
  })
})

// Client usage (automatic type inference)
function Post({ postId }: { postId: number }) {
  const { data } = useQuery('/posts/<id:int>', {
    params: { id: postId }
  })
  
  // data type is automatically inferred as:
  // {
  //   id: number
  //   title: string
  //   content: string
  //   author: {
  //     id: number
  //     name: string
  //   }
  // }
  
  return <h1>{data?.title}</h1>
}
```

### Generate Type Definitions

```typescript
// Generate types using farrow-api-codegen
import { generateTypes } from 'farrow-api-codegen'

// Generate TypeScript type definitions
generateTypes({
  input: 'http://localhost:3000/api',
  output: './src/api-types.ts'
})
```

## Cache Management

### Query Keys

```tsx
// Query keys can be strings, arrays, or objects
useQuery('/posts')
useQuery(['/posts', { page: 1 }])
useQuery({
  path: '/posts',
  filters: { published: true }
})

// Invalidate queries
queryClient.invalidateQueries(['/posts'])
queryClient.invalidateQueries({ path: '/posts' })
```

### Cache Strategies

```tsx
const { data } = useQuery('/posts', {
  staleTime: 5 * 60 * 1000,     // Consider data fresh for 5 minutes
  cacheTime: 10 * 60 * 1000,    // Remove from cache after 10 minutes
  refetchOnMount: true,          // Refetch on component mount
  refetchOnWindowFocus: false,  // Don't refetch on window focus
  keepPreviousData: true        // Keep previous data
})
```

## Error Handling

### Global Error Handling

```tsx
const client = createClient({
  baseURL: 'http://localhost:3000/api',
  onError: (error) => {
    if (error.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    } else if (error.status === 403) {
      // Show permission error
      toast.error('Permission denied')
    }
  }
})
```

### Component-level Error Boundaries

```tsx
import { ErrorBoundary } from 'farrow-react'

function App() {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <YourApp />
    </ErrorBoundary>
  )
}
```

## Testing

### Mock Client

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { createMockClient, FarrowProvider } from 'farrow-react/test'

const mockClient = createMockClient({
  '/users/<id:int>': ({ params }) => ({
    id: params.id,
    name: 'Test User'
  })
})

test('loads user data', async () => {
  const wrapper = ({ children }) => (
    <FarrowProvider client={mockClient}>
      {children}
    </FarrowProvider>
  )
  
  const { result } = renderHook(
    () => useQuery('/users/<id:int>', { params: { id: 1 } }),
    { wrapper }
  )
  
  await waitFor(() => {
    expect(result.current.data).toEqual({
      id: 1,
      name: 'Test User'
    })
  })
})
```

## Best Practices

### 1. Organize Query Keys

```typescript
// queries.ts
export const queryKeys = {
  all: ['posts'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: any) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: number) => [...queryKeys.details(), id] as const
}

// Usage
useQuery(queryKeys.detail(postId))
queryClient.invalidateQueries(queryKeys.lists())
```

### 2. Custom Hooks

```typescript
// hooks/usePosts.ts
export function usePosts(page = 1) {
  return useQuery('/posts', {
    query: { page, limit: 20 },
    keepPreviousData: true
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation('/posts', {
    method: 'POST',
    onSuccess: () => {
      queryClient.invalidateQueries(['/posts'])
    }
  })
}
```

### 3. Data Transformation

```typescript
const { data } = useQuery('/posts', {
  select: (data) => {
    // Transform and filter data
    return data.posts
      .filter(p => p.published)
      .map(p => ({
        ...p,
        formattedDate: new Date(p.createdAt).toLocaleDateString()
      }))
  }
})
```

## Related Links

- [React Documentation](https://react.dev/)
- [farrow-http Documentation](/en/ecosystem/farrow-http)
- [GitHub](https://github.com/farrowjs/farrow)