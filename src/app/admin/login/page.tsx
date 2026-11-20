import { Logo } from "@/components/SiteChrome";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card w-full max-w-sm p-6">
        <Logo />
        <p className="mb-5 mt-1 text-sm text-muted">Admin</p>
        <LoginForm />
      </div>
    </div>
  );
}
