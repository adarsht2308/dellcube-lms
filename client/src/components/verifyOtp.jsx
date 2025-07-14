import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useVerifyOTPMutation } from "@/features/api/authApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "@/components/ui/input-otp";

function VerifyOTP() {
  const { state } = useLocation();
  const [otp, setOtp] = useState("");
  const [verifyOTP, { isLoading }] = useVerifyOTPMutation();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!state?.email) {
      toast.error("Email is missing. Please register again.");
      navigate("/login");
      return;
    }

    try {
      const response = await verifyOTP({ email: state.email, otp }).unwrap();

      if (response.success) {
        toast.success(response.message || "OTP Verified successfully. Please Login");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err?.data?.message || "OTP Verification Failed.");
    }
  };

  // Handle OTP input change
  const handleOtpChange = (value) => {
    setOtp(value);
  };

  return (
    <section className="flex items-center w-full justify-center mt-24 p-4 min-h-[80vh]">
      <div className="w-[400px]">
        <h1 className="text-center text-3xl mb-4 font-bold">Verify OTP to Register</h1>
        <Label>Email</Label>
        <Input type="text" value={state?.email || ""} disabled className="mb-4" />
        <Label>OTP</Label>

        <div className="mt-2 mb-4">
          <InputOTP
            value={otp}
            onChange={handleOtpChange}
            maxLength={6}
            className="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="mt-4 w-full"
          disabled={isLoading || otp.length !== 6}
          onClick={handleVerify}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
      </div>
    </section>
  );
}

export default VerifyOTP;