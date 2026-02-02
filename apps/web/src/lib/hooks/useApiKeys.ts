import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface ApiKey {
  id: string;
  workspaceId: string;
  name: string;
  key?: string; // Only present on creation
  permissions: {
    topics?: string[];
    actions?: string[];
  };
  active: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface CreateApiKeyInput {
  name: string;
  permissions?: {
    topics?: string[];
    actions?: string[];
  };
  expiresAt?: string;
}

interface UpdateApiKeyInput {
  name?: string;
  active?: boolean;
  permissions?: {
    topics?: string[];
    actions?: string[];
  };
}

// Get all API keys for a workspace
export const useApiKeys = (workspaceId: string) => {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'api-keys'],
    queryFn: async () => {
      const response = await api.get<ApiKey[]>(`/workspaces/${workspaceId}/api-keys`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
};

// Get single API key
export const useApiKey = (keyId: string) => {
  return useQuery({
    queryKey: ['api-keys', keyId],
    queryFn: async () => {
      const response = await api.get<ApiKey>(`/api-keys/${keyId}`);
      return response.data;
    },
    enabled: !!keyId,
  });
};

// Create API key
export const useCreateApiKey = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApiKeyInput) => {
      const response = await api.post<ApiKey>(`/workspaces/${workspaceId}/api-keys`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'api-keys'] });
    },
  });
};

// Update API key
export const useUpdateApiKey = (keyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateApiKeyInput) => {
      const response = await api.patch<ApiKey>(`/api-keys/${keyId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', keyId] });
    },
  });
};

// Revoke API key
export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      await api.delete(`/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
};
