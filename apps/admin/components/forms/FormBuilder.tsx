import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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
    // setDragActive(false); // removed unused dragActive
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
        // onDragStart removed: dragActive state not used
      >
        {/* ...rest of the drag-and-drop UI... */}
      </DndContext>
      <button onClick={handleSave} style={{ marginTop: 24 }}>
        Save Form
      </button>
    </div>
  );
}
