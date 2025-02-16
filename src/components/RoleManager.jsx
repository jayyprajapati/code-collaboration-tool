import { useState } from "react";
import PropTypes from "prop-types";

export default function RoleManager({ users, onRoleChange }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("editor");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUser) {
      onRoleChange(selectedUser, selectedRole);
    }
  };

  return (
    <div className="role-manager">
      <h4>Manage Roles</h4>
      <form onSubmit={handleSubmit}>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.name} value={user.name}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </select>

        <button type="submit">Update Role</button>
      </form>
    </div>
  );
}

RoleManager.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
    })
  ).isRequired,
  onRoleChange: PropTypes.func.isRequired,
};
