'use client';

import { type ElementRef, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
// import React from 'react';


export function Modal({ children , }: { children: React.ReactNode  }) {
  const router = useRouter();
  const dialogRef = useRef<ElementRef<'dialog'>>(null);
  // const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // setMounted(true);
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
    
  }, []);

  function onDismiss() {
    router.back();
  }
 
  // if (!mounted || typeof window === 'undefined') return null; // Ensure client-side only

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; // Prevent errors if modal-root doesn't exist

  return createPortal(
    <div className="modal-backdrop">
      <dialog ref={dialogRef} className="modal" onClose={onDismiss}>
        {children}
        <button onClick={onDismiss} className="close-button"></button>
         

      </dialog>
    </div>,
    modalRoot
  );
}