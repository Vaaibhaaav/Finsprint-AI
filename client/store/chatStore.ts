import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ChatRoom, Message } from "../types/types"

interface ChatStore {
    messages: Message[];
    isConnected: boolean;
    activeRoomId: string | null;
    generatingHistory: boolean;
    rooms: ChatRoom[] | [];
    initWebSocket: (currentUserId: string, token: string) => void;
    disconnectWebSocket: () => void;
    setActiveRoom: (roomId: string | null, api: any) => Promise<void>;
    getOrCreateRoom: (userId: string, coachId: string, api: any) => Promise<void>;
    fetchAllRooms: (api: any) => Promise<void>;
    sendMessage: (content: string, currentUserId: string) => void;
}

let wsInstance: WebSocket | null = null;

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            messages: [],
            isConnected: false,
            activeRoomId: null,
            generatingHistory: false,
            rooms: [],
            initWebSocket: (currentUserId: string, token: string) => {
                if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
                    return;
                }

                const wsUrl = `ws://localhost:8080/api/v1/chat/ws?token=${encodeURIComponent(token)}`;
                wsInstance = new WebSocket(wsUrl);

                wsInstance.onopen = () => {
                    set({ isConnected: true })
                    console.log("[Zustand WS] Live real-time channel established.");
                }

                wsInstance.onmessage = (event) => {
                    try {
                        const incomingMessage: Message = JSON.parse(event.data);
                        const { activeRoomId } = get();
                        if (incomingMessage.RoomID === activeRoomId) {
                            set((state) => {
                                const baseMessages = state.messages.filter(m => m.ID !== incomingMessage.ID);
                                return { messages: [...baseMessages, incomingMessage] };
                            });
                        }
                    } catch (error) {
                        console.error("[Zustand WS] Malformed package dropped:", error);
                    }
                }
                wsInstance.onclose = () => {
                    set({ isConnected: false })
                    console.log("[Zustand WS] Live real-time channel closed.");
                }
            },
            disconnectWebSocket: () => {
                if (wsInstance) {
                    wsInstance.close();
                    wsInstance = null;
                }
                set({ isConnected: false, messages: [], activeRoomId: null });
            },
            setActiveRoom: async (roomId, api) => {
                set({ activeRoomId: roomId, messages: [] });
                if (!roomId) return;

                set({ generatingHistory: true });
                try {
                    const res = await api.get(`/api/v1/chat/rooms/${roomId}/messages`)
                    if (res.status === 200) {
                        console.log(res)
                        const historyData = res.data
                        set({ messages: historyData || [] });
                    }
                } catch (err) {
                    console.error("[Zustand Chat] Failed syncing history lines:", err);
                } finally {
                    set({ generatingHistory: false });
                }
            },
            fetchAllRooms: async (api) => {
                try {
                    const res = await api.get(`/api/v1/chat/rooms`)
                    if (res.status === 200) {
                        console.log(res)
                        const roomsData = res.data
                        set({ rooms: roomsData });
                    }
                } catch (err) {
                    console.error("[Zustand Chat] Failed fetching rooms:", err);
                }
            },
            getOrCreateRoom: async (userId, coachId, api) => {
                try {
                    const res = await api.post(`/api/v1/chat/rooms`, {
                        user_id: userId,
                        coach_id: coachId,
                    })
                    if (res.status === 200) {
                        console.log(res)
                        const roomData = res.data
                        set({ activeRoomId: roomData.id });
                    }
                } catch (err) {
                    console.error("[Zustand Chat] Failed creating room:", err);
                }
            },
            sendMessage: (content, currentUserId) => {
                const { activeRoomId, isConnected } = get();
                if (!wsInstance || !isConnected || !activeRoomId) {
                    console.error("[Zustand Chat] Cannot send: Connection pipe is offline.");
                    return;
                }

                const temporaryId = crypto.randomUUID();
                const messagePayload = {
                    room_id: activeRoomId,
                    content: content,
                };

                const optimisticMessage: Message = {
                    ID: temporaryId,
                    RoomID: activeRoomId,
                    SenderID: currentUserId,
                    Content: content,
                    IsRead: false,
                    CreatedAt: new Date().toISOString(),
                    isOptimistic: true,
                };

                set((state) => ({ messages: [...state.messages, optimisticMessage] }));

                wsInstance.send(JSON.stringify(messagePayload));
            },
        }),
        {
            name: 'chat-storage',
            partialize(state) {
                return {
                    rooms: state.rooms,
                    activeRoomId: state.activeRoomId,
                };
            },
        }
    )
);