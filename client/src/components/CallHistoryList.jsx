import { Video } from 'lucide-react';

const CallHistoryList = ({ calls, userRole }) => {
  if (!calls || calls.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Video className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Calls Yet</h3>
        <p className="text-gray-500">Connect with an astrologer via video call!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <div key={call._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {userRole === 'client' ? call.receiverId?.name : call.callerId?.name}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(call.startTime).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-800">
              {Math.floor(call.duration / 60)}m {call.duration % 60}s
            </p>
            <p className="text-sm text-red-500 font-medium">-₹{call.cost?.toFixed(2) || 0}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CallHistoryList;
