import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const ChatHistoryList = ({ sessions, compact = false }) => {
  const navigate = useNavigate();

  if (!sessions || sessions.length === 0) {
    return (
      <div className={`text-center ${compact ? 'py-8' : 'py-12'} text-gray-500`}>
        <div className={`bg-purple-100 ${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <MessageCircle className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-purple-600`} />
        </div>
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-2`}>No Chats Yet</h3>
        <p className="text-gray-500 text-sm">Start a conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div
          key={session.peerId}
          onClick={() => navigate(`/chat/${session.peerId}`)}
          className={`flex items-center justify-between ${compact ? 'p-3' : 'p-4'} border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-white shadow-sm`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`rounded-xl bg-purple-100 ${compact ? 'p-2' : 'p-3'}`}>
                <MessageCircle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-purple-600`} />
              </div>
              {session.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {session.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-gray-800 ${compact ? 'text-sm' : 'text-base'} truncate`}>{session.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                {session.lastMessage}
              </p>
            </div>
          </div>
          {!compact && (
            <div className="text-right pl-2">
              <p className="text-xs text-gray-400">
                {new Date(session.timestamp).toLocaleDateString('en-IN', {
                  month: 'short', day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatHistoryList;
