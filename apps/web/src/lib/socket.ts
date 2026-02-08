import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store';

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        const token = useAuthStore.getState().token;
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

        this.socket = io(`${wsUrl}/events`, {
            auth: {
                token,
            },
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
        });

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        return this.socket;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public subscribe(topicId: string, consumerGroupId?: string): void {
        if (!this.socket) return;
        this.socket.emit('subscribe', { topicId, consumerGroupId });
    }

    public unsubscribe(topicId: string): void {
        if (!this.socket) return;
        this.socket.emit('unsubscribe', { topicId });
    }
}

export const socketService = SocketService.getInstance();
