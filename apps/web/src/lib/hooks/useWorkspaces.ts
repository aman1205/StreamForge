import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateWorkspaceInput {
  name: string;
  slug: string;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// Get all workspaces
export const useWorkspaces = () => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await api.get<Workspace[]>('/workspaces');
      return response.data;
    },
  });
};

// Get single workspace
export const useWorkspace = (id: string) => {
  return useQuery({
    queryKey: ['workspaces', id],
    queryFn: async () => {
      const response = await api.get<Workspace>(`/workspaces/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create workspace
export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWorkspaceInput) => {
      const response = await api.post<Workspace>('/workspaces', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

// Get workspace members
export const useWorkspaceMembers = (workspaceId: string) => {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'members'],
    queryFn: async () => {
      const response = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
};
