'use client';
import ChatComponent from '@/features/chat/components/ChatComponent';
import FriendsComponent from '@/features/chat/components/FriendsComponent';
import FriendsModal from '@/features/chat/components/FriendsModal';
import useChatState from '@/features/chat/hooks/useChatState';

export default function ChatPage() {
  const { user, authLoading, relations, selectedFriend, setSelectedFriend, loading, error, refreshFriends, friendsModalProps } = useChatState();
  if (authLoading) return <p role="status" className="p-6 text-blue-900">Loading chat...</p>;
  if (!user) return <p className="p-6 text-blue-900">Sign in to view your friends.</p>;
  return <div className="flex h-dvh min-w-0 flex-1 overflow-hidden">
    <div className={`${selectedFriend ? 'hidden md:flex' : 'flex'} h-full w-full shrink-0 md:w-auto`}>
      <FriendsComponent key={user.id} relations={relations} selectedId={selectedFriend?.id} onSelect={setSelectedFriend}
        onAdd={() => friendsModalProps.setIsActive(true)} loading={loading} error={error} onRefresh={refreshFriends} userId={user.id} />
    </div>
    {selectedFriend ? <ChatComponent key={`${user.id}-${selectedFriend.id}`} userId={user.id} friend={selectedFriend} onBack={() => setSelectedFriend(null)} /> :
      <div className="hidden min-w-0 flex-1 items-center justify-center bg-blue-50/50 p-8 text-center md:flex"><div><h2 className="text-lg font-semibold text-blue-900">Your conversations</h2><p className="mt-2 text-sm text-blue-500">Choose a friend to open a local conversation preview.</p></div></div>}
    <FriendsModal key={user.id} {...friendsModalProps} />
  </div>;
}
