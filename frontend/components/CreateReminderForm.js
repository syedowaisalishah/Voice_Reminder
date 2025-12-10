import { useState, useEffect } from 'react';

export default function CreateReminderForm({ onReminderCreated }) {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        userId: '',
        phoneNumber: '',
        message: '',
        scheduledAt: '',
    });
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { getUsers } = await import('../lib/api');
            const response = await getUsers();
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users. Please refresh the page.');
        } finally {
            setLoadingUsers(false);
        }
    };

    const validatePhoneNumber = (phone) => {
        // E.164 format: +[country code][number]
        const re = /^\+[1-9]\d{1,14}$/;
        return re.test(phone);
    };

    const validateDateTime = (datetime) => {
        const scheduledDate = new Date(datetime);
        const now = new Date();
        return scheduledDate > now;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.userId) {
            setError('Please select a user');
            return;
        }

        if (!formData.phoneNumber.trim()) {
            setError('Phone number is required');
            return;
        }

        if (!validatePhoneNumber(formData.phoneNumber)) {
            setError('Phone number must be in E.164 format (e.g., +1234567890)');
            return;
        }

        if (!formData.message.trim()) {
            setError('Message is required');
            return;
        }

        if (formData.message.length > 500) {
            setError('Message must be 500 characters or less');
            return;
        }

        if (!formData.scheduledAt) {
            setError('Scheduled date and time is required');
            return;
        }

        if (!validateDateTime(formData.scheduledAt)) {
            setError('Scheduled time must be in the future');
            return;
        }

        setLoading(true);

        try {
            const { createReminder } = await import('../lib/api');
            const response = await createReminder({
                userId: formData.userId,
                phoneNumber: formData.phoneNumber,
                message: formData.message,
                scheduledAt: new Date(formData.scheduledAt).toISOString(),
            });

            setSuccess(`Reminder created successfully! ID: ${response.data.id}`);
            setFormData({
                userId: formData.userId, // Keep user selected
                phoneNumber: '',
                message: '',
                scheduledAt: '',
            });

            // Notify parent component
            if (onReminderCreated) {
                onReminderCreated(response.data);
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || err.response.data.error || 'Failed to create reminder');
            } else if (err.request) {
                setError('Network error - please check your connection and ensure the backend is running');
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loadingUsers) {
        return (
            <div className="card">
                <p className="text-gray-600">Loading users...</p>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="card bg-yellow-50">
                <p className="text-yellow-800">
                    No users found. Please create a user first before creating reminders.
                </p>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="text-xl font-semibold mb-4">Create New Reminder</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="userId" className="form-label">
                        Select User
                    </label>
                    <select
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        className="form-input"
                        disabled={loading}
                    >
                        <option value="">-- Select a user --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="phoneNumber" className="form-label">
                        Phone Number (E.164 format)
                    </label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="+1234567890"
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Format: +[country code][number] (e.g., +1234567890)
                    </p>
                </div>

                <div className="mb-4">
                    <label htmlFor="message" className="form-label">
                        Reminder Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Your reminder: Buy groceries at 6 PM"
                        rows="4"
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.message.length}/500 characters
                    </p>
                </div>

                <div className="mb-4">
                    <label htmlFor="scheduledAt" className="form-label">
                        Scheduled Date & Time
                    </label>
                    <input
                        type="datetime-local"
                        id="scheduledAt"
                        name="scheduledAt"
                        value={formData.scheduledAt}
                        onChange={handleChange}
                        className="form-input"
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="form-error mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="form-success mb-4">
                        {success}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating...' : 'Create Reminder'}
                </button>
            </form>
        </div>
    );
}
