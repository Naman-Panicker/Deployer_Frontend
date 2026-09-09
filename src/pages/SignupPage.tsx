import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/src/components/auth/SignupForm";

export function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-semibold">Create Account</CardTitle>
          <CardDescription>Sign up to start deploying your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default SignupPage;
