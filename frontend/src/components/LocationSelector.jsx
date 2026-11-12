import React, { useState, useEffect } from 'react';
import { Form, Select } from 'antd';
import locationService from '../services/location.service';
import './LocationSelector.css';

const toOptions = (items) => items.map(item => ({ value: item.code, label: item.name }));

const LocationSelector = ({ value, onChange, errors }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  // Tai danh sach tinh/thanh khi component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Tai gia tri co san neu duoc truyen vao
  useEffect(() => {
    if (value?.provinceCode && provinces.length > 0) {
      const province = provinces.find(p => p.code === value.provinceCode);
      if (province) {
        setSelectedProvince(province);
        loadDistricts(province.code);
      }
    }
  }, [value?.provinceCode, provinces]);

  useEffect(() => {
    if (value?.districtCode && districts.length > 0) {
      const district = districts.find(d => d.code === value.districtCode);
      if (district) {
        setSelectedDistrict(district);
        loadWards(district.code);
      }
    }
  }, [value?.districtCode, districts]);

  useEffect(() => {
    if (value?.wardCode && wards.length > 0) {
      const ward = wards.find(w => w.code === value.wardCode);
      if (ward) {
        setSelectedWard(ward);
      }
    }
  }, [value?.wardCode, wards]);

  const loadProvinces = async () => {
    const data = await locationService.getProvinces();
    setProvinces(data);
  };

  const loadDistricts = async (provinceCode) => {
    const data = await locationService.getDistricts(provinceCode);
    setDistricts(data);
  };

  const loadWards = async (districtCode) => {
    const data = await locationService.getWards(districtCode);
    setWards(data);
  };

  const handleProvinceChange = (code) => {
    const province = provinces.find(p => p.code === code);
    
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    if (province) {
      loadDistricts(province.code);
      onChange({
        city: province.name,
        district: '',
        ward: '',
        provinceCode: province.code,
        districtCode: null,
        wardCode: null
      });
    } else {
      onChange({
        city: '',
        district: '',
        ward: '',
        provinceCode: null,
        districtCode: null,
        wardCode: null
      });
    }
  };

  const handleDistrictChange = (code) => {
    const district = districts.find(d => d.code === code);
    
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);

    if (district) {
      loadWards(district.code);
      onChange({
        city: selectedProvince.name,
        district: district.name,
        ward: '',
        provinceCode: selectedProvince.code,
        districtCode: district.code,
        wardCode: null
      });
    } else {
      onChange({
        city: selectedProvince.name,
        district: '',
        ward: '',
        provinceCode: selectedProvince.code,
        districtCode: null,
        wardCode: null
      });
    }
  };

  const handleWardChange = (code) => {
    const ward = wards.find(w => w.code === code);
    
    setSelectedWard(ward);

    if (ward) {
      onChange({
        city: selectedProvince.name,
        district: selectedDistrict.name,
        ward: ward.name,
        provinceCode: selectedProvince.code,
        districtCode: selectedDistrict.code,
        wardCode: ward.code
      });
    } else {
      onChange({
        city: selectedProvince.name,
        district: selectedDistrict.name,
        ward: '',
        provinceCode: selectedProvince.code,
        districtCode: selectedDistrict.code,
        wardCode: null
      });
    }
  };

  return (
    <div className="location-selector">
      <Form.Item
        label="Tỉnh/Thành phố"
        htmlFor="province"
        required
        validateStatus={errors?.city ? 'error' : undefined}
        help={errors?.city}
      >
        <Select
          id="province"
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="Chọn Tỉnh/Thành phố"
          value={selectedProvince?.code}
          options={toOptions(provinces)}
          onChange={handleProvinceChange}
        />
      </Form.Item>

      <Form.Item
        label="Quận/Huyện"
        htmlFor="district"
        required
        validateStatus={errors?.district ? 'error' : undefined}
        help={errors?.district}
      >
        <Select
          id="district"
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="Chọn Quận/Huyện"
          disabled={!selectedProvince}
          value={selectedDistrict?.code}
          options={toOptions(districts)}
          onChange={handleDistrictChange}
        />
      </Form.Item>

      <Form.Item label="Phường/Xã" htmlFor="ward">
        <Select
          id="ward"
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="Chọn Phường/Xã"
          disabled={!selectedDistrict}
          value={selectedWard?.code}
          options={toOptions(wards)}
          onChange={handleWardChange}
        />
      </Form.Item>
    </div>
  );
};

export default LocationSelector;
