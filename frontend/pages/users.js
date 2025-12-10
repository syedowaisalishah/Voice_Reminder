import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CreateUserForm from '../components/CreateUserForm';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const { getUsers } = await import('../lib/api');
            const response = await getUsers();
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            if (err.request) {
                setError('Cannot connect to backend. Please ensure the backend API is running.');
            } else {
                setError('Failed to load users. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUserCreated = (newUser) => {
        setUsers(prev => [...prev, newUser]);
    };

    return (
        <>
            <Head>
                <title>Users - Voice Reminder Service</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="container py-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
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
                        {/* Create User Form */}
                        <div>
                            <CreateUserForm onUserCreated={handleUserCreated} />
                        </div>

                        {/* Users List */}
                        <div>
                            <div className="card">
                                <h3 className="text-xl font-semibold mb-4">All Users</h3>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                        <p className="text-red-800">{error}</p>
                                        <button
                                            onClick={fetchUsers}
                                            className="btn btn-primary mt-2 text-sm"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="text-gray-600 mt-2">Loading users...</p>
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <p className="text-gray-600">No users yet. Create your first user!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {users.map(user => (
                                            <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.email}</p>
                                                        <p className="text-xs text-gray-500 mt-1">ID: {user.id}</p>
                                                    </div>
                                                    <Link href={`/reminders?userId=${user.id}`}>
                                                        <button className="btn btn-primary text-sm">
                                                            View Reminders
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
