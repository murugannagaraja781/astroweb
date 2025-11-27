import { Video } from 'lucide-react';

const CallHistoryList = ({ calls, userRole, compact = false }) => {
  if (!calls || calls.length === 0) {
    return (
      <div className={`text-center ${compact ? 'py-8' : 'py-12'} text-gray-500`}>
        <div className={`bg-blue-100 ${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Video className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600`} />
        </div>
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-2`}>No Calls Yet</h3>
        <p className="text-gray-500 text-sm">Make a call!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {calls.map((call) => (
        <div key={call._id} className={`flex items-center justify-between ${compact ? 'p-3' : 'p-4'} border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-xl bg-blue-100 ${compact ? 'p-2' : 'p-3'}`}>
              <Video className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
            <div className="min-w-0">
              <p className={`font-medium text-gray-800 ${compact ? 'text-sm' : 'text-base'} truncate`}>
                {userRole === 'client' ? call.receiverId?.name : call.callerId?.name}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(call.startTime).toLocaleDateString('en-IN', {
                  month: 'short', day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="text-right pl-2">
            <p className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-base'}`}>
              {Math.floor(call.duration / 60)}m {call.duration % 60}s
            </p>
            {!compact && <p className="text-sm text-red-500 font-medium">-₹{call.cost?.toFixed(2) || 0}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CallHistoryList;
