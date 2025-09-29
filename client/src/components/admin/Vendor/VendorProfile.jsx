import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Save,
  Edit,
} from "lucide-react";
import {
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
} from "../../../features/api/Vendor/vendorApi.js";

const VendorProfile = () => {
  const { user } = useSelector((store) => store.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    assignedClient: "",
    vendorStatus: "",
  });

  // Use RTK Query hooks
  const { data: profileResponse, isLoading: profileLoading } =
    useGetVendorProfileQuery();
  const [updateProfile, { isLoading: updateLoading }] =
    useUpdateVendorProfileMutation();

  // Update profile data when API response changes
  useEffect(() => {
    if (profileResponse?.success && profileResponse?.vendor) {
      const vendor = profileResponse.vendor;
      setProfileData({
        _id: vendor._id,
        name: vendor.name || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        gstNumber: vendor.gstNumber || "",
        panNumber: vendor.panNumber || "",
        bankName: vendor.bankName || "",
        accountNumber: vendor.accountNumber || "",
        ifsc: vendor.ifsc || "",
        assignedClient: vendor.assignedClient?.name || "Not assigned",
        vendorStatus: vendor.vendorStatus || "active",
      });
    }
  }, [profileResponse]);

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await updateProfile(profileData).unwrap();
      if (response.success) {
        setIsEditing(false);
        // Optionally show success message
        console.log("Profile updated successfully");
      } else {
        console.error("Error updating profile:", response.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handlePasswordUpdate = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("All password fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    try {
      const response = await updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }).unwrap();

      if (response.success) {
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast.success("Password updated successfully");
      } else {
        toast.error("Error updating password: " + response.message);
      }
    } catch (error) {
      toast.error(
        "Error updating password: " + (error?.data?.message || error.message)
      );
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        gstNumber: user.gstNumber || "",
        panNumber: user.panNumber || "",
        bankName: user.bankName || "",
        accountNumber: user.accountNumber || "",
        ifsc: user.ifsc || "",
        assignedClient: user.assignedClient || "Not assigned",
        vendorStatus: user.vendorStatus || "active",
      });
    }
    setIsEditing(false);
  };

  // Show loading state while profile is being fetched
  if (profileLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your vendor account information
          </p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateLoading}>
                <Save className="h-4 w-4 mr-2" />
                {updateLoading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profileData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedClient">Assigned Client</Label>
              <Input
                id="assignedClient"
                value={profileData.assignedClient}
                disabled={true}
                className="bg-gray-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Business Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={profileData.gstNumber}
                onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                value={profileData.panNumber}
                onChange={(e) => handleInputChange("panNumber", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorStatus">Status</Label>
              <Input
                id="vendorStatus"
                value={profileData.vendorStatus}
                disabled={true}
                className="bg-gray-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Bank Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={profileData.bankName}
                  onChange={(e) =>
                    handleInputChange("bankName", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={profileData.accountNumber}
                  onChange={(e) =>
                    handleInputChange("accountNumber", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input
                  id="ifsc"
                  value={profileData.ifsc}
                  onChange={(e) => handleInputChange("ifsc", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Update Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Change Password</span>
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? "Cancel" : "Change Password"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showPasswordForm && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handlePasswordUpdate}>Update Password</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    profileData.vendorStatus === "active"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="font-medium">
                  {profileData.vendorStatus === "active"
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Your account is currently {profileData.vendorStatus}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Contact administrator to change status
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorProfile;
