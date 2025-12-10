const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Reminder = require('../../models/Reminder');

let mongoServer;

// Setup in-memory MongoDB before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Clear database between tests
beforeEach(async () => {
    await User.deleteMany({});
    await Reminder.deleteMany({});
});

describe('API Integration Tests - Users', () => {
    describe('POST /users', () => {
        it('should create a new user with valid email', async () => {
            const response = await request(app)
                .post('/users')
                .send({ email: 'newuser@example.com' })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('email', 'newuser@example.com');
            expect(response.body).toHaveProperty('createdAt');

            // Verify user is in database
            const user = await User.findById(response.body.id);
            expect(user).toBeTruthy();
            expect(user.email).toBe('newuser@example.com');
        });

        it('should return 400 for missing email', async () => {
            const response = await request(app)
                .post('/users')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('email');
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/users')
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('invalid email format');
        });

        it('should return 400 for duplicate email', async () => {
            // Create first user
            await request(app)
                .post('/users')
                .send({ email: 'duplicate@example.com' })
                .expect(201);

            // Try to create duplicate
            const response = await request(app)
                .post('/users')
                .send({ email: 'duplicate@example.com' })
                .expect(400);

            expect(response.body.error).toContain('already exists');
        });
    });

    describe('GET /users', () => {
        it('should return empty array when no users exist', async () => {
            const response = await request(app)
                .get('/users')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return all users', async () => {
            // Create test users
            await User.create({ email: 'user1@example.com' });
            await User.create({ email: 'user2@example.com' });
            await User.create({ email: 'user3@example.com' });

            const response = await request(app)
                .get('/users')
                .expect(200);

            expect(response.body).toHaveLength(3);
            expect(response.body[0]).toHaveProperty('email');
            expect(response.body[0]).toHaveProperty('id');
        });
    });
});

describe('API Integration Tests - Reminders', () => {
    let testUser;

    beforeEach(async () => {
        // Create a test user for reminder tests
        testUser = await User.create({ email: 'testuser@example.com' });
    });

    describe('POST /reminders', () => {
        const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

        it('should create a new reminder with valid data', async () => {
            const response = await request(app)
                .post('/reminders')
                .send({
                    user_id: testUser._id.toString(),
                    phone_number: '+1234567890',
                    message: 'Test reminder',
                    scheduled_at: futureDate
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('userId', testUser._id.toString());
            expect(response.body).toHaveProperty('phoneNumber', '+1234567890');
            expect(response.body).toHaveProperty('message', 'Test reminder');
            expect(response.body).toHaveProperty('status', 'scheduled');

            // Verify reminder is in database
            const reminder = await Reminder.findById(response.body.id);
            expect(reminder).toBeTruthy();
            expect(reminder.status).toBe('scheduled');
        });

        it('should return 400 for missing required fields', async () => {
            const testCases = [
                {}, // All missing
                { phone_number: '+1234567890', message: 'Test', scheduled_at: futureDate }, // Missing user_id
                { user_id: testUser._id.toString(), message: 'Test', scheduled_at: futureDate }, // Missing phone_number
                { user_id: testUser._id.toString(), phone_number: '+1234567890', scheduled_at: futureDate }, // Missing message
                { user_id: testUser._id.toString(), phone_number: '+1234567890', message: 'Test' } // Missing scheduled_at
            ];

            for (const testCase of testCases) {
                const response = await request(app)
                    .post('/reminders')
                    .send(testCase)
                    .expect(400);

                expect(response.body).toHaveProperty('error');
            }
        });

        it('should return 400 for invalid phone number format', async () => {
            const response = await request(app)
                .post('/reminders')
                .send({
                    user_id: testUser._id.toString(),
                    phone_number: '1234567890', // Missing +
                    message: 'Test',
                    scheduled_at: futureDate
                })
                .expect(400);

            expect(response.body.error).toContain('phone_number');
        });

        it('should return 400 for past scheduled_at date', async () => {
            const pastDate = new Date(Date.now() - 3600000).toISOString();

            const response = await request(app)
                .post('/reminders')
                .send({
                    user_id: testUser._id.toString(),
                    phone_number: '+1234567890',
                    message: 'Test',
                    scheduled_at: pastDate
                })
                .expect(400);

            expect(response.body.error).toContain('future');
        });

        it('should return 400 for non-existent user', async () => {
            const fakeUserId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .post('/reminders')
                .send({
                    user_id: fakeUserId,
                    phone_number: '+1234567890',
                    message: 'Test',
                    scheduled_at: futureDate
                })
                .expect(400);

            expect(response.body.error).toContain('user not found');
        });
    });

    describe('GET /reminders/:id', () => {
        it('should return reminder by id', async () => {
            const reminder = await Reminder.create({
                userId: testUser._id,
                phoneNumber: '+1234567890',
                message: 'Test reminder',
                scheduledAt: new Date(Date.now() + 3600000),
                status: 'scheduled'
            });

            const response = await request(app)
                .get(`/reminders/${reminder._id}`)
                .expect(200);

            expect(response.body).toHaveProperty('id', reminder._id.toString());
            expect(response.body).toHaveProperty('message', 'Test reminder');
            expect(response.body).toHaveProperty('status', 'scheduled');
        });

        it('should return 404 for non-existent reminder', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .get(`/reminders/${fakeId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('not found');
        });

        it('should return 400 for invalid reminder id format', async () => {
            await request(app)
                .get('/reminders/invalid-id')
                .expect(400);
        });
    });

    describe('GET /users/:id/reminders', () => {
        it('should return all reminders for a user', async () => {
            // Create multiple reminders
            await Reminder.create({
                userId: testUser._id,
                phoneNumber: '+1111111111',
                message: 'Reminder 1',
                scheduledAt: new Date(Date.now() + 3600000),
                status: 'scheduled'
            });
            await Reminder.create({
                userId: testUser._id,
                phoneNumber: '+2222222222',
                message: 'Reminder 2',
                scheduledAt: new Date(Date.now() + 7200000),
                status: 'called'
            });

            const response = await request(app)
                .get(`/users/${testUser._id}/reminders`)
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty('userId', testUser._id.toString());
        });

        it('should filter reminders by status', async () => {
            await Reminder.create({
                userId: testUser._id,
                phoneNumber: '+1111111111',
                message: 'Reminder 1',
                scheduledAt: new Date(Date.now() + 3600000),
                status: 'scheduled'
            });
            await Reminder.create({
                userId: testUser._id,
                phoneNumber: '+2222222222',
                message: 'Reminder 2',
                scheduledAt: new Date(Date.now() + 7200000),
                status: 'called'
            });

            const response = await request(app)
                .get(`/users/${testUser._id}/reminders?status=called`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toHaveProperty('status', 'called');
        });

        it('should return empty array for user with no reminders', async () => {
            const response = await request(app)
                .get(`/users/${testUser._id}/reminders`)
                .expect(200);

            expect(response.body).toEqual([]);
        });
    });
});

describe('API Integration Tests - CORS and Headers', () => {
    it('should include CORS headers', async () => {
        const response = await request(app)
            .get('/users')
            .expect(200);

        expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS preflight requests', async () => {
        await request(app)
            .options('/users')
            .expect(204);
    });
});
