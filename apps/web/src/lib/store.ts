import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Workspace } from '@streamforge/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  workspace: Workspace | null;
  setAuth: (user: User, token: string, workspace?: Workspace) => void;
  setWorkspace: (workspace: Workspace) => void;
  logout: () => void;
}

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  clearWorkspace: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      workspace: null,
      setAuth: (user, token, workspace) => set({ user, token, workspace }),
      setWorkspace: (workspace) => set({ workspace }),
      logout: () => set({ user: null, token: null, workspace: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      clearWorkspace: () => set({ currentWorkspace: null }),
    }),
    {
      name: 'workspace-storage',
    }
  )
);
