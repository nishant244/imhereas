'use client';

import { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';

const allowedNames = ['cutie', 'dragon', 'cld'];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isNameAllowed, setIsNameAllowed] = useState(false);
  const [hasStoredName, setHasStoredName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [contentEditableSupported, setContentEditableSupported] = useState(true);

  // Ref for the contentEditable div
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const testDiv = document.createElement('div');
      if (!('isContentEditable' in testDiv)) {
        setContentEditableSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.clear();
    const savedName = sessionStorage.getItem('allowedName');
    if (savedName && allowedNames.includes(savedName.toLowerCase())) {
      setFormData(prev => ({ ...prev, name: savedName }));
      setIsNameAllowed(true);
      setHasStoredName(true);
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitted(false);
    setError(false);

    if (name === 'name') {
      const isValid = allowedNames.includes(value.trim().toLowerCase());
      setIsNameAllowed(isValid);

      if (isValid) {
        sessionStorage.setItem('allowedName', value.trim());
        setHasStoredName(true);
      }
    }
  };

  const sendForm = async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/.netlify/functions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          message: formData.message.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      setSubmitted(true);

      // Clear React state first
      setFormData(prev => ({ ...prev, message: '' }));

      // Clear contentEditable div content manually after state update
      if (messageRef.current) {
        messageRef.current.textContent = '';
      }

      setLoading(false);
      return true;
    } catch {
      setLoading(false);
      setError(true);
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const success = await sendForm();
    if (!success) {
      setTimeout(() => {
        sendForm();
      }, 3000);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col gap-10 justify-center items-center p-4"
      style={{ overflowX: 'auto', paddingBottom: '40vh', paddingInline: '10vw' }}
    >
      <div className="w-full max-w-md p-6 rounded space-y-10">
        <h1
          className="text-4xl font-bold text-center"
          style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.35)', paddingBottom: '1rem' }}
        >
          Hey there!
        </h1>

        <div
          className="my-4 h-10 flex justify-center items-center shadow-3xl shadow-gray-950"
          style={{ paddingBottom: '0.5rem' }}
        >
          {loading && <div className="loader invert-svg"></div>}
          {!loading && submitted && (
            <p className="text-green-600 text-xl font-medium text-center">Got it!</p>
          )}
          {!loading && error && (
            <p
              className="text-red-600 text-xl font-medium text-center"
              style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.35)' }}
            >
              Try again...
            </p>
          )}
        </div>

        <div className="shadow-2xl shadow-gray-950 rounded-3xl px-1 overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full p-6">
            {!hasStoredName && (
              <input
                key="name-input"
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                autoComplete="off"
                spellCheck={false}
                className="p-2 h-10 border outline-none rounded-3xl w-full text-lg focus-within:border-black focus-within:border-2 text-center shadow-3xl shadow-gray-950"
              />
            )}

            {isNameAllowed && (
              <div className="flex w-full items-center space-x-3">
                <div
                  className="h-10 flex-1 border rounded-l-3xl overflow-hidden flex items-center out focus-within:border-2"
                  style={{ paddingRight: '1rem' }}
                >
                  {contentEditableSupported ? (
                    <div
                      ref={messageRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        const value = e.currentTarget.textContent || '';
                        setFormData(prev => ({ ...prev, message: value }));
                        setSubmitted(false);
                        setError(false);
                      }}
                      className="h-full w-full outline-none text-lg text-left leading-[2.5rem] whitespace-nowrap"
                      style={{
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                        boxSizing: 'border-box',
                        lineHeight: '2.5rem',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    />
                  ) : (
                    <input
                      key="message-input"
                      type="text"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="h-full w-full border-none outline-none rounded-l-3xl px-4 text-lg text-left"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        boxSizing: 'border-box',
                        paddingTop: '0',
                        paddingBottom: '0',
                      }}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  className="rounded-r-3xl shadow-2xl shadow-gray-950 flex items-center justify-center w-16 h-10 hover:bg-gray-900 active:scale-95 transition-all duration-150 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--foreground)',
                    color: 'var(--background)',
                  }}
                  disabled={!formData.message.trim() || loading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
