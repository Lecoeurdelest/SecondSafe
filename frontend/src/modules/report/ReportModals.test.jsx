import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReportProduct from './ReportProduct';
import ReportUser from './ReportUser';
import Dispute from './Dispute';
import { createProductReport, createUserReport, createDispute, uploadEvidenceImages, uploadEvidenceMedia } from '../../services/report.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/report.service', () => ({
  createProductReport: jest.fn(),
  createUserReport: jest.fn(),
  createDispute: jest.fn(),
  uploadEvidenceImages: jest.fn(),
  uploadEvidenceMedia: jest.fn()
}));

const PRODUCT = { _id: 'product-1', title: 'Balo cũ', price: 150000, images: [], seller: { fullName: 'Người bán A' } };
const USER = { _id: 'user-9', fullName: 'Trần Thị B', rating: 4.25 };
const ORDER = { _id: 'order-1', agreedPrice: 250000, listing: { title: 'Sách cũ', images: [] }, seller: { fullName: 'Người bán A' } };

function show(element) {
  return render(<AppProviders language="vi" themeMode="light">{element}</AppProviders>);
}

async function choose(label, option) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(await screen.findByText(option, { selector: '.ant-select-item-option-content' }));
}

const file = (name = 'a.jpg', type = 'image/jpeg') => new File(['x'], name, { type });

beforeEach(() => jest.clearAllMocks());

describe('ReportProduct', () => {
  function open() {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    show(<ReportProduct product={PRODUCT} onSuccess={onSuccess} onCancel={onCancel} />);
    return { onSuccess, onCancel };
  }

  test('shows the listing and keeps the send button disabled until a reason and a description are given', () => {
    open();
    expect(screen.getByText('Báo cáo sản phẩm', { selector: '.ant-modal-title' })).toBeInTheDocument();
    expect(screen.getByText('Balo cũ')).toBeInTheDocument();
    expect(screen.getByText('Người bán: Người bán A')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gửi báo cáo' })).toBeDisabled();
  });

  test('a too short description is refused and a valid report is sent with its evidence', async () => {
    createProductReport.mockResolvedValue({});
    uploadEvidenceImages.mockResolvedValue(['/uploads/e.jpg']);
    const { onSuccess } = open();

    await choose('Lý do báo cáo', 'Lừa đảo');
    fireEvent.change(screen.getByLabelText('Mô tả chi tiết'), { target: { value: 'ngắn' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mô tả phải có ít nhất 10 ký tự');
    expect(createProductReport).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Mô tả chi tiết'), { target: { value: 'Người bán yêu cầu chuyển khoản trước.' } });
    fireEvent.change(screen.getByLabelText('Chọn ảnh', { selector: 'input' }), { target: { files: [file()] } });
    expect(await screen.findByRole('img', { name: 'Bằng chứng 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo' }));

    await waitFor(() => expect(createProductReport).toHaveBeenCalledWith('product-1', 'scam', 'Người bán yêu cầu chuyển khoản trước.', ['/uploads/e.jpg']));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('evidence can be removed and a failed send shows the message', async () => {
    createProductReport.mockRejectedValue(new Error('Bạn đã báo cáo sản phẩm này.'));
    uploadEvidenceImages.mockResolvedValue(['/uploads/e.jpg']);
    open();

    await choose('Lý do báo cáo', 'Spam');
    fireEvent.change(screen.getByLabelText('Mô tả chi tiết'), { target: { value: 'Tin đăng lặp lại nhiều lần.' } });
    fireEvent.change(screen.getByLabelText('Chọn ảnh', { selector: 'input' }), { target: { files: [file()] } });
    await screen.findByRole('img', { name: 'Bằng chứng 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tệp' }));
    expect(screen.queryByRole('img', { name: 'Bằng chứng 1' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn đã báo cáo sản phẩm này.');
  });

  test('cancelling calls the handler', () => {
    const { onCancel } = open();
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ReportUser', () => {
  test('shows the user and sends a report with a video as evidence', async () => {
    createUserReport.mockResolvedValue({});
    uploadEvidenceImages.mockResolvedValue(['/uploads/clip.mp4']);
    const onSuccess = jest.fn();
    const { container } = show(<ReportUser reportedUser={USER} onSuccess={onSuccess} onCancel={jest.fn()} />);

    expect(screen.getByText('Báo cáo người dùng', { selector: '.ant-modal-title' })).toBeInTheDocument();
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    expect(screen.getByText('Đánh giá: 4.3/5')).toBeInTheDocument();

    await choose('Lý do báo cáo', 'Hành vi không phù hợp');
    fireEvent.change(screen.getByLabelText('Mô tả chi tiết'), { target: { value: 'Nhắn tin quấy rối nhiều lần.' } });
    fireEvent.change(screen.getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [file('clip.mp4', 'video/mp4')] } });
    await waitFor(() => expect(document.querySelector('video')).not.toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo' }));

    await waitFor(() => expect(createUserReport).toHaveBeenCalledWith('user-9', 'inappropriate', 'Nhắn tin quấy rối nhiều lần.', ['/uploads/clip.mp4']));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(container).toBeDefined();
  });
});

describe('Dispute', () => {
  function open(props = {}) {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    show(<Dispute order={ORDER} onSuccess={onSuccess} onCancel={onCancel} {...props} />);
    return { onSuccess, onCancel };
  }

  test('starts from the suggested reason and needs at least one evidence file', async () => {
    createDispute.mockResolvedValue({});
    uploadEvidenceMedia.mockResolvedValue(['/uploads/box.mp4']);
    const { onSuccess } = open({ initialReason: 'not_received' });

    expect(screen.getByText('Tạo khiếu nại', { selector: '.ant-modal-title' })).toBeInTheDocument();
    expect(screen.getByText('Mã đơn: order-1')).toBeInTheDocument();
    expect(screen.getByTitle('Không nhận được hàng')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Mô tả chi tiết vấn đề'), { target: { value: 'Quá 7 ngày vẫn chưa nhận được hàng.' } });
    expect(screen.getByRole('button', { name: 'Tạo khiếu nại' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [file('box.mp4', 'video/mp4')] } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tạo khiếu nại' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Tạo khiếu nại' }));

    await waitFor(() => expect(createDispute).toHaveBeenCalledWith('order-1', 'not_received', 'Quá 7 ngày vẫn chưa nhận được hàng.', ['/uploads/box.mp4']));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('shows the important notes and a failed upload message', async () => {
    uploadEvidenceMedia.mockRejectedValue(new Error('Video vượt quá 3 phút.'));
    open();

    expect(screen.getByText('Khiếu nại chỉ được tạo cho đơn hàng đã được giao')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [file('long.mp4', 'video/mp4')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Video vượt quá 3 phút.');
  });
});
