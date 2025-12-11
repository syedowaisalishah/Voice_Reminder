import Link from 'next/link';

export default function ReminderList({ reminders, loading }) {
  if (loading) {
    return (
      <div className="card">
        <p className="text-gray-600">Loading reminders...</p>
      </div>
    );
  }

  if (!reminders || reminders.length === 0) {
    return (
      <div className="card bg-gray-50">
        <p className="text-gray-600">No reminders found for this user.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'scheduled': 'badge-scheduled',
      'initialized': 'badge-processing',
      'called': 'badge-called',
      'failed': 'badge-failed',
    };
    return `badge ${statusClasses[status] || 'badge-scheduled'}`;
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const truncateMessage = (message, maxLength = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      {reminders.map(reminder => (
        <Link key={reminder.id} href={`/reminder/${reminder.id}`}>
          <div className="card hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-400">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={getStatusBadgeClass(reminder.status)}>
                    {reminder.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    ID: {reminder.id.substring(0, 8)}...
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Phone:</span> {reminder.phoneNumber}
                </p>
              </div>
            </div>

            <p className="text-gray-800 mb-3">
              {truncateMessage(reminder.message)}
            </p>

            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDateTime(reminder.scheduledAt)}
              </div>
              <span className="text-blue-600 hover:text-blue-800 font-medium">
                View Details →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
