"use client";
import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === "pendiente") {
          alert("Tu cuenta está pendiente de aprobación por el administrador.");
          return;
        }
        router.push("/agenda");
      } else {
        alert("Usuario no encontrado en la base de datos.");
      }
    } catch (error) {
      alert("Credenciales incorrectas o error de conexión.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96 border">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">DM Kinesio</h1>
        <input type="email" placeholder="Email" className="w-full p-3 mb-4 border rounded text-gray-900" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" className="w-full p-3 mb-6 border rounded text-gray-900" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">Iniciar Sesión</button>
        <button type="button" onClick={() => router.push("/registro")} className="w-full mt-4 text-sm text-blue-600 hover:underline">¿No tienes cuenta? Regístrate</button>
      </form>
    </div>
  );
}