import logo from '../assets/logo.svg'
import { useAuth } from '../contexts/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import IconButton from '@mui/material/IconButton';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
export default function Header() {
  const { currentUser } = useAuth();

    const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (err) {
        console.error(err);
      }
    };
    return (
      <>
      <nav>
        <img src={logo} width='220px' height='70px' alt="" />
        {currentUser && <>
        <div className='logout-btn' onClick={handleLogout}>
          <IconButton color='#ef233c'>
          <LogoutIcon color='#ef233c' />
          </IconButton>
          <div>Logout</div>
        </div>
         
        </>}
      </nav>
      
      </>
    );
  }