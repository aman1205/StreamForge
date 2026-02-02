import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface ConsumerGroup {
  id: string;
  topicId: string;
  name: string;
  config: any;
  createdAt: string;
  updatedAt: string;
  topic: {
    id: string;
    name: string;
  };
}

interface CreateConsumerGroupInput {
  name: string;
  config?: any;
}

interface Consumer {
  id: string;
  name: string;
  pending: number;
  idle: number;
}

interface ConsumerGroupStats {
  totalMessages: number;
  pendingMessages: number;
  consumers: Consumer[];
  lag: number;
}

// Get all consumer groups for a topic
export const useConsumerGroups = (topicId: string) => {
  return useQuery({
    queryKey: ['topics', topicId, 'consumer-groups'],
    queryFn: async () => {
      const response = await api.get<ConsumerGroup[]>(`/topics/${topicId}/consumer-groups`);
      return response.data;
    },
    enabled: !!topicId,
  });
};

// Get single consumer group
export const useConsumerGroup = (groupId: string) => {
  return useQuery({
    queryKey: ['consumer-groups', groupId],
    queryFn: async () => {
      const response = await api.get<ConsumerGroup>(`/consumer-groups/${groupId}`);
      return response.data;
    },
    enabled: !!groupId,
  });
};

// Create consumer group
export const useCreateConsumerGroup = (topicId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConsumerGroupInput) => {
      const response = await api.post<ConsumerGroup>(
        `/topics/${topicId}/consumer-groups`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', topicId, 'consumer-groups'] });
    },
  });
};

// Delete consumer group
export const useDeleteConsumerGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      await api.delete(`/consumer-groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumer-groups'] });
    },
  });
};

// Get consumer group stats
export const useConsumerGroupStats = (groupId: string) => {
  return useQuery({
    queryKey: ['consumer-groups', groupId, 'stats'],
    queryFn: async () => {
      const response = await api.get<ConsumerGroupStats>(`/consumer-groups/${groupId}/stats`);
      return response.data;
    },
    enabled: !!groupId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

// Consume messages from consumer group
export const useConsumeMessages = (groupId: string) => {
  return useMutation({
    mutationFn: async (params: { count?: number; block?: number }) => {
      const response = await api.post(`/consumer-groups/${groupId}/consume`, params);
      return response.data;
    },
  });
};

// Acknowledge message
export const useAcknowledgeMessage = (groupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      await api.post(`/consumer-groups/${groupId}/ack`, { messageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumer-groups', groupId, 'stats'] });
    },
  });
};
