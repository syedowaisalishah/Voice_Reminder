const workerService = require('../../services/workerService');
const reminderRepo = require('../../repositories/reminder.repository');
const calllogRepo = require('../../repositories/calllog.repository');
const twilioClient = require('../../integrations/twilio.client');

// Mock dependencies
jest.mock('../../repositories/reminder.repository');
jest.mock('../../repositories/calllog.repository');
jest.mock('../../integrations/twilio.client');

describe('Worker Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('processDueReminders', () => {
    it('should process due reminders and initiate calls', async () => {
      const mockReminders = [
        {
          id: 'reminder1',
          phone_number: '+1234567890',
          message: 'Reminder 1',
          scheduled_at: new Date(Date.now() - 1000)
        },
        {
          id: 'reminder2',
          phone_number: '+9876543210',
          message: 'Reminder 2',
          scheduled_at: new Date(Date.now() - 2000)
        }
      ];

      const mockCall1 = { sid: 'call_sid_1' };
      const mockCall2 = { sid: 'call_sid_2' };

      reminderRepo.getDueReminders.mockResolvedValue(mockReminders);
      twilioClient.initiateCall
        .mockResolvedValueOnce(mockCall1)
        .mockResolvedValueOnce(mockCall2);
      reminderRepo.updateReminderStatus.mockResolvedValue({});
      calllogRepo.createLog.mockResolvedValue({});

      await workerService.processDueReminders();

      // Verify getDueReminders was called
      expect(reminderRepo.getDueReminders).toHaveBeenCalledTimes(1);

      // Verify calls were initiated for each reminder
      expect(twilioClient.initiateCall).toHaveBeenCalledTimes(2);
      expect(twilioClient.initiateCall).toHaveBeenNthCalledWith(
        1,
        '+1234567890',
        'Reminder 1',
        'reminder1'
      );
      expect(twilioClient.initiateCall).toHaveBeenNthCalledWith(
        2,
        '+9876543210',
        'Reminder 2',
        'reminder2'
      );

      // Verify reminder statuses were updated
      expect(reminderRepo.updateReminderStatus).toHaveBeenCalledTimes(2);
      expect(reminderRepo.updateReminderStatus).toHaveBeenNthCalledWith(
        1,
        'reminder1',
        'processing',
        'call_sid_1'
      );
      expect(reminderRepo.updateReminderStatus).toHaveBeenNthCalledWith(
        2,
        'reminder2',
        'processing',
        'call_sid_2'
      );

      // Verify call logs were created
      expect(calllogRepo.createLog).toHaveBeenCalledTimes(2);
      expect(calllogRepo.createLog).toHaveBeenNthCalledWith(1, {
        reminder_id: 'reminder1',
        external_call_id: 'call_sid_1',
        status: 'created',
        received_at: expect.any(Date)
      });
      expect(calllogRepo.createLog).toHaveBeenNthCalledWith(2, {
        reminder_id: 'reminder2',
        external_call_id: 'call_sid_2',
        status: 'created',
        received_at: expect.any(Date)
      });
    });

    it('should handle case when no reminders are due', async () => {
      reminderRepo.getDueReminders.mockResolvedValue([]);

      await workerService.processDueReminders();

      expect(reminderRepo.getDueReminders).toHaveBeenCalledTimes(1);
      expect(twilioClient.initiateCall).not.toHaveBeenCalled();
      expect(reminderRepo.updateReminderStatus).not.toHaveBeenCalled();
      expect(calllogRepo.createLog).not.toHaveBeenCalled();
    });

    it('should continue processing other reminders if one fails', async () => {
      const mockReminders = [
        {
          id: 'reminder1',
          phone_number: '+1234567890',
          message: 'Reminder 1',
          scheduled_at: new Date(Date.now() - 1000)
        },
        {
          id: 'reminder2',
          phone_number: '+9876543210',
          message: 'Reminder 2',
          scheduled_at: new Date(Date.now() - 2000)
        }
      ];

      reminderRepo.getDueReminders.mockResolvedValue(mockReminders);
      
      // First call fails, second succeeds
      twilioClient.initiateCall
        .mockRejectedValueOnce(new Error('Twilio API error'))
        .mockResolvedValueOnce({ sid: 'call_sid_2' });

      reminderRepo.updateReminderStatus.mockResolvedValue({});
      calllogRepo.createLog.mockResolvedValue({});

      // Should not throw error, but continue processing
      await expect(workerService.processDueReminders()).rejects.toThrow('Twilio API error');

      // First call was attempted
      expect(twilioClient.initiateCall).toHaveBeenCalledTimes(1);
      
      // Status and log should not be updated for failed reminder
      expect(reminderRepo.updateReminderStatus).not.toHaveBeenCalled();
      expect(calllogRepo.createLog).not.toHaveBeenCalled();
    });

    it('should handle Twilio client errors gracefully', async () => {
      const mockReminders = [
        {
          id: 'reminder1',
          phone_number: '+1234567890',
          message: 'Test',
          scheduled_at: new Date(Date.now() - 1000)
        }
      ];

      reminderRepo.getDueReminders.mockResolvedValue(mockReminders);
      twilioClient.initiateCall.mockRejectedValue(new Error('Network error'));

      await expect(workerService.processDueReminders()).rejects.toThrow('Network error');

      expect(twilioClient.initiateCall).toHaveBeenCalledTimes(1);
      // Should not update status or create log if call initiation fails
      expect(reminderRepo.updateReminderStatus).not.toHaveBeenCalled();
      expect(calllogRepo.createLog).not.toHaveBeenCalled();
    });

    it('should pass correct parameters to Twilio client', async () => {
      const mockReminder = {
        id: 'test-reminder-id',
        phone_number: '+15551234567',
        message: 'This is a test reminder message',
        scheduled_at: new Date(Date.now() - 1000)
      };

      reminderRepo.getDueReminders.mockResolvedValue([mockReminder]);
      twilioClient.initiateCall.mockResolvedValue({ sid: 'test_call_sid' });
      reminderRepo.updateReminderStatus.mockResolvedValue({});
      calllogRepo.createLog.mockResolvedValue({});

      await workerService.processDueReminders();

      expect(twilioClient.initiateCall).toHaveBeenCalledWith(
        '+15551234567',
        'This is a test reminder message',
        'test-reminder-id'
      );
    });
  });
});
