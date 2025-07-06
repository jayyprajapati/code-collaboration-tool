import PropTypes from "prop-types";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

export default function RoleManager({ users, onRoleChange }) {
  return (
    <div className="role-manager">
      <div className="role-manager-title">
        <ManageAccountsIcon /> Manage Roles
      </div>
      {users.map((user) => (
        <div className="manage-user-name-role" key={user.name}>
          <div className="manage-user-name">{user.name}</div>
          <select
            className="manage-user-role-dropdown"
            value={user.role} // Use the role from the user object
            onChange={(e) => onRoleChange(user.name, e.target.value)} // Directly call onRoleChange
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
        </div>
      ))}
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
