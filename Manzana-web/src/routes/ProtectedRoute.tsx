import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { loading, user, session, isAdminOrStaff, userProfile } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="spinner"></div>
        <span>Loading...</span>
      </div>
    )
  }

  // Check if user has valid session and admin/staff permissions
  if (!user || !session || !userProfile || !isAdminOrStaff) {
    console.log('ProtectedRoute - redirecting to login:', {
      user: !!user,
      session: !!session,
      userProfile: !!userProfile,
      isAdminOrStaff,
      userType: userProfile?.user_type
    })
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
