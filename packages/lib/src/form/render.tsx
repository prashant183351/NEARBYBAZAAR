import React from 'react';
import { FormField } from '@nearbybazaar/types';

interface FormRendererProps {
  fields: FormField[];
  value: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export const FormRenderer: React.FC<FormRendererProps> = ({ fields, value, onChange }) => {
  function handleChange(id: string, val: any) {
    onChange({ ...value, [id]: val });
  }

  return (
    <form>
      {fields.map((field) => (
        <div key={field.id} style={{ marginBottom: 16 }}>
          <label htmlFor={field.id}>{field.label}</label>
          {field.type === 'text' && (
            <input
              id={field.id}
              type="text"
              value={value[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          )}
          {field.type === 'number' && (
            <input
              id={field.id}
              type="number"
              value={value[field.id] || ''}
              onChange={(e) => handleChange(field.id, Number(e.target.value))}
            />
          )}
          {field.type === 'textarea' && (
            <textarea
              id={field.id}
              value={value[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          )}
          {field.type === 'select' && (
            <select
              id={field.id}
              value={value[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            >
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {field.type === 'checkbox' && (
            <input
              id={field.id}
              type="checkbox"
              checked={!!value[field.id]}
              onChange={(e) => handleChange(field.id, e.target.checked)}
            />
          )}
          {field.type === 'radio' && (
            <>
              {(field.options || []).map((opt) => (
                <label key={opt}>
                  <input
                    type="radio"
                    name={field.id}
                    value={opt}
                    checked={value[field.id] === opt}
                    onChange={() => handleChange(field.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </>
          )}
          {field.type === 'file' && (
            <div>
              <input
                id={field.id}
                type="file"
                multiple={field.maxFiles && field.maxFiles > 1}
                accept={field.accept || '*'}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const maxFiles = field.maxFiles || 1;
                  const maxSize = field.maxFileSize || 1024 * 1024 * 5; // default 5MB
                  const validFiles = files.slice(0, maxFiles).filter((f) => f.size <= maxSize);
                  handleChange(field.id, validFiles);
                }}
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {value[field.id]?.length || 0} of {field.maxFiles || 1} files uploaded. Max size:{' '}
                {(field.maxFileSize || 1024 * 1024 * 5) / (1024 * 1024)}MB
              </div>
              {value[field.id]?.some(
                (f: File) => f.size > (field.maxFileSize || 1024 * 1024 * 5),
              ) && (
                <div style={{ color: 'red', fontSize: 12 }}>
                  Some files exceed the maximum size.
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </form>
  );
};
