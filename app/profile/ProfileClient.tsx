"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function ProfileClient() {
  const { data: session, status } = useSession();

  return (
    <div className="flex justify-center items-center min-h-screen bg-transparent">
      <div className="w-full max-w-md mx-auto bg-white border border-gray-200 shadow-md rounded-lg p-6 mt-20">
        <h2 className="text-xl font-semibold mb-2 text-[#bf5700]">Profile Status</h2>
        <p className="text-gray-600 mb-4 text-sm">Manage your session below.</p>
        {session ? (
          <>
            <p className="text-gray-800 text-sm mb-1">
              Signed in as <span className="font-semibold">{session.user?.name}</span>
            </p>
            <p className="text-gray-500 text-sm mb-4">{session.user?.email}</p>
            <button
              onClick={() => signOut()}
              className="w-full px-4 py-2 rounded-md bg-[#bf5700] text-white text-sm hover:bg-[#a54700] transition"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-4">You're not signed in.</p>
            <button
              onClick={() => signIn("google")}
              className="w-full px-4 py-2 rounded-md bg-[#bf5700] text-white text-sm hover:bg-[#a54700] transition"
            >
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
