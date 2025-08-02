import React, { useEffect, useRef } from 'react';

const EdgeContextMenu = ({ x, y, onSelect, onDelete, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      id="edge-menu"
      className="absolute bg-white border rounded shadow w-32 z-50"
      style={{ left: x, top: y }}
    >
      <ul>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onSelect}>Select</li>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onDelete}>Delete</li>
      </ul>
    </div>
  );
};

export default EdgeContextMenu;