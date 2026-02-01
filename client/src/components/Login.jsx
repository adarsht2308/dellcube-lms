import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useLoginUserMutation, useCheckUserAssignmentsMutation } from "@/features/api/authApi";
import { Loader2, Mail, Lock, Eye, EyeOff, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import Waves from "./Waves";

function Login() {
  const [loginInput, setLoginInput] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [assignments, setAssignments] = useState(null);
  const [checkingAssignments, setCheckingAssignments] = useState(false);

  const [
    loginUser,
    {
      data: loginData,
      error: loginError,
      isLoading: loginIsLoading,
      isSuccess: loginIsSucess,
    },
  ] = useLoginUserMutation();
  const [checkAssignments, { isLoading: isCheckingAssignments }] = useCheckUserAssignmentsMutation();
  const navigate = useNavigate();

  // Debug: Log assignments when they change
  useEffect(() => {
    if (assignments) {
      console.log("[Login] Assignments updated:", assignments);
      console.log("[Login] Selected company:", selectedCompany);
      if (selectedCompany) {
        console.log("[Login] Branches for selected company:", assignments.branchesByCompany[selectedCompany]);
      }
    }
  }, [assignments, selectedCompany]);

  const inputHandler = (e) => {
    const { name, value } = e.target;
    setLoginInput({ ...loginInput, [name]: value });
    
    // Reset selections when identifier changes
    if (name === "identifier") {
      setSelectedCompany("");
      setSelectedBranch("");
      setAssignments(null);
    }
  };

  // Check assignments when identifier is entered (on blur)
  const handleIdentifierBlur = async () => {
    if (!loginInput.identifier.trim()) return;

    setCheckingAssignments(true);
    try {
      const checkData = {
        email: loginInput.identifier.includes("@")
          ? loginInput.identifier
          : undefined,
        mobile: !loginInput.identifier.includes("@")
          ? loginInput.identifier
          : undefined,
      };

      const result = await checkAssignments(checkData).unwrap();
      if (result.success) {
        setAssignments(result.data);
        // Auto-select if only one company
        if (result.data.companies.length === 1) {
          // Ensure companyId is a string for consistent lookup
          const companyId = String(result.data.companies[0]._id);
          setSelectedCompany(companyId);
          // Auto-select branch if only one branch for this company
          const branches = result.data.branchesByCompany[companyId] || [];
          if (branches.length === 1) {
            setSelectedBranch(String(branches[0]._id));
          }
        }
      }
    } catch (error) {
      // User not found or error - will be handled during login
      setAssignments(null);
    } finally {
      setCheckingAssignments(false);
    }
  };

  // Reset branch when company changes
  const handleCompanyChange = (companyId) => {
    // Ensure companyId is a string for consistent lookup
    const companyIdString = String(companyId);
    setSelectedCompany(companyIdString);
    setSelectedBranch(""); // Reset branch selection
  };

  const handleFormSubmit = async () => {
    const inputData = {
      email: loginInput.identifier.includes("@")
        ? loginInput.identifier
        : undefined,
      mobile: !loginInput.identifier.includes("@")
        ? loginInput.identifier
        : undefined,
      password: loginInput.password,
    };

    // Always require company and branch selection if assignments exist
    if (assignments && assignments.companies.length > 0) {
      // Use selected values or default to first company/branch
      const companyId = selectedCompany || assignments.companies[0]._id;
      const branchId = selectedBranch || (assignments.branchesByCompany[companyId]?.[0]?._id);
      
      if (!companyId || !branchId) {
        toast.error("Please select company and branch");
        return;
      }
      
      inputData.companyId = companyId;
      inputData.branchId = branchId;
    }

    await loginUser(inputData);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleFormSubmit();
    }
  };

  useEffect(() => {
    if (loginIsSucess && loginData) {
      toast.success(loginData?.message || "Login successful.");
      const token = loginData.token;
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);
      const userRole = decoded.role;

      if (userRole === "superAdmin") {
        navigate("/admin/dashboard");
      } else if (userRole === "branchAdmin") {
        navigate("/admin/branch-admin-dashboard");
      } else if (userRole === "driver") {
        navigate("/admin/driver-dashboard");
      } else if (userRole === "operation") {
        navigate("/admin/operation-dashboard");
      } else if (userRole === "vendor") {
        navigate("/admin/dashboard");
      } else {
        navigate("/unauthorized");
      }
    }
    if (loginError) {
      toast.error(loginError?.data?.message || "Login Failed");
    }
  }, [loginIsLoading, loginData, loginError]);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Glitch Background */}
      <div className="absolute inset-0 z-0">
        <Waves
          lineColor="#FFCC1B"
          backgroundColor="rgba(255, 255, 255, 0.2)"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>
      {/* Login Content */}
      <section className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FFD249]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FFD249]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/images/dellcube_logo-og.png"
                alt="Dellcube Logo"
                className="w-48 h-auto object-contain"
              />
            </div>
          </div>

          {/* Login Card */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-[#202020] text-center">
                Sign In to Your Account
              </CardTitle>
              <CardDescription className="text-center text-[#828083]">
                Enter your credentials to access the Dellcube LMS
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8">
              {/* Email/Mobile Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="identifier"
                  className="text-sm font-medium text-[#202020]"
                >
                  Email or Mobile Number
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#828083] w-4 h-4" />
                  <Input
                    id="identifier"
                    type="text"
                    name="identifier"
                    value={loginInput.identifier}
                    onChange={inputHandler}
                    onBlur={handleIdentifierBlur}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your email or mobile"
                    className="pl-10 h-12 border-[#FFD249]/20 focus:border-[#FFD249] focus:ring-[#FFD249]/20 transition-all duration-200 bg-white/50"
                    required
                  />
                  {checkingAssignments && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-[#828083]" />
                  )}
                </div>
              </div>

              {/* Company Selection - Always show if assignments exist */}
              {assignments && assignments.companies.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#202020]">
                    Select Company
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#828083] w-4 h-4 z-10" />
                    <Select value={selectedCompany || assignments.companies[0]._id} onValueChange={handleCompanyChange}>
                      <SelectTrigger className="pl-10 h-12 border-[#FFD249]/20 focus:border-[#FFD249] focus:ring-[#FFD249]/20 transition-all duration-200 bg-white/50">
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments.companies.map((company) => (
                          <SelectItem key={company._id} value={company._id}>
                            {company.name} ({company.companyCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Branch Selection - Always show if assignments exist */}
              {assignments && assignments.companies.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#202020]">
                    Select Branch
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#828083] w-4 h-4 z-10" />
                    <Select 
                      value={selectedBranch || (assignments.branchesByCompany[selectedCompany || String(assignments.companies[0]._id)]?.[0]?._id || "")} 
                      onValueChange={setSelectedBranch}
                      disabled={!selectedCompany && assignments.companies.length > 1}
                    >
                      <SelectTrigger className="pl-10 h-12 border-[#FFD249]/20 focus:border-[#FFD249] focus:ring-[#FFD249]/20 transition-all duration-200 bg-white/50">
                        <SelectValue placeholder={!selectedCompany && assignments.companies.length > 1 ? "Select company first" : "Select a branch"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(assignments.branchesByCompany[selectedCompany || String(assignments.companies[0]._id)] || []).map((branch) => (
                          <SelectItem key={String(branch._id)} value={String(branch._id)}>
                            {branch.name} ({branch.branchCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-[#202020]"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#828083] w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={loginInput.password}
                    onChange={inputHandler}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12 border-[#FFD249]/20 focus:border-[#FFD249] focus:ring-[#FFD249]/20 transition-all duration-200 bg-white/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#828083] hover:text-[#202020] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#FFD249] hover:text-[#202020] transition-colors font-medium"
                >
                  Forgot your password?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="px-8 pb-8">
              <Button
                onClick={handleFormSubmit}
                disabled={
                  loginIsLoading ||
                  !loginInput.identifier ||
                  !loginInput.password ||
                  (assignments && assignments.companies.length > 0 && (!selectedCompany && !assignments.companies[0]?._id))
                }
                className="w-full h-12 bg-[#FFD249] hover:bg-[#202020] text-[#202020] hover:text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                {loginIsLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-[#828083]">
              Need help? Contact{" "}
              <a
                href="mailto:support@dellcube.com"
                className="text-[#FFD249] hover:text-[#202020] transition-colors font-medium"
              >
                info@dellcube.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
