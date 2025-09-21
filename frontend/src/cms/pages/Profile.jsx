import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Save, Bell, Volume2, VolumeX } from 'lucide-react';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import soundManager from '../utils/soundUtils';
import toast from 'react-hot-toast';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchUserProfile();
    // Load sound preference
    setSoundEnabled(soundManager.getSoundPreference());
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data);
      reset(response.data);
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const response = await authService.updateProfile(data);
      setUser(response.data);
      authService.setUser(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    soundManager.setSoundPreference(newValue);
    toast.success(newValue ? 'Sound notifications enabled' : 'Sound notifications disabled');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <User size={32} className="text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email Address
            </label>
            <Input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              Current Password
            </label>
            <Input
              type="password"
              {...register('currentPassword')}
              placeholder="Enter current password (required to change password)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Only required if you want to change your password
            </p>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              New Password
            </label>
            <Input
              type="password"
              {...register('newPassword', {
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Leave blank to keep current password
            </p>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Role:</span>
                <span className="ml-2 font-medium capitalize">{user?.role}</span>
              </div>
              <div>
                <span className="text-gray-600">Member since:</span>
                <span className="ml-2 font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Bell size={20} className="mr-2" />
          Notification Preferences
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Sound Notifications</h3>
              <p className="text-sm text-gray-500">
                Play a sound when new orders are received
              </p>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                soundEnabled ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {soundEnabled ? (
              <>
                <Volume2 size={16} />
                <span>Sound notifications are enabled</span>
              </>
            ) : (
              <>
                <VolumeX size={16} />
                <span>Sound notifications are disabled</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Security Notice</h3>
        <p className="text-sm text-yellow-700">
          For security reasons, you must enter your current password to change your email or password. 
          All changes are logged and monitored.
        </p>
      </div>
    </div>
  );
};

export default Profile;
