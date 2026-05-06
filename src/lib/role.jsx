import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const RoleContext = createContext({ isViewer: false, userEmail: '' })

export function RoleProvider({ children }) {
  const [isViewer, setIsViewer] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata || {}
      setIsViewer(meta.role === 'viewer')
      setUserEmail(data?.user?.email || '')
    })
  }, [])

  return (
    <RoleContext.Provider value={{ isViewer, userEmail }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
