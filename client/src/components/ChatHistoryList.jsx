import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const ChatHistoryList = ({ sessions }) => {
  const navigate = useNavigate();

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Chats Yet</h3>
        <p className="text-gray-500">Start a conversation with an astrologer!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div
          key={session.peerId}
          onClick={() => navigate(`/chat/${session.peerId}`)}
          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-white shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-xl bg-purple-100">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              {session.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {session.unreadCount}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">{session.name}</p>
              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                {session.lastMessage}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {new Date(session.timestamp).toLocaleDateString('en-IN', {
                month: 'short', day: 'numeric'
              })}
            </p>
            <p className="text-xs text-indigo-600 font-medium mt-1">Open</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatHistoryList;
