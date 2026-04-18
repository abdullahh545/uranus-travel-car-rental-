import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ut_user')) } catch { return null }
  })

  function signIn(userData, token) {
    localStorage.setItem('ut_user',  JSON.stringify(userData))
    localStorage.setItem('ut_token', token)
    setUser(userData)
  }

  function signOut() {
    localStorage.removeItem('ut_user')
    localStorage.removeItem('ut_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
