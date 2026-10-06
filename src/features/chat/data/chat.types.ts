export interface ChatFriend {
  id: number;
  Name: string;
  Surname: string;
  Username: string;
}
export interface Friendship {
  friend: ChatFriend;
  accepted: boolean;
  incoming: boolean;
}
export interface ChatMessage {
  id: string;
  senderId: number;
  content: string;
  createdAt: string;
}
export const friendName = (friend: ChatFriend) => `${friend.Name ?? ''} ${friend.Surname ?? ''}`.trim() || friend.Username || 'Friend';
