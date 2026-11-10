// AuthContext.jsx
// Substitui o authStore do Zustand por um Context API simples.
//
// Por que Context API e não Zustand?
// - Context é nativo do React — não precisa instalar nada
// - É o padrão ensinado em cursos de React
// - Para este projeto, o estado de auth é simples: ou tem usuário, ou não tem
//
// Como usar em qualquer componente:
//   const { usuario, login, logout, atualizarUsuario } = useAuth()

import { createContext, useContext, useState } from 'react'

// Criamos o contexto. O valor inicial null não importa muito
// porque o AuthProvider vai fornecer o valor real.
const AuthContext = createContext(null)

// O AuthProvider envolve toda a aplicação (veja main.jsx).
// Qualquer componente filho consegue acessar o usuário com useAuth().
export function AuthProvider({ children }) {
  // Ao iniciar, tentamos ler o usuário salvo no localStorage.
  // O JSON.parse converte a string de volta para objeto JavaScript.
  // Se não houver nada salvo, o estado começa como null (ninguém logado).
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('hg_user')
    return salvo ? JSON.parse(salvo) : null
  })

  // Chamada após login bem-sucedido.
  // Salva o token e os dados do usuário no localStorage
  // e atualiza o estado — todos os componentes que usam useAuth()
  // vão re-renderizar automaticamente.
  function login(dadosUsuario, token) {
    localStorage.setItem('hg_token', token)
    localStorage.setItem('hg_user', JSON.stringify(dadosUsuario))
    setUsuario(dadosUsuario)
  }

  // Chamada ao clicar em "Sair".
  // Remove tudo do localStorage e zera o estado.
  function logout() {
    localStorage.removeItem('hg_token')
    localStorage.removeItem('hg_user')
    setUsuario(null)
  }

  // Chamada após editar perfil ou trocar avatar.
  // Atualiza os dados do usuário sem precisar fazer logout/login.
  function atualizarUsuario(dadosUsuario) {
    localStorage.setItem('hg_user', JSON.stringify(dadosUsuario))
    setUsuario(dadosUsuario)
  }

  // Passamos tudo para os filhos via value do Provider.
  return (
    <AuthContext.Provider value={{ usuario, login, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook customizado que simplifica o uso do contexto.
// Em vez de escrever useContext(AuthContext) em todo lugar,
// qualquer página escreve apenas: const { usuario } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
