import { useState } from 'react';

const ROLES = ['admin', 'vendor', 'user', 'guest'];
const PERMISSIONS = [
  { key: 'view', label: 'Can view form' },
  { key: 'submit', label: 'Can submit form' },
  { key: 'edit', label: 'Can edit form' },
  { key: 'delete', label: 'Can delete form' },
];

export default function FormPermissions({
  form,
  onSave,
}: {
  form: any;
  onSave: (perms: any) => void;
}) {
  const [permissions, setPermissions] = useState(form.permissions || {});

  function handleToggle(role: string, perm: string) {
    setPermissions((p: typeof permissions) => ({
      ...p,
      [role]: { ...p[role], [perm]: !p[role]?.[perm] },
    }));
  }

  function handleSave() {
    onSave(permissions);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Form Permissions</h2>
      <p>
        Set which roles can view, submit, edit, or delete this form. These settings control API
        authorization via RBAC.
      </p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Role</th>
            {PERMISSIONS.map((perm) => (
              <th key={perm.key}>{perm.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROLES.map((role) => (
            <tr key={role}>
              <td>{role}</td>
              {PERMISSIONS.map((perm) => (
                <td key={perm.key} style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!!permissions[role]?.[perm.key]}
                    onChange={() => handleToggle(role, perm.key)}
                    aria-label={`${perm.label} for ${role}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSave} style={{ marginTop: 16 }}>
        Save Permissions
      </button>
      <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
        <strong>Guidance:</strong> <br />
        <ul>
          <li>
            <b>View</b>: Can see the form and its fields.
          </li>
          <li>
            <b>Submit</b>: Can submit entries to the form.
          </li>
          <li>
            <b>Edit</b>: Can modify the form schema and settings.
          </li>
          <li>
            <b>Delete</b>: Can delete the form.
          </li>
        </ul>
      </div>
    </div>
  );
}
