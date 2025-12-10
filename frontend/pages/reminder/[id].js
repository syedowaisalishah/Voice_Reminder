import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ReminderDetailPage() {
    const router = useRouter();
    const { id } = router.query;

    const [reminder, setReminder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchReminder(id);
        }
    }, [id]);

    const fetchReminder = async (reminderId) => {
        setLoading(true);
        setError('');
        try {
            const { getReminder } = await import('../../lib/api');
            const response = await getReminder(reminderId);
            
            // Backend returns: { success: true, data: {...} }
            const reminderData = response.data?.data || response.data;
            setReminder(reminderData);
        } catch (err) {
            console.error('Failed to fetch reminder:', err);
            if (err.response && err.response.status === 404) {
                setError('Reminder not found.');
            } else if (err.request) {
                setError('Cannot connect to backend. Please ensure the backend API is running.');
            } else {
                setError('Failed to load reminder. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'scheduled': 'badge-scheduled',
            'processing': 'badge-processing',
            'called': 'badge-called',
            'failed': 'badge-failed',
        };
        return `badge ${statusClasses[status] || 'badge-scheduled'}`;
    };

    const formatDateTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading reminder...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container py-8">
                    <div className="card bg-red-50 max-w-2xl mx-auto">
                        <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                        <p className="text-red-700 mb-4">{error}</p>
                        <div className="flex gap-2">
                            <button onClick={() => fetchReminder(id)} className="btn btn-primary">
                                Retry
                            </button>
                            <Link href="/reminders">
                                <button className="btn btn-secondary">
                                    Back to Reminders
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!reminder) {
        return null;
    }

    return (
        <>
            <Head>
                <title>Reminder Details - Voice Reminder Service</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="container py-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gray-900">Reminder Details</h1>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchReminder(id)}
                                    className="btn btn-secondary"
                                >
                                    🔄 Refresh
                                </button>
                                <Link href="/reminders">
                                    <button className="btn btn-secondary">
                                        ← Back to Reminders
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Main Reminder Info */}
                        <div className="card mb-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold">Reminder Information</h2>
                                <span className={getStatusBadgeClass(reminder.status)}>
                                    {reminder.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Reminder ID</label>
                                    <p className="text-gray-900 mt-1 font-mono text-sm">{reminder.id}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">User ID</label>
                                    <p className="text-gray-900 mt-1 font-mono text-sm">{reminder.userId}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Phone Number</label>
                                    <p className="text-gray-900 mt-1 text-lg font-semibold">{reminder.phoneNumber}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Scheduled At</label>
                                    <p className="text-gray-900 mt-1">{formatDateTime(reminder.scheduledAt)}</p>
                                </div>

                                {reminder.externalCallId && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">External Call ID</label>
                                        <p className="text-gray-900 mt-1 font-mono text-sm">{reminder.externalCallId}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Created At</label>
                                    <p className="text-gray-900 mt-1 text-sm">{formatDateTime(reminder.createdAt)}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="text-sm font-medium text-gray-600">Message</label>
                                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-900 whitespace-pre-wrap">{reminder.message}</p>
                                </div>
                            </div>
                        </div>

                        {/* Call Logs Section */}
                        {reminder.callLogs && reminder.callLogs.length > 0 && (
                            <div className="card">
                                <h2 className="text-2xl font-semibold mb-4">Call Logs</h2>
                                <div className="space-y-4">
                                    {reminder.callLogs.map((log, index) => (
                                        <div key={log.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600">Call ID</label>
                                                    <p className="text-gray-900 font-mono text-sm mt-1">{log.externalCallId}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600">Status</label>
                                                    <p className="text-gray-900 mt-1">
                                                        <span className={`badge ${log.status === 'completed' ? 'badge-called' : 'badge-failed'}`}>
                                                            {log.status}
                                                        </span>
                                                    </p>
                                                </div>
                                                {log.receivedAt && (
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600">Received At</label>
                                                        <p className="text-gray-900 text-sm mt-1">{formatDateTime(log.receivedAt)}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {log.transcript && (
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600">Transcript</label>
                                                    <div className="mt-2 p-3 bg-white rounded border border-gray-300">
                                                        <p className="text-gray-900 text-sm whitespace-pre-wrap">{log.transcript}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Status Explanation */}
                        <div className="card bg-blue-50 mt-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">Status Information</h3>
                            <div className="text-sm text-blue-800 space-y-1">
                                <p><span className="font-semibold">Scheduled:</span> Reminder is waiting to be sent</p>
                                <p><span className="font-semibold">Processing:</span> Call has been initiated, waiting for result</p>
                                <p><span className="font-semibold">Called:</span> Call completed successfully</p>
                                <p><span className="font-semibold">Failed:</span> Call failed or could not be completed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
