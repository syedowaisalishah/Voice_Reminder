import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateUserForm from '../../components/CreateUserForm';
import * as api from '../../lib/api';

// Mock the API
jest.mock('../../lib/api');

describe('CreateUserForm Component', () => {
  let mockOnUserCreated;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnUserCreated = jest.fn();
  });

  it('should render the form with all elements', () => {
    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    expect(screen.getByText(/create new user/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
  });

  it('should accept email input', async () => {
    const user = userEvent.setup();
    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should submit form with valid email', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    };

    api.createUser.mockResolvedValue({ data: mockUser });

    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /create user/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith('test@example.com');
      expect(mockOnUserCreated).toHaveBeenCalledWith(mockUser);
    });
  });

  it('should display error message on API failure', async () => {
    const user = userEvent.setup();
    api.createUser.mockRejectedValue({
      response: {
        data: { error: 'Email already exists' }
      }
    });

    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /create user/i });

    await user.type(emailInput, 'existing@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    expect(mockOnUserCreated).not.toHaveBeenCalled();
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    };

    api.createUser.mockResolvedValue({ data: mockUser });

    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(emailInput).toHaveValue('');
    });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    api.createUser.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
    );

    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /create user/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should display success message after creating user', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    };

    api.createUser.mockResolvedValue({ data: mockUser });

    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/user created successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    const user = userEvent.setup();
    api.createUser.mockRejectedValue({
      request: {}
    });

    render(<CreateUserForm onUserCreated={mockOnUserCreated} />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/cannot connect to backend/i)).toBeInTheDocument();
    });
  });
});
