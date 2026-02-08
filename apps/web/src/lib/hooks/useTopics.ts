import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface Topic {
  id: string;
  workspaceId: string;
  name: string;
  partitions: number;
  retentionMs: number;
  schema: any;
  createdAt: string;
  updatedAt: string;
}

interface CreateTopicInput {
  name: string;
  partitions?: number;
  retentionMs?: number;
  schema?: any;
}

interface UpdateTopicInput {
  name?: string;
  partitions?: number;
  retentionMs?: number;
  schema?: any;
}

interface TopicStats {
  totalMessages: number;
  messageRate: number;
  consumerGroups: number;
  lastMessageTime: string | null;
}

// Get all topics for a workspace
export const useTopics = (workspaceId: string) => {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'topics'],
    queryFn: async () => {
      const response = await api.get<Topic[]>(`/workspaces/${workspaceId}/topics`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
};

// Get single topic
export const useTopic = (topicId: string) => {
  return useQuery({
    queryKey: ['topics', topicId],
    queryFn: async () => {
      const response = await api.get<Topic>(`/topics/${topicId}`);
      return response.data;
    },
    enabled: !!topicId,
  });
};

// Create topic
export const useCreateTopic = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTopicInput) => {
      const response = await api.post<Topic>(`/workspaces/${workspaceId}/topics`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'topics'] });
    },
  });
};

// Update topic
export const useUpdateTopic = (topicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTopicInput) => {
      const response = await api.patch<Topic>(`/topics/${topicId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', topicId] });
    },
  });
};

// Delete topic
export const useDeleteTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicId: string) => {
      await api.delete(`/topics/${topicId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
};

// Get topic stats
export const useTopicStats = (topicId: string) => {
  return useQuery({
    queryKey: ['topics', topicId, 'stats'],
    queryFn: async () => {
      const response = await api.get<TopicStats>(`/topics/${topicId}/stats`);
      return response.data;
    },
    enabled: !!topicId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

// Publish event to topic
export const usePublishEvent = (topicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post(`/topics/${topicId}/publish`, { payload });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', topicId, 'stats'] });
    },
  });
};
