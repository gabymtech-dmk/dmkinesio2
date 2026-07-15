"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase"; 
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
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
  estado: string; // 'Pendiente', 'Asistió', 'No Asistió'
}

export default function AgendaPanel() {
  const [showModal, setShowModal] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [formData, setFormData] = useState({
    apellido: "", nombres: "", documento: "", fechaNac: "", email: "", obraSocial: "", especialidad: "", fechaTurno: "", horaTurno: "", obs: ""
  });

  const [fechaReferencia, setFechaReferencia] = useState(new Date());
  const router = useRouter();

  const fetchTurnos = async () => {
    const q = collection(db, "turnos");
    const querySnapshot = await getDocs(q);
    const listaTurnos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Turno[];
    setTurnos(listaTurnos);
  };

  useEffect(() => {
    fetchTurnos();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const turnoRef = doc(db, "turnos", id);
      await updateDoc(turnoRef, { estado: nuevoEstado });
      fetchTurnos(); 
    } catch (error) {
      alert("Error al actualizar el estado");
    }
  };

  const handleDeleteTurno = async (id: string) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este turno definitivamente?");
    if (!confirmar) return;

    try {
      const turnoRef = doc(db, "turnos", id);
      await deleteDoc(turnoRef);
      alert("¡Turno eliminado correctamente!");
      fetchTurnos(); 
    } catch (error) {
      alert("Error al eliminar el turno");
    }
  };

  const handleGuardar = async () => {
    try {
      await addDoc(collection(db, "turnos"), { ...formData, estado: "Pendiente", fechaCreacion: new Date() });
      alert("¡Turno guardado!");
      setShowModal(false);
      fetchTurnos();
      setFormData({ apellido: "", nombres: "", documento: "", fechaNac: "", email: "", obraSocial: "", especialidad: "", fechaTurno: "", horaTurno: "", obs: "" });
    } catch (e) { alert("Error al guardar."); }
  };

  const getDiasDeLaSemana = (fecha: Date) => {
    const dias = [];
    const copia = new Date(fecha);
    const diaDeLaSemana = copia.getDay();
    const inicioSemana = new Date(copia);
    inicioSemana.setDate(copia.getDate() - diaDeLaSemana);

    for (let i = 0; i < 7; i++) {
      const d = new Date(inicioSemana);
      d.setDate(inicioSemana.getDate() + i);
      dias.push(d);
    }
    return dias;
  };

  const diasSemana = getDiasDeLaSemana(fechaReferencia);

  const formatFechaParaFiltro = (d: Date) => {
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const getTurnosDelDia = (fecha: Date) => {
    const fechaString = formatFechaParaFiltro(fecha);
    return turnos.filter(t => t.fechaTurno === fechaString);
  };

  const semanaAnterior = () => {
    const nueva = new Date(fechaReferencia);
    nueva.setDate(nueva.getDate() - 7);
    setFechaReferencia(nueva);
  };

  const semanaSiguiente = () => {
    const nueva = new Date(fechaReferencia);
    nueva.setDate(nueva.getDate() + 7);
    setFechaReferencia(nueva);
  };

  const irAHoy = () => {
    setFechaReferencia(new Date());
  };

  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-blue-800 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8">DM KINESIO</h2>
        <nav className="space-y-2 mb-8">
          <a href="/agenda" className="block p-3 bg-blue-900 rounded-lg font-bold border-l-4 border-white transition">📅 Agenda</a>
          <a href="/pacientes" className="block p-3 rounded-lg hover:bg-blue-700 transition">📁 Historias Clínicas</a>
        </nav>
        <button 
          onClick={handleLogout} 
          className="w-full p-3 bg-red-500 rounded-lg font-bold hover:bg-red-600 transition"
        >
          Cerrar Sesión
        </button>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Agenda Semanal</h1>
            <p className="text-sm text-gray-500">
              Semana del {diasSemana[0].toLocaleDateString('es-AR')} al {diasSemana[6].toLocaleDateString('es-AR')}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button onClick={semanaAnterior} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">
              ◀ Anterior
            </button>
            <button onClick={irAHoy} className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100">
              Hoy
            </button>
            <button onClick={semanaSiguiente} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">
              Siguiente ▶
            </button>
          </div>

          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">
            + Nuevo Turno
          </button>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="grid grid-cols-7 gap-3 min-h-[500px]">
            {diasSemana.map((fecha, index) => {
              const turnosDelDia = getTurnosDelDia(fecha);
              const esHoy = fecha.toDateString() === new Date().toDateString();

              return (
                <div 
                  key={index} 
                  className={`border rounded-lg p-2 flex flex-col bg-white transition min-h-[450px] ${esHoy ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'hover:bg-gray-50'}`}
                >
                  <div className="text-center pb-2 mb-2 border-b border-gray-100">
                    <span className="block text-xs font-bold text-gray-400 uppercase">{nombresDias[index]}</span>
                    <span className={`inline-block text-lg font-bold px-2 py-0.5 rounded-full ${esHoy ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                      {fecha.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {turnosDelDia.length === 0 ? (
                      <span className="text-[10px] text-gray-400 italic block text-center mt-4">Sin turnos</span>
                    ) : (
                      turnosDelDia.map((t: Turno) => (
                        <div 
                          key={t.id} 
                          className={`text-xs p-2 rounded-lg border-l-4 shadow-sm flex flex-col justify-between ${
                            t.estado === 'Asistió' 
                              ? 'bg-green-100 border-green-500 text-green-900' 
                              : t.estado === 'No Asistió' 
                              ? 'bg-red-100 border-red-500 text-red-900' 
                              : 'bg-blue-600 border-blue-800 text-white'
                          }`}
                        >
                          <div>
                            <span className="font-bold block text-[11px] mb-0.5">{t.horaTurno} hs</span>
                            <span className="font-semibold block break-words leading-tight">{t.nombres} {t.apellido}</span>
                            
                            {t.especialidad && (
                              <span className={`text-[10px] font-bold block mt-1.5 uppercase tracking-wide ${
                                t.estado === 'Pendiente' ? 'text-yellow-300' : 'text-blue-800 font-extrabold'
                              }`}>
                                ⚕️ {t.especialidad}
                              </span>
                            )}

                            {t.obraSocial && (
                              <span className={`text-[9px] block mt-0.5 uppercase ${
                                t.estado === 'Pendiente' ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                OS: {t.obraSocial}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1.5 mt-2 justify-end border-t border-black/10 pt-1.5">
                            <button 
                              onClick={() => window.location.href = `/pacientes?dni=${t.documento}`}
                              title="Ver Historia Clínica" 
                              className={`p-1 text-xs rounded font-bold transition ${
                                t.estado === 'Pendiente' 
                                  ? 'bg-white/20 text-white hover:bg-white hover:text-blue-800' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white'
                              }`}
                            >
                              📁
                            </button>

                            <button 
                              onClick={() => handleDeleteTurno(t.id)} 
                              title="Eliminar turno" 
                              className={`p-1 text-xs rounded font-bold transition ${
                                t.estado === 'Pendiente' 
                                  ? 'bg-white/20 text-white hover:bg-red-600 hover:text-white' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-600 hover:text-white'
                              }`}
                            >
                              🗑️
                            </button>
                            
                            <button 
                              onClick={() => handleUpdateEstado(t.id, 'Asistió')} 
                              title="Asistió" 
                              className={`p-1 text-xs rounded font-bold transition ${
                                t.estado === 'Asistió' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-white/30 text-current hover:bg-white/50'
                              }`}
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => handleUpdateEstado(t.id, 'No Asistió')} 
                              title="No asistió" 
                              className={`p-1 text-xs rounded font-bold transition ${
                                t.estado === 'No Asistió' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-white/30 text-current hover:bg-white/50'
                              }`}
                            >
                              ✗
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Asignar Turno</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="block text-xs font-bold text-gray-600 mb-1">APELLIDO</label><input type="text" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, apellido: e.target.value})} /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">NOMBRES</label><input type="text" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, nombres: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Nº DOCUMENTO</label><input type="text" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, documento: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">FECHA NACIMIENTO</label><input type="date" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, fechaNac: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">EMAIL</label><input type="email" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div><label className="block text-xs font-bold text-gray-600 mb-1">OBRA SOCIAL</label><input type="text" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, obraSocial: e.target.value})} /></div>
               <div><label className="block text-xs font-bold text-gray-600 mb-1">ESPECIALIDAD</label><input type="text" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, especialidad: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 bg-blue-50 p-4 rounded-lg">
              <div><label className="block text-xs font-bold text-blue-800 mb-1">FECHA TURNO</label><input type="date" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, fechaTurno: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-blue-800 mb-1">HORA TURNO</label><input type="time" className="w-full border-2 p-2 rounded text-gray-900" onChange={(e) => setFormData({...formData, horaTurno: e.target.value})} /></div>
            </div>
            <div className="mb-6"><label className="block text-xs font-bold text-gray-600 mb-1">OBSERVACIONES</label><textarea className="w-full border-2 p-2 rounded text-gray-900 h-20" onChange={(e) => setFormData({...formData, obs: e.target.value})} /></div>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowModal(false)} className="text-gray-500 font-bold px-6 py-2">CANCELAR</button>
              <button onClick={handleGuardar} className="bg-blue-600 text-white px-8 py-2 rounded font-bold hover:bg-blue-700">GUARDAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}