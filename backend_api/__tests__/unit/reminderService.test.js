const reminderService = require('../../services/reminderService');
const reminderRepo = require('../../repositories/reminderRepo');
const userRepo = require('../../repositories/userRepo');
const validators = require('../../utils/validators');

// Mock dependencies
jest.mock('../../repositories/reminderRepo');
jest.mock('../../repositories/userRepo');
jest.mock('../../utils/logger');

describe('ReminderService - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createReminder', () => {
        const validReminderData = {
            user_id: 'user123',
            phone_number: '+1234567890',
            message: 'Test reminder message',
            scheduled_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        };

        const mockUser = {
            _id: 'user123',
            email: 'test@example.com'
        };

        const mockReminder = {
            _id: 'reminder123',
            userId: 'user123',
            phoneNumber: '+1234567890',
            message: 'Test reminder message',
            scheduledAt: new Date(validReminderData.scheduled_at),
            status: 'scheduled',
            createdAt: new Date()
        };

        it('should create a reminder with valid data', async () => {
            userRepo.findById.mockResolvedValue(mockUser);
            reminderRepo.create.mockResolvedValue(mockReminder);

            const result = await reminderService.createReminder(validReminderData);

            expect(result).toEqual(mockReminder);
            expect(userRepo.findById).toHaveBeenCalledWith('user123');
            expect(reminderRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user123',
                    phoneNumber: '+1234567890',
                    message: 'Test reminder message',
                    status: 'scheduled'
                })
            );
        });

        it('should throw error if required fields are missing', async () => {
            const testCases = [
                { ...validReminderData, user_id: undefined },
                { ...validReminderData, phone_number: undefined },
                { ...validReminderData, message: undefined },
                { ...validReminderData, scheduled_at: undefined },
                {}
            ];

            for (const testCase of testCases) {
                await expect(reminderService.createReminder(testCase))
                    .rejects.toThrow('missing required fields');
                await expect(reminderService.createReminder(testCase))
                    .rejects.toMatchObject({ statusCode: 400 });
            }
        });

        it('should throw error if phone number format is invalid', async () => {
            const invalidPhoneNumbers = [
                '1234567890',           // Missing '+'
                '+123',                 // Too short
                'not-a-phone',         // Not a number format
                '+abc1234567890',      // Contains letters
                '(123) 456-7890',      // Not E.164 format
            ];

            for (const invalidPhone of invalidPhoneNumbers) {
                const data = { ...validReminderData, phone_number: invalidPhone };

                await expect(reminderService.createReminder(data))
                    .rejects.toThrow('invalid phone_number format');
            }
        });

        it('should throw error if scheduled_at is not a future date', async () => {
            const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
            const data = { ...validReminderData, scheduled_at: pastDate };

            await expect(reminderService.createReminder(data))
                .rejects.toThrow('scheduled_at must be a valid future ISO datetime');
        });

        it('should throw error if scheduled_at is invalid format', async () => {
            const invalidDates = [
                'not-a-date',
                '2023-13-45',           // Invalid month/day
                'tomorrow',
                '12/31/2023'            // Non-ISO format
            ];

            for (const invalidDate of invalidDates) {
                const data = { ...validReminderData, scheduled_at: invalidDate };

                await expect(reminderService.createReminder(data))
                    .rejects.toThrow('scheduled_at must be a valid future ISO datetime');
            }
        });

        it('should throw error if user does not exist', async () => {
            userRepo.findById.mockResolvedValue(null);

            await expect(reminderService.createReminder(validReminderData))
                .rejects.toThrow('user not found');
            await expect(reminderService.createReminder(validReminderData))
                .rejects.toMatchObject({ statusCode: 400 });
        });

        it('should set initial status to "scheduled"', async () => {
            userRepo.findById.mockResolvedValue(mockUser);
            reminderRepo.create.mockResolvedValue(mockReminder);

            await reminderService.createReminder(validReminderData);

            expect(reminderRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'scheduled' })
            );
        });
    });

    describe('getReminderById', () => {
        it('should return reminder if found', async () => {
            const mockReminder = {
                _id: 'reminder123',
                userId: 'user123',
                status: 'scheduled',
                callLogs: []
            };

            reminderRepo.findById.mockResolvedValue(mockReminder);

            const result = await reminderService.getReminderById('reminder123');

            expect(result).toEqual(mockReminder);
            expect(reminderRepo.findById).toHaveBeenCalledWith('reminder123');
        });

        it('should throw error if id is missing', async () => {
            await expect(reminderService.getReminderById()).rejects.toThrow('reminder id is required');
            await expect(reminderService.getReminderById('')).rejects.toThrow('reminder id is required');
        });

        it('should throw error if reminder not found', async () => {
            reminderRepo.findById.mockResolvedValue(null);

            await expect(reminderService.getReminderById('nonexistent'))
                .rejects.toThrow('reminder not found');
            await expect(reminderService.getReminderById('nonexistent'))
                .rejects.toMatchObject({ statusCode: 404 });
        });
    });

    describe('getRemindersByUser', () => {
        it('should return reminders for a user', async () => {
            const mockReminders = [
                { _id: '1', userId: 'user123', status: 'scheduled' },
                { _id: '2', userId: 'user123', status: 'called' }
            ];

            reminderRepo.findByUserId.mockResolvedValue(mockReminders);

            const result = await reminderService.getRemindersByUser('user123');

            expect(result).toEqual(mockReminders);
            expect(reminderRepo.findByUserId).toHaveBeenCalledWith(
                { userId: 'user123' },
                expect.objectContaining({ skip: 0, limit: 25 })
            );
        });

        it('should throw error if userId is missing', async () => {
            await expect(reminderService.getRemindersByUser()).rejects.toThrow('user id is required');
            await expect(reminderService.getRemindersByUser('')).rejects.toThrow('user id is required');
        });

        it('should filter by status if provided', async () => {
            reminderRepo.findByUserId.mockResolvedValue([]);

            await reminderService.getRemindersByUser('user123', { status: 'called' });

            expect(reminderRepo.findByUserId).toHaveBeenCalledWith(
                { userId: 'user123', status: 'called' },
                expect.any(Object)
            );
        });

        it('should throw error if status is invalid', async () => {
            await expect(
                reminderService.getRemindersByUser('user123', { status: 'invalid_status' })
            ).rejects.toThrow('invalid status');
        });

        it('should handle pagination options', async () => {
            reminderRepo.findByUserId.mockResolvedValue([]);

            await reminderService.getRemindersByUser('user123', { page: 2, pageSize: 10 });

            expect(reminderRepo.findByUserId).toHaveBeenCalledWith(
                expect.any(Object),
                { skip: 10, limit: 10 }
            );
        });
    });

    describe('updateReminderStatus', () => {
        it('should update reminder status', async () => {
            const mockReminder = {
                _id: 'reminder123',
                status: 'called',
                twilioCallSid: 'call123'
            };

            reminderRepo.update.mockResolvedValue(mockReminder);

            const result = await reminderService.updateReminderStatus('reminder123', 'called', 'call123');

            expect(result).toEqual(mockReminder);
            expect(reminderRepo.update).toHaveBeenCalledWith('reminder123', {
                status: 'called',
                twilioCallSid: 'call123'
            });
        });

        it('should throw error if id or status is missing', async () => {
            await expect(reminderService.updateReminderStatus()).rejects.toThrow('reminder id and status are required');
            await expect(reminderService.updateReminderStatus('id123')).rejects.toThrow('reminder id and status are required');
            await expect(reminderService.updateReminderStatus('', 'called')).rejects.toThrow('reminder id and status are required');
        });

        it('should throw error if reminder not found', async () => {
            reminderRepo.update.mockResolvedValue(null);

            await expect(reminderService.updateReminderStatus('nonexistent', 'called'))
                .rejects.toThrow('reminder not found');
            await expect(reminderService.updateReminderStatus('nonexistent', 'called'))
                .rejects.toMatchObject({ statusCode: 404 });
        });

        it('should update status without externalCallId if not provided', async () => {
            const mockReminder = { _id: 'reminder123', status: 'processing' };
            reminderRepo.update.mockResolvedValue(mockReminder);

            await reminderService.updateReminderStatus('reminder123', 'processing');

            expect(reminderRepo.update).toHaveBeenCalledWith('reminder123', {
                status: 'processing'
            });
        });
    });
});
