import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateReminderForm from '../../components/CreateReminderForm';
import * as api from '../../lib/api';

jest.mock('../../lib/api');

describe('CreateReminderForm Component', () => {
  let mockOnReminderCreated;
  const mockUsers = [
    { id: 'user1', email: 'user1@example.com' },
    { id: 'user2', email: 'user2@example.com' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnReminderCreated = jest.fn();
    api.getUsers.mockResolvedValue({ data: mockUsers });
  });

  it('should render the form with all fields', async () => {
    render(<CreateReminderForm onReminderCreated={mockOnReminderCreated} />);

    await waitFor(() => {
      expect(screen.getByText(/create new reminder/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select user/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/scheduled date/i)).toBeInTheDocument();
    });
  });

  it('should load and display users in dropdown', async () => {
    render(<CreateReminderForm onReminderCreated={mockOnReminderCreated} />);

    await waitFor(() => {
      expect(api.getUsers).toHaveBeenCalled();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const futureDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    
    const mockReminder = {
      id: 'reminder123',
      userId: 'user1',
      phoneNumber: '+1234567890',
      message: 'Test reminder',
      scheduledAt: futureDate,
      status: 'scheduled'
    };

    api.createReminder.mockResolvedValue({ data: mockReminder });

    render(<CreateReminderForm onReminderCreated={mockOnReminderCreated} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select user/i)).toBeInTheDocument();
    });

    const userSelect = screen.getByLabelText(/select user/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const messageInput = screen.getByLabelText(/message/i);
    const dateInput = screen.getByLabelText(/scheduled date/i);
    const submitButton = screen.getByRole('button', { name: /create reminder/i });

    await user.selectOptions(userSelect, 'user1');
    await user.type(phoneInput, '+1234567890');
    await user.type(messageInput, 'Test reminder');
    await user.type(dateInput, futureDate);
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.createReminder).toHaveBeenCalledWith({
        user_id: 'user1',
        phone_number: '+1234567890',
        message: 'Test reminder',
        scheduled_at: expect.any(String)
      });
      expect(mockOnReminderCreated).toHaveBeenCalledWith(mockReminder);
    });
  });

  it('should display error for missing fields', async () => {
    const user = userEvent.setup();
    
    render(<CreateReminderForm onReminderCreated={mockOnReminderCreated} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select user/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create reminder/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
    });

    expect(mockOnReminderCreated).not.toHaveBeenCalled();
  });

  it('should validate phone number format', async () => {
    const user = userEvent.setup();
    const futureDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

    render(<CreateReminderForm onReminderCreated={mockOnReminderCreated} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select user/i)).toBeInTheDocument();
    });

    const userSelect = screen.getByLabelText(/select user/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const messageInput = screen.getByLabelText(/message/i);
    const dateInput = screen.getByLabelText(/scheduled date/i);
    const submitButton = screen.getByRole('button', { name: /create reminder/i });

    await user.selectOptions(userSelect, 'user1');
    await user.type(phoneInput, '1234567890'); // Invalid format (missing +)
    await user.type(messageInput, 'Test');
    await user.type(dateInput, futureDate);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must start with/i)).toBeInTheDocument();
    });
  });

  it('should display API error messages', async () => {
    const user = userEvent.setup();
    const futureDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

    api.createReminder.mockRejectedValue({
      response: {
        data: { error: 'Scheduled time must be in the future' }
      }
    });

    render(<CreateReminderForm onReminderCreated={mockOnReminderCreated} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select user/i)).toBeInTheDocument();
    });

    const userSelect = screen.getByLabelText(/select user/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const messageInput = screen.getByLabelText(/message/i);
    const dateInput = screen.getByLabelText(/scheduled date/i);
    const submitButton = screen.getByRole('button', { name: /create reminder/i });

    await user.selectOptions(userSelect, 'user1');
    await user.type(phoneInput, '+1234567890');
    await user.type(messageInput, 'Test');
    await user.type(dateInput, futureDate);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/scheduled time must be in the future/i)).toBeInTheDocument();
    });
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    const futureDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    
    api.createReminder.mockResolvedValue({
      data: {
        id: 'reminder123',
        status: 'scheduled'
      }
    });

    render(<CreateReminderForm onReminderCreated={mockOnReminderCreated} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select user/i)).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText(/phone number/i);
    const messageInput = screen.getByLabelText(/message/i);
    
    await user.selectOptions(screen.getByLabelText(/select user/i), 'user1');
    await user.type(phoneInput, '+1234567890');
    await user.type(messageInput, 'Test reminder');
    await user.type(screen.getByLabelText(/scheduled date/i), futureDate);
    await user.click(screen.getByRole('button', { name: /create reminder/i }));

    await waitFor(() => {
      expect(phoneInput).toHaveValue('');
      expect(messageInput).toHaveValue('');
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    const futureDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    
    api.createReminder.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
    );

    render(<CreateReminderForm onReminderCreated={mockOnReminderCreated} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select user/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/select user/i), 'user1');
    await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
    await user.type(screen.getByLabelText(/message/i), 'Test');
    await user.type(screen.getByLabelText(/scheduled date/i), futureDate);
    
    const submitButton = screen.getByRole('button', { name: /create reminder/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
