import React, { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField, FormFieldType } from '@nearbybazaar/types';

const FIELD_TYPES: FormFieldType[] = ['text', 'textarea', 'select', 'checkbox', 'radio'];

function getDefaultField(type: FormFieldType): FormField {
  return {
    id: Math.random().toString(36).slice(2),
    type,
    label: `${type[0].toUpperCase() + type.slice(1)} Field`,
    options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    required: false,
  };
}

export default function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [dragActive, setDragActive] = useState(false);

  function handleAddField(type: FormFieldType) {
    setFields((f) => [...f, getDefaultField(type)]);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      setFields(arrayMove(fields, oldIndex, newIndex));
    }
    setDragActive(false);
  }

  async function handleSave() {
    // Save form schema to backend
    await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    alert('Form saved!');
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Form Builder</h2>
      <div style={{ marginBottom: 16 }}>
        {FIELD_TYPES.map((type) => (
          <button key={type} onClick={() => handleAddField(type)} style={{ marginRight: 8 }}>
            Add {type}
          </button>
        ))}
      </div>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={() => setDragActive(true)}
      >
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {fields.map((field) => (
              <li
                key={field.id}
                style={{
                  marginBottom: 12,
                  background: dragActive ? '#f0f0f0' : '#fff',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                }}
              >
                <strong>{field.label}</strong> ({field.type})
                {field.options && <div>Options: {field.options.join(', ')}</div>}
                <div>Required: {field.required ? 'Yes' : 'No'}</div>
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button onClick={handleSave} style={{ marginTop: 24 }}>
        Save Form
      </button>
    </div>
  );
}
