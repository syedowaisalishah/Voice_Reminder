import { useState } from 'react';

export default function CreateUserForm({ onUserCreated }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const { createUser } = await import('../lib/api');
            const response = await createUser(email);

            setSuccess(`User created successfully! ID: ${response.data.id}`);
            setEmail('');

            // Notify parent component
            if (onUserCreated) {
                onUserCreated(response.data);
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || err.response.data.error || 'Failed to create user');
            } else if (err.request) {
                setError('Network error - please check your connection and ensure the backend is running');
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3 className="text-xl font-semibold mb-4">Create New User</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="email" className="form-label">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        placeholder="user@example.com"
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
                    {loading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </div>
    );
}
