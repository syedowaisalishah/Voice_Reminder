import axios from 'axios';
import { createUser, getUsers, createReminder, getReminder, getUserReminders } from '../../lib/api';

jest.mock('axios');

describe('API Library', () => {
    const mockApiUrl = 'http://localhost:4000';

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_API_URL = mockApiUrl;
    });

    describe('createUser', () => {
        it('should make POST request to create user', async () => {
            const mockResponse = {
                data: {
                    id: '123',
                    email: 'test@example.com'
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            const result = await createUser('test@example.com');

            expect(axios.post).toHaveBeenCalledWith(`${mockApiUrl}/users`, {
                email: 'test@example.com'
            });
            expect(result).toEqual(mockResponse);
        });

        it('should handle errors', async () => {
            const error = new Error('Network error');
            axios.post.mockRejectedValue(error);

            await expect(createUser('test@example.com')).rejects.toThrow('Network error');
        });
    });

    describe('getUsers', () => {
        it('should make GET request to fetch users', async () => {
            const mockResponse = {
                data: [
                    { id: '1', email: 'user1@example.com' },
                    { id: '2', email: 'user2@example.com' }
                ]
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await getUsers();

            expect(axios.get).toHaveBeenCalledWith(`${mockApiUrl}/users`);
            expect(result).toEqual(mockResponse);
            expect(result.data).toHaveLength(2);
        });
    });

    describe('createReminder', () => {
        it('should make POST request to create reminder', async () => {
            const reminderData = {
                user_id: 'user123',
                phone_number: '+1234567890',
                message: 'Test reminder',
                scheduled_at: '2024-12-31T10:00:00Z'
            };

            const mockResponse = {
                data: {
                    id: 'reminder123',
                    ...reminderData,
                    status: 'scheduled'
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            const result = await createReminder(reminderData);

            expect(axios.post).toHaveBeenCalledWith(`${mockApiUrl}/reminders`, reminderData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle validation errors', async () => {
            const error = {
                response: {
                    status: 400,
                    data: { error: 'Invalid phone number format' }
                }
            };

            axios.post.mockRejectedValue(error);

            await expect(createReminder({})).rejects.toEqual(error);
        });
    });

    describe('getReminder', () => {
        it('should make GET request to fetch specific reminder', async () => {
            const mockResponse = {
                data: {
                    id: 'reminder123',
                    userId: 'user123',
                    message: 'Test reminder',
                    status: 'scheduled',
                    callLogs: []
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await getReminder('reminder123');

            expect(axios.get).toHaveBeenCalledWith(`${mockApiUrl}/reminders/reminder123`);
            expect(result).toEqual(mockResponse);
        });

        it('should handle 404 errors', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { error: 'Reminder not found' }
                }
            };

            axios.get.mockRejectedValue(error);

            await expect(getReminder('nonexistent')).rejects.toEqual(error);
        });
    });

    describe('getUserReminders', () => {
        it('should make GET request to fetch user reminders', async () => {
            const mockResponse = {
                data: [
                    { id: 'reminder1', userId: 'user123', status: 'scheduled' },
                    { id: 'reminder2', userId: 'user123', status: 'called' }
                ]
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await getUserReminders('user123');

            expect(axios.get).toHaveBeenCalledWith(`${mockApiUrl}/users/user123/reminders`);
            expect(result).toEqual(mockResponse);
        });

        it('should include query parameters for filtering', async () => {
            const mockResponse = { data: [] };
            axios.get.mockResolvedValue(mockResponse);

            await getUserReminders('user123', { status: 'called' });

            expect(axios.get).toHaveBeenCalledWith(
                `${mockApiUrl}/users/user123/reminders`,
                expect.objectContaining({
                    params: { status: 'called' }
                })
            );
        });

        it('should support pagination parameters', async () => {
            const mockResponse = { data: [] };
            axios.get.mockResolvedValue(mockResponse);

            await getUserReminders('user123', { page: 2, pageSize: 10 });

            expect(axios.get).toHaveBeenCalledWith(
                `${mockApiUrl}/users/user123/reminders`,
                expect.objectContaining({
                    params: { page: 2, pageSize: 10 }
                })
            );
        });
    });

    describe('Error Handling', () => {
        it('should preserve error response data', async () => {
            const errorResponse = {
                response: {
                    status: 400,
                    data: {
                        error: 'Validation failed',
                        details: ['field1 is required', 'field2 is invalid']
                    }
                }
            };

            axios.post.mockRejectedValue(errorResponse);

            try {
                await createUser('invalid-email');
            } catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.error).toBe('Validation failed');
                expect(error.response.data.details).toHaveLength(2);
            }
        });

        it('should handle network errors', async () => {
            const networkError = {
                request: {},
                message: 'Network Error'
            };

            axios.get.mockRejectedValue(networkError);

            try {
                await getUsers();
            } catch (error) {
                expect(error.request).toBeDefined();
                expect(error.message).toBe('Network Error');
            }
        });
    });
});
