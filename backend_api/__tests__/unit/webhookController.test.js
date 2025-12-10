const webhookController = require('../../controllers/webhookController');
const Reminder = require('../../models/reminder.model');
const CallLog = require('../../models/calllog.model');
const twilioClient = require('../../integrations/twilioClient');
const vapiClient = require('../../integrations/vapiClient');

// Mock dependencies
jest.mock('../../models/reminder.model');
jest.mock('../../models/calllog.model');
jest.mock('../../integrations/twilioClient');
jest.mock('../../integrations/vapiClient');
jest.mock('../../utils/logger');

describe('Webhook Controller - Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            headers: {},
            get: jest.fn()
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
    });

    describe('handleTwilio', () => {
        const mockReminder = {
            _id: 'reminder123',
            twilioCallSid: 'CA123456',
            status: 'processing'
        };

        it('should process valid Twilio webhook', async () => {
            req.body = {
                CallSid: 'CA123456',
                CallStatus: 'completed'
            };

            twilioClient.validateRequest.mockReturnValue(true);
            CallLog.find.mockResolvedValue([]);
            Reminder.findOne.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});
            Reminder.findByIdAndUpdate.mockResolvedValue({});

            await webhookController.handleTwilio(req, res, next);

            expect(twilioClient.validateRequest).toHaveBeenCalledWith(req);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith('ok');
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject invalid Twilio signature', async () => {
            req.body = {
                CallSid: 'CA123456',
                CallStatus: 'completed'
            };

            twilioClient.validateRequest.mockReturnValue(false);

            await webhookController.handleTwilio(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith('invalid signature');
            expect(CallLog.find).not.toHaveBeenCalled();
        });

        it('should create call log for new webhook', async () => {
            req.body = {
                CallSid: 'CA123456',
                CallStatus: 'in-progress'
            };

            twilioClient.validateRequest.mockReturnValue(true);
            CallLog.find.mockResolvedValue([]); // No existing logs
            Reminder.findOne.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});

            await webhookController.handleTwilio(req, res, next);

            expect(CallLog.create).toHaveBeenCalledWith({
                reminderId: mockReminder._id,
                externalCallId: 'CA123456',
                provider: 'twilio',
                status: 'in-progress'
            });
        });

        it('should be idempotent - not create duplicate call logs', async () => {
            req.body = {
                CallSid: 'CA123456',
                CallStatus: 'completed'
            };

            twilioClient.validateRequest.mockReturnValue(true);
            CallLog.find.mockResolvedValue([{ _id: 'existing-log' }]); // Existing log

            await webhookController.handleTwilio(req, res, next);

            expect(CallLog.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should update reminder status to failed when call fails', async () => {
            req.body = {
                CallSid: 'CA123456',
                CallStatus: 'failed'
            };

            twilioClient.validateRequest.mockReturnValue(true);
            CallLog.find.mockResolvedValue([]);
            Reminder.findOne.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});
            Reminder.findByIdAndUpdate.mockResolvedValue({});

            await webhookController.handleTwilio(req, res, next);

            expect(Reminder.findByIdAndUpdate).toHaveBeenCalledWith(
                mockReminder._id,
                { status: 'failed' }
            );
        });

        it('should keep status as processing when call completes (waiting for transcript)', async () => {
            req.body = {
                CallSid: 'CA123456',
                CallStatus: 'completed'
            };

            twilioClient.validateRequest.mockReturnValue(true);
            CallLog.find.mockResolvedValue([]);
            Reminder.findOne.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});
            Reminder.findByIdAndUpdate.mockResolvedValue({});

            await webhookController.handleTwilio(req, res, next);

            expect(Reminder.findByIdAndUpdate).toHaveBeenCalledWith(
                mockReminder._id,
                { status: 'processing' }
            );
        });

        it('should handle errors gracefully', async () => {
            req.body = {
                CallSid: 'CA123456',
                CallStatus: 'completed'
            };

            const error = new Error('Database error');
            twilioClient.validateRequest.mockReturnValue(true);
            CallLog.find.mockRejectedValue(error);

            await webhookController.handleTwilio(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });

        it('should handle duplicate key errors in call log creation', async () => {
            req.body = {
                CallSid: 'CA123456',
                CallStatus: 'completed'
            };

            const duplicateError = new Error('Duplicate');
            duplicateError.code = 11000;

            twilioClient.validateRequest.mockReturnValue(true);
            CallLog.find.mockResolvedValue([]);
            Reminder.findOne.mockResolvedValue(mockReminder);
            CallLog.create.mockRejectedValue(duplicateError);

            await webhookController.handleTwilio(req, res, next);

            // Should not call next with error (handled gracefully)
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('handleVapi', () => {
        const mockReminder = {
            _id: 'reminder123',
            twilioCallSid: 'CA123456',
            status: 'processing'
        };

        it('should process valid VAPI webhook', async () => {
            req.body = {
                call_id: 'vapi_call_123',
                status: 'completed',
                metadata: { reminder_id: 'reminder123' },
                transcript: 'Test transcript'
            };

            vapiClient.validateRequest.mockReturnValue(true);
            CallLog.findOne.mockResolvedValue(null);
            Reminder.findById.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});
            Reminder.findByIdAndUpdate.mockResolvedValue({});

            await webhookController.handleVapi(req, res, next);

            expect(vapiClient.validateRequest).toHaveBeenCalledWith(req);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith('ok');
        });

        it('should reject invalid VAPI signature', async () => {
            req.body = {
                call_id: 'vapi_call_123',
                status: 'completed'
            };

            vapiClient.validateRequest.mockReturnValue(false);

            await webhookController.handleVapi(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith('invalid signature');
        });

        it('should be idempotent - reject duplicate webhooks', async () => {
            req.body = {
                call_id: 'vapi_call_123',
                status: 'completed',
                metadata: { reminder_id: 'reminder123' }
            };

            vapiClient.validateRequest.mockReturnValue(true);
            CallLog.findOne.mockResolvedValue({ _id: 'existing-log' });

            await webhookController.handleVapi(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith('duplicate');
            expect(CallLog.create).not.toHaveBeenCalled();
        });

        it('should create call log with transcript', async () => {
            req.body = {
                call_id: 'vapi_call_123',
                status: 'transcribed',
                metadata: { reminder_id: 'reminder123' },
                transcript: 'This is a test transcript'
            };

            vapiClient.validateRequest.mockReturnValue(true);
            CallLog.findOne.mockResolvedValue(null);
            Reminder.findById.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});
            Reminder.findByIdAndUpdate.mockResolvedValue({});

            await webhookController.handleVapi(req, res, next);

            expect(CallLog.create).toHaveBeenCalledWith({
                reminderId: mockReminder._id,
                externalCallId: 'vapi_call_123',
                provider: 'vapi',
                status: 'transcribed',
                transcript: 'This is a test transcript'
            });
        });

        it('should update reminder status to called on success', async () => {
            req.body = {
                call_id: 'vapi_call_123',
                status: 'completed',
                metadata: { reminder_id: 'reminder123' }
            };

            vapiClient.validateRequest.mockReturnValue(true);
            CallLog.findOne.mockResolvedValue(null);
            Reminder.findById.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});
            Reminder.findByIdAndUpdate.mockResolvedValue({});

            await webhookController.handleVapi(req, res, next);

            expect(Reminder.findByIdAndUpdate).toHaveBeenCalledWith(
                mockReminder._id,
                { status: 'called' }
            );
        });

        it('should update reminder status to failed on failure', async () => {
            req.body = {
                call_id: 'vapi_call_123',
                status: 'error',
                metadata: { reminder_id: 'reminder123' }
            };

            vapiClient.validateRequest.mockReturnValue(true);
            CallLog.findOne.mockResolvedValue(null);
            Reminder.findById.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});
            Reminder.findByIdAndUpdate.mockResolvedValue({});

            await webhookController.handleVapi(req, res, next);

            expect(Reminder.findByIdAndUpdate).toHaveBeenCalledWith(
                mockReminder._id,
                { status: 'failed' }
            );
        });

        it('should find reminder by twilioCallSid if metadata.reminder_id not present', async () => {
            req.body = {
                call_id: 'CA123456',
                status: 'completed'
            };

            vapiClient.validateRequest.mockReturnValue(true);
            CallLog.findOne.mockResolvedValue(null);
            Reminder.findById.mockResolvedValue(null);
            Reminder.findOne.mockResolvedValue(mockReminder);
            CallLog.create.mockResolvedValue({});
            Reminder.findByIdAndUpdate.mockResolvedValue({});

            await webhookController.handleVapi(req, res, next);

            expect(Reminder.findOne).toHaveBeenCalledWith({ twilioCallSid: 'CA123456' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle duplicate key errors gracefully', async () => {
            req.body = {
                call_id: 'vapi_call_123',
                status: 'completed',
                metadata: { reminder_id: 'reminder123' }
            };

            const duplicateError = new Error('Duplicate');
            duplicateError.code = 11000;

            vapiClient.validateRequest.mockReturnValue(true);
            CallLog.findOne.mockResolvedValue(null);
            Reminder.findById.mockResolvedValue(mockReminder);
            CallLog.create.mockRejectedValue(duplicateError);

            await webhookController.handleVapi(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith('ok');
        });
    });
});
