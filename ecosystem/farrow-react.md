# farrow-react

React Hooks 和工具集，用于在 React 应用中与 Farrow API 交互。

## 概述

`farrow-react` 提供了一套 React Hooks 和组件，让你能够以类型安全的方式在 React 应用中调用 Farrow API。它提供了数据获取、状态管理和实时更新等功能。

## 特性

- 🎯 **类型安全** - 端到端的 TypeScript 类型推导
- 🔄 **自动重新获取** - 智能的缓存和更新策略
- ⚡ **乐观更新** - 提供即时的用户反馈
- 🔌 **WebSocket 支持** - 实时数据同步
- 📦 **轻量级** - 最小的运行时开销

## 安装

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

## 快速开始

### 设置 Provider

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

### 使用 Hooks

```tsx
import { useQuery, useMutation } from 'farrow-react'

function UserProfile({ userId }: { userId: number }) {
  // 查询数据
  const { data, loading, error } = useQuery('/users/<id:int>', {
    params: { id: userId }
  })

  // 更新数据
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

## 核心 Hooks

### useQuery

获取数据的 Hook。

```tsx
import { useQuery } from 'farrow-react'

function PostList() {
  const { data, loading, error, refetch } = useQuery('/posts', {
    query: { page: 1, limit: 10 },
    // 选项
    enabled: true,              // 是否启用查询
    refetchInterval: 5000,      // 自动重新获取间隔
    refetchOnFocus: true,       // 窗口聚焦时重新获取
    refetchOnReconnect: true,   // 网络重连时重新获取
    staleTime: 60000,          // 数据过期时间
    cacheTime: 300000,         // 缓存保留时间
    retry: 3,                  // 重试次数
    retryDelay: 1000,         // 重试延迟
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

修改数据的 Hook。

```tsx
import { useMutation } from 'farrow-react'

function CreatePost() {
  const [createPost, { data, loading, error }] = useMutation('/posts', {
    method: 'POST',
    onSuccess: (data) => {
      console.log('Post created:', data)
      // 导航到新文章
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

订阅实时数据的 Hook。

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

无限滚动加载的 Hook。

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

## 高级特性

### 乐观更新

```tsx
import { useMutation, useQueryClient } from 'farrow-react'

function TodoItem({ todo }) {
  const queryClient = useQueryClient()
  
  const [toggleTodo] = useMutation('/todos/<id:int>/toggle', {
    method: 'PATCH',
    // 乐观更新
    onMutate: async ({ params }) => {
      // 取消相关查询
      await queryClient.cancelQueries(['/todos'])
      
      // 保存当前数据
      const previousTodos = queryClient.getQueryData(['/todos'])
      
      // 乐观更新
      queryClient.setQueryData(['/todos'], old => {
        return old.map(t => 
          t.id === params.id 
            ? { ...t, completed: !t.completed }
            : t
        )
      })
      
      return { previousTodos }
    },
    // 错误回滚
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['/todos'], context.previousTodos)
      }
    },
    // 成功后重新验证
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

### 预取数据

```tsx
import { useQueryClient } from 'farrow-react'

function PostLink({ postId, title }) {
  const queryClient = useQueryClient()
  
  const handleMouseEnter = () => {
    // 预取文章详情
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

### 依赖查询

```tsx
function UserPosts({ userId }) {
  // 先获取用户
  const { data: user } = useQuery('/users/<id:int>', {
    params: { id: userId }
  })
  
  // 然后获取用户的文章
  const { data: posts } = useQuery('/users/<id:int>/posts', {
    params: { id: userId },
    enabled: !!user,  // 只有用户数据存在时才查询
    select: (data) => {
      // 转换数据
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

### 轮询和实时更新

```tsx
function Dashboard() {
  // 轮询
  const { data: stats } = useQuery('/dashboard/stats', {
    refetchInterval: 5000,  // 每 5 秒更新
    refetchIntervalInBackground: true  // 后台也更新
  })
  
  // WebSocket 实时更新
  useSubscription('/dashboard/live', {
    onMessage: (update) => {
      // 处理实时更新
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

## 组件

### Query 组件

声明式的数据获取组件。

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

### Suspense 支持

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

## 类型安全

### 自动类型推导

```tsx
// API 定义（服务端）
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

// 客户端使用（类型自动推导）
function Post({ postId }: { postId: number }) {
  const { data } = useQuery('/posts/<id:int>', {
    params: { id: postId }
  })
  
  // data 的类型自动推导为：
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

### 生成类型定义

```typescript
// 使用 farrow-api-codegen 生成类型
import { generateTypes } from 'farrow-api-codegen'

// 生成 TypeScript 类型定义
generateTypes({
  input: 'http://localhost:3000/api',
  output: './src/api-types.ts'
})
```

## 缓存管理

### 查询键

```tsx
// 查询键可以是字符串、数组或对象
useQuery('/posts')
useQuery(['/posts', { page: 1 }])
useQuery({
  path: '/posts',
  filters: { published: true }
})

// 使查询无效
queryClient.invalidateQueries(['/posts'])
queryClient.invalidateQueries({ path: '/posts' })
```

### 缓存策略

```tsx
const { data } = useQuery('/posts', {
  staleTime: 5 * 60 * 1000,     // 5 分钟内认为数据是新鲜的
  cacheTime: 10 * 60 * 1000,    // 10 分钟后从缓存中移除
  refetchOnMount: true,          // 组件挂载时重新获取
  refetchOnWindowFocus: false,  // 窗口聚焦时不重新获取
  keepPreviousData: true        // 保留之前的数据
})
```

## 错误处理

### 全局错误处理

```tsx
const client = createClient({
  baseURL: 'http://localhost:3000/api',
  onError: (error) => {
    if (error.status === 401) {
      // 跳转到登录页
      window.location.href = '/login'
    } else if (error.status === 403) {
      // 显示权限错误
      toast.error('Permission denied')
    }
  }
})
```

### 组件级错误边界

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

## 测试

### 模拟客户端

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

## 最佳实践

### 1. 组织查询键

```typescript
// queries.ts
export const queryKeys = {
  all: ['posts'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: any) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: number) => [...queryKeys.details(), id] as const
}

// 使用
useQuery(queryKeys.detail(postId))
queryClient.invalidateQueries(queryKeys.lists())
```

### 2. 自定义 Hooks

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

### 3. 数据转换

```typescript
const { data } = useQuery('/posts', {
  select: (data) => {
    // 转换和过滤数据
    return data.posts
      .filter(p => p.published)
      .map(p => ({
        ...p,
        formattedDate: new Date(p.createdAt).toLocaleDateString()
      }))
  }
})
```

## 相关链接

- [React 文档](https://react.dev/)
- [farrow-http 文档](/ecosystem/farrow-http)
- [GitHub](https://github.com/farrowjs/farrow)