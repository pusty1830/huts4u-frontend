import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { resetPassword } from '../services/services';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get token and userId from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const userId = queryParams.get('userId') || queryParams.get('id');

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
  });
  const [success, setSuccess] = useState(false);

  

  // Check for token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
    }
  }, [token]);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) feedback.push('Weak - try adding numbers and special characters');
    else if (score < 4) feedback.push('Good - could be stronger');
    else feedback.push('Strong password');

    return { score, feedback: feedback.join('. ') };
  };

  const handlePasswordChange = (field) => (e) => {
    const value = e.target.value;
    setPasswords(prev => ({ ...prev, [field]: value }));

    if (field === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const togglePasswordVisibility = (field) => () => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Please use a stronger password (minimum 8 characters with letters, numbers, and symbols)');
      setLoading(false);
      return;
    }

    try {
      const response =await resetPassword( {
        token,
        userId,
        newPassword: passwords.newPassword,
      });
    
setSuccess(true);
        setMessage(response.msg);
        
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
     
     
        
      
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err.response?.data?.message || 
        'Invalid or expired reset link. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
          
          <Typography component="h1" variant="h4" gutterBottom>
            Password Reset Successful!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {message}
          </Typography>

          <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
            You can now login with your new password.
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Redirecting to login page...
            </Typography>
          </Alert>

          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 3 }}>
          <img
            src="https://huts44u.s3.ap-south-1.amazonaws.com/hutlogo-removebg-preview.png"
            alt="Huts4u Logo"
            style={{ width: '120px', height: 'auto' }}
          />
        </Box>

        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create New Password
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Your new password must be different from previous passwords.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* New Password */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type={showPassword.newPassword ? 'text' : 'password'}
              id="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange('newPassword')}
              disabled={loading || !token}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility('newPassword')}
                      edge="end"
                    >
                      {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Strength Indicator */}
            {passwords.newPassword && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Password Strength: {passwordStrength.feedback}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {[1, 2, 3, 4, 5].map((index) => (
                    <Box
                      key={index}
                      sx={{
                        flex: 1,
                        height: 4,
                        backgroundColor: index <= passwordStrength.score 
                          ? (passwordStrength.score < 3 ? 'error.main' : 
                             passwordStrength.score < 4 ? 'warning.main' : 'success.main')
                          : 'grey.300',
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Confirm Password */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type={showPassword.confirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
              disabled={loading || !token}
              error={passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword}
              helperText={passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword 
                ? 'Passwords do not match' 
                : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility('confirmPassword')}
                      edge="end"
                    >
                      {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Requirements */}
            <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight="bold" display="block">
                Password Requirements:
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • Minimum 8 characters
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • At least one uppercase letter
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • At least one number
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • At least one special character
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 1, mb: 2, py: 1.5 }}
              disabled={loading || !token || !passwords.newPassword || !passwords.confirmPassword}
              startIcon={loading ? <CircularProgress size={20} /> : <LockResetIcon />}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Link>
            </Box>
          </Box>
        </Paper>

        {/* Security Notice */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            For security, this link can only be used once.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ResetPassword;