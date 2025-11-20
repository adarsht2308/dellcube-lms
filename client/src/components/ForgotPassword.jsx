import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  useSendPasswordResetOTPMutation,
  useVerifyPasswordResetOTPMutation,
} from "@/features/api/authApi";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Waves from "./Waves";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [sendPasswordResetOTP, { isLoading: isSendingOTP }] =
    useSendPasswordResetOTPMutation();
  const [verifyPasswordResetOTP, { isLoading: isResettingPassword }] =
    useVerifyPasswordResetOTPMutation();

  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const result = await sendPasswordResetOTP({ email }).unwrap();
      if (result.success) {
        toast.success(result.message || "OTP sent to your email");
        setStep(2);
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send OTP");
    }
  };

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) {
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

    try {
      const result = await verifyPasswordResetOTP({
        email,
        otp,
        newPassword,
      }).unwrap();

      if (result.success) {
        toast.success(result.message || "Password reset successfully");
        navigate("/");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reset password");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (step === 1) {
        handleSendOTP();
      } else if (step === 2) {
        handleResetPassword();
      }
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
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

      <section className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FFD249]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FFD249]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/images/dellcube_logo-og.png"
                alt="Dellcube Logo"
                className="w-48 h-auto object-contain"
              />
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-[#202020] text-center">
                {step === 1 ? "Reset Password" : "Enter Verification Code"}
              </CardTitle>
              <CardDescription className="text-center text-[#828083]">
                {step === 1
                  ? "Enter your email address and we'll send you a verification code"
                  : "Enter the 6-digit code sent to your email and set a new password"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-[#202020]"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#828083] w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter your email"
                        className="pl-10 h-12 border-[#FFD249]/20 focus:border-[#FFD249] focus:ring-[#FFD249]/20 transition-all duration-200 bg-white/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-[#FFD249]/10 to-[#FFB800]/10 dark:from-[#FFD249]/20 dark:to-[#FFB800]/20 rounded-lg border border-[#FFD249]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-[#FFD249]" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Verification Email
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      A 6-digit verification code will be sent to the email
                      address you provide.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Verification Code
                    </Label>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
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
                      Enter the 6-digit code sent to {email}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="newPassword"
                      className="text-sm font-medium text-[#202020]"
                    >
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#828083] w-4 h-4" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Minimum 6 characters"
                        className="pl-10 h-12 border-[#FFD249]/20 focus:border-[#FFD249] focus:ring-[#FFD249]/20 transition-all duration-200 bg-white/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-[#202020]"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#828083] w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Re-enter your password"
                        className="pl-10 h-12 border-[#FFD249]/20 focus:border-[#FFD249] focus:ring-[#FFD249]/20 transition-all duration-200 bg-white/50"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="px-8 pb-8 flex flex-col gap-3">
              {step === 1 ? (
                <>
                  <Button
                    onClick={handleSendOTP}
                    disabled={isSendingOTP || !email}
                    className="w-full h-12 bg-[#FFD249] hover:bg-[#202020] text-[#202020] hover:text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    {isSendingOTP ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                  <Link
                    to="/"
                    className="w-full flex items-center justify-center gap-2 text-sm text-[#828083] hover:text-[#202020] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleResetPassword}
                    disabled={
                      isResettingPassword ||
                      !otp ||
                      otp.length !== 6 ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="w-full h-12 bg-[#FFD249] hover:bg-[#202020] text-[#202020] hover:text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="w-full h-12 border-2 border-[#FFD249] text-[#202020] hover:bg-[#FFD249]/20 font-semibold rounded-xl"
                  >
                    Back
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>

          <div className="text-center mt-8">
            <p className="text-sm text-[#828083]">
              Remember your password?{" "}
              <Link
                to="/"
                className="text-[#FFD249] hover:text-[#202020] transition-colors font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ForgotPassword;

