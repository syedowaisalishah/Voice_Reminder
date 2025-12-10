const userService = require('../../services/userService');
const userRepo = require('../../repositories/userRepo');

// Mock the repository
jest.mock('../../repositories/userRepo');
jest.mock('../../utils/logger');

describe('UserService - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create a user with valid email', async () => {
            const mockUser = {
                _id: '123',
                email: 'test@example.com',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            userRepo.create.mockResolvedValue(mockUser);

            const result = await userService.createUser('test@example.com');

            expect(result).toEqual(mockUser);
            expect(userRepo.create).toHaveBeenCalledWith('test@example.com');
            expect(userRepo.create).toHaveBeenCalledTimes(1);
        });

        it('should throw error if email is missing', async () => {
            await expect(userService.createUser()).rejects.toThrow('email is required');
            await expect(userService.createUser('')).rejects.toThrow('email is required');
            await expect(userService.createUser()).rejects.toMatchObject({ statusCode: 400 });
        });

        it('should throw error if email is not a string', async () => {
            await expect(userService.createUser(123)).rejects.toThrow('email is required');
            await expect(userService.createUser({})).rejects.toThrow('email is required');
            await expect(userService.createUser(null)).rejects.toThrow('email is required');
        });

        it('should throw error if email format is invalid', async () => {
            const invalidEmails = [
                'notanemail',
                'missing@domain',
                '@nodomain.com',
                'spaces in@email.com',
                'double@@domain.com'
            ];

            for (const invalidEmail of invalidEmails) {
                await expect(userService.createUser(invalidEmail))
                    .rejects.toThrow('invalid email format');
            }
        });

        it('should accept valid email formats', async () => {
            const validEmails = [
                'simple@example.com',
                'firstname.lastname@example.com',
                'email123@test.co.uk',
                'user_name@company.org'
            ];

            const mockUser = { _id: '123', email: '', createdAt: new Date(), updatedAt: new Date() };

            for (const validEmail of validEmails) {
                mockUser.email = validEmail;
                userRepo.create.mockResolvedValue(mockUser);

                const result = await userService.createUser(validEmail);
                expect(result.email).toBe(validEmail);
            }
        });

        it('should throw error if email already exists (duplicate)', async () => {
            const duplicateError = new Error('Duplicate key');
            duplicateError.code = 11000; // MongoDB duplicate key error code

            userRepo.create.mockRejectedValue(duplicateError);

            await expect(userService.createUser('duplicate@example.com'))
                .rejects.toThrow('email already exists');

            await expect(userService.createUser('duplicate@example.com'))
                .rejects.toMatchObject({ statusCode: 400 });
        });

        it('should re-throw other repository errors', async () => {
            const dbError = new Error('Database connection failed');
            userRepo.create.mockRejectedValue(dbError);

            await expect(userService.createUser('test@example.com'))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            const mockUsers = [
                { _id: '1', email: 'user1@example.com' },
                { _id: '2', email: 'user2@example.com' }
            ];

            userRepo.findAll.mockResolvedValue(mockUsers);

            const result = await userService.getAllUsers();

            expect(result).toEqual(mockUsers);
            expect(userRepo.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return empty array if no users exist', async () => {
            userRepo.findAll.mockResolvedValue([]);

            const result = await userService.getAllUsers();

            expect(result).toEqual([]);
        });
    });

    describe('getUserById', () => {
        it('should return user if found', async () => {
            const mockUser = {
                _id: '123',
                email: 'test@example.com'
            };

            userRepo.findById.mockResolvedValue(mockUser);

            const result = await userService.getUserById('123');

            expect(result).toEqual(mockUser);
            expect(userRepo.findById).toHaveBeenCalledWith('123');
        });

        it('should throw error if id is missing', async () => {
            await expect(userService.getUserById()).rejects.toThrow('user id is required');
            await expect(userService.getUserById('')).rejects.toThrow('user id is required');
            await expect(userService.getUserById(null)).rejects.toMatchObject({ statusCode: 400 });
        });

        it('should return null if user not found', async () => {
            userRepo.findById.mockResolvedValue(null);

            const result = await userService.getUserById('nonexistent');

            expect(result).toBeNull();
        });
    });
});
