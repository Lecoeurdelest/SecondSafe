import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LocationSelector from './LocationSelector';
import locationService from '../services/location.service';
import AppProviders from '../ui/AppProviders';

jest.mock('../services/location.service', () => ({
  __esModule: true,
  default: { getProvinces: jest.fn(), getDistricts: jest.fn(), getWards: jest.fn() }
}));

const PROVINCES = [{ code: 1, name: 'Hà Nội' }, { code: 79, name: 'TP. Hồ Chí Minh' }];
const DISTRICTS = [{ code: 10, name: 'Ba Đình' }, { code: 11, name: 'Cầu Giấy' }];
const WARDS = [{ code: 100, name: 'Phúc Xá' }];

function Harness({ initial, errors, onChange }) {
  const [value, setValue] = React.useState(initial);
  return (
    <AppProviders language="vi" themeMode="light">
      <LocationSelector value={value} errors={errors} onChange={next => { setValue(next); onChange(next); }} />
    </AppProviders>
  );
}

async function choose(name, option) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name }));
  fireEvent.click(await screen.findByText(option, { selector: '.ant-select-item-option-content' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  locationService.getProvinces.mockResolvedValue(PROVINCES);
  locationService.getDistricts.mockResolvedValue(DISTRICTS);
  locationService.getWards.mockResolvedValue(WARDS);
});

test('district and ward stay disabled until their parent is chosen', async () => {
  render(<Harness initial={{}} errors={{}} onChange={jest.fn()} />);
  await waitFor(() => expect(locationService.getProvinces).toHaveBeenCalled());

  expect(screen.getByRole('combobox', { name: 'Tỉnh/Thành phố' })).toBeEnabled();
  expect(screen.getByRole('combobox', { name: 'Quận/Huyện' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Phường/Xã' })).toBeDisabled();
});

test('choosing a province, district and ward reports names and codes at every step', async () => {
  const onChange = jest.fn();
  render(<Harness initial={{}} errors={{}} onChange={onChange} />);

  await choose('Tỉnh/Thành phố', 'Hà Nội');
  expect(onChange).toHaveBeenLastCalledWith({ city: 'Hà Nội', district: '', ward: '', provinceCode: 1, districtCode: null, wardCode: null });
  await waitFor(() => expect(locationService.getDistricts).toHaveBeenCalledWith(1));

  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Quận/Huyện' })).toBeEnabled());
  await choose('Quận/Huyện', 'Ba Đình');
  expect(onChange).toHaveBeenLastCalledWith({ city: 'Hà Nội', district: 'Ba Đình', ward: '', provinceCode: 1, districtCode: 10, wardCode: null });

  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Phường/Xã' })).toBeEnabled());
  await choose('Phường/Xã', 'Phúc Xá');
  expect(onChange).toHaveBeenLastCalledWith({ city: 'Hà Nội', district: 'Ba Đình', ward: 'Phúc Xá', provinceCode: 1, districtCode: 10, wardCode: 100 });
});

test('a saved location is restored into the three selects', async () => {
  render(<Harness initial={{ provinceCode: 1, districtCode: 10, wardCode: 100 }} errors={{}} onChange={jest.fn()} />);

  await waitFor(() => expect(screen.getByTitle('Phúc Xá')).toBeInTheDocument());
  expect(screen.getByTitle('Hà Nội')).toBeInTheDocument();
  expect(screen.getByTitle('Ba Đình')).toBeInTheDocument();
});

test('clearing the province resets the location and validation messages are shown', async () => {
  const onChange = jest.fn();
  render(<Harness initial={{ provinceCode: 1 }} errors={{ city: 'Vui lòng nhập thành phố', district: 'Vui lòng nhập quận/huyện' }} onChange={onChange} />);

  expect(screen.getByText('Vui lòng nhập thành phố')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập quận/huyện')).toBeInTheDocument();

  await waitFor(() => expect(screen.getByTitle('Hà Nội')).toBeInTheDocument());
  const select = screen.getByRole('combobox', { name: 'Tỉnh/Thành phố' }).closest('.ant-select');
  const clear = select.querySelector('.ant-select-clear');
  expect(clear).not.toBeNull();
  fireEvent.mouseDown(clear);
  fireEvent.click(clear);
  await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ city: '', district: '', ward: '', provinceCode: null, districtCode: null, wardCode: null }));
});
