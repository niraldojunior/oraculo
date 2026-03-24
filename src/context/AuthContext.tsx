import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import type { User, Company, Department, AppRole } from '../types';
import { mockUsers, mockCompanies } from '../data/mockDb';

interface AuthContextType {
  user: User | null;
  currentCompany: Company | null;
  currentDepartment: Department | null;
  departments: Department[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchCompany: (companyId: string) => void;
  switchDepartment: (deptId: string) => void;
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
    
    // Fallback: if user is logged in, try to find their first company
    const savedUser = localStorage.getItem('oraculo_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as User;
        if (u && Array.isArray(u.associatedCompanyIds)) {
          const firstCompany = mockCompanies.find(c => u.associatedCompanyIds.includes(c.id));
          return firstCompany || mockCompanies.find(c => c.id === 'c_vtal') || mockCompanies[0];
        }
      } catch (e) {
        console.error('AuthContext: Failed to parse saved user', e);
      }
    }
    return mockCompanies.find(c => c.id === 'c_vtal') || mockCompanies[0];
  });

  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(() => {
    const saved = localStorage.getItem('oraculo_department');
    return saved ? JSON.parse(saved) : null;
  });

  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (currentCompany) {
      fetch('/api/departments')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch departments');
          return res.json();
        })
        .then(data => {
          const companyDepts = (Array.isArray(data) ? data : []).filter(d => d.companyId === currentCompany.id);
          setDepartments(companyDepts);
          
          if (!currentDepartment || currentDepartment.companyId !== currentCompany.id) {
            const firstDept = companyDepts[0] || null;
            setCurrentDepartment(firstDept);
            if (firstDept) localStorage.setItem('oraculo_department', JSON.stringify(firstDept));
          }
        })
        .catch(err => {
          console.error('AuthContext: Failed to fetch departments', err);
          // Don't crash, just set empty
          setDepartments([]);
        });
    } else {
      setDepartments([]);
      setCurrentDepartment(null);
    }
  }, [currentCompany, currentDepartment?.id]); // Added currentDepartment.id as dependency just in case, though mostly currentCompany is enough

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

  const switchDepartment = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (dept) {
      setCurrentDepartment(dept);
      localStorage.setItem('oraculo_department', JSON.stringify(dept));
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
    setCurrentDepartment(null);
    localStorage.removeItem('oraculo_user');
    localStorage.removeItem('oraculo_company');
    localStorage.removeItem('oraculo_department');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('oraculo_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      currentCompany, 
      currentDepartment, 
      departments, 
      login, 
      logout, 
      switchCompany, 
      switchDepartment,
      switchRole, 
      updateUser 
    }}>
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
