"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  status: string;
}

export default function AdminPage() {
  const [pendientes, setPendientes] = useState<Usuario[]>([]);

  useEffect(() => {
    const fetchPendientes = async () => {
      const q = query(collection(db, "usuarios"), where("status", "==", "pendiente"));
      const snapshot = await getDocs(q);
      setPendientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario)));
    };
    fetchPendientes();
  }, []);

  const aprobar = async (id: string) => {
    await updateDoc(doc(db, "usuarios", id), { status: "aprobado" });
    alert("Usuario aprobado con éxito.");
    window.location.reload(); // Recarga para ver cambios
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-blue-800">Aprobación de Usuarios</h1>
      <div className="space-y-4 max-w-2xl">
        {pendientes.length === 0 ? <p>No hay usuarios pendientes.</p> : pendientes.map((u) => (
          <div key={u.id} className="bg-white p-4 rounded border shadow-sm flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900">{u.nombre}</p>
              <p className="text-sm text-gray-500">{u.email} - Rol: {u.rol}</p>
            </div>
            <button onClick={() => aprobar(u.id)} className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600">Aprobar</button>
          </div>
        ))}
      </div>
    </div>
  );
}