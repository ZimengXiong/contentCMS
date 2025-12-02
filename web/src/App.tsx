import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import PostsPage from './pages/PostsPage'
import PostEditorPage from './pages/PostEditorPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <PostsPage /> },
      { path: '*', element: <PostsPage /> },
    ],
  },
  {
    path: '/post/:slug',
    element: <PostEditorPage />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}