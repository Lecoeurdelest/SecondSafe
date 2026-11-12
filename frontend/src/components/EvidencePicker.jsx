import React, { useRef } from 'react';
import { Button, Flex, Typography } from 'antd';
import { Plus, X } from '@phosphor-icons/react';
import { getImageUrl } from '../utils/imageHelper';
import './EvidencePicker.css';

export default function EvidencePicker({
  id,
  files,
  accept,
  max = 5,
  disabled,
  uploading,
  buttonLabel = 'Chọn tệp',
  notes = [],
  isVideo = () => false,
  imageAlt = (index) => `Bằng chứng ${index + 1}`,
  onSelect,
  onRemove
}) {
  const input = useRef(null);

  return (
    <div className="evidence-picker">
      <input
        ref={input}
        id={id}
        type="file"
        accept={accept}
        multiple
        hidden
        aria-label={buttonLabel}
        disabled={disabled || files.length >= max}
        onChange={onSelect}
      />
      <Button
        icon={<Plus />}
        disabled={disabled || uploading || files.length >= max}
        onClick={() => input.current.click()}
      >
        {buttonLabel}
      </Button>
      {notes.map(note => <Typography.Text key={note} type="secondary" className="evidence-picker__note">{note}</Typography.Text>)}
      {uploading && <Typography.Text type="secondary" role="status" className="evidence-picker__note">Đang tải tệp lên...</Typography.Text>}
      {files.length > 0 && (
        <Flex wrap gap={10} className="evidence-picker__grid">
          {files.map((url, index) => (
            <div key={`${url}-${index}`} className="evidence-picker__item">
              {isVideo(url) ? <video src={getImageUrl(url)} controls /> : <img src={getImageUrl(url)} alt={imageAlt(index)} />}
              <Button
                className="evidence-picker__remove"
                shape="circle"
                size="small"
                icon={<X />}
                aria-label="Xóa tệp"
                disabled={disabled}
                onClick={() => onRemove(index)}
              />
            </div>
          ))}
        </Flex>
      )}
    </div>
  );
}
