import { AuthForm } from "@/components/ui/AuthForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm type="login" />
    </Suspense>
  );
}
