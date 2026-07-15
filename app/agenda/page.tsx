"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase"; 
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

interface Turno {
  id: string;
  apellido: string;
  nombres: string;
  documento: string;
  fechaNac: string;
  email: string;
  obraSocial: string;
  especialidad: string;
  fechaTurno: string;
  horaTurno: string;
  obs: string;
  estado: string; 
}

interface User {
  id: string;
  email: string;
  status: string;
}

export default function AgendaPanel() {
  const [view, setView] = useState("agenda"); // 'agenda' o 'admin'
  const [showModal, setShowModal] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    apellido: "", nombres: "", documento: "", fechaNac: "", email: "", obraSocial: "", especialidad: "", fechaTurno: "", horaTurno: "", obs: ""
  });

  const [fechaReferencia, setFechaReferencia] = useState(new Date());
  const router = useRouter();

  const fetchTurnos = async () => {
    const q = collection(db, "turnos");
    const querySnapshot = await getDocs(q);
    const listaTurnos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Turno[];
    setTurnos(listaTurnos);
  };

  const fetchUsuarios = async () => {
    const q = collection(db, "users");
    const querySnapshot = await getDocs(q);
    const listaUsuarios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    setUsuarios(listaUsuarios);
  };

  useEffect(() => {
    fetchTurnos();
    if (view === "admin") fetchUsuarios();
  }, [view]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const handleApproveUser = async (id: string) => {
    await updateDoc(doc(db, "users", id), { status: "approved" });
    fetchUsuarios();
  };

  const handleDeleteUser = async (id: string) => {
    if(confirm("¿Eliminar usuario definitivamente?")) {
      await deleteDoc(doc(db, "users", id));
      fetchUsuarios();
    }
  };

  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    await updateDoc(doc(db, "turnos", id), { estado: nuevoEstado });
    fetchTurnos(); 
  };

  const handleDeleteTurno = async (id: string) => {
    if (window.confirm("¿Estás seguro?")) {
      await deleteDoc(doc(db, "turnos", id));
      fetchTurnos(); 
    }
  };

  const handleGuardar = async () => {
    await addDoc(collection(db, "turnos"), { ...formData, estado: "Pendiente", fechaCreacion: new Date() });
    setShowModal(false);
    fetchTurnos();
    setFormData({ apellido: "", nombres: "", documento: "", fechaNac: "", email: "", obraSocial: "", especialidad: "", fechaTurno: "", horaTurno: "", obs: "" });
  };

  const diasSemana = Array.from({length: 7}).map((_, i) => {
    const d = new Date(fechaReferencia);
    d.setDate(d.getDate() - d.getDay() + i);
    return d;
  });

  const getTurnosDelDia = (fecha: Date) => {
    const fs = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    return turnos.filter(t => t.fechaTurno === fs);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-blue-800 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8">DM KINESIO</h2>
        <nav className="space-y-2 mb-8">
          <button onClick={() => setView("agenda")} className={`w-full text-left p-3 ${view === 'agenda' ? 'bg-blue-900' : ''} rounded-lg font-bold`}>📅 Agenda</button>
          <a href="/pacientes" className="block p-3 rounded-lg hover:bg-blue-700 transition">📁 Historias Clínicas</a>
          
          {auth.currentUser?.email === "gabymartin267@gmail.com" && (
            <button onClick={() => setView("admin")} className={`w-full text-left p-3 ${view === 'admin' ? 'bg-blue-900' : ''} rounded-lg font-bold border-t border-blue-600 mt-2 text-yellow-300`}>
              ⚙️ Administración
            </button>
          )}
        </nav>
        <button onClick={handleLogout} className="w-full p-3 bg-red-500 rounded-lg font-bold hover:bg-red-600">Cerrar Sesión</button>
      </aside>

      <main className="flex-1 p-8">
        {view === "agenda" ? (
          <>
            <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Agenda Semanal</h1>
              </div>
              <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">+ Nuevo Turno</button>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="grid grid-cols-7 gap-3 min-h-[500px]">
                {diasSemana.map((fecha, i) => (
                  <div key={i} className="border rounded-lg p-2 min-h-[450px]">
                    <div className="text-center font-bold pb-2 border-b">{fecha.getDate()}</div>
                    <div className="space-y-2 mt-2">
                      {getTurnosDelDia(fecha).map((t) => (
                        <div key={t.id} className="text-[10px] p-2 bg-blue-600 text-white rounded">
                          {t.horaTurno} hs - {t.nombres}
                          <div className="flex justify-end gap-1 mt-1">
                            <button onClick={() => handleDeleteTurno(t.id)}>🗑️</button>
                            <button onClick={() => handleUpdateEstado(t.id, 'Asistió')}>✓</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>
            <table className="w-full border-collapse">
              <thead><tr className="bg-gray-100"><th className="p-2 border">Email</th><th className="p-2 border">Estado</th><th className="p-2 border">Acciones</th></tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="p-2 border">{u.email}</td>
                    <td className="p-2 border">{u.status || "pending"}</td>
                    <td className="p-2 border space-x-2">
                      <button onClick={() => handleApproveUser(u.id)} className="bg-green-500 text-white px-2 py-1 rounded">Aprobar</button>
                      <button onClick={() => handleDeleteUser(u.id)} className="bg-red-500 text-white px-2 py-1 rounded">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal igual que antes... */}
    </div>
  );
}