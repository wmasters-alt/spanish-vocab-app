'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  {
    href: '/',
    label: 'Books',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
  },
  {
    href: '/master',
    label: 'Master Vocab',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = NAV.map(({ href, label, icon }) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
          active
            ? 'bg-indigo-600 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
        {label}
      </Link>
    )
  })

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-indigo-700 text-white flex items-center justify-between px-4 h-14 shadow">
        <span className="font-bold text-base tracking-tight">🇪🇸 Vocab</span>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-indigo-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-20 bg-white border-b border-slate-200 shadow-lg p-3 flex flex-col gap-1">
          {navItems}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-200 min-h-screen">
        <div className="px-6 py-5 border-b border-slate-100">
          <span className="text-xl font-bold text-indigo-700 tracking-tight">🇪🇸 Vocab</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems}
        </nav>
      </aside>
    </>
  )
}
