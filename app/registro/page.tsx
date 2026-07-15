"use client";
import { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("profesional");
  const router = useRouter();

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        nombre: nombre,
        email: email,
        rol: rol,
        status: "pendiente",
        fechaRegistro: new Date().toISOString()
      });

      alert("Registro exitoso. Tu cuenta está pendiente de aprobación.");
      router.push("/");
    } catch (error) {
      alert("Error al registrar: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleRegistro} className="bg-white p-8 rounded-xl shadow-lg w-96 border">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">Registrar Usuario</h1>
        <input type="text" placeholder="Nombre completo" className="w-full p-3 mb-4 border rounded text-gray-900" onChange={(e) => setNombre(e.target.value)} required />
        <input type="email" placeholder="Email" className="w-full p-3 mb-4 border rounded text-gray-900" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" className="w-full p-3 mb-4 border rounded text-gray-900" onChange={(e) => setPassword(e.target.value)} required />
        <select className="w-full p-3 mb-6 border rounded text-gray-900" onChange={(e) => setRol(e.target.value)}>
          <option value="profesional">Profesional</option>
          <option value="administrativo">Administrativo</option>
        </select>
        <button type="submit" className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Crear Cuenta</button>
        <button type="button" onClick={() => router.push("/")} className="w-full mt-4 text-sm text-gray-500 hover:underline">Volver al Login</button>
      </form>
    </div>
  );
}