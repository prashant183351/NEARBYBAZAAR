import React, { useState } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const initialIdeas = [
    { id: '1', title: 'Improve onboarding', status: 'Backlog' },
    { id: '2', title: 'Add analytics dashboard', status: 'Backlog' },
    { id: '3', title: 'Refactor API', status: 'In Progress' },
    { id: '4', title: 'Automate tests', status: 'Completed' },
];

const columns = ['Backlog', 'In Progress', 'Completed'];

export default function KaizenBoard() {
    const [ideas, setIdeas] = useState(initialIdeas);
    const sensors = useSensors(useSensor(PointerSensor));

    function handleDragEnd(event: any) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const activeIdea = ideas.find(i => i.id === active.id);
        if (!activeIdea) return;
        // Move idea to new column
        setIdeas(ideas.map(i => i.id === active.id ? { ...i, status: over.id } : i));
        // TODO: Persist to server
    }

    return (
        <div style={{ display: 'flex', gap: 32, padding: 32 }}>
            {columns.map(col => (
                <div key={col} style={{ flex: 1, background: '#f7f7f7', borderRadius: 8, padding: 16 }}>
                    <h3>{col}</h3>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={ideas.filter(i => i.status === col).map(i => i.id)} strategy={verticalListSortingStrategy}>
                            {ideas.filter(i => i.status === col).map(i => (
                                <div key={i.id} id={i.id} style={{ background: '#fff', margin: '8px 0', padding: 12, borderRadius: 4, boxShadow: '0 1px 4px #ccc' }}>
                                    {i.title}
                                </div>
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            ))}
        </div>
    );
}
