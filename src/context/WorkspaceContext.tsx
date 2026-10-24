import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import auth from '../libs/auth';
import type { Capability, UserDataType } from '../types/auth';

export type WorkspaceType = 'user' | 'expert' | 'reviewer' | 'admin' | 'security';

interface WorkspaceContextValue {
  workspace: WorkspaceType;
  setWorkspace: (ws: WorkspaceType) => void;
  canAccessExpert: boolean;
  canAccessReviewer: boolean;
  canAccessAdmin: boolean;
  canAccessSecurity: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: 'user',
  setWorkspace: () => {},
  canAccessExpert: false,
  canAccessReviewer: false,
  canAccessAdmin: false,
  canAccessSecurity: false,
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserDataType | null>(() => auth.getUserData());
  const [capabilities, setCapabilities] = useState<Capability[]>(() => auth.getCapabilities());

  const canAccessExpert = capabilities.includes('expert_verified') || currentUser?.role === 'pakar';
  const canAccessReviewer = capabilities.some((c) =>
    ['credential_reviewer', 'cultural_reviewer'].includes(c)
  );
  const canAccessAdmin = capabilities.includes('admin') || currentUser?.role === 'admin';
  const canAccessSecurity = capabilities.includes('security_admin');

  const [workspace, setWorkspaceState] = useState<WorkspaceType>(() => {
    const saved = localStorage.getItem('active_workspace') as WorkspaceType;
    if (saved === 'admin' && canAccessAdmin) return 'admin';
    if (saved === 'expert' && canAccessExpert) return 'expert';
    if (saved === 'reviewer' && canAccessReviewer) return 'reviewer';
    if (saved === 'security' && canAccessSecurity) return 'security';
    if (saved === 'user') return 'user';
    if (canAccessAdmin) return 'admin';
    if (canAccessExpert) return 'expert';
    if (canAccessReviewer) return 'reviewer';
    return 'user';
  });

  // Dengarkan perubahan sesi autentikasi secara reaktif
  useEffect(() => {
    const handleAuthChange = () => {
      const u = auth.getUserData();
      const c = auth.getCapabilities();
      setCurrentUser(u);
      setCapabilities(c);

      const isExp = c.includes('expert_verified') || u?.role === 'pakar';
      const isRev = c.some((cap) =>
        ['credential_reviewer', 'cultural_reviewer'].includes(cap)
      );
      const isAdm = c.includes('admin') || u?.role === 'admin';

      const saved = localStorage.getItem('active_workspace') as WorkspaceType | null;
      if (isAdm && (!saved || saved === 'admin')) {
        setWorkspaceState('admin');
        localStorage.setItem('active_workspace', 'admin');
      } else if (isExp && (!saved || saved === 'expert')) {
        setWorkspaceState('expert');
        localStorage.setItem('active_workspace', 'expert');
      } else if (isRev && (!saved || saved === 'reviewer')) {
        setWorkspaceState('reviewer');
        localStorage.setItem('active_workspace', 'reviewer');
      } else if (!isExp && !isRev && !isAdm) {
        setWorkspaceState('user');
        localStorage.setItem('active_workspace', 'user');
      }
    };

    window.addEventListener('auth:session-changed', handleAuthChange);
    return () => window.removeEventListener('auth:session-changed', handleAuthChange);
  }, []);

  const setWorkspace = (ws: WorkspaceType) => {
    if (ws === 'admin' && !canAccessAdmin) return;
    if (ws === 'expert' && !canAccessExpert) return;
    if (ws === 'reviewer' && !canAccessReviewer) return;
    if (ws === 'security' && !canAccessSecurity) return;
    setWorkspaceState(ws);
    localStorage.setItem('active_workspace', ws);
  };

  useEffect(() => {
    // Pastikan fallback aman jika kapabilitas berubah
    if (workspace === 'admin' && !canAccessAdmin) {
      setWorkspaceState('user');
      localStorage.setItem('active_workspace', 'user');
    } else if (workspace === 'expert' && !canAccessExpert) {
      setWorkspaceState('user');
      localStorage.setItem('active_workspace', 'user');
    } else if (workspace === 'reviewer' && !canAccessReviewer) {
      setWorkspaceState('user');
      localStorage.setItem('active_workspace', 'user');
    }
  }, [canAccessAdmin, canAccessExpert, canAccessReviewer, workspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setWorkspace,
        canAccessExpert,
        canAccessReviewer,
        canAccessAdmin,
        canAccessSecurity,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
