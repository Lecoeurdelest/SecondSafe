import React, { useRef } from 'react';
import { Button, Flex, Typography } from 'antd';
import { Plus, X } from '@phosphor-icons/react';

export default function ProductImagePicker({ images, canAdd, accept, hint, error, onAdd, onRemove }) {
  const input = useRef(null);

  return (
    <div className="image-picker">
      <Flex wrap gap={12} className="image-picker__tiles">
        {images.map((image, index) => (
          <div key={image.key} className="image-picker__tile">
            <img src={image.src} alt={image.alt} onError={image.onError} />
            <Button
              className="image-picker__remove"
              shape="circle"
              size="small"
              icon={<X />}
              aria-label="Xóa ảnh"
              title="Xóa ảnh"
              onClick={() => onRemove(image, index)}
            />
          </div>
        ))}
        {canAdd && (
          <Button className="image-picker__add" type="dashed" icon={<Plus />} onClick={() => input.current.click()}>
            Up ảnh
          </Button>
        )}
      </Flex>
      <input ref={input} type="file" accept={accept} multiple hidden aria-label="Chọn ảnh sản phẩm" onChange={onAdd} />
      {hint && <Typography.Text type="secondary" className="image-picker__hint">{hint}</Typography.Text>}
      {error && <Typography.Text type="danger" className="image-picker__error" role="alert">{error}</Typography.Text>}
    </div>
  );
}
