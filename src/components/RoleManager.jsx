import { useState } from "react";
import PropTypes from "prop-types";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

// import TaskAltIcon from '@mui/icons-material/TaskAlt';
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export default function RoleManager({ users, onRoleChange }) {
  // const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("editor");

  const handleUserRoleChange = (username) => {
    onRoleChange(username, selectedRole);
  };

  return (
    <div className="role-manager">
      <div className="role-manager-title"><ManageAccountsIcon /> Manage Roles</div>
      {/* <div>{users.map((user) => (user.name))}</div> */}
      {users.map((user) => (
        <div className="manage-user-name-role" key={user.name}>
          <div className="manage-user-name">{user.name}</div>
          <form onSubmit={handleUserRoleChange(user.name)} style={{display: 'flex', gap: '5px'}}>
                  <select
                  className="manage-user-role-dropdown"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
          
                  {/* <button type="submit" className="manage-user-role-update-btn"><TaskAltIcon /> Update</button> */}
                </form>

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
