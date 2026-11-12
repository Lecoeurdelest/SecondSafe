import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function LinkButton({ to, onClick, ...props }) {
  const navigate = useNavigate();

  function handleClick(event) {
    if (onClick) onClick(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
    event.preventDefault();
    navigate(to);
  }

  return <Button {...props} href={to} onClick={handleClick} />;
}
