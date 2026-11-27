import { useLayoutEffect, useRef, useState } from 'react';

// Native dialogs keep keyboard focus and portal content in the same top layer.
export default function WorkspaceDialog({ label, onClose, size = 'form', children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    setVisible(true); // Leaflet must measure its container after the dialog opens.
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={ref} aria-label={label} className={`workspace-dialog dialog-${size}`}
      onCancel={event => { event.preventDefault(); onClose(); }}>
      {visible && children}
    </dialog>
  );
}
