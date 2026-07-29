import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-[20%] left-[10%] h-[50%] w-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] h-[40%] w-[35%] rounded-full bg-teal-400/10 blur-[100px]" />
      </div>
      <LoginForm />
    </div>
  );
}
