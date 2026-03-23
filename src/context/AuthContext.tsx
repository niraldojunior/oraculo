import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Director' | 'Manager' | 'Lead Engineer' | 'Engineer/Analyst';
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (role: User['role']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('oraculo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, password: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        let mockUser: User | null = null;
        if (email === 'diretor@vtal.com' || (email === 'niraldojunior@gmail.com' && password === '123')) {
          mockUser = { id: 'u_dir', name: 'Niraldo (Diretor)', email, role: 'Director' };
        } else if (email === 'gerente@vtal.com') {
          mockUser = { id: 'u_mgr', name: 'Ricardo (Gerente)', email, role: 'Manager' };
        } else if (email === 'lider@vtal.com') {
          mockUser = { id: 'u_lead', name: 'Roberta (Líder Técnico)', email, role: 'Lead Engineer' };
        }

        if (mockUser) {
          setUser(mockUser);
          localStorage.setItem('oraculo_user', JSON.stringify(mockUser));
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  };

  const switchUser = (role: User['role']) => {
    const names = {
      'Director': 'Niraldo (Diretor)',
      'Manager': 'Ricardo (Gerente)',
      'Lead Engineer': 'Roberta (Líder Técnico)',
      'Engineer/Analyst': 'Juliana (Engenheiro)'
    };
    const newUser: User = {
      id: `u_${role.toLowerCase().replace(' ', '_')}`,
      name: names[role],
      email: `${role.toLowerCase()}@vtal.com`,
      role
    };
    setUser(newUser);
    localStorage.setItem('oraculo_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('oraculo_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
