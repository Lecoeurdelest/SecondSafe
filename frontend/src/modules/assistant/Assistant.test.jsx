import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Assistant from './Assistant';
import assistantService from '../../services/assistant.service';

jest.mock('../../services/assistant.service', () => ({
  __esModule: true,
  default: {
    ask: jest.fn(),
    getModerationGuidance: jest.fn()
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.setItem('token', 'test-token');
  assistantService.ask.mockResolvedValue({
    answer: 'Bạn có thể xem các sản phẩm đang bán.',
    products: []
  });
});

test('customers can ask the assistant a FAQ question', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Assistant />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText('Bạn cần trợ giúp về'), {
    target: { value: 'faq' }
  });
  fireEvent.change(screen.getByLabelText('Câu hỏi'), {
    target: { value: 'Làm sao để mở yêu cầu hỗ trợ?' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Hỏi trợ lý' }));

  await waitFor(() => expect(assistantService.ask).toHaveBeenCalledWith({
    message: 'Làm sao để mở yêu cầu hỗ trợ?',
    mode: 'faq'
  }));
  expect(await screen.findByText('Bạn có thể xem các sản phẩm đang bán.')).toBeInTheDocument();
  expect(screen.getByText(/Google Gemini chỉ nhận chủ đề FAQ/)).toBeInTheDocument();
});
