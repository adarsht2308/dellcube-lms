import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState, useEffect } from "react";
import {
  useLoadUserQuery,
  useUpdateUserMutation,
  useSendPasswordResetOTPMutation,
  useVerifyPasswordResetOTPMutation,
} from "../../features/api/authApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Lock, Mail, Phone, Building2, MapPin, Shield, Edit3, Camera, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const Profile = () => {
  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [signatureFile, setSignatureFile] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [passwordResetStep, setPasswordResetStep] = useState(1);
  const [passwordResetOTP, setPasswordResetOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { data, isLoading, refetch } = useLoadUserQuery();
  const [
    updateUser,
    {
      data: updateUserData,
      isLoading: updateUserIsLoading,
      isError,
      error,
      isSuccess,
    },
  ] = useUpdateUserMutation();
  const [sendPasswordResetOTP, { isLoading: isSendingOTP }] =
    useSendPasswordResetOTPMutation();
  const [verifyPasswordResetOTP, { isLoading: isResettingPassword }] =
    useVerifyPasswordResetOTPMutation();

  const onChangeHandler = (e) => {
    const file = e.target.files?.[0];
    const fieldName = e.target.name;

    if (file) {
      if (fieldName === "profilePhoto") {
        setProfilePhoto(file);
      } else if (fieldName === "bannerImage") {
        setBannerImage(file);
      } else if (fieldName === "signature") {
        setSignatureFile(file);
        setSignaturePreview(URL.createObjectURL(file));
      }
    }
  };

  const updateUserHandler = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("profilePhoto", profilePhoto);
    formData.append("bannerImage", bannerImage);
    if (signatureFile) {
      formData.append("signature", signatureFile);
    }
    await updateUser(formData);
  };

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (isSuccess) {
      refetch();
      toast.success(data.message || "Profile updated.");
    }
    if (isError) {
      toast.error(error.message || "Failed to update profile");
    }
  }, [error, updateUserData, isSuccess, isError]);

  const user = data && data.user;
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
      setSignaturePreview(user?.signature?.url || "");
    }
  }, [user]);

  const handleSendPasswordResetOTP = async () => {
    if (!user?.email) {
      toast.error("Email not found");
      return;
    }

    try {
      const result = await sendPasswordResetOTP({ email: user.email }).unwrap();
      if (result.success) {
        toast.success(result.message || "OTP sent to your email");
        setPasswordResetStep(2);
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send OTP");
    }
  };

  const handleResetPassword = async () => {
    if (!passwordResetOTP || passwordResetOTP.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!user?.email) {
      toast.error("Email not found");
      return;
    }

    try {
      const result = await verifyPasswordResetOTP({
        email: user.email,
        otp: passwordResetOTP,
        newPassword,
      }).unwrap();

      if (result.success) {
        toast.success(result.message || "Password reset successfully");
        setShowPasswordResetDialog(false);
        setPasswordResetStep(1);
        setPasswordResetOTP("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reset password");
    }
  };

  if (isLoading) return <MyProfile />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Banner Section */}
      <div className="relative h-56 sm:h-64 md:h-72 overflow-visible">
        <div className="absolute inset-0 overflow-hidden">
        <img
          src={user?.bannerUrl}
          alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 pb-12 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-visible">
          {/* Profile Header */}
          <div className="relative px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="absolute -top-20 sm:-top-24 left-1/2 sm:left-8 transform -translate-x-1/2 sm:translate-x-0 z-20">
                <Avatar className="h-40 w-40 sm:h-48 sm:w-48 border-4 border-white dark:border-gray-800 shadow-2xl ring-4 ring-[#FFD249]/30">
                  <AvatarImage src={user?.photoUrl} alt={user?.name} className="object-cover" />
                  <AvatarFallback className="text-4xl sm:text-5xl bg-gradient-to-br from-[#FFD249] to-[#FFB800] text-[#202020] font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                    </Avatar>
                  </div>

              {/* Name and Action Buttons */}
              <div className="flex-1 text-center sm:text-left space-y-3 sm:space-y-2">
                  <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                          {name}
                      </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    {user?.role?.toUpperCase()}
                  </p>
                      </div>
                
                {user?.status === false && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Account Deactivated</span>
                      </div>
                    )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                    <Button className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium shadow-lg border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80">
                      <Edit3 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                      <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
                          <DialogDescription>
                        Update your profile information and preferences
                          </DialogDescription>
                        </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Name</Label>
                            <Input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e?.target?.value)}
                          placeholder="Enter your name"
                          className="h-11"
                            />
                          </div>
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Profile Photo</Label>
                        <div className="flex items-center gap-3">
                          <Camera className="w-5 h-5 text-gray-400" />
                            <Input
                              onChange={onChangeHandler}
                              type="file"
                              accept="image/*"
                              id="profilePhoto"
                              name="profilePhoto"
                            className="flex-1"
                            />
                          </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Banner Image</Label>
                        <div className="flex items-center gap-3">
                          <Camera className="w-5 h-5 text-gray-400" />
                            <Input
                              onChange={onChangeHandler}
                              type="file"
                              accept="image/*"
                              id="bannerImage"
                              name="bannerImage"
                            className="flex-1"
                            />
                          </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Authorized Signature</Label>
                              <Input
                                onChange={onChangeHandler}
                                type="file"
                                accept="image/*"
                                name="signature"
                              />
                        <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          This signature is embedded automatically on company dockets and invoices created from your account.
                        </p>
                              {signaturePreview && (
                          <div className="mt-3 p-4 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-900">
                                <img
                                  src={signaturePreview}
                                  alt="Signature preview"
                              className="max-h-32 mx-auto"
                                />
                          </div>
                              )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            disabled={updateUserIsLoading}
                            onClick={updateUserHandler}
                        className="w-full sm:w-auto bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
                          >
                            {updateUserIsLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Changes...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordResetDialog(true);
                    setPasswordResetStep(1);
                    setPasswordResetOTP("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="border-2 border-[#FFD249] text-[#202020] bg-white hover:bg-[#FFD249]/20 hover:text-[#202020] dark:bg-[#202020] dark:text-[#FFD249] dark:border-[#FFD249] dark:hover:bg-[#FFD249]/10"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Information Grid */}
          <div className="px-4 sm:px-6 lg:px-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Contact Information Card */}
              <div className="bg-gradient-to-br from-[#FFD249]/10 to-[#FFB800]/10 dark:from-gray-700 dark:to-gray-750 rounded-xl p-6 space-y-4 border border-[#FFD249]/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#FFD249]" />
                  Contact Information
                </h2>
                
                {user?.email && (
                  <div className="flex items-start gap-3 group">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5 group-hover:text-[#FFD249] transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                      <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium break-all">{user?.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 group">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 group-hover:text-[#FFD249] transition-colors" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mobile</p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{user?.mobile}</p>
                  </div>
                </div>
              </div>

              {/* Organization Information Card */}
              <div className="bg-gradient-to-br from-[#FFD249]/10 to-[#FFB800]/10 dark:from-gray-700 dark:to-gray-750 rounded-xl p-6 space-y-4 border border-[#FFD249]/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#FFD249]" />
                  Organization Details
                </h2>
                
                <div className="flex items-start gap-3 group">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5 group-hover:text-[#FFD249] transition-colors" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Company</p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{user?.company?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 group-hover:text-[#FFD249] transition-colors" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Branch</p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{user?.branch?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <Shield className="w-5 h-5 text-gray-400 mt-0.5 group-hover:text-[#FFD249] transition-colors" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${user?.status === false ? 'bg-red-500' : 'bg-green-500'}`} />
                      <p className={`text-sm sm:text-base font-medium ${user?.status === false ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {user?.status === false ? "Deactivated" : "Active"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            {signaturePreview && (
              <div className="mt-6 bg-gradient-to-br from-[#FFD249]/10 to-[#FFB800]/10 dark:from-gray-700 dark:to-gray-750 rounded-xl p-6 border border-[#FFD249]/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#FFD249]" />
                  Authorized Signature
                </h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <img
                    src={signaturePreview}
                    alt="Signature"
                    className="max-h-32 mx-auto sm:mx-0"
                  />
                </div>
              </div>
            )}

            {/* Deactivation Warning */}
            {user?.status === false && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Account Deactivated</h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      Your account is currently deactivated. Please contact support for assistance.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog
        open={showPasswordResetDialog}
        onOpenChange={(open) => {
          setShowPasswordResetDialog(open);
          if (!open) {
            setPasswordResetStep(1);
            setPasswordResetOTP("");
            setNewPassword("");
            setConfirmPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Lock className="w-6 h-6 text-[#FFD249]" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              {passwordResetStep === 1
                ? "We'll send an OTP to your email to verify your identity."
                : "Enter the OTP sent to your email and set a new password."}
            </DialogDescription>
          </DialogHeader>

          {passwordResetStep === 1 ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gradient-to-br from-[#FFD249]/10 to-[#FFB800]/10 dark:from-[#FFD249]/20 dark:to-[#FFB800]/20 rounded-lg border border-[#FFD249]/30 dark:border-[#FFD249]/40">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-[#FFD249]" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Email Address</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-all">{user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  A 6-digit verification code will be sent to this email address.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordResetDialog(false)}
                  className="border-[#FFD249] text-[#202020] hover:bg-[#FFD249]/10 dark:border-[#FFD249] dark:text-[#FFD249] dark:hover:bg-[#FFD249]/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendPasswordResetOTP}
                  disabled={isSendingOTP}
                  className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
                >
                  {isSendingOTP ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Verification Code</Label>
                <InputOTP
                  maxLength={6}
                  value={passwordResetOTP}
                  onChange={setPasswordResetOTP}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                    <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                    <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                    <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                    <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                    <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-xs text-gray-500">
                  Enter the 6-digit code sent to {user?.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="h-11"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasswordResetStep(1);
                    setPasswordResetOTP("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="border-[#FFD249] text-[#202020] hover:bg-[#FFD249]/10 dark:border-[#FFD249] dark:text-[#FFD249] dark:hover:bg-[#FFD249]/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

const MyProfile = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Banner Skeleton */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-300 dark:bg-gray-700 animate-pulse" />

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 md:-mt-32 pb-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="relative px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
              <Skeleton className="h-32 w-32 sm:h-40 sm:w-40 rounded-full -mt-20 sm:-mt-24" />
              <div className="flex-1 text-center sm:text-left space-y-3">
                <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-24 mx-auto sm:mx-0" />
                  </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-36" />
                    </div>
                  </div>
                </div>

          <div className="px-4 sm:px-6 lg:px-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};