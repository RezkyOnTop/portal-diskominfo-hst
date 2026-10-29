import { signIn } from "@/lib/auth";

export const metadata = { title: "Masuk Administrator" };

async function loginAction(formData: FormData) {
  "use server";
  await signIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: "/dashboard",
  });
}

export default function MasukPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-8 shadow-[var(--shadow-card)]">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Masuk Administrator
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Area terbatas untuk pengelolaan konten, statistik, dan kelola user.
        </p>
        <form action={loginAction} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">
              Username atau Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              required
              autoComplete="username"
              placeholder="cth. admin"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
