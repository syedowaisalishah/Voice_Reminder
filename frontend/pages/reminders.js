import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import CreateReminderForm from '../components/CreateReminderForm';
import ReminderList from '../components/ReminderList';

export default function RemindersPage() {
  const router = useRouter();
  const { userId } = router.query;

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch reminders when userId changes
  useEffect(() => {
    if (selectedUserId) {
      fetchReminders(selectedUserId);
    }
  }, [selectedUserId]);

  // Update selected user from query param
  useEffect(() => {
    if (userId && userId !== selectedUserId) {
      setSelectedUserId(userId);
    }
  }, [userId]);

  const fetchUsers = async () => {
    try {
      const { getUsers } = await import('../lib/api');
      const response = await getUsers();
      
      // Backend returns: { success: true, data: [...], meta: {...} }
      const apiResponse = response.data;
      const usersArray = (apiResponse && Array.isArray(apiResponse.data)) 
        ? apiResponse.data 
        : Array.isArray(apiResponse) ? apiResponse : [];
      
      setUsers(usersArray);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchReminders = async (userId) => {
    if (!userId) {
      setReminders([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { getUserReminders } = await import('../lib/api');
      const response = await getUserReminders(userId);
      
      // Backend returns: { success: true, data: [...], meta: {...} }
      const apiResponse = response.data;
      const remindersArray = (apiResponse && Array.isArray(apiResponse.data)) 
        ? apiResponse.data 
        : Array.isArray(apiResponse) ? apiResponse : [];
      
      setReminders(remindersArray);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
      setReminders([]);
      if (err.request) {
        setError('Cannot connect to backend. Please ensure the backend API is running.');
      } else {
        setError('Failed to load reminders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    const newUserId = e.target.value;
    setSelectedUserId(newUserId);
    router.push(`/reminders${newUserId ? `?userId=${newUserId}` : ''}`, undefined, { shallow: true });
  };

  const handleReminderCreated = (newReminder) => {
    setReminders(prev => [newReminder, ...prev]);
  };

  return (
    <>
      <Head>
        <title>Reminders - Voice Reminder Service</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Reminders</h1>
              <Link href="/">
                <button className="btn btn-secondary">
                  ← Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Reminder Form */}
            <div>
              <CreateReminderForm onReminderCreated={handleReminderCreated} />
            </div>

            {/* Reminders List */}
            <div>
              <div className="card mb-6">
                <label htmlFor="userSelect" className="form-label">
                  Select User to View Reminders
                </label>
                <select
                  id="userSelect"
                  value={selectedUserId}
                  onChange={handleUserChange}
                  className="form-input"
                  disabled={loadingUsers}
                >
                  <option value="">-- Select a user --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <p className="text-red-800">{error}</p>
                  <button 
                    onClick={() => fetchReminders(selectedUserId)}
                    className="btn btn-primary mt-2 text-sm"
                  >
                    Retry
                  </button>
                </div>
              )}

              {selectedUserId ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      Reminders for {users.find(u => u.id === selectedUserId)?.email || 'User'}
                    </h3>
                    <button 
                      onClick={() => fetchReminders(selectedUserId)}
                      className="btn btn-secondary text-sm"
                      disabled={loading}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  <ReminderList reminders={reminders} loading={loading} />
                </div>
              ) : (
                <div className="card bg-blue-50">
                  <p className="text-blue-800">
                    Please select a user above to view their reminders.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
