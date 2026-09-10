import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'
import List from './pages/List'
import Search from './pages/Search'
import Add from './pages/Add'
import Detail from './pages/Detail'
import Settings from './pages/Settings'
import Graph from './pages/Graph'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<List />} />
          <Route path="graph" element={<Graph />} />
          <Route path="search" element={<Search />} />
          <Route path="add" element={<Add />} />
          <Route path="doc/:id" element={<Detail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
