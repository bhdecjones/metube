'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';

interface PinDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<void>;
  title?: string;
}

export function PinDialog({ open, onClose, onSubmit, title = 'Enter PIN' }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(pin);
      setPin('');
    } catch (err: any) {
      setError(err?.message ?? 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setError(null);
    onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="transition transform duration-150"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transition transform duration-100"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="w-full max-w-sm rounded-xl border border-gray-700 bg-black p-6 shadow-2xl">
              <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  className="rounded bg-gray-800 px-3 py-2 text-lg tracking-widest text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  placeholder="••••"
                  minLength={4}
                  maxLength={10}
                />
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 disabled:opacity-60"
                  >
                    {loading ? 'Verifying…' : 'Confirm'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
