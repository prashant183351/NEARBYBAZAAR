// ...existing code...
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
          {/* 'number' is not a valid FormFieldType, so skip */}
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
          {/* 'file' is not a valid FormFieldType, so skip */}
        </div>
      ))}
    </form>
  );
};
