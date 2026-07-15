"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase"; 
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

// Interfaces
interface Turno { id: string; apellido: string; nombres: string; documento: string; fechaNac: string; email: string; obraSocial: string; especialidad: string; fechaTurno: string; horaTurno: string; obs: string; estado: string; }
interface User { id: string; email: string; status: string; nombre: string; rol: string; }

export default function AgendaPanel() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("agenda");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    apellido: "", nombres: "", documento: "", fechaNac: "", email: "", obraSocial: "", especialidad: "", fechaTurno: "", horaTurno: "", obs: ""
  });
  const [fechaReferencia, setFechaReferencia] = useState(new Date());
  const router = useRouter();

  // Guardia de seguridad
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Funciones de navegación de semana
  const semanaAnterior = () => { const nueva = new Date(fechaReferencia); nueva.setDate(nueva.getDate() - 7); setFechaReferencia(nueva); };
  const semanaSiguiente = () => { const nueva = new Date(fechaReferencia); nueva.setDate(nueva.getDate() + 7); setFechaReferencia(nueva); };
  const irAHoy = () => setFechaReferencia(new Date());

  const fetchTurnos = async () => {
    const q = collection(db, "turnos");
    const querySnapshot = await getDocs(q);
    const listaTurnos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Turno[];
    setTurnos(listaTurnos);
  };

  const fetchUsuarios = async () => {
    const q = collection(db, "usuarios");
    const querySnapshot = await getDocs(q);
    const listaUsuarios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    setUsuarios(listaUsuarios);
  };

  useEffect(() => {
    if (!loading) {
      fetchTurnos();
      if (view === "admin") fetchUsuarios();
    }
  }, [view, loading]);

  const handleLogout = async () => {
    try { await signOut(auth); router.push("/"); } catch (error) { console.error(error); }
  };

  const handleApproveUser = async (id: string) => { await updateDoc(doc(db, "usuarios", id), { status: "aprobado" }); fetchUsuarios(); };
  const handleDeleteUser = async (id: string) => { if(confirm("¿Eliminar usuario definitivamente?")) { await deleteDoc(doc(db, "usuarios", id)); fetchUsuarios(); } };
  const handleUpdateEstado = async (id: string, nuevoEstado: string) => { await updateDoc(doc(db, "turnos", id), { estado: nuevoEstado }); fetchTurnos(); };
  const handleDeleteTurno = async (id: string) => { if (window.confirm("¿Seguro?")) { await deleteDoc(doc(db, "turnos", id)); fetchTurnos(); } };
  const handleGuardar = async () => { await addDoc(collection(db, "turnos"), { ...formData, estado: "Pendiente", fechaCreacion: new Date() }); setShowModal(false); fetchTurnos(); setFormData({ apellido: "", nombres: "", documento: "", fechaNac: "", email: "", obraSocial: "", especialidad: "", fechaTurno: "", horaTurno: "", obs: "" }); };

  const diasSemana = Array.from({length: 7}).map((_, i) => { const d = new Date(fechaReferencia); d.setDate(d.getDate() - d.getDay() + i); return d; });
  const getTurnosDelDia = (fecha: Date) => { const fs = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`; return turnos.filter(t => t.fechaTurno === fs); };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex text-gray-900">
      <button className="md:hidden fixed top-4 left-4 z-50 bg-blue-800 text-white p-2 rounded-lg" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰ Menú</button>

      <aside className={`${isSidebarOpen ? 'block' : 'hidden'} md:block fixed md:relative z-40 w-64 h-full bg-blue-800 text-white p-6`}>
        <h2 className="text-2xl font-bold mb-8 mt-10 md:mt-0">DM KINESIO</h2>
        <nav className="space-y-2 mb-8">
          <button onClick={() => { setView("agenda"); setIsSidebarOpen(false); }} className={`w-full text-left p-3 ${view === 'agenda' ? 'bg-blue-900' : ''} rounded-lg font-bold`}>📅 Agenda</button>
          <a href="/pacientes" className="block p-3 rounded-lg hover:bg-blue-700 transition">📁 Historias Clínicas</a>
          
          {auth.currentUser?.email === "gabymartin267@gmail.com" && (
            <button onClick={() => { setView("admin"); setIsSidebarOpen(false); }} className={`w-full text-left p-3 ${view === 'admin' ? 'bg-blue-900' : ''} rounded-lg font-bold border-t border-blue-600 mt-2 text-yellow-300`}>
              ⚙️ Administración
            </button>
          )}
        </nav>
        <button onClick={handleLogout} className="w-full p-3 bg-red-500 rounded-lg font-bold hover:bg-red-600">Cerrar Sesión</button>
      </aside>

      {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsSidebarOpen(false)}></div>}

      <main className="flex-1 p-4 md:p-8 text-gray-900 overflow-x-hidden">
        {view === "agenda" ? (
          <>
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-4 md:mb-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Agenda Semanal</h1>
                <p className="text-sm text-gray-500">Semana del {diasSemana[0].toLocaleDateString('es-AR')} al {diasSemana[6].toLocaleDateString('es-AR')}</p>
              </div>
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <button onClick={semanaAnterior} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold">◀</button>
                <button onClick={irAHoy} className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100">Hoy</button>
                <button onClick={semanaSiguiente} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold">▶</button>
              </div>
              <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold w-full md:w-auto">+ Nuevo Turno</button>
            </header>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 md:gap-3 min-w-[600px] md:min-w-0 min-h-[500px]">
                {diasSemana.map((fecha, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-1 md:p-2 min-h-[450px]">
                    <div className="text-center font-bold pb-2 border-b border-gray-200 text-[10px] md:text-sm">{fecha.getDate()}</div>
                    <div className="space-y-1 md:space-y-2 mt-2">
                      {getTurnosDelDia(fecha).map((t) => (
                        <div key={t.id} className="text-[9px] md:text-[10px] p-1 md:p-2 bg-blue-600 text-white rounded shadow-sm">
                          <span className="font-bold block">{t.horaTurno} hs</span>
                          {t.nombres} {t.apellido}
                          <div className="flex justify-end gap-1 mt-1 border-t border-white/20 pt-1">
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
          <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                <thead><tr className="bg-gray-100"><th className="p-2 border">Email</th><th className="p-2 border">Estado</th><th className="p-2 border">Acciones</th></tr></thead>
                <tbody>
                    {usuarios.map(u => (
                    <tr key={u.id} className="border-b">
                        <td className="p-2 border text-xs md:text-sm">{u.email}</td>
                        <td className="p-2 border font-bold text-xs md:text-sm">{u.status}</td>
                        <td className="p-2 border space-x-1">
                        <button onClick={() => handleApproveUser(u.id)} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Aprobar</button>
                        <button onClick={() => handleDeleteUser(u.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Del</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}