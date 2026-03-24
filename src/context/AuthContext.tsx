import React, { createContext, useContext, useState, type ReactNode } from 'react';

import type { User, Company, AppRole } from '../types';
import { mockUsers, mockCompanies } from '../data/mockDb';

interface AuthContextType {
  user: User | null;
  currentCompany: Company | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchCompany: (companyId: string) => void;
  // keep switchUser for role simulation if needed, but let's prioritize the new User type
  switchRole: (role: AppRole) => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('oraculo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => {
    const saved = localStorage.getItem('oraculo_company');
    if (saved) return JSON.parse(saved);
    // Default to V.tal if user is logged in
    const savedUser = localStorage.getItem('oraculo_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as User;
        if (u && Array.isArray(u.associatedCompanyIds)) {
          const firstCompany = mockCompanies.find(c => u.associatedCompanyIds.includes(c.id));
          return firstCompany || mockCompanies[0];
        }
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
      return mockCompanies[0];
    }
    return null;
  });

  const login = async (email: string, password: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const foundUser = mockUsers.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          setUser(foundUser);
          localStorage.setItem('oraculo_user', JSON.stringify(foundUser));
          
          const firstCompany = mockCompanies.find(c => foundUser.associatedCompanyIds.includes(c.id));
          const companyToSet = firstCompany || mockCompanies[0];
          setCurrentCompany(companyToSet);
          localStorage.setItem('oraculo_company', JSON.stringify(companyToSet));
          
          resolve(true);
        } else {
          // Fallback legacy mock login for other users if needed
          if (email === 'diretor@vtal.com' || email === 'gerente@vtal.com') {
             // ... handle legacy if really needed, but let's stick to the new requirement
             resolve(false);
          }
          resolve(false);
        }
      }, 500);
    });
  };

  const switchCompany = (companyId: string) => {
    const company = mockCompanies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('oraculo_company', JSON.stringify(company));
    }
  };

  const switchRole = (role: AppRole) => {
    const names: Record<AppRole, string> = {
      'VP': 'Vinícius (VP)',
      'Director': 'Niraldo (Diretor)',
      'Manager': 'Ricardo (Gerente)',
      'Lead Engineer': 'Roberta (Líder Técnico)',
      'Engineer/Analyst': 'Juliana (Engenheiro)'
    };
    const newUser: User = {
      id: `u_${role.toLowerCase().replace(' ', '_')}`,
      fullName: names[role],
      email: `${role.toLowerCase().replace(' ', '')}@vtal.com`,
      role,
      associatedCompanyIds: ['c_vtal', 'c_btg', 'c_nio']
    };
    setUser(newUser);
    localStorage.setItem('oraculo_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setCurrentCompany(null);
    localStorage.removeItem('oraculo_user');
    localStorage.removeItem('oraculo_company');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('oraculo_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, currentCompany, login, logout, switchCompany, switchRole, updateUser }}>
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
