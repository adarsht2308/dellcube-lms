import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Save,
  Edit,
  Users,
} from "lucide-react";
import {
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
} from "../../../features/api/Vendor/vendorApi.js";
import { getTokenData } from "@/utils/getTokenData";

const VendorProfile = () => {
  const { user } = useSelector((store) => store.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [activeBranch, setActiveBranch] = useState(null);
  const [activeCompany, setActiveCompany] = useState(null);
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
    assignedClients: [],
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
        assignedClients: vendor.assignedClients || [],
        vendorStatus: vendor.vendorStatus || "active",
      });

      // Get active branch and company from token
      const { branchId: tokenBranchId, companyId: tokenCompanyId } = getTokenData();
      
      // Find the active branch from vendor's branches
      if (tokenBranchId && vendor.branch) {
        const branches = Array.isArray(vendor.branch) ? vendor.branch : [vendor.branch];
        const activeBranchData = branches.find(
          (b) => String(b?._id || b) === String(tokenBranchId)
        );
        if (activeBranchData) {
          setActiveBranch(activeBranchData);
        }
      }

      // Find the active company from vendor's companies
      if (tokenCompanyId && vendor.company) {
        const companies = Array.isArray(vendor.company) ? vendor.company : [vendor.company];
        const activeCompanyData = companies.find(
          (c) => String(c?._id || c) === String(tokenCompanyId)
        );
        if (activeCompanyData) {
          setActiveCompany(activeCompanyData);
        }
      }
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
        assignedClients: user.assignedClients || [],
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
      {/* Active Branch/Company Badge */}
      {(activeBranch || activeCompany) && (
        <div className="bg-gradient-to-r from-[#FFD249]/10 to-[#FFD249]/5 border border-[#FFD249]/30 rounded-lg p-4 flex items-center gap-4">
          <div className="p-2 bg-[#FFD249]/20 rounded-full">
            <Building className="h-5 w-5 text-[#FFD249]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {activeCompany && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Company:
                  </span>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800 border-[#FFD249]/50">
                    <Building className="h-3 w-3 mr-1 text-[#FFD249]" />
                    {typeof activeCompany === 'object' ? activeCompany.name : activeCompany}
                  </Badge>
                </div>
              )}
              {activeBranch && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Branch:
                  </span>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800 border-[#FFD249]/50">
                    <MapPin className="h-3 w-3 mr-1 text-[#FFD249]" />
                    {typeof activeBranch === 'object' ? activeBranch.name : activeBranch}
                  </Badge>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You are currently logged in to this branch
            </p>
          </div>
        </div>
      )}

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

          </CardContent>
        </Card>

        {/* Assigned Clients - Separate Card with Better UI */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Assigned Clients</span>
              {Array.isArray(profileData.assignedClients) && profileData.assignedClients.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {profileData.assignedClients.length} {profileData.assignedClients.length === 1 ? 'client' : 'clients'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(profileData.assignedClients) && profileData.assignedClients.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  // Group customers by company and branch
                  const groupedCustomers = {};
                  
                  profileData.assignedClients.forEach((customer) => {
                    const companyId = customer?.company?._id || customer?.company || 'unknown';
                    const branchId = customer?.branch?._id || customer?.branch || 'unknown';
                    const companyName = customer?.company?.name || 'Unknown Company';
                    const branchName = customer?.branch?.name || 'Unknown Branch';
                    const key = `${companyId}-${branchId}`;
                    
                    if (!groupedCustomers[key]) {
                      groupedCustomers[key] = {
                        companyName,
                        branchName,
                        companyId,
                        branchId,
                        customers: []
                      };
                    }
                    groupedCustomers[key].customers.push(customer);
                  });

                  return Object.values(groupedCustomers).map((group, idx) => (
                    <div key={idx} className="border-l-4 border-[#FFD249] pl-4 py-3 bg-gradient-to-r from-[#FFD249]/5 to-transparent rounded-r-md">
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="w-4 h-4 text-[#FFD249]" />
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{group.companyName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">→</span>
                        <MapPin className="w-3 h-3 text-[#FFD249]" />
                        <span className="font-medium text-xs text-gray-700 dark:text-gray-300">{group.branchName}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {group.customers.length} {group.customers.length === 1 ? 'client' : 'clients'}
                        </Badge>
                      </div>
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.customers.map((customer, customerIdx) => (
                          <div 
                            key={customerIdx} 
                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#FFD249] hover:shadow-md transition-all duration-200"
                          >
                            <div className="p-2 bg-[#FFD249]/10 rounded-full">
                              <Users className="w-4 h-4 text-[#FFD249]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {customer?.name || customer}
                              </p>
                              {customer?.email && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-1">
                                  <Mail className="w-3 h-3" />
                                  {customer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No clients assigned</p>
                <p className="text-sm mt-1">Clients will appear here when assigned by an administrator</p>
              </div>
            )}
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
